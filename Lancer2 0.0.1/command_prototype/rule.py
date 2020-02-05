#get_color，show，get_valid_moves，make_move，undo_move，get_status

from entity import Board, Move, PlayerMove, Action, PlayerAction, ActionType, \
ForceBoard, Position, Unit, King, \
player_1, player_2, board_size_x, board_size_y, InvalidParameter

class InvalidMoveException(Exception):
    pass

def make_move(board, player_move_list):
    player_action_map = {}
    for player_move in player_move_list:
        player_action_map[player_move.player] = validate_player_move(board, player_move)

    player_action_list = [player_action.copy() for player_action in player_action_map.values()]

    next_board = board.copy()

    run_upgrade_phase(next_board, player_action_list)
    force_board = run_defend_phase(player_action_list)
    run_clash_phase(next_board, player_action_list)
    run_battle_phase(next_board, player_action_list, force_board)
    run_recruit_phase(next_board, player_action_list)

    return next_board, player_action_map

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

def run_defend_phase(player_action_list):
    force_board = ForceBoard()
    for player_action in player_action_list:
        for action in player_action.extract_actions(lambda a: a.type == ActionType.Defend):
            force_board.increase(action.move.position_to, player_action.player)
    return force_board

def run_clash_phase(board, player_action_list):
    clash_board = Board()
    clashing_actions = []
    for player_action in player_action_list:
        for action in player_action.action_list:
            if action.type != ActionType.Attack:
                continue
            action_other = clash_board.at(action.move.position_to)
            if action_other is not None:
                if action_other.move.position_to == action.move.position_from:
                    clashing_actions.append(action)
                    clashing_actions.append(action_other)
            clash_board.put(action.move.position_from, action)

    if len(clashing_actions) == 0:
        return

    for player_action in player_action_list:
        player_action.extract_actions(lambda a: a in clashing_actions)

    for action in clashing_actions:
        board.remove(action.move.position_from)

def run_battle_phase(board, player_action_list, force_board):
    arrive_board = {
        player_1: Board(),
        player_2: Board()
    }
    for player_action in player_action_list:
        for action in player_action.extract_actions(
                lambda a: a.type in (ActionType.Attack, ActionType.Move)):
            target = action.move.position_to
            if arrive_board[player_action.player].at(target) is None:
                unit = board.remove(action.move.position_from)
                arrive_board[player_action.player].put(target, unit)
            force_board.increase(target, player_action.player)

    def foreach_arriver(unit, target_position):
        if force_board.winner(target_position) == unit.owner:
            board.put(target_position, unit)

    for player in arrive_board:
        arrive_board[player].iterate_units(foreach_arriver)

def run_recruit_phase(board, player_action_list):
    for player_action in player_action_list:
        for action in player_action.action_list:
            assert(action.type == ActionType.Recruit)
            if board.at(action.move.position_from) is None:
                skill = action.move.get_skill()
                unit_recruited = Unit.create_from_skill(player_action.player, skill)
                board.put(action.move.position_from, unit_recruited)

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
    player_1: 0,
    player_2: board_size_y - 1
}

def validate_move(board, move, player):
    unit = board.at(move.position_from)
    if unit is None:
        if move.position_from.y == spawn_row[player]:
            try:
                skill = move.get_skill()
            except InvalidParameter:
                raise InvalidMoveException("this skill recruits nothing")
            unit_recruited = Unit.create_from_skill(player, skill)
            return Action(move, ActionType.Recruit, type(unit_recruited))
        else:
            raise InvalidMoveException("grid is empty")

    if unit.owner != player:
        raise InvalidMoveException("grid is enemy")

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
   