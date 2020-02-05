import socket
import select
import net
import game
from entity import player_1, player_2

player_socket = {}
player_name = {}
socket_player = {}

HOST_IP = "0.0.0.0"

def init():
    global player_socket, player_name, socket_player
    player_socket = {
        player_1: None,
        player_2: None
    }
    player_name = {
        player_1: None,
        player_2: None
    }
    for socket in socket_player:
        socket.close()
    socket_player = {}

def start():
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind((HOST_IP, net.PORT))
    server_socket.listen()

    print(f'Listening for connections on {HOST_IP}:{net.PORT}...')

    while True:
        try:
            if len(socket_player) < 2:
                wait_for_players(server_socket)
            run_game()
        except Exception:
            continue

def wait_for_players(server_socket):
    print(f'Waiting for players...')
    init()
    for player in player_socket:
        client_socket, client_address = server_socket.accept()
        try:
            command = net.receive_command(client_socket)
        except net.BadMessage:
            continue

        assert(type(command) is net.LoginCommand)

        player_socket[player] = client_socket
        socket_player[client_socket] = player
        player_name[player] = command.player_name
        print(f'Player {command.player_name} connected from {client_address}.')

    print('All players connected, starting game...')

def run_game():
    this_game = game.Game()
    this_game.replenish()
    while True:
        for player, socket in player_socket.items():
            net.send_command(socket, net.GameCommand(this_game, player, player_name))
        
        if this_game.get_status() != 0:
            break

        player_move = {
            player_1: None,
            player_2: None
        }
        
        sockets = player_socket.values()
        while not all(player_move.values()):
            read_sockets, _, exception_sockets = select.select(sockets, [], sockets)

            if len(exception_sockets) > 0:
                for socket in exception_sockets:
                    print(f"Connection error from {socket_player[socket]}.")
                    socket_player.pop(socket)
                    raise net.BadMessage

            for socket in read_sockets:
                try:
                    command = net.receive_command(socket)
                except net.BadMessage:
                    socket_player.pop(socket)
                    raise net.BadMessage
                assert(type(command) is net.PlayerMoveCommand)
                player = socket_player[socket]
                print(f"Received player {player} move: {command.player_move}.")
                player_move[player] = command.player_move

        this_game.make_move(player_move.values())
        this_game.replenish()
