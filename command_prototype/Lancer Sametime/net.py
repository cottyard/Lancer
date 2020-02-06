import pickle
import base64
import requests

server_endpoint = "http://52.246.182.85:5000/"
encoding = 'ascii'

def receive_game(session_id):
    url = server_endpoint + f"session/{session_id}/current_game"
    res = requests.get(url=url)
    if not res.ok:
        print(f"Did not receive game for session {session_id}: {res.status_code}")
        return None
    command = unpack_command(res.json())
    assert(type(command) == GameCommand)
    return command

def query_game(session_id):
    url = server_endpoint + f"session/{session_id}/current_game_id"
    res = requests.get(url=url)
    return res.text

def new_game(player_name):
    url = server_endpoint + f"match/{player_name}"
    res = requests.post(url=url)
    session_id = res.text
    return session_id

def submit_player_move(game_id, player_move):
    url = server_endpoint + f"game/{game_id}/move"
    data = pack_command(PlayerMoveCommand(player_move))
    requests.post(url, json=data)

def unpack_command(data):
    return unpack_data(data['command'])

def pack_command(command):
    return {'command': pack_data(command)}

def pack_data(obj):
    byte_data = pickle.dumps(obj)
    base64_data = base64.encodebytes(byte_data)
    return base64_data.decode(encoding)

def unpack_data(data):
    return pickle.loads(base64.decodebytes(data.encode(encoding)))

class GameCommand:
    def __init__(self, game, game_id, status, player_name_map):
        self.game = game
        self.game_id = game_id
        self.status = status
        self.player_name_map = player_name_map

class PlayerMoveCommand:
    def __init__(self, player_move):
        self.player_move = player_move
