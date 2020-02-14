// class PlayerMove:
//     @classmethod
//     def from_literal(self, player, literal):
//         try:
//             return PlayerMove(player, [Move.from_literal(lit) for lit in literal.split()])
//         except:
//             raise InvalidParameter("player move literal")

//     def __init__(self, player, move_list):
//         self.player = player
//         self.move_list = move_list
    
//     def __repr__(self):
//         return ','.join([str(m) for m in self.move_list])

// class Action:
//     def __init__(self, move, type_, unit_type):
//         self.move = move
//         self.type = type_
//         self.unit_type = unit_type

//     def __repr__(self):
//         return f'{self.move}({ActionType.show(self.type)})'

//     def get_cost(self):
//         return ActionType.cost(self.type, self.unit_type)

// class PlayerAction:
//     def __init__(self, player, action_list):
//         self.player = player
//         self.action_list = action_list
    
//     def extract_actions(self, filter):
//         extracted = [a for a in self.action_list if filter(a)]
//         remaining = [a for a in self.action_list if not filter(a)]
//         self.action_list = remaining
//         return extracted

//     def copy(self):
//         return PlayerAction(self.player, self.action_list.copy())

//     def get_cost(self):
//         return sum([action.get_cost() for action in self.action_list])

//     def __repr__(self):
//         return ','.join([str(a) for a in self.action_list])

// class ActionType(Enum):
//     Upgrade = 1
//     Defend = 2
//     Move = 3
//     Attack = 4
//     Recruit = 5

//     @classmethod
//     def show(self, action_type):
//         return {
//             ActionType.Upgrade: 'UPG',
//             ActionType.Defend: 'DEF',
//             ActionType.Move: 'MOV',
//             ActionType.Attack: 'ATK',
//             ActionType.Recruit: 'REC'
//         }[action_type]

//     @classmethod
//     def cost(self, action_type, unit_type):
//         try:
//             return {
//                 ActionType.Upgrade: 4,
//                 ActionType.Defend: 2,
//                 ActionType.Move: 3,
//                 ActionType.Attack: 5,
//             }[action_type]
//         except KeyError:
//             return {
//                 Soldier: 10,
//                 Barbarian: 10,
//                 Archer: 10,
//                 Knight: 15,
//                 Wagon: 30
//             }[unit_type]

class InvalidParameter extends Error {}

class Coordinate
{
    constructor(public x: number, public y: number)
    {
        if (!(0 <= x && x < g.board_size_x && 0 <= y && y < g.board_size_y))
        {
            throw new InvalidParameter("Coordinate");
        }
    }

    // def from_literal(self, literal):
    //     try:
    //         x, y = literal
    //         x, y = map(int, [x, y])
    //     except:
    //         raise InvalidParameter("move literal")
    //     else:
    //         return Position(x - 1, y - 1)

    // def get_delta(self, position):
    //     return PositionDelta(position.x - self.x, position.y - self.y)
    
    equals(other: Coordinate): boolean
    {
        return this.x == other.x && this.y == other.y;
    }

    // def get_new_position(self, position_delta):
    //     try:
    //         return Position(self.x + position_delta.dx, self.y + position_delta.dy)
    //     except InvalidParameter:
    //         return None

    // def __str__(self):
    //     return f'{self.x + 1}{self.y + 1}'

    // def __hash__(self):
    //     return self.x * 10 + self.y
}

class CoordinateDelta
{
    constructor(public dx: number, public dy: number)
    {
    }
// def __eq__(self, other):
//     return self.dx == other.dx and self.dy == other.dy
}
    
class Skill
{
    constructor(public delta: CoordinateDelta)
    { 
        if (! (-g.skill_range <= delta.dx && delta.dx <= g.skill_range && 
               -g.skill_range <= delta.dy && delta.dy <= g.skill_range))
        {
            throw new InvalidParameter("Skill");
        }
    }
}

class SkillSet
{
    private map: boolean[][];

    constructor(skills: Skill[] = []) {
        this.map = [];

        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            this.map[i] = [];
            for (let j = -g.skill_range; j <= g.skill_range; j++) {
                this.map[i][j] = false;
            }
        }

        for (let skill of skills)
        {
            this.add(skill);
        }
    }

    add(skill: Skill)
    {
        this.map[skill.delta.dx][skill.delta.dy] = true;
    }

    static from_literal(matrix: string): SkillSet
    {
        let rows = matrix.split('\n');
        rows = rows.map((row: string) => { return row.trim(); });

        let skills: Skill[] = [];
        for (let dy = -g.skill_range; dy <= g.skill_range; dy++)
        {
            for (let dx = -g.skill_range; dx <= g.skill_range; dx++)
            {
                 if (rows[dy + g.skill_range][dx + g.skill_range] == 'x')
                 {
                    skills.push(new Skill(new CoordinateDelta(dx, dy)));
                 }
            }
        }

        return new SkillSet(skills);
    }

    as_list(): Skill[]
    {
        let skills: Skill[] = [];
        for (let dy = -g.skill_range; dy <= g.skill_range; dy++)
        {
            for (let dx = -g.skill_range; dx <= g.skill_range; dx++)
            {
                 if (this.map[dx][dy])
                 {
                    skills.push(new Skill(new CoordinateDelta(dy, dx)));
                 }
            }
        }

        return skills;
    }

    copy(): SkillSet
    {
        return new SkillSet(this.as_list());
    }
}

//     op_union = lambda a, b: a or b
//     op_common = lambda a, b: a and b
//     op_subtract = lambda a, b: a and not b

//     def apply(self, operator, skillset):
//         self.map = [
//             [
//                 operator(self.map[i][j], skillset.map[i][j]) 
//                 for j in range(skillset_size)
//             ]
//             for i in range(skillset_size)
//         ]
//         return self

//     def copy(self):
//         return SkillSet().union(self)

//     def union(self, skillset):
//         return self.apply(SkillSet.op_union, skillset)

//     def subtract(self, skillset):
//         return self.apply(SkillSet.op_subtract, skillset)

//     def __eq__(self, other):
//         return all(
//             self.map[i][j] == other.map[i][j]
//             for i in range(skillset_size)
//             for j in range(skillset_size)
//         )

//     def flip(self):
//         self.map = [list(reversed(col)) for col in self.map]


//     def has(self, skill):
//         return self.map[skill.delta.dx + skillset_offset][skill.delta.dy + skillset_offset]



class Move
{
    constructor(public from: Coordinate, public to: Coordinate)
    {
    }

    equals(other: Move): boolean
    {
        return this.from.equals(other.from) && this.to.equals(other.to);
    }

    // def is_from_same(self, move):
    //     return self.position_from == move.position_from

    // def is_to_same(self, move):
    //     return self.position_to == move.position_to

    // def get_skill(self):
    //     return Skill(self.position_from.get_delta(self.position_to))

    // def __repr__(self):
    //     return str(self.position_from) + '->' + str(self.position_to)
}

enum Player
{
    P1 = 1,
    P2 = 2
}

abstract class Unit
{
    readonly perfect: SkillSet;
    current: SkillSet;

    constructor(public owner: Player)
    {
        this.display = this.constructor.name;
        this.perfect = SkillSet.from_literal(perfect_skills_map[this.display]);
        this.current = new SkillSet();
    }

    display: string;
}

type AdvancedUnitConstructor = new (...args: any[]) => AdvancedUnit;
type UnitConstructor = new (...args: any[]) => Unit;

abstract class BasicUnit extends Unit
{
    readonly promotion_options: AdvancedUnitConstructor[];
    constructor(
        owner: Player, 
        endow_inborn: boolean = true)
    {
        super(owner);
        if (endow_inborn)
        {
            this.current = SkillSet.from_literal(
                inborn_skills_map[this.constructor.name]);
        }
    }
}

abstract class AdvancedUnit extends Unit
{
    constructor(owner: Player, was: BasicUnit)
    {
        super(owner);
        this.current = was.current.copy();
    }
}

class Rider extends BasicUnit
{
    readonly promotion_options = [ Lancer, Knight ];
}

class Soldier extends BasicUnit
{
    readonly promotion_options = [Swordsman, Spearman];
}

class Archer extends BasicUnit
{
    readonly promotion_options = [Warrior, Spearman];
}

class Barbarian extends BasicUnit
{
    readonly promotion_options = [Warrior, Swordsman];
}

class Lancer extends AdvancedUnit
{
}

class Knight extends AdvancedUnit
{
}

class Swordsman extends AdvancedUnit
{
}

class Spearman extends AdvancedUnit
{
}

class Warrior extends AdvancedUnit
{
}

class King extends Unit
{
}

class Wagon extends Unit
{
}

let perfect_skills_map: { [unit_name: string]: string; } =
{
    'King':
        `-----
        -xxx-
        -x-x-
        -xxx-
        -----`,
    'Rider':
        `-x-x-
        x---x
        -----
        x---x
        -x-x-`,
    'Lancer':
        `-xxx-
        x---x
        x---x
        x---x
        -xxx-`,
    'Knight':
        `-x-x-
        xx-xx
        -----
        xx-xx
        -x-x-`,
    'Soldier':
        `-----
        --x--
        -x-x-
        --x--
        -----`,
    'Swordsman':
        `-----
        -xxx-
        -x-x-
        -xxx-
        -----`,
    'Spearman':
        `--x--
        --x--
        xx-xx
        --x--
        --x--`,
    'Archer':
        `--x--
        -----
        x---x
        -----
        --x--`,
    'Barbarian':
        `-----
        -x-x-
        -----
        -x-x-
        -----`,
    'Warrior':
        `--x--
        -x-x-
        x---x
        -x-x-
        --x--`,
    'Wagon':
        `-----
        --x--
        -xxx-
        --x--
        -----`
}

let inborn_skills_map: { [unit_name: string]: string; } =
{
    'King':
        `-----
        -xxx-
        -x-x-
        -xxx-
        -----`,
    'Rider':
        `-x-x-
        -----
        -----
        -----
        -----`,
    'Soldier':
        `-----
        --x--
        -----
        --x--
        -----`,
    'Archer':
        `--x--
        -----
        -----
        -----
        --x--`,
    'Barbarian':
        `-----
        -x-x-
        -----
        -----
        -----`,
    'Wagon':
        `-----
        -----
        --x--
        -----
        -----`
}

    // def endow(self, skill):
    //     if self.perfect_skillset.has(skill):
    //         self.skillset.add(skill)
    //         return True
    //     return False

    // def has_skill(self, skill):
    //     return self.skillset.has(skill)
    
    // def has_potential_skill(self, skill):
    //     return self.potential_skillset().has(skill)

    // def is_perfect(self):
    //     return self.skillset == self.perfect_skillset

    // def is_promotion_ready(self):
    //     return not self.is_advanced() and self.is_perfect()

    // def potential_skillset(self):
    //     return self.ultimate_skillset().subtract(self.skillset)
    
    // def ultimate_skillset(self):
    //     ultimate = self.perfect_skillset.copy()
    //     if self.is_promotion_ready():
    //         for creator in promotion_map[type(self)]:
    //             ultimate.union(potential_skillset_map[creator.display])

    //     return ultimate

    // def get_promoted(self, skill):
    //     if not self.is_promotion_ready():
    //         return None

    //     creator = Unit.which_creator_has_skill(promotion_map[type(self)], skill)
    //     if creator is None:
    //         return None
    //     promoted = creator(self.owner, skillset=self.skillset)
    //     promoted.endow(skill)
    //     return promoted
        
    // @classmethod
    // def which_creator_has_skill(self, creator_list, skill):
    //     for creator in creator_list:
    //         if potential_skillset_map[creator.display].has(skill):
    //             return creator
                
    // @classmethod
    // def create_from_skill(self, player, skill):
    //     creator = self.which_creator_has_skill(
    //         [Knight, Soldier, Warrior, Archer, Wagon], skill)
    //     assert(creator is not None)
    //     created = creator(player)
    //     created.endow(skill)
    //     return created





