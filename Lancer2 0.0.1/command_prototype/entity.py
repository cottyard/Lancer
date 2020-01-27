import skills

board_size_x = 9
board_size_y = 9
player_1 = 1
player_2 = 2
skillset_size = 5
skillset_offset = skillset_size // 2

class Board:
    def __init__(self):
        self.board = [[None] * board_size_y for i in range(board_size_x)]

    def set_out(self):
        for row, setting, player in [
            (0, board_setting_1st_row, player_1),
            (1, board_setting_2nd_row, player_1),
            (board_size_y - 1, board_setting_1st_row, player_2),
            (board_size_y - 2, board_setting_2nd_row, player_2)
        ]:
            for i in range(board_size_x):
                self.board[i][row] = setting[i](player)
    
    def at(self, position):
        return self.board[position.x][position.y]

    def iterate_units(self, func):
        for i in range(board_size_x):
            for j in range(board_size_y):
                u = self.board[i][j]
                if u is not None:
                    func(u, i, j)

class Move:
    def __init__(self, position_from, position_to):
        self.position_from = position_from
        self.position_to = position_to

class Position:
    def __init__(self, x, y):
        self.x = x
        self.y = y

class Unit:
    display = ""
    def __init__(self, owner, flip_skillset=False):
        self.owner = owner
        self.ultimate_skillset = SkillSet(potential_skill_list_map[self.display])
        self.skillset = SkillSet(inborn_skill_list_map[self.display])
        if flip_skillset:
            self.skillset.flip()

    def endow(self, skill):
        if self.ultimate_skillset.has(skill) and not self.skillset.has(skill):
            self.skillset.add(skill)
            return True
        return False

    def is_ultimate(self):
        return self.skillset.equals(self.ultimate_skillset)

    def is_promotion_ready(self):
        return not self.is_advanced() and self.is_ultimate()

    def is_advanced(self):
        return type(self) not in promotion_map

    def potential_skillset(self):
        ultimate = self.ultimate_skillset.copy()
        if self.is_promotion_ready():
            for p in promotion_map[type(self)]:
                ultimate.add_some(skills.potential_skill_list_map[p.display])

        return ultimate.subtract(self.skillset)

class PositionDelta:
    def __init__(self, dx, dy):
        self.dx = dx
        self.dy = dy

class Skill:
    def __init__(self, position_delta):
        self.delta = position_delta

class SkillSet:
    op_union = lambda a, b: a or b
    op_common = lambda a, b: a and b
    op_subtract = lambda a, b: a and not b

    def __init__(self, skill_list=[]):
        self.map = [[False] * skillset_size for i in range(skillset_size)]
        self.add_some(skill_list)

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

    def equals(self, skillset):
        return all(
            self.map[i][j] == skillset.map[i][j]
            for i in range(skillset_size)
            for j in range(skillset_size)
        )

    def flip(self):
        self.map = [list(reversed(col)) for col in self.map]

    def add(self, skill):
        self.map[skill.delta.dx + skillset_offset][skill.delta.dy + skillset_offset] = True
    
    def add_some(self, skill_list):
        for skill in skill_list:
            self.add(skill)

    def has(self, skill):
        return self.map[skill.delta.dx + skillset_offset][skill.delta.dy + skillset_offset]

class Knight(Unit):
    display = "KNT"
    
class Soldier(Unit):
    display = "SLD"

class Archer(Unit):
    display = "ACH"

class Barbarian(Unit):
    display = "BAR"

class Lancer(Unit):
    display = "LAN"

class Calvary(Unit):
    display = "CAL"

class Swordsman(Unit):
    display = "SWD"

class Spearman(Unit):
    display = "SPR"

class Sniper(Unit):
    display = "SNP"

class Warrior(Unit):
    display = "WAR"

class King(Unit):
    display = "KING"

def convert_skill_list_map(skill_list_map):
    return {
        k: [Skill(PositionDelta(x - skillset_offset, y - skillset_offset)) for x, y in v] 
        for k, v in skill_list_map.items() 
    }

potential_skill_list_map = convert_skill_list_map(skills.potential_skill_list_map)
inborn_skill_list_map = convert_skill_list_map(skills.inborn_skill_list_map)

promotion_map = {
    Knight: [Lancer, Calvary],
    Soldier: [Swordsman, Spearman],
    Archer: [Sniper, Spearman],
    Barbarian: [Warrior, Swordsman]
}

board_setting_1st_row = [Archer, Knight, Archer, Knight, King, Knight, Archer, Knight, Archer]
board_setting_2nd_row = [Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier]
