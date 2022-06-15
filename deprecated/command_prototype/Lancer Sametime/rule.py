from entity import Action, ActionType, InvalidParameter, \
    King, Move, PlayerAction, PlayerMove, Position, Unit
from board import Board, ForceBoard
from const import player_1, player_2, board_size_y, player_color_map
from renderer import dye


max_unit_count = 20

text_killed = dye('RED', 'killed')

class InvalidMoveException(Exception):
    pass

class RoundBrief:
    def __init__(self, clash_briefs, battle_briefs):
        self.clash_briefs = clash_briefs
        self.battle_briefs = battle_briefs

class ClashBrief:
    def __init__(self, unit_brief_map):
        self.unit_brief_map = unit_brief_map

    def brief(self):
        return f'{self.unit_brief_map[player_1].brief()} and ' + \
            f'{self.unit_brief_map[player_2].brief()} {text_killed} each other.'

class BattleBrief:
    def __init__(self, position):
        self.position = position

class Invasion(BattleBrief):
    def __init__(
            self, position, unit_invader, unit_reinforcers, 
            unit_invaded, unit_defenders, successful, escaped):
        super().__init__(position)
        self.unit_invader = unit_invader
        self.unit_reinforcers = unit_reinforcers
        self.unit_invaded = unit_invaded
        self.unit_defenders = unit_defenders
        self.successful = successful
        self.escaped = escaped
    
    def brief(self):
        invasive_squad = [self.unit_invader] + self.unit_reinforcers
        if self.successful:
            if self.unit_invaded is None:
                action = 'moved to'
            else:
                action = 'invaded'

            if self.unit_defenders:
                text = f'{brief_squad(invasive_squad)} {action} [{self.position}] and ' + \
                    f'outfought {brief_squad(self.unit_defenders)}. '
            else:
                text = f'{brief_squad(invasive_squad)} {action} [{self.position}]. '

            if self.unit_invaded is not None:
                if self.escaped:
                    text += f'{self.unit_invaded.brief()} escaped.'
                else:
                    text += f'{self.unit_invaded.brief()} was {text_killed}.'
        else:
            text = f'{brief_squad(invasive_squad)} was defeated at ' + \
                f'[{self.position}] by {brief_squad(self.unit_defenders)}. ' + \
                f'{self.unit_invader.brief()} was {text_killed}.'
        
        return text

class SkirmishTied(BattleBrief):
    def __init__(
            self, position, unit_lead_1, unit_followers_1, unit_lead_2, unit_followers_2):
        super().__init__(position)
        self.unit_lead_1 = unit_lead_1
        self.unit_lead_2 = unit_lead_2
        self.unit_followers_1 = unit_followers_1
        self.unit_followers_2 = unit_followers_2

    def brief(self):
        text = f'A skirmish at [{self.position}] between ' + \
            f'{brief_squad([self.unit_lead_1] + self.unit_followers_1)} and ' + \
            f'{brief_squad([self.unit_lead_2] + self.unit_followers_2)} was tied. ' + \
            f'{self.unit_lead_1.brief()} and {self.unit_lead_2.brief()} were {text_killed}.'
        return text

class Skirmish(BattleBrief):
    def __init__(
            self, position, unit_victorious, units_victorious, unit_defeated, units_defeated):
        super().__init__(position)
        self.unit_victorious = unit_victorious
        self.units_victorious = units_victorious
        self.unit_defeated = unit_defeated
        self.units_defeated = units_defeated

    def brief(self):
        text = f'A skirmish at [{self.position}] between ' + \
            f'{brief_squad([self.unit_victorious] + self.units_victorious)} and ' + \
            f'{brief_squad([self.unit_defeated] + self.units_defeated)} was won by ' + \
            f'{self.unit_victorious.brief()}. {self.unit_defeated.brief()} was {text_killed}.'
        return text

class UnitBrief:
    def __init__(self, unit_type, player, position):
        self.unit_type = unit_type
        self.player = player
        self.position = position

    def __repr__(self):
        return f'{self.unit_type.__name__}[{self.position}]'

    def brief(self):
        return dye(player_color_map[self.player], f'{self.unit_type.__name__}') + f'[{self.position}]'


def as_brief(unit, player, position):
    if unit is None:
        return None
    return UnitBrief(type(unit), player, position)

def brief_squad(unit_brief_list):
    return ','.join([unit_brief.brief() for unit_brief in unit_brief_list])

def make_move(board, player_move_list):
    player_action_map = {}
    for player_move in player_move_list:
        player_action_map[player_move.player] = validate_player_move(board, player_move)

    player_action_list = [player_action.copy() for player_action in player_action_map.values()]

    next_board = board.copy()
    force_board = ForceBoard()

    run_upgrade_phase(next_board, player_action_list)
    run_defend_phase(board, player_action_list, force_board)
    clash_briefs = run_clash_phase(next_board, player_action_list)
    battle_briefs = run_battle_phase(next_board, player_action_list, force_board, board)
    run_recruit_phase(next_board, player_action_list)

    return next_board, player_action_map, RoundBrief(clash_briefs, battle_briefs)

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
                as_brief(unit, player_action.player, action.move.position_from))
    return force_board

def run_clash_phase(board, player_action_list):
    clash_briefs = []
    clash_board = Board()
    clashing_actions = []
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
        return clash_briefs

    for player_action in player_action_list:
        player_action.extract_actions(lambda a: a in clashing_actions)

    for action_1, action_2 in list(zip(clashing_actions[0::2], clashing_actions[1::2])):
        board.remove(action_1.move.position_from)
        board.remove(action_2.move.position_from)
        clash_briefs.append(
            ClashBrief({
                player_1: UnitBrief(action_1.unit_type, player_1, action_1.move.position_from),
                player_2: UnitBrief(action_2.unit_type, player_2, action_2.move.position_from)
            }))

    return clash_briefs

def run_battle_phase(board, player_action_list, force_board, last_board):
    battle_briefs = []

    for player_action in player_action_list:
        for action in player_action.extract_actions(
                lambda a: a.type in (ActionType.Attack, ActionType.Move)):
            target_position = action.move.position_to
            if force_board.arriver(target_position, player_action.player) is None:
                unit = board.remove(action.move.position_from)
                force_board.arrive(
                    target_position, 
                    player_action.player,
                    (unit, action.move.position_from))
            else:
                unit = board.at(action.move.position_from)
                force_board.reinforce(
                    target_position,
                    player_action.player,
                    as_brief(unit, player_action.player, action.move.position_from))

    def settle_battle(position):
        outcome = force_board.battle(position)
        arriver = outcome.arriver_won()
        is_position_empty = board.at(position) is None

        if arriver is not None:
            unit, _ = arriver
            board.put(position, unit)

        if outcome.arriver_map.count() == 1:
            player_invader = outcome.arriver_map.arrived_players()[0]
            player_invaded = opponent(player_invader)
            successful = arriver is not None
            resident = last_board.at(position)

            unit_invader, position_from = outcome.arriver_map.get(player_invader)
            battle_brief = Invasion(
                position,
                as_brief(unit_invader, player_invader, position_from),
                outcome.reinforcers_map.get(player_invader), 
                as_brief(resident, player_invaded, position),
                outcome.reinforcers_map.get(player_invaded),
                successful,
                is_position_empty)
        elif outcome.tied():
            unit_1, position_1 = outcome.arriver_map.get(player_1)
            unit_2, position_2 = outcome.arriver_map.get(player_2)

            battle_brief = SkirmishTied(
                position, 
                as_brief(unit_1, player_1, position_1),
                outcome.reinforcers_map.get(player_1),
                as_brief(unit_2, player_2, position_2),
                outcome.reinforcers_map.get(player_2))
        else:
            player_won = outcome.player_won
            player_lost = opponent(player_won)
            unit_won, position_1 = outcome.arriver_map.get(player_won)
            unit_lost, position_2 = outcome.arriver_map.get(player_lost)

            battle_brief = Skirmish(
                position, 
                as_brief(unit_won, player_won, position_1),
                outcome.reinforcers_map.get(player_won),
                as_brief(unit_lost, player_lost, position_2),
                outcome.reinforcers_map.get(player_lost))

        battle_briefs.append(battle_brief)
            
    force_board.iterate_battles(settle_battle)
    return battle_briefs

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
    player_1: 0,
    player_2: board_size_y - 1
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
