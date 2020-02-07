from flask import Flask, request, abort
import net
import game
from entity import player_1, player_2
import uuid

app = Flask(__name__)

match_queue = []
game_player_move_map = {}

@app.route('/session/<string:session_id>/current_game')
def get_game(session_id):
    session_id = uuid.UUID(session_id)
    for pool in [Session.session_map, Session.ended_session_map]:
        if session_id in pool:
            session = pool[session_id]
            server_game = session.current_game()
            return net.pack_command(
                net.GameCommand(
                    server_game.game,
                    server_game.game_id,
                    server_game.status,
                    server_game.player_name_map))
    abort(404)

@app.route('/session/<string:session_id>/current_game_id')
def get_game_id(session_id):
    session_id = uuid.UUID(session_id)
    for pool in [Session.session_map, Session.ended_session_map]:
        if session_id in pool:
            return str(pool[session_id].current_game_id())
    return ''

@app.route('/game/<string:game_id>/move', methods=['POST'])
def submit_player_move(game_id):
    game_id = uuid.UUID(game_id)
    command = net.unpack_command(request.get_json())
    assert(type(command) is net.PlayerMoveCommand)
    player = command.player_move.player
    print(f"Received player {player} move: {command.player_move}.")
    if game_id not in game_player_move_map:
        game_player_move_map[game_id] = ServerGamePlayerMove()
    game_player_move_map[game_id].update(player, command.player_move)

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
            print(e)
            print(player_move)
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
                # this should never happen
                sg_player_move.reset()
            
            session.update(next_server_game.game_id)

            if session.is_ended():
                ended_sessions.append(session.session_id)
                
        for session_id in ended_sessions:
            cls.ended_session_map[session.session_id] = session
            del cls.session_map[session.session_id]

def start():
    app.run(debug=True, host='0.0.0.0')

if __name__ == '__main__':
    start()