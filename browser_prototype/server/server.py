from flask import Flask, request, abort, send_from_directory, Response
import game
from const import player_1, player_2
import uuid
import os
import sys
import logging
import json
import entity

logging.basicConfig(level=logging.DEBUG)
static_dir = os.path.join(os.path.dirname(os.getcwd()), 'target')

app = Flask(__name__)

match_queue = []
game_player_move_map = {}

app = Flask(__name__)

@app.after_request
def apply_caching(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route('/')
def root():
    return send_from_directory(static_dir, 'index.html')

@app.route('/lancer.js')
def send_static_js():
    return send_from_directory(static_dir, 'lancer.js')

@app.route('/app.css')
def send_static_css():
    return send_from_directory(static_dir, 'app.css')

@app.route('/app_mobile.css')
def send_static_css_mobile():
    return send_from_directory(static_dir, 'app_mobile.css')

@app.route('/game/<string:game_id>')
def get_game(game_id):
    game_id = uuid.UUID(game_id)
    try:
        server_game = ServerGame.server_game_map[game_id]
    except KeyError:
        abort(404)
    else:
        return json.dumps([
            server_game.game.serialize(),
            str(server_game.game_id),
            server_game.status.value,
            server_game.player_name_map
        ])

@app.route('/session/<string:session_id>/rollback', methods=['POST'])
def rollback_game(session_id):
    session_id = uuid.UUID(session_id)
    for pool in [Session.session_map, Session.ended_session_map]:
        if session_id in pool:
            session = pool[session_id]
            session.rollback()
            return 'done'
    abort(404)

@app.route('/session/<string:session_id>/status')
def get_session_status(session_id):
    session_id = uuid.UUID(session_id)
    current_game_id = None

    for pool in [Session.session_map, Session.ended_session_map]:
        if session_id in pool:
            current_game_id = pool[session_id].current_game_id()

    result = {
        'latest': str(current_game_id)
    }
    if current_game_id:
        if current_game_id in game_player_move_map:
            sg_player_move = game_player_move_map[current_game_id]
            result['player_moved'] = {
                player_1: sg_player_move.player_move_map[player_1] is not None,
                player_2: sg_player_move.player_move_map[player_2] is not None
            }
        else:
            result['player_moved'] = {
                player_1: False,
                player_2: False
            }
    return json.dumps(result)

@app.route('/game/<string:game_id>/move', methods=['POST'])
def submit_player_move(game_id):
    game_id = uuid.UUID(game_id)
    data = json.loads(request.data)
    player = int(data[0])
    moves_literal = ' '.join(data[1:])

    player_move = entity.PlayerMove.from_literal(player, moves_literal)
    logging.info(f"Received player {player} move: {player_move}.")

    if game_id not in game_player_move_map:
        game_player_move_map[game_id] = ServerGamePlayerMove()
    game_player_move_map[game_id].update(player, player_move)
    Session.process_sessions()
    return 'done'

@app.route('/match/<string:player_name>', methods=['POST'])
def new_game(player_name):
    if len(match_queue) > 0:
        session_id, waiting_player_name = match_queue.pop(0)
        if waiting_player_name != player_name:
            player_name_map = {
                player_1: waiting_player_name,
                player_2: player_name
            }
            Session(session_id, player_name_map)
            print('new match', session_id, player_name_map.values())
            return str(session_id)
    session_id = uuid.uuid4()
    match_queue.append((session_id, player_name))
    return str(session_id)

class ServerGame:
    server_game_map = {}

    def __init__(self, player_name_map, game_=None):
        if game_ is None:
            self.game = game.Game()
        else:
            self.game = game_
        self.game_id = uuid.uuid4()
        self.status = self.game.get_status()
        self.player_name_map = player_name_map
        ServerGame.server_game_map[self.game_id] = self

    def next(self, player_move):
        try:
            next_game = self.game.make_move(player_move.as_list())
        except Exception as e:
            print('exception during game.make_move:', e)
            return None
        return ServerGame(self.player_name_map, next_game)

class ServerGamePlayerMove:
    def __init__(self):
        self.reset()

    def all_players_moved(self):
        return self.as_list().count(None) == 0

    def update(self, player, player_move):
        self.player_move_map[player] = player_move

    def as_list(self):
        return list(self.player_move_map.values())

    def reset(self):
        self.player_move_map = { 
            player_1: None, 
            player_2: None 
        }

    def __repr__(self):
        return ','.join([str(pm) for pm in self.as_list()])

# class PlayerStatus:
#     connected = 'connected'
#     connecting = 'connecting'
#     disconnected = 'disconnected'

#     def __init__(self):
#         self.status_map = {}    

#     def get(self, player_name):
#         if player_name in self.status_map:
#             return self.status_map[player_name]
#         else:
#             return None

class Session:
    session_map = {}
    ended_session_map = {}

    def __init__(self, session_id, player_name_map):
        self.session_id = session_id
        server_game = ServerGame(player_name_map)
        self.game_id_list = [server_game.game_id]
        Session.session_map[self.session_id] = self

    def update(self, game_id):
        self.game_id_list.append(game_id)

    def current_game_id(self):
        return self.game_id_list[-1]

    def current_game(self):
        return ServerGame.server_game_map[self.current_game_id()]

    def is_ended(self):
        return self.current_game().status != game.GameStatus.Ongoing

    def rollback(self):
        if len(self.game_id_list) > 1:
            self.game_id_list.pop()

    @classmethod
    def process_sessions(cls):
        ended_sessions = []
        for session in cls.session_map.values():
            if session.current_game_id() not in game_player_move_map:
                continue

            sg_player_move = game_player_move_map[session.current_game_id()]
            if not sg_player_move.all_players_moved():
                continue
            
            server_game = session.current_game()
            next_server_game = server_game.next(sg_player_move)

            if next_server_game is None:
                # when this happen, there is a bug 
                # with client move validation
                sg_player_move.reset()
                return
            
            session.update(next_server_game.game_id)

            if session.is_ended():
                ended_sessions.append(session)

        for session in ended_sessions:
            cls.ended_session_map[session.session_id] = session
            del cls.session_map[session.session_id]

def start():
    app.run(debug=False, host='0.0.0.0', port=80)

if __name__ == '__main__':
    start()