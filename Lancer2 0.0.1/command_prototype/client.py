import pickle
import rule
import paint
import game
import socket
from entity import player_1, player_2, Position, PlayerMove
from os import system
import renderer
import net

player_autoplay = {
    player_1: False,
    player_2: False
}

op_exit = 'x'
op_toggle_auto = 'a'

player_color = {
    player_1: "LIGHTMAGENTA_EX",
    player_2: "YELLOW"
}

class ExitCommand(Exception):
    pass

def mode_online():
    client_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client_socket.connect((net.SERVER_IP, net.PORT))

    name = input("[Your name]: ")
    net.send_command(client_socket, net.LoginCommand(name))

    print("Waiting for server to start game...")

    while True:
        command = net.receive_command(client_socket)
        assert(type(command) is net.GameCommand)
        try:
            system('cls')
            renderer.show_canvas(
                paint.get_painted_canvas(
                    command.game, command.player_name, player_color, command.side))
            show_supply(command.player_name, command.game)
            check_game_status(command.game, command.player_name)

            while True:
                try:
                    player_move = read_player_move(
                        command.game, 
                        command.side, 
                        command.player_name[command.side])
                    command.game.validate_player_move(player_move)
                except rule.InvalidMoveException as e:
                    prompt(e)
                else:
                    break
        except ExitCommand:
            return

        net.send_command(client_socket, net.PlayerMoveCommand(player_move))
        print("Waiting for opponent move...")

def check_game_status(game, player_name):
    status = game.get_status()
    if status != 0:
        if status == 3:
            prompt("Draw.")
        elif status == 1:
            prompt("%s wins." % player_name[player_1])
        elif status == 2:
            prompt("%s wins." % player_name[player_2])
        else:
            prompt("Unknown status.")
        raise ExitCommand

def show_supply(player_name, game):
    print(f"{player_name[player_1]} supply: {game.supply[player_1]} | " + \
        f"{player_name[player_2]} supply: {game.supply[player_2]}")

def mode_hotseat():
    # global player_1_name, player_2_name
    # player_1_name = input("player1: ")
    # player_2_name = input("player2: ")

    player_name = {
        player_1: 'xyt',
        player_2: 'zc'
    }

    this_game = game.Game()
    
    while True:
        system('cls')
        renderer.show_canvas(paint.get_painted_canvas(this_game, player_name, player_color))

        this_game.replenish()
        show_supply(player_name, this_game)
        
        try:
            check_game_status(this_game, player_name)
        
            player_move_p1 = read_player_move(this_game, player_1, player_name[player_1])
            player_move_p2 = read_player_move(this_game, player_2, player_name[player_2])
        except ExitCommand:
            return

        try:
            this_game.make_move([player_move_p1, player_move_p2])
        except rule.InvalidMoveException as e:
            prompt(e)

def prompt(msg):
    print(msg)
    input("press enter...".upper())

def read_player_move(game, player, name):
    if player_autoplay[player]:
        return game.get_random_player_move(player)
    while True:
        i = input(f"[x:exit a:autoplay {name}]: ")
        if i == op_exit:
            raise ExitCommand
        if i == op_toggle_auto:
            player_autoplay[player] = True
            return game.get_random_player_move(player)
            
        try:
            return PlayerMove.from_literal(player, i)
        except:
            prompt("invalid input")
