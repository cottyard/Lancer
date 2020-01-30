#get_color，show，get_valid_moves，make_move，undo_move，get_status
from entity import Board, Move, Position, Unit, King, \
player_1, player_2, board_size_x, board_size_y

class InvalidMoveException(Exception):
    pass

def make_move(board, move_p1, move_p2):
    for move, player in (
            (move_p1, player_1), 
            (move_p2, player_2)):
        validate_move(board, move, player)

    move_type_p1 = decide_move_type(board, move_p1, move_p2)
    move_type_p2 = decide_move_type(board, move_p2, move_p1)

    next_board = board.copy()

    if move_type_p1 in move_case_map and \
       move_type_p2 in move_case_map[move_type_p1]:
        move_case_map[move_type_p1][move_type_p2](
            next_board, move_p1, move_p2)
    else:
        move_case_map[move_type_p2][move_type_p1](
            next_board, move_p2, move_p1)

    return next_board, move_type_p1, move_type_p2

def decide_move_type(board, move, enemy_move):
    unit = board.at(move.position_from)
    skill = move.get_skill()
    if unit.has_potential_skill(skill):
        return 'E'
    if unit.has_skill(skill):
        destination = board.at(move.position_to)
        if destination is None:
            return 'O'
        if destination.owner == unit.owner:
            return 'D'
        if move.position_to == enemy_move.position_from:
            return 'A1'
        else:
            return 'A2'
    else:
        raise Exception("Unhandled invalid move")

def status(board):
    king_1 = find_unit(board, King, player_1)
    king_2 = find_unit(board, King, player_2)
    if king_1 and king_2:
        return 0
    elif king_1:
        return 1
    elif king_2:
        return 2
    else:
        return 3

def find_unit(board, type_, owner):
    found_position = None
    
    def each(u, position):
        nonlocal found_position
        if type(u) == type_ and u.owner == owner:
            found_position = position

    board.iterate_units(each)
    return found_position

def validate_move(board, move, player):
    unit = board.at(move.position_from)
    if unit is None:
        raise InvalidMoveException("grid is empty")
    if unit.owner != player:
        raise InvalidMoveException("grid is enemy")
    skill = move.get_skill()
    if not unit.ultimate_skillset().has(skill):
        raise InvalidMoveException("skill not available")

def all_valid_moves(board, player, include_endowment=False):
    all_moves = []
    def each(u, position):
        if u.owner != player:
            return
        all_moves.extend(
            valid_moves(board, position, include_endowment))
            
    board.iterate_units(each)
    return all_moves

def valid_moves(board, position, include_endowment=False):
    unit = board.at(position)
    
    if include_endowment:
        skillset = unit.ultimate_skillset()
    else:
        skillset = unit.skillset

    skill_list = skillset.list_skills()
    in_reach = [position.get_new_position(skill.delta) for skill in skill_list]
    return [Move(position, pos) for pos in in_reach if pos is not None]

def endow(board, move):
    unit = board.at(move.position_from)
    skill = move.get_skill()
    if unit.is_promotion_ready():
        promoted = unit.get_promoted(skill)
        assert(promoted is not None)
        board.put(move.position_from, promoted)
    else:
        assert(unit.endow(skill))

# E: endow
# O: move to empty grid
# A1: attack enemy moving unit
# A2: attack enemy non-moving unit
# D: defend ally unit

move_case_map = {}

def case(key_1, key_2):
    def wrap(f):
        if key_1 not in move_case_map:
            move_case_map[key_1] = {}
        move_case_map[key_1][key_2] = f
        return f
    return wrap

@case('E', 'E')
def move_case_EE(board, move_1, move_2):
    endow(board, move_1)
    endow(board, move_2)

@case('O', 'E')
def move_case_OE(board, move_1, move_2):
    board.move(move_1)
    endow(board, move_2)

@case('O', 'O')
def move_case_OO(board, move_1, move_2):
    if move_1.position_to == move_2.position_to:
        board.remove(move_1.position_from)
        board.remove(move_2.position_from)
    else:
        board.move(move_1)
        board.move(move_2)

@case('A1', 'E')
def move_case_A1E(board, move_1, move_2):
    board.move(move_1)

@case('A1', 'O')
def move_case_A1O(board, move_1, move_2):
    board.move(move_2)
    board.move(move_1)

@case('A1', 'A1')
def move_case_A1A1(board, move_1, move_2):
    board.remove(move_1.position_from)
    board.remove(move_2.position_from)

@case('D', 'E')
def move_case_DE(board, move_1, move_2):
    endow(board, move_2)

@case('D', 'O')
def move_case_DO(board, move_1, move_2):
    board.move(move_2)

@case('D', 'A1')
def move_case_DA1(board, move_1, move_2):
    board.move(move_2)

@case('D', 'D')
def move_case_DD(board, move_1, move_2):
    pass

@case('A2', 'E')
def move_case_A2E(board, move_1, move_2):
    board.move(move_1)
    endow(board, move_2)

@case('A2', 'O')
def move_case_A2O(board, move_1, move_2):
    board.move(move_1)
    board.move(move_2)

@case('A2', 'A1')
def move_case_A2A1(board, move_1, move_2):
    board.move(move_1)
    board.move(move_2)

@case('A2', 'D')
def move_case_A2D(board, move_1, move_2):
    if move_1.position_to == move_2.position_to:
        board.remove(move_1.position_from)
    else:
        board.move(move_1)

@case('A2', 'A2')
def move_case_A2A2(board, move_1, move_2):
    board.move(move_1)
    board.move(move_2)
