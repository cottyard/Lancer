class InvalidParameter extends Error {}

class Coordinate implements IHashable
{
    constructor(public x: number, public y: number)
    {
        if (!(0 <= x && x < g.board_size_x && 0 <= y && y < g.board_size_y))
        {
            throw new InvalidParameter("Coordinate");
        }
    }
    
    equals(other: Coordinate): boolean
    {
        return this.x == other.x && this.y == other.y;
    }

    add(dx: number, dy: number): Coordinate | null
    {
        try
        {
            return new Coordinate(this.x + dx, this.y + dy);
        }
        catch 
        {
            return null;
        }
    }

    copy(): Coordinate
    {
        return new Coordinate(this.x, this.y);
    }

    hash(): string
    {
        return `Coordinate(${this.x},${this.y})`;
    }
}

class Skill implements IHashable
{
    constructor(public x: number, public y: number)
    { 
        if (! (-g.skill_range <= x && x <= g.skill_range && 
               -g.skill_range <= y && y <= g.skill_range))
        {
            throw new InvalidParameter("Skill");
        }
    }

    hash(): string 
    {
        return `Skill(${this.x},${this.y})`;
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

    has(skill: Skill): boolean
    {
        return this.map[skill.x][skill.y];
    }

    serialize(): string
    {
        let map: boolean[][] = [];
        
        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            map[i + g.skill_range] = [];
            for (let j = -g.skill_range; j <= g.skill_range; j++) {
                map[i + g.skill_range][j + g.skill_range] = this.map[i][j];
            }
        }

        return JSON.stringify(map);
    }

    static deserialize(payload: string): SkillSet
    {
        let map = JSON.parse(payload);
        let sks = new SkillSet();
        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            for (let j = -g.skill_range; j <= g.skill_range; j++) {
                sks.map[i][j] = map[i + g.skill_range][j + g.skill_range];
            }
        }
        return sks;
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
        for (let dy = -g.skill_range; dy <= g.skill_range; dy++) {
            for (let dx = -g.skill_range; dx <= g.skill_range; dx++) {
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
        return new SkillSet().union(this);
    }

    static op_union = (a: boolean, b: boolean) => a || b;
    static op_subtract = (a: boolean, b: boolean) => a && !b;

    apply(operator: (a: boolean, b: boolean) => boolean, other: SkillSet): SkillSet
    {
        let result = new SkillSet();
        
        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            result.map[i] = [];
            for (let j = -g.skill_range; j <= g.skill_range; j++) {
                result.map[i][j] = operator(this.map[i][j], other.map[i][j]);
            }
        }

        return result;
    }

    union(other: SkillSet): SkillSet
    {
        return this.apply(SkillSet.op_union, other);
    }
    
    subtract(other: SkillSet): SkillSet
    {
        return this.apply(SkillSet.op_subtract, other);
    }

    equals(other: SkillSet): boolean
    {
        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            for (let j = -g.skill_range; j < g.skill_range; j++) {
                if (this.map[i][j] != other.map[i][j])
                {
                    return false;
                }
            }
        }
        return true;
    }

    flip(): SkillSet
    {
        let flipped = this.copy();
        
        for (let i = -g.skill_range; i <= g.skill_range; i++) {
            for (let j = -g.skill_range; j < 0; j++) {
                let c = flipped.map[i];
                [c[j], c[-j]] = [c[-j], c[j]];
            }
        }
        return flipped;
    }
}
        
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

    get_skill(): Skill
    {
        return new Skill(this.to.x - this.from.x, this.to.y - this.from.y);
    }
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

    pop(): void
    {
        this.moves.pop();
    }
}

class Action
{
    constructor(public move: Move, public type: ActionType, public unit_type: UnitConstructor)
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
            throw new Error("Action.cost");
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
    display: string;

    constructor(public owner: Player)
    {
        this.perfect = g.perfect_skills.get(this.type())!;
        this.current = new SkillSet();
        this.display = this.constructor.name;
    }

    serialize(): string
    {
        return JSON.stringify([this.display, Player[this.owner], this.current.serialize()]);
    }
    
    endow_inborn(): void
    {
        let inborn = g.inborn_skills.get(this.type());
        if (!inborn)
        {
            return;
        }
        this.current = this.owner == Player.P1 ? inborn : inborn.flip();
    }

    type(): UnitConstructor
    {
        return <UnitConstructor>this.constructor;
    }

    endow(skill: Skill): boolean
    {
        if (this.perfect.has(skill))
        {
            this.current.add(skill);
            return true;
        }
        return false;
    }

    capable(skill: Skill): boolean
    {
        return this.current.has(skill);
    }

    potential(): SkillSet
    {
        return this.perfect.subtract(this.current);
    }

    is_promotion_ready(): boolean
    {
        return false;
    }

    is_perfect(): boolean
    {
        return this.current.equals(this.perfect);
    }

    static from_skill(player: Player, skill: Skill): Unit | null
    {
        let cons = this.which_has_skill(g.spawnable_unit_types, skill);
        if (cons == null)
        {
            return null;
        }
        let unit = new cons(player);
        unit.endow(skill);
        return unit;
    }

    static which_has_skill(cons: UnitConstructor[], skill: Skill): UnitConstructor | null
    {
        for (let c of cons)
        {
            if (g.perfect_skills.get(c)!.has(skill))
            {
                return c;
            }
        }
        return null;
    }
}

interface UnitConstructor extends IDeserializable<Unit>
{
    new (owner: Player): Unit;
    deserialize(payload: string): Unit;
}

const UnitConstructor: UnitConstructor = class _ extends Unit
{
    static deserialize(payload: string): Unit
    {
        console.log(payload);
        let display: string, owner: string, current: string;
        [display, owner, current] = <[string, string, string]>JSON.parse(payload);
        
        let type = g.unit_type_by_name.get(display);
        if (!type)
        {
            throw new Error('Unit.deserialize: no constructor');
        }
        let unit = new type(Player[<keyof typeof Player>owner]);
        unit.current = SkillSet.deserialize(current);
        return unit;
    }
}

type AdvancedUnitConstructor = new (owner: Player, was: BasicUnit) => AdvancedUnit;

abstract class BasicUnit extends UnitConstructor
{
    abstract readonly promotion_options: AdvancedUnitConstructor[];

    is_promotion_ready(): boolean
    {
        return this.is_perfect();
    }

    potential(): SkillSet
    {
        let potentials = super.potential();
        if (this.is_promotion_ready())
        {
            for (let future_type of this.promotion_options)
            {
                potentials = potentials.union(g.perfect_skills.get(
                    <UnitConstructor>future_type)!);
            }
        }
            
        return potentials;
    }
}

abstract class AdvancedUnit extends UnitConstructor
{
    constructor(owner: Player, was: BasicUnit | null = null)
    {
        super(owner);
        if (was != null)
        {
            this.current = was.current.copy();
        }
    }
}

class Rider extends BasicUnit
{
    readonly promotion_options = [Lancer, Knight];
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

class King extends UnitConstructor
{
}

class Wagon extends UnitConstructor
{
}
