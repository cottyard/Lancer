import rule
from entity import Board, player_1, player_2, Position
import renderer
# import sys
# import intro
# from copy import deepcopy

op_exit = 'x'

player_1_name = '[1]'
player_2_name = '[2]'

def get_player_name(player):
    return player_1_name if player == player_1 else player_2_name

def main():
    global player_1_name, player_2_name
    player_1_name = input("player1: ")
    player_2_name = input("player2: ")

    turn = 1

    board = Board()
    board.set_out()

    def next_turn():
        nonlocal turn
        turn += 1

    while True:
        renderer.show_canvas(get_painted_board(board))
        
        p1_move = get_player_move(player_1_name)
        p2_move = get_player_move(player_2_name)

        # last_from = x1 - 1, y1 - 1
        # last_to = x2 - 1, y2 - 1

        # msg = make_move(board, player, x1 - 1, y1 - 1, x2 - 1, y2 - 1, skill_x, skill_y)
        # if msg is not None:
        #     prompt(msg)
        #     continue

        #msg = is_game_over(board)
        # if msg:
        #     renderer.show_canvas(construct_canvas(board, last_from, last_to))
        #     prompt(msg)
        #     return
        next_turn()
        print('\n\n\n')

def get_player_move(name):
    i = input("[%s]: " % name)
    if i == op_exit:
        return 'exit'
    try:
        x1, y1, x2, y2 = i
        x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

        if not rule.validate_coord(x1 - 1, y1 - 1) or \
            not rule.validate_coord(x2 - 1, y2 - 1):
            raise Exception()
    except:
        prompt("invalid input")
        return None

    return (Position(x1 - 1, y1 - 1), Position(x2 - 1, y2 - 1))

def get_painted_board(board):
    canvas = renderer.init_canvas()
    zero = renderer.get_zero_renderer(canvas)
    grid_renderer = renderer.get_grid_renderer(zero)
    highlight_renderer = renderer.get_highlight_renderer(zero)
    #hint_board = gen_hints(board)

    def render_unit(u, x, y):
        grid_renderer(
            x, y, get_player_name(u.owner), u.display, "LIGHTMAGENTA_EX" if u.owner == player_1 else "YELLOW",
            u.is_ultimate(), 0, 0, u.skillset.map, u.potential_skillset().map)
            #hint_board[x][y]
    #
    board.iterate_units(render_unit)
    # if last_from is not None:
    #     highlight_renderer(*last_from)
    # if last_to is not None:
    #     highlight_renderer(*last_to)
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


# def is_game_over(board):
#     king_mated = {
#         rule.p1: False,
#         rule.p2: False
#     }
    
#     for p in king_mated:
#         moves = all_available_moves(board, p)
#         print(p, 'moves', len(moves))
#         if len(moves) == 0:
#             king_mated[p] = True

#     if not king_mated[rule.p1] and not king_mated[rule.p2]:
#         return None
#     if king_mated[rule.p1] and king_mated[rule.p2]:
#         return 'Draw. This should never happen.'
#     winner = player_2_name if king_mated[rule.p1] else player_1_name
#     return "%s wins." % winner

# def all_available_moves(board, player):
#     all_moves = []
#     def each(u, x, y):
#         if u.owner != player:
#             return        
#         for nx, ny in rule.pos_in_reach(x, y, u.skills()):
#             if is_valid_move(board, x, y, nx, ny):
#                 all_moves.append((nx, ny))
#     iterate_units(board, each)
#     return all_moves



# def is_king_in_check(board, player):
#     kx, ky = find_unit(board, rule.King, player)
#     hints = gen_hints(board)
#     return hints[kx][ky][0] > 0
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 
# def find_unit(board, type_, owner):
#     pos = None
    
#     def each(u, x, y):
#         nonlocal pos
#         if type(u) == type_ and u.owner == owner:
#             pos = (x, y)

#     iterate_units(board, each)
#     return pos

def prompt(msg):
    print(msg)
    input("press enter...".upper())

# def make_move(board, player, x1, y1, x2, y2, skill_x, skill_y):
#     u = board[x1][y1]
#     if u is None:
#         return 'empty grid'

#     if u.owner != player:
#         return "invalid owner"

#     if u.skills()[skill_x][skill_y]:
#         if is_valid_move(board, x1, y1, x2, y2):
#             return move(board, x1, y1, x2, y2)
#         else:
#             return 'invalid move: king will be in check'
#     else:
#         if is_king_in_check(board, player):
#             return 'invalid move: must answer the check'
#         return endow(board, x1, y1, skill_x, skill_y)



# ##def which_units_can_reach(board, player, x, y):
# ##    can_reach = []
# ##
# ##    def each(u, ux, uy):
# ##        if u.owner != player:
# ##            return
# ##
# ##        in_reach = rule.pos_in_reach(ux, uy, u.skills())
# ##
# ##        if (x, y) in in_reach:
# ##            can_reach.append((u, (ux, uy)))
# ##
# ##    iterate_units(board, each)
# ##
# ##    return can_reach

# def move(board, from_x, from_y, to_x, to_y):
#     u = board[from_x][from_y]
#     t = board[to_x][to_y]
#     if t is not None:
#         if t.owner == u.owner:
#             return 'teamkill forbidden'
#         u = u.absorb(t)

#     board[to_x][to_y] = u
#     board[from_x][from_y] = None


# def endow(board, x, y, skill_x, skill_y):
#     err_msg = "skill not available or already endowed"
#     u = board[x][y]
#     if u.is_promotion_ready():
#         c = rule.get_adv_creator_from_endowment(u, skill_x, skill_y)
#         if c is None:
#             return err_msg
#         promoted = c(u.owner, u.skills())
#         promoted.endow(skill_x, skill_y)
#         board[x][y] = promoted
#     else:
#         if not u.endow(skill_x, skill_y):
#             return err_msg

main()
