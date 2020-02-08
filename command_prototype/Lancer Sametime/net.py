import pickle
import base64
import requests
from requests.exceptions import ReadTimeout, ConnectTimeout, ConnectionError

server_endpoint = "http://localhost:5000/"
encoding = 'ascii'

client_timeout = 8

def retry_on_timeout(func):
    for _ in range(3):
        try:
            return func()
        except ReadTimeout:
            print(f'{func.__name__} read timeout')
            continue
        except ConnectTimeout:
            print(f'{func.__name__} timeout')
            continue
        except ConnectionError:
            print(f'{func.__name__} read timeout')
            continue
    raise Exception("Server timed out.")

def receive_game(session_id):
    url = server_endpoint + f"session/{session_id}/current_game"

    def receive():
        res = requests.get(url=url, timeout=client_timeout * 2)
        if not res.ok:
            print(f"Did not receive game for session {session_id}: {res.status_code}")
            return None
        command = unpack_command(res.json())
        assert(type(command) == GameCommand)
        return command
    
    return retry_on_timeout(receive)

def query_game(session_id):
    url = server_endpoint + f"session/{session_id}/current_game_id"

    def query():
        res = requests.get(url=url, timeout=client_timeout)
        if res.text:
            return res.text
        else:
            return None

    return retry_on_timeout(query)

def rollback_game(session_id):
    url = server_endpoint + f"session/{session_id}/rollback"

    def rollback():
        res = requests.post(url=url, timeout=client_timeout)
        return res.text == 'done'

    return retry_on_timeout(rollback)

def new_game(player_name):
    url = server_endpoint + f"match/{player_name}"

    def new():
        res = requests.post(url=url, timeout=client_timeout)
        session_id = res.text
        return session_id
    
    return retry_on_timeout(new)

def submit_player_move(game_id, player_move):
    url = server_endpoint + f"game/{game_id}/move"

    def submit():
        data = pack_command(PlayerMoveCommand(player_move))
        res = requests.post(url, json=data)
        return res.text == 'done'

    return retry_on_timeout(submit) 

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
