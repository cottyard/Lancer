import pickle

SERVER_IP = "127.0.0.1"
PORT = 24601

HEADER_LENGTH = 10
ENCODING = 'utf-8'

class BadMessage(Exception):
    pass

def receive_command(socket):
    try:
        message_header = socket.recv(HEADER_LENGTH)
        if len(message_header) == 0:
            raise BadMessage
        message_length = int(message_header.decode(ENCODING).strip())
        message_payload = socket.recv(message_length)

        return pickle.loads(message_payload)
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
    
class MoveCommand:
    def __init__(self, move):
        self.move = move        