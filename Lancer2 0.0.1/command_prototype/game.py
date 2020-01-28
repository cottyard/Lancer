import rule
from entity import Board, player_1, player_2, Position, Move
import renderer
import random
from os import system

auto_play_1 = False
auto_play_2 = False

op_exit = 'x'
op_toggle_auto = 'a'

player_1_name = 'xyt'
player_2_name = 'zc'

player_1_color = "LIGHTMAGENTA_EX"
player_2_color = "YELLOW"

hint_from = "o>>"
hint_to = ">>o"

move_type_hint_map = {
    'E': ('UPG', 'BLUE'),
    'D': ('DEF', 'GREEN'),
    'A1': ('ATK', 'RED'),
    'A2': ('ATK', 'RED'),
    'O': ('MOV', None)
}

class ExitCommand(Exception):
    pass

def get_player_name(player):
    return player_1_name if player == player_1 else player_2_name

def main():
    # global player_1_name, player_2_name
    # player_1_name = input("player1: ")
    # player_2_name = input("player2: ")

    turn = 1

    board = Board()
    board.set_out()

    last_move_p1 = None
    last_move_p2 = None
    last_move_type_p1 = None
    last_move_type_p2 = None

    while True:
        system('cls')
        renderer.show_canvas(
            get_painted_board(board, last_move_p1, last_move_p2, last_move_type_p1, last_move_type_p2))
        
        status = rule.status(board)
        if status != 0:
            if status == 3:
                prompt("Draw.")
            elif status == 1:
                prompt("%s wins." % get_player_name(player_1))
            elif status == 2:
                prompt("%s wins." % get_player_name(player_2))
            else:
                prompt("Unknown status.")
            return

        try:
            if auto_play_1:
                move_p1 = get_random_move(board, player_1)
            else:
                move_p1 = get_player_move(board, player_1)

            if auto_play_2:
                move_p2 = get_random_move(board, player_2)
            else:
                move_p2 = get_player_move(board, player_2)
        except ExitCommand:
            return

        try:
            board, last_move_type_p1, last_move_type_p2 = rule.make_move(board, move_p1, move_p2)
        except rule.InvalidMoveException as e:
            prompt(e)

        last_move_p1, last_move_p2 = move_p1, move_p2

        turn += 1

def set_auto(player):
    global auto_play_1, auto_play_2
    if player == player_1:
        auto_play_1 = True
    else:
        auto_play_2 = True

def cancel_auto(player):
    global auto_play_1, auto_play_2
    if player == player_1:
        auto_play_1 = False
    else:
        auto_play_2 = False

def get_random_move(board, player):
    return random.choice(rule.all_valid_moves(board, player, True))

def get_player_move(board, player):
    global auto_play_1, auto_play_2
    while True:
        i = input("[x:exit a:autoplay %s]: " % get_player_name(player))
        if i == op_exit:
            raise ExitCommand
        if i == op_toggle_auto:
            set_auto(player)
            return get_random_move(board, player)
        
        try:
            x1, y1, x2, y2 = i
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

            position_1 = Position(x1 - 1, y1 - 1)
            position_2 = Position(x2 - 1, y2 - 1)
        except:
            prompt("invalid input")
        else:
            return Move(position_1, position_2)

def get_painted_board(board, move_p1, move_p2, move_type_p1, move_type_p2):
    canvas = renderer.init_canvas()
    zero = renderer.get_zero_renderer(canvas)
    grid_renderer = renderer.get_grid_renderer(zero)
    highlight_renderer = renderer.get_highlight_renderer(zero)
    #hint_board = gen_hints(board)
    
    def render_unit(u, position):
        grid_renderer(
            position.x, position.y, get_player_name(u.owner), u.display,
            player_1_color if u.owner == player_1 else player_2_color,
            u.is_perfect(), 0, 0, u.skillset.map, u.potential_skillset().map)
            #hint_board[x][y]

    board.iterate_units(render_unit)

    if move_p1 is not None:
        hint_content, hint_color = move_type_hint_map[move_type_p1]
        if hint_color is None:
            hint_color = player_1_color
        highlight_renderer(move_p1.position_from.x, move_p1.position_from.y, player_1_color, False, hint_from)
        highlight_renderer(move_p1.position_from.x, move_p1.position_from.y, hint_color, True, hint_content)
        highlight_renderer(move_p1.position_to.x, move_p1.position_to.y, player_1_color, False, hint_to)
        
    if move_p2 is not None:
        hint_content, hint_color = move_type_hint_map[move_type_p2]
        if hint_color is None:
            hint_color = player_2_color
        highlight_renderer(move_p2.position_from.x, move_p2.position_from.y, player_2_color, False, hint_from)
        highlight_renderer(move_p2.position_from.x, move_p2.position_from.y, hint_color, True, hint_content)
        highlight_renderer(move_p2.position_to.x, move_p2.position_to.y, player_2_color, move_p1.position_to == move_p2.position_to, hint_to)

    return canvas

# def gen_hints(board):
#     hint_board = [
#         [[0, 0] for j in range(rule.board_size_y)]
#         for i in range(rule.board_size_x)
#     ]
    
#     def each(u, i, j):
#         for (x, y) in rule.pos_in_reach(i, j, u.skills()):
#             u2 = board[x][y]
#             if u2 is None:
#                 continue
#             if u2.owner == u.owner:
#                 hint_board[x][y][1] += 1
#             else:
#                 hint_board[x][y][0] += 1

#     iterate_units(board, each)
#     return hint_board

def prompt(msg):
    print(msg)
    input("press enter...".upper())

main()
