import skills
from enum import Enum
from const import board_size_x, board_size_y, skillset_size, skillset_range
import json

class Move:
    @classmethod
    def from_literal(self, literal):
        try:
            x1, y1, x2, y2 = literal
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

            position_1 = Position(x1, y1)
            position_2 = Position(x2, y2)
        except:
            raise InvalidParameter("move literal")
        else:
            return Move(position_1, position_2)

    def __init__(self, position_from, position_to):
        self.position_from = position_from
        self.position_to = position_to
    
    def __eq__(self, move):
        return self.position_from == move.position_from and \
            self.position_to == move.position_to

    def is_from_same(self, move):
        return self.position_from == move.position_from

    def is_to_same(self, move):
        return self.position_to == move.position_to

    def get_skill(self):
        return Skill(self.position_from.get_delta(self.position_to))

    def __repr__(self):
        return str(self.position_from) + '->' + str(self.position_to)

    def serialize(self):
        return self.position_from.serialize() + self.position_to.serialize()

class PlayerMove:
    @classmethod
    def from_literal(self, player, literal):
        try:
            return PlayerMove(player, [Move.from_literal(lit) for lit in literal.split()])
        except:
            raise InvalidParameter("player move literal")

    def __init__(self, player, move_list):
        self.player = player
        self.move_list = move_list
    
    def __repr__(self):
        return ','.join([str(m) for m in self.move_list])

class Action:
    def __init__(self, move, type_, unit_type):
        self.move = move
        self.type = type_
        self.unit_type = unit_type

    def __repr__(self):
        return f'{self.move}({ActionType.show(self.type)})'

    def get_cost(self):
        if self.type == ActionType.Move:
            if self.move.get_skill().is_leap():
                return 4
            else:
                return 3
        try:
            return {
                ActionType.Upgrade: 5,
                ActionType.Defend: 2,
                ActionType.Attack: 6,
            }[self.type]
        except KeyError:
            return {
                Barbarian: 8,
                Soldier: 12,
                Archer: 10,
                Rider: 16,
                Wagon: 20
            }[self.unit_type]

    def serialize(self):
        return json.dumps([self.type.value, self.unit_type.__name__, self.move.serialize()])

class PlayerAction:
    def __init__(self, player, action_list):
        self.player = player
        self.action_list = action_list
    
    def extract_actions(self, filter):
        extracted = [a for a in self.action_list if filter(a)]
        remaining = [a for a in self.action_list if not filter(a)]
        self.action_list = remaining
        return extracted

    def copy(self):
        return PlayerAction(self.player, self.action_list.copy())

    def get_cost(self):
        return sum([action.get_cost() for action in self.action_list])

    def __repr__(self):
        return ','.join([str(a) for a in self.action_list])
    
    def serialize(self):
        return json.dumps([self.player] + [
            action.serialize() for action in self.action_list])

class ActionType(Enum):
    Upgrade = 1
    Defend = 2
    Move = 3
    Attack = 4
    Recruit = 5

    @classmethod
    def show(self, action_type):
        return {
            ActionType.Upgrade: 'UPG',
            ActionType.Defend: 'DEF',
            ActionType.Move: 'MOV',
            ActionType.Attack: 'ATK',
            ActionType.Recruit: 'REC'
        }[action_type]

class Position:
    def __init__(self, x, y):
        if not (0 <= x < board_size_x and 0 <= y < board_size_y):
            raise InvalidParameter("Position")
        self.x = x
        self.y = y

    @classmethod
    def from_literal(self, literal):
        try:
            x, y = literal
            x, y = map(int, [x, y])
        except:
            raise InvalidParameter("move literal")
        else:
            return Position(x - 1, y - 1)

    def get_delta(self, position):
        return PositionDelta(position.x - self.x, position.y - self.y)
    
    def __eq__(self, position):
        return self.x == position.x and self.y == position.y

    def get_new_position(self, position_delta):
        try:
            return Position(self.x + position_delta.dx, self.y + position_delta.dy)
        except InvalidParameter:
            return None

    def __str__(self):
        return f'{self.x + 1}{self.y + 1}'

    def __hash__(self):
        return self.x * 10 + self.y

    def serialize(self):
        return f'{self.x}{self.y}'

class Unit:
    display = ""
    level = 0
    trophy = 0
    
    def __init__(self, owner, skillset=None, flip_skillset=False):
        self.owner = owner
        self.perfect_skillset = potential_skillset_map[self.display].copy()
        if skillset is None:
            self.skillset = inborn_skillset_map[self.display].copy()
        else:
            self.skillset = skillset.copy()

        if flip_skillset:
            self.skillset.flip()

    def endow(self, skill):
        if self.perfect_skillset.has(skill):
            self.skillset.add(skill)
            return True
        return False
        
    def has_skill(self, skill):
        return self.skillset.has(skill)
    
    def has_potential_skill(self, skill):
        return self.potential_skillset().has(skill)

    def is_perfect(self):
        return self.skillset == self.perfect_skillset

    def is_promotion_ready(self):
        return not self.is_advanced() and self.is_perfect()

    def is_advanced(self):
        return type(self) not in promotion_map

    def potential_skillset(self):
        return self.ultimate_skillset().subtract(self.skillset)
    
    def ultimate_skillset(self):
        ultimate = self.perfect_skillset.copy()
        if self.is_promotion_ready():
            for creator in promotion_map[type(self)]:
                ultimate.union(potential_skillset_map[creator.display])
        return ultimate

    def get_promoted(self, skill):
        if not self.is_promotion_ready():
            return None

        creator = Unit.which_creator_has_skill(promotion_map[type(self)], skill)
        if creator is None:
            return None
        promoted = creator(self.owner, skillset=self.skillset)
        promoted.endow(skill)
        return promoted
    
    def duel(self, other):
        if self.level == other.level:
            return None
        elif self.level > other.level:
            return self
        else:
            return other

    @classmethod
    def which_creator_has_skill(self, creator_list, skill):
        for creator in creator_list:
            if potential_skillset_map[creator.display].has(skill):
                return creator

    @classmethod
    def create_from_skill(self, player, skill):
        if skill.delta.dx == skill.delta.dy == 0:
            creator = Wagon
        else:
            creator = self.which_creator_has_skill(
                [Rider, Soldier, Barbarian, Archer], skill)
        if creator is None:
            return None

        created = creator(player, SkillSet())
        created.endow(skill)
        return created

    def serialize(self):
        return json.dumps([type(self).__name__, self.owner, self.skillset.serialize()])

    @classmethod
    def deserialize(cls, payload):
        [typename, owner, p_skillset] = json.loads(payload)
        return eval(typename)(owner, SkillSet.deserialize(p_skillset))

class PositionDelta:
    def __init__(self, dx, dy):
        self.dx = dx
        self.dy = dy
    
    def __eq__(self, other):
        return self.dx == other.dx and self.dy == other.dy

class InvalidParameter(Exception):
    pass

class Skill:
    def __init__(self, position_delta):
        self.delta = position_delta
        if not (
                0 <= self.delta.dx + skillset_range < skillset_size and \
                0 <= self.delta.dy + skillset_range < skillset_size):
            raise InvalidParameter("Skill")
    
    def is_leap(self):
        return abs(self.delta.dx) > 1 or abs(self.delta.dy) > 1

class SkillSet:
    op_union = lambda a, b: a or b
    op_common = lambda a, b: a and b
    op_subtract = lambda a, b: a and not b

    def __init__(self, skill_list=[]):
        self.map = [[False] * skillset_size for i in range(skillset_size)]
        for skill in skill_list:
            self.add(skill)

    def apply(self, operator, skillset):
        self.map = [
            [
                operator(self.map[i][j], skillset.map[i][j]) 
                for j in range(skillset_size)
            ]
            for i in range(skillset_size)
        ]
        return self

    def copy(self):
        return SkillSet().union(self)

    def union(self, skillset):
        return self.apply(SkillSet.op_union, skillset)

    def subtract(self, skillset):
        return self.apply(SkillSet.op_subtract, skillset)

    def __eq__(self, other):
        return all(
            self.map[i][j] == other.map[i][j]
            for i in range(skillset_size)
            for j in range(skillset_size))

    def flip(self):
        self.map = [list(reversed(col)) for col in self.map]

    def add(self, skill):
        self.map[skill.delta.dx + skillset_range][skill.delta.dy + skillset_range] = True

    def has(self, skill):
        return self.map[skill.delta.dx + skillset_range][skill.delta.dy + skillset_range]

    def list_skills(self):
        return [
            Skill(PositionDelta(x - skillset_range, y - skillset_range))
            for x in range(skillset_size)
            for y in range(skillset_size)
            if self.map[x][y]
        ]
    
    def serialize(self):
        m = [[0] * skillset_size for i in range(skillset_size)]
        for i in range(skillset_size):
            for j in range(skillset_size):
                if self.map[i][j]:
                    m[i][j] = 1
        return json.dumps(m)

    @classmethod
    def deserialize(cls, payload):
        s = SkillSet()
        m = json.loads(payload)
        for i in range(skillset_size):
            for j in range(skillset_size):
                s.map[i][j] = m[i][j] == 1
        return s

class Rider(Unit):
    display = "RDR"
    level = 2
    trophy = 8

class Soldier(Unit):
    display = "SLD"
    level = 1
    trophy = 6

class Archer(Unit):
    display = "ACH"
    level = 1
    trophy = 5

class Barbarian(Unit):
    display = "BAR"
    level = 1
    trophy = 4

class Lancer(Unit):
    display = "LAN"
    level = 3
    trophy = 8

class Knight(Unit):
    display = "KNT"
    level = 3
    trophy = 8

class Swordsman(Unit):
    display = "SWD"
    level = 2
    trophy = 5

class Spearman(Unit):
    display = "SPR"
    level = 2
    trophy = 6

class Warrior(Unit):
    display = "WAR"
    level = 2
    trophy = 4

class King(Unit):
    display = "KING"
    level = 1
    trophy = 0

class Wagon(Unit):
    display = "WAG"
    level = 0
    trophy = 20

def convert_skill_list_map_to_skillset_map(skill_list_map):
    return {
        k: SkillSet([Skill(PositionDelta(x - skillset_range, y - skillset_range)) for x, y in v])
        for k, v in skill_list_map.items() 
    }

promotion_map = {
    Rider: [Lancer, Knight],
    Soldier: [Swordsman, Spearman],
    Archer: [Warrior, Spearman],
    Barbarian: [Warrior, Swordsman]
}

potential_skillset_map = convert_skill_list_map_to_skillset_map(skills.potential_skill_list_map)
inborn_skillset_map = convert_skill_list_map_to_skillset_map(skills.inborn_skill_list_map)

