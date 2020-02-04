import pickle

SERVER_IP = "127.0.0.1"
PORT = 24601

HEADER_LENGTH = 10
ENCODING = 'utf-8'

class BadMessage(Exception):
    pass

def receive_command(socket):
    try:
        header = socket.recv(HEADER_LENGTH)
        if len(header) == 0:
            raise BadMessage
        length = int(header.decode(ENCODING).strip())
        payload = b''
        while len(payload) < length:
            payload += socket.recv(length - len(payload))
        return pickle.loads(payload)
    except:
        raise BadMessage

def send_command(socket, command):
    payload = pickle.dumps(command)
    header = f"{len(payload):<{HEADER_LENGTH}}".encode(ENCODING)
    socket.send(header + payload)

class LoginCommand:
    def __init__(self, player_name):
        self.player_name = player_name

class GameCommand:
    def __init__(self, game, side, player_name):
        self.game = game
        self.side = side
        self.player_name = player_name
    
class PlayerMoveCommand:
    def __init__(self, player_move):
        self.player_move = player_move        