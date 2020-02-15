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

    // def get_delta(self, position):
    //     return PositionDelta(position.x - self.x, position.y - self.y)
    
    equals(other: Coordinate): boolean
    {
        return this.x == other.x && this.y == other.y;
    }

    copy(): Coordinate
    {
        return new Coordinate(this.x, this.y);
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

class Skill implements IHashable
{
    hash(): string 
    {
        return `Skill(${this.x},${this.y})`;
    }

    constructor(public x: number, public y: number)
    { 
        if (! (-g.skill_range <= x && x <= g.skill_range && 
               -g.skill_range <= y && y <= g.skill_range))
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
        this.map[skill.x][skill.y] = true;
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
                    skills.push(new Skill(dx, dy));
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
                    skills.push(new Skill(dx, dy));
                }
            }
        }

        return skills;
    }

    copy(): SkillSet
    {
        return new SkillSet(this.as_list());
    }

    flip(): SkillSet
    {
        let flipped = this.copy();
        
        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            for (let j = -g.skill_range; j < 0; j++) {
                let c = flipped.map[i];
                [c[j], c[-j]] = [c[-j], c[j]]
            }
        }
        return flipped;
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
//     def has(self, skill):
//         return self.map[skill.delta.dx + skillset_offset][skill.delta.dy + skillset_offset]

        
enum Player
{
    P1 = 1,
    P2 = 2
}

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

    get_skill(): Skill
    {
        return new Skill(this.to.x - this.from.x, this.to.y - this.from.y);
    }

    // def __repr__(self):
    //     return str(self.position_from) + '->' + str(self.position_to)
}

class PlayerMove
{
    constructor(public player: Player, public moves: Move[] = [])
    {
    }

    append(move: Move): void
    {
        this.moves.push(move);
    }
}

class Action
{
    constructor(public move: Move, public type: ActionType, public unit_type: typeof Unit)
    {
    }

    cost(): number
    {
        switch(this.type)
        {
            case ActionType.Upgrade:
                return 4;
            case ActionType.Defend:
                return 2;
            case ActionType.Move:
                return 3;
            case ActionType.Attack:
                return 5;
            case ActionType.Recruit:
                switch(this.unit_type)
                {
                    case Soldier:
                    case Barbarian:
                    case Archer:
                        return 10;
                    case Rider:
                        return 15;
                    case Wagon:
                        return 30;
                }
            throw new Error("Action cost");
        }
    }
}

enum ActionType
{
    Upgrade,
    Defend,
    Move,
    Attack,
    Recruit
}

class PlayerAction
{
    constructor(public player: Player, public actions: Action[])
    {
    }

    cost(): number
    {
        return this.actions.map((a) => {return a.cost();}).reduce((a, b) => a + b, 0)
    }
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
            let inborn = SkillSet.from_literal(
                inborn_skills_map[this.constructor.name]);
            if (owner == Player.P2)
            {
                inborn = inborn.flip();
            }
            this.current = inborn;
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





