from entity import Action, ActionType, InvalidParameter, \
    King, Move, PlayerAction, PlayerMove, Position, Unit
from board import Board, ForceBoard
from const import player_1, player_2, board_size_y

max_unit_count = 28

class InvalidMoveException(Exception):
    pass

class BoardUnit:
    def __init__(self, unit, position):
        self.unit = unit
        self.position = position

class Martyr:
    def __init__(self, board_unit, has_trophy = True):
        self.board_unit = board_unit
        self.has_trophy = has_trophy

def make_move(board, player_move_list):
    player_action_map = {}
    for player_move in player_move_list:
        player_action_map[player_move.player] = validate_player_move(board, player_move)

    player_action_list = [player_action.copy() for player_action in player_action_map.values()]

    next_board = board.copy()
    force_board = ForceBoard()

    martyr_list = []

    run_upgrade_phase(next_board, player_action_list)
    run_defend_phase(board, player_action_list, force_board)
    martyr_list += run_clash_phase(next_board, player_action_list, force_board)
    martyr_list += run_battle_phase(next_board, player_action_list, force_board, board)
    run_recruit_phase(next_board, player_action_list)

    return next_board, player_action_map, martyr_list

def run_upgrade_phase(board, player_action_list):
    for player_action in player_action_list:
        for action in player_action.extract_actions(lambda a: a.type == ActionType.Upgrade):
            unit = board.at(action.move.position_from)
            skill = action.move.get_skill()
            if unit.is_promotion_ready():
                promoted = unit.get_promoted(skill)
                assert(promoted is not None)
                board.put(action.move.position_from, promoted)
            else:
                assert(unit.endow(skill))

def run_defend_phase(board, player_action_list, force_board):
    for player_action in player_action_list:
        for action in player_action.extract_actions(lambda a: a.type == ActionType.Defend):
            unit = board.at(action.move.position_from)
            force_board.reinforce(
                action.move.position_to,
                player_action.player,
                BoardUnit(unit, action.move.position_from))
    return force_board

def run_clash_phase(board, player_action_list, force_board):
    clash_board = Board()
    clashing_actions = []
    martyr_list = []
    for player_action in player_action_list:
        for action in player_action.action_list:
            if action.type != ActionType.Attack:
                continue
            action_other = clash_board.at(action.move.position_to)
            if action_other is not None:
                if action_other.move.position_to == action.move.position_from:
                    if player_action.player == player_1:
                        clashing_actions.extend([action, action_other])
                    else:
                        clashing_actions.extend([action_other, action])
            clash_board.put(action.move.position_from, action)

    if len(clashing_actions) == 0:
        return martyr_list

    for player_action in player_action_list:
        player_action.extract_actions(lambda a: a in clashing_actions)
    
    for action_1, action_2 in list(zip(clashing_actions[0::2], clashing_actions[1::2])):
        u1 = board.remove(action_1.move.position_from)
        u2 = board.remove(action_2.move.position_from)
        bu1 = BoardUnit(u1, action_1.move.position_from)
        bu2 = BoardUnit(u2, action_2.move.position_from)

        surviver = u1.duel(u2)
        if surviver is None:
            martyr_list.extend([Martyr(bu1), Martyr(bu2)])
        else:
            a_surviver = action_1 if surviver == u1 else action_2
            bunit_surviver = bu1 if surviver == u1 else bu2
            bunit_martyr = bu2 if surviver == u1 else bu1
            force_board.arrive(
                a_surviver.move.position_to,
                surviver.owner,
                bunit_surviver
            )
            martyr_list.append(Martyr(bunit_martyr))

    return martyr_list

def run_battle_phase(board, player_action_list, force_board, last_board):
    for player_action in player_action_list:
        for action in player_action.extract_actions(
                lambda a: a.type in (ActionType.Attack, ActionType.Move)):
            target_position = action.move.position_to
            if force_board.arriver(target_position, player_action.player) is None:
                unit = board.remove(action.move.position_from)
                force_board.arrive(
                    target_position, 
                    player_action.player,
                    BoardUnit(unit, action.move.position_from))
            else:
                unit = board.at(action.move.position_from)
                force_board.reinforce(
                    target_position,
                    player_action.player,
                    BoardUnit(unit, action.move.position_from))

    martyr_list = []
    def settle_battle(position):
        outcome = force_board.battle(position)
        arriver = outcome.arriver_won()
        arriving_successful = arriver is not None
        resident = board.at(position)

        if arriving_successful:
            bunit = arriver
            board.put(position, bunit.unit)
        
        if outcome.is_skirmish():
            if outcome.tied():
                bu1 = outcome.arriver_map.get(player_1)
                bu2 = outcome.arriver_map.get(player_2)
                martyr_list.extend([Martyr(bu1, False), Martyr(bu2, False)])
            else:
                player_lost = opponent(outcome.player_won)
                bunit = outcome.arriver_map.get(player_lost)
                martyr_list.append(Martyr(bunit, False))
        else:
            player_invader = outcome.arriver_map.arrived_players()[0]
            bunit = outcome.arriver_map.get(player_invader)
            
            if arriving_successful:
                if resident:
                    martyr_list.append(Martyr(BoardUnit(resident, position)))
            else:
                martyr_list.append(Martyr(bunit, False))

    force_board.iterate_battles(settle_battle)
    return martyr_list

def run_recruit_phase(board, player_action_list):
    for player_action in player_action_list:
        for action in player_action.action_list:
            assert(action.type == ActionType.Recruit)
            if board.at(action.move.position_from) is None:
                skill = action.move.get_skill()
                unit_recruited = Unit.create_from_skill(player_action.player, skill)
                board.put(action.move.position_from, unit_recruited)

def opponent(player):
    return player_2 if player == player_1 else player_1

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

spawn_row = {
    player_1: board_size_y - 1,
    player_2: 0
}

def count_unit(board, player, unit_type=None):
    count = 0
    def count_unit(u, _):
        nonlocal count
        if u.owner == player:
            if unit_type is None or type(u) == unit_type:
                count += 1
    board.iterate_units(count_unit)
    return count

def validate_move(board, move, player):
    unit = board.at(move.position_from)
    if unit is None:
        if move.position_from.y != spawn_row[player]:
            raise InvalidMoveException("grid is empty")
        elif count_unit(board, player) >= max_unit_count:
            raise InvalidMoveException("units limit exceeded - cannot recruit anymore")
        else:
            try:
                skill = move.get_skill()
            except InvalidParameter:
                raise InvalidMoveException("not a valid skill")
            unit_recruited = Unit.create_from_skill(player, skill)
            if unit_recruited is None:
                raise InvalidMoveException("this skill recruits nothing")
            return Action(move, ActionType.Recruit, type(unit_recruited))

    if unit.owner != player:
        raise InvalidMoveException("grid belongs to enemy")

    try:
        skill = move.get_skill()
    except InvalidParameter:
        raise InvalidMoveException("not a valid skill")

    if not unit.ultimate_skillset().has(skill):
        raise InvalidMoveException("skill not available")
    
    if not unit.skillset.has(skill):
        return Action(move, ActionType.Upgrade, type(unit))

    target_unit = board.at(move.position_to)

    if target_unit is None:
        return Action(move, ActionType.Move, type(unit))

    if unit.owner == target_unit.owner:
        return Action(move, ActionType.Defend, type(unit))
    else:
        return Action(move, ActionType.Attack, type(unit))

def validate_player_move(board, player_move):
    moves = player_move.move_list
    position_from_list = [move.position_from for move in moves]
    if len(set(position_from_list)) != len(moves):
        raise InvalidMoveException("unit moved more than once")

    return PlayerAction(
        player_move.player,
        [
            validate_move(board, move, player_move.player)
            for move in moves
        ])

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
