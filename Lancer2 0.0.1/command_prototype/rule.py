#get_color，show，get_valid_moves，make_move，undo_move，get_status
from entity import Board, Move, Position, Unit, \
player_1, player_2, board_size_x, board_size_y, skillset_size

class InvalidMoveException(Exception):
    pass

# def make_move(board, move_p1, move_p2):
#     for move, player in (
#             (move_p1, player_1), 
#             (move_p2, player_2)):
#         if not validate_move_object(board, move, player):
#             raise InvalidMoveException("invalid object")

# def validate_move_object(board, move, player):
#     unit = board.at(move.position_from)
#     if unit is None:
#         return False
#     return unit.owner == player

# def make_move(board, player, x1, y1, x2, y2, skill_x, skill_y):
#     if u.skills()[skill_x][skill_y]:
#         if is_valid_move(board, x1, y1, x2, y2):
#             return move(board, x1, y1, x2, y2)
#         else:
#             return 'invalid move: king will be in check'
#     else:
#         if is_king_in_check(board, player):
#             return 'invalid move: must answer the check'
#         return endow(board, x1, y1, skill_x, skill_y)

# def is_valid_move(board, from_x, from_y, to_x, to_y):
#     u1 = board[from_x][from_y]
#     u2 = board[to_x][to_y]

#     if u1 is None:
#         return False

#     if u2 is not None and u1.owner == u2.owner:
#         return False

#     next_board = deepcopy(board)
#     move(next_board, from_x, from_y, to_x, to_y)
#     if is_king_in_check(next_board, u1.owner):
#         return False
    
#     return True

def validate_coord(x, y):
    return 0 <= x < board_size_x and \
           0 <= y < board_size_y

def which_skill(x1, y1, x2, y2):
    dx = x2 - x1 + skillset_size // 2
    dy = y2 - y1 + skillset_size // 2

    if not (
        0 <= dx < skillset_size and \
        0 <= dy < skillset_size):
            raise ValueError

    return dx, dy

def pos_in_reach(x, y, skillset):
    in_reach = [
        (
            x + dx - skillset_size // 2,
            y + dy - skillset_size // 2
        )
        for dx in range(skillset_size)
        for dy in range(skillset_size)
        if skillset[dx][dy]
    ]
    return [(i, j) for (i, j) in in_reach if validate_coord(i, j)]

# def get_creator_from_endowment(skill_x, skill_y):
#     return get_creator_by_skill(promotion_map.keys(), skill_x, skill_y)

# def get_adv_creator_from_endowment(u, skill_x, skill_y):
#     return get_creator_by_skill(promotion_map[type(u)], skill_x, skill_y)

# def get_creator_by_skill(creators, skill_x, skill_y):
#     for c in creators:
#         if potential_skillset[c.display][skill_x][skill_y]:
#             return c

