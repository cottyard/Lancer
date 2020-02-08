import skills
from enum import Enum
from const import board_size_x, board_size_y, skillset_size, skillset_offset

class Move:
    @classmethod
    def from_literal(self, literal):
        try:
            x1, y1, x2, y2 = literal
            x1, y1, x2, y2 = map(int, [x1, y1, x2, y2])

            position_1 = Position(x1 - 1, y1 - 1)
            position_2 = Position(x2 - 1, y2 - 1)
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
        return ActionType.cost(self.type, self.unit_type)

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

    @classmethod
    def cost(self, action_type, unit_type):
        try:
            return {
                ActionType.Upgrade: 20,
                ActionType.Defend: 10,
                ActionType.Move: 15,
                ActionType.Attack: 25,
            }[action_type]
        except KeyError:
            return {
                Soldier: 50,
                Barbarian: 50,
                Archer: 50,
                Wagon: 80,
                Knight: 70
            }[unit_type]
            
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

class Unit:
    display = ""
    
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
        
    @classmethod
    def which_creator_has_skill(self, creator_list, skill):
        for creator in creator_list:
            if potential_skillset_map[creator.display].has(skill):
                return creator
                
    @classmethod
    def create_from_skill(self, player, skill):
        creator = self.which_creator_has_skill(
            [Knight, Soldier, Warrior, Archer, Wagon], skill)
        assert(creator is not None)
        created = creator(player)
        created.endow(skill)
        return created

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
                0 <= self.delta.dx + skillset_offset < skillset_size and \
                0 <= self.delta.dy + skillset_offset < skillset_size):
            raise InvalidParameter("Skill")

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
            for j in range(skillset_size)
        )

    def flip(self):
        self.map = [list(reversed(col)) for col in self.map]

    def add(self, skill):
        self.map[skill.delta.dx + skillset_offset][skill.delta.dy + skillset_offset] = True

    def has(self, skill):
        return self.map[skill.delta.dx + skillset_offset][skill.delta.dy + skillset_offset]

    def list_skills(self):
        return [
            Skill(PositionDelta(x - skillset_offset, y - skillset_offset))
            for x in range(skillset_size)
            for y in range(skillset_size)
            if self.map[x][y]
        ]

class Knight(Unit):
    display = "KNT"
    letter = "N"
    
class Soldier(Unit):
    display = "SLD"
    letter = "D"

class Archer(Unit):
    display = "ACH"
    letter = "A"

class Barbarian(Unit):
    display = "BAR"
    letter = "B"

class Lancer(Unit):
    display = "LAN"
    letter = "L"

class Calvary(Unit):
    display = "CAL"
    letter = "C"

class Swordsman(Unit):
    display = "SWD"
    letter = "S"

class Spearman(Unit):
    display = "SPR"
    letter = "P"

class Sniper(Unit):
    display = "SNP"
    letter = "P"

class Warrior(Unit):
    display = "WAR"
    letter = "W"

class King(Unit):
    display = "KING"
    letter = "K"

class Wagon(Unit):
    display = "WAG"
    letter = "G"

def convert_skill_list_map_to_skillset_map(skill_list_map):
    return {
        k: SkillSet([Skill(PositionDelta(x - skillset_offset, y - skillset_offset)) for x, y in v])
        for k, v in skill_list_map.items() 
    }

promotion_map = {
    Knight: [Lancer, Calvary],
    Soldier: [Swordsman, Spearman],
    Archer: [Sniper, Spearman],
    Barbarian: [Warrior, Swordsman]
}

potential_skillset_map = convert_skill_list_map_to_skillset_map(skills.potential_skill_list_map)
inborn_skillset_map = convert_skill_list_map_to_skillset_map(skills.inborn_skill_list_map)

