import pickle
import rule
import paint
import game
import socket
from entity import player_1, player_2, Position, PlayerMove
from os import system
import renderer
import net
import time

player_autoplay = {
    player_1: False,
    player_2: False
}

op_exit = 'x'
op_toggle_auto = 'a'
op_rollback = 'r'

class ExitCommand(Exception):
    pass
class RollbackCommand(Exception):
    pass

def get_player(player_name_map, player_name):
    for player in player_name_map:
        if player_name_map[player] == player_name:
            return player
    raise Exception(f"player name not found in received game: {player_name_map}")

def mode_online():
    name = input("[Your name]: ")
    session_id = net.new_game(name)
    game_id = None

    print(f"Waiting for other players on session {session_id}...")

    while True:
        game_id = net.query_game(session_id)
        if game_id:
            break
        time.sleep(1)

    start_session(session_id, game_id, name)

def mode_recover():
    session_id = input("[Session ID]: ").strip()
    game_id = net.query_game(session_id)
    if not game_id:
        prompt("Session not found.")
    name = input("[Your name]: ")
    start_session(session_id, game_id, name)

def start_session(session_id, game_id, player_name):
    with open(session_id, 'w'):
        pass

    while True:
        try:
            cmd = net.receive_game(session_id)
            if cmd is None:
                prompt('Game session aborted.')
                return
            assert(type(cmd) is net.GameCommand)
            player = get_player(cmd.player_name_map, player_name)
            renderer.show_canvas(
                paint.get_painted_canvas(
                    cmd.game, cmd.player_name_map, player))
            show_supply_and_population(cmd.player_name_map, cmd.game)
            check_game_status(cmd.status, cmd.player_name_map)

            player_move = read_player_move_online(
                cmd.game, 
                player, 
                cmd.player_name_map[player],
                session_id)
        except ExitCommand:
            return
        except RollbackCommand:
            continue

        net.submit_player_move(game_id, player_move)
        print("Waiting for opponent move...")

        while True:
            new_game_id = net.query_game(session_id)
            if not new_game_id:
                prompt('Game session aborted.')
                return
            if new_game_id != game_id:
                game_id = new_game_id
                break
            time.sleep(1)

def check_game_status(status, player_name_map):
    if status != game.GameStatus.Ongoing:
        if status == game.GameStatus.Draw:
            prompt("Draw.")
        elif status == game.GameStatus.Victorious:
            prompt("%s wins." % player_name_map[player_1])
        elif status == game.GameStatus.Defeated:
            prompt("%s wins." % player_name_map[player_2])
        else:
            prompt("Unknown status.")
        raise ExitCommand

def show_supply_and_population(player_name_map, game):
    for player in player_name_map:
        print(
            f"{player_name_map[player]} supply: {game.supply[player]} (+{game.incremental_supply(player)}) | " + \
            f"units: {game.count_unit(player)}/{rule.max_unit_count}")

def mode_hotseat():
    player_name_map = {
        player_1: input("player1: "),
        player_2: input("player2: ")
    }

    this_game = game.Game()
    
    while True:
        renderer.show_canvas(paint.get_painted_canvas(this_game, player_name_map))
        show_supply_and_population(player_name_map, this_game)
        
        try:
            check_game_status(this_game.get_status(), player_name_map)
        
            player_move_p1 = read_player_move_hotseat(this_game, player_1, player_name_map[player_1])
            player_move_p2 = read_player_move_hotseat(this_game, player_2, player_name_map[player_2])
        except ExitCommand:
            return

        try:
            this_game = this_game.make_move([player_move_p1, player_move_p2])
        except rule.InvalidMoveException as e:
            prompt(e)

def prompt(msg):
    print(msg)
    input("press enter...".upper())

def read_player_move_hotseat(game, player, name):
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
            player_move = PlayerMove.from_literal(player, i)
        except:
            prompt("invalid input")
            continue

        try:
            game.validate_player_move(player_move)
        except rule.InvalidMoveException as e:
            prompt(e)
            continue

        return player_move

def read_player_move_online(game, player, name, session_id):
    while True:
        i = input(f"[x:exit r:rollback {name}]: ")
        if i == op_exit:
            raise ExitCommand
        if i == op_rollback:
            net.rollback_game(session_id)
            raise RollbackCommand
            
        try:
            player_move = PlayerMove.from_literal(player, i)
        except:
            prompt("invalid input")
            continue

        try:
            game.validate_player_move(player_move)
        except rule.InvalidMoveException as e:
            prompt(e)
            continue

        return player_move
