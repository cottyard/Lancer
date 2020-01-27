import skills

class Unit:
    display = ""
    def __init__(self, owner, skillset=None):
        self.owner = owner
        self.ultimate_skillset = skills.potential_skillset[self.display]
        if skillset is None:
            try:
                blueprint = skills.inborn_skillset[self.display]
                if owner == p1:
                    skillset = skills.copy_skillset(blueprint)
                else:
                    skillset = skills.flip_skillset(blueprint)
            except KeyError:
                skillset = skills.empty_skillset()
        self.skillset = skillset

    def endow(self, x, y):
        if self.ultimate_skillset[x][y] and not self.skillset[x][y]:
            self.skillset[x][y] = True
            return True
        return False

    def forget(self, x, y):
        self.skillset[x][y] = False

    def absorb(self, unit):
        return self
##        if self.is_promotion_ready():
##            promotions = set()
##            for p in promotion_map[type(self)]:
##                adv_potentials = skills.op_skillsets(
##                    skills.op_skillset_subtract,
##                    skills.potential_skillset[p.display],
##                    self.ultimate_skillset)
##                for i in range(skills.skillset_size):
##                    for j in range(skills.skillset_size):
##                        if unit.skills()[i][j] and adv_potentials[i][j]:
##                            promotions.add(p)
##
##            assert len(promotions) <= 1
##            if len(promotions) == 0:
##                return self
##            promotion_creator = promotions.pop()
##            promoted = promotion_creator(
##                self.owner,
##                skills.op_skillsets(
##                    skills.op_skillset_common,
##                    skills.potential_skillset[promotion_creator.display],
##                    skills.op_skillsets(
##                        skills.op_skillset_union,
##                        self.skillset,
##                        unit.skills())))
##
##            return promoted
##        else:
##            incremental = skills.op_skillsets(skills.op_skillset_common, self.ultimate_skillset, unit.skillset)
##            self.skillset = skills.op_skillsets(skills.op_skillset_union, self.skillset, incremental)
##            return self

    def is_perfected(self):
        return not any(
            self.ultimate_skillset[i][j] ^ self.skillset[i][j]
            for i in range(skills.skillset_size)
            for j in range(skills.skillset_size)
        )

    def is_promotion_ready(self):
        return not self.is_advanced() and self.is_perfected()

    def is_advanced(self):
        return type(self) not in promotion_map

    def potentials(self):
        ultimate = skills.copy_skillset(self.ultimate_skillset)
        if self.is_promotion_ready():
            for p in promotion_map[type(self)]:
                ultimate = skills.op_skillsets(skills.op_skillset_union, ultimate, skills.potential_skillset[p.display])

        potentials = skills.op_skillsets(skills.op_skillset_subtract, ultimate, self.skills())
        return potentials

    def skills(self):
        return self.skillset

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

def validate_coord(x, y):
    return 0 <= x < board_size_x and \
           0 <= y < board_size_y

def which_skill(x1, y1, x2, y2):
    dx = x2 - x1 + skills.skillset_size // 2
    dy = y2 - y1 + skills.skillset_size // 2

    if not (
        0 <= dx < skills.skillset_size and \
        0 <= dy < skills.skillset_size):
            raise ValueError

    return dx, dy

def pos_in_reach(x, y, skillset):
    in_reach = [
        (
            x + dx - skills.skillset_size // 2,
            y + dy - skills.skillset_size // 2
        )
        for dx in range(skills.skillset_size)
        for dy in range(skills.skillset_size)
        if skillset[dx][dy]
    ]
    return [(i, j) for (i, j) in in_reach if validate_coord(i, j)]

def get_creator_from_endowment(skill_x, skill_y):
    return get_creator_by_skill(promotion_map.keys(), skill_x, skill_y)

def get_adv_creator_from_endowment(u, skill_x, skill_y):
    return get_creator_by_skill(promotion_map[type(u)], skill_x, skill_y)

def get_creator_by_skill(creators, skill_x, skill_y):
    for c in creators:
        if skills.potential_skillset[c.display][skill_x][skill_y]:
            return c

promotion_map = {
    Knight: [Lancer, Calvary],
    Soldier: [Swordsman, Spearman],
    Archer: [Sniper, Spearman],
    Barbarian: [Warrior, Swordsman]
}

##promotion_by_absorb = {
##    (Knight, Lancer): [Lancer, Spearman, Archer, Sniper],
##    (Knight, Calvary): [Calvary, Swordsman, Warrior],
##    (Soldier, Swordsman): [Calvary, Swordsman, Warrior],
##    (Soldier, Spearman): [Lancer, Spearman, Archer, Sniper],
##    (Archer, Sniper): [Sniper, Warrior],
##    (Archer, Spearman):[Soldier, Spearman, Swordsman],
##    (Barbarian, Warrior): [Sniper, Warrior],
##    (Barbarian, Swordsman): [Soldier, Spearman, Swordsman]
##}

board_setting_1st_row = [Archer, Knight, Archer, Knight, King, Knight, Archer, Knight, Archer]
board_setting_2nd_row = [Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier]

board_size_x = 9
board_size_y = 9
p1 = 1
p2 = 2
