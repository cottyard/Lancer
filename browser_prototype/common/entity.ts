import { g } from "./global";
import { IHashable, ISerializable, ICopyable, extract, IDeserializable } from "./language";

class InvalidParameter extends Error { }

export class Coordinate implements IHashable, ISerializable, ICopyable<Coordinate>
{
    constructor(public x: number, public y: number)
    {
        if (!Coordinate.is_valid(x, y))
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
        if (!Coordinate.is_valid(this.x + dx, this.y + dy))
        {
            return null;
        }
        return new Coordinate(this.x + dx, this.y + dy);
    }

    copy(): Coordinate
    {
        return new Coordinate(this.x, this.y);
    }

    hash(): string
    {
        return `Coord(${ this.x },${ this.y })`;
    }

    serialize(): string
    {
        return `${ this.x }${ this.y }`;
    }

    static deserialize(payload: string): Coordinate
    {
        return new Coordinate(parseInt(payload[0]), parseInt(payload[1]));
    }

    static is_valid(x: number, y: number): boolean
    {
        return 0 <= x && x < g.board_size_x && 0 <= y && y < g.board_size_y;
    }
}

export class Skill implements IHashable
{
    constructor(public x: number, public y: number)
    {
        if (!Skill.is_valid(x, y))
        {
            throw new InvalidParameter("Skill");
        }
    }

    hash(): string 
    {
        return `Skill(${ this.x },${ this.y })`;
    }

    equals(other: Skill): boolean
    {
        return this.x == other.x && this.y == other.y;
    }

    is_leap(): boolean
    {
        return Math.abs(this.x) > 1 || Math.abs(this.y) > 1;
    }

    is_adjacent(): boolean
    {
        return Math.abs(this.x) + Math.abs(this.y) == 1;
    }

    static is_valid(x: number, y: number)
    {
        return -g.skill_range <= x && x <= g.skill_range &&
            -g.skill_range <= y && y <= g.skill_range;
    }
}

export class SkillSet implements ISerializable, ICopyable<SkillSet>
{
    private map: boolean[];

    constructor(skills: Skill[] = [])
    {
        this.map = [];
        for (let i = 0; i < g.skillset_size * g.skillset_size; i++)
        {
            this.map[i] = false;
        }

        for (let skill of skills)
        {
            this.add(skill);
        }
    }

    add(skill: Skill)
    {
        this.map[(skill.x + g.skill_range) * g.skillset_size + skill.y + g.skill_range] = true;
    }

    has(skill: Skill): boolean
    {
        return this.map[(skill.x + g.skill_range) * g.skillset_size + skill.y + g.skill_range];
    }

    serialize(): string
    {
        let map: number[] = [];

        for (let i = 0; i < g.skillset_size * g.skillset_size; i++)
        {
            map[i] = this.map[i] ? 1 : 0;
        }

        return JSON.stringify(map);
    }

    static deserialize(payload: string): SkillSet
    {
        let map = JSON.parse(payload);
        let sks = new SkillSet();
        for (let i = 0; i < g.skillset_size * g.skillset_size; i++)
        {
            sks.map[i] = map[i] == 1;
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
        for (let dy = -g.skill_range; dy <= g.skill_range; dy++)
        {
            for (let dx = -g.skill_range; dx <= g.skill_range; dx++)
            {
                if (this.map[(dx + g.skill_range) * g.skillset_size + dy + g.skill_range])
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

        for (let i = 0; i < g.skillset_size * g.skillset_size; i++)
        {
            result.map[i] = operator(this.map[i], other.map[i]);
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
        for (let i = 0; i < g.skillset_size * g.skillset_size; i++)
        {
            if (this.map[i] != other.map[i])
            {
                return false;
            }
        }
        return true;
    }

    flip(): SkillSet
    {
        let flipped = this.copy();

        for (let i = 0; i < g.skillset_size; i++)
        {
            for (let j = 0; j < g.skill_range; j++)
            {
                [
                    flipped.map[i * g.skillset_size + j],
                    flipped.map[i * g.skillset_size + g.skillset_size - 1 - j]
                ] = [
                        flipped.map[i * g.skillset_size + g.skillset_size - 1 - j],
                        flipped.map[i * g.skillset_size + j]
                    ];
            }
        }
        return flipped;
    }
}

export enum Player
{
    P1 = 1,
    P2 = 2
}

export type Players<T> =
    {
        [Player.P1]: T,
        [Player.P2]: T,
    };

export module Players
{
    export const color = {
        [Player.P1]: g.const.STYLE_RED_LIGHT,
        [Player.P2]: g.const.STYLE_BLUE_LIGHT
    }
    
    export function* both()
    {
        yield Player.P1;
        yield Player.P2;
    }

    export function* values<T>(players: Players<T>)
    {
        yield players[Player.P1];
        yield players[Player.P2];
    }

    export function create<T>(ctor: (p: Player) => T): Players<T>
    {
        return {
            [Player.P1]: ctor(Player.P1),
            [Player.P2]: ctor(Player.P2)
        };
    }
}

export function opponent(player: Player)
{
    return player == Player.P1 ? Player.P2 : Player.P1;
}

export function deserialize_player(payload: string): Player
{
    return <Player> Player[<keyof typeof Player>('P' + payload)];
}

export function serialize_player(player: Player)
{
    return JSON.stringify(player);
}

export class Move implements ISerializable, ICopyable<Move>, IHashable
{
    constructor(public from: Coordinate, public to: Coordinate)
    {
        this.which_skill();
    }

    equals(other: Move): boolean
    {
        return this.from.equals(other.from) && this.to.equals(other.to);
    }

    which_skill(): Skill
    {
        let dx = this.to.x - this.from.x;
        let dy = this.to.y - this.from.y;
        return new Skill(dx, dy);
    }

    hash(): string
    {
        return `Move(${ this.from.hash() },${ this.to.hash() })`;
    }

    serialize(): string
    {
        return this.from.serialize() + this.to.serialize();
    }

    static deserialize(payload: string)
    {
        return new Move(Coordinate.deserialize(payload.slice(0, 2)), Coordinate.deserialize(payload.slice(2, 4)));
    }

    copy(): Move
    {
        return new Move(this.from.copy(), this.to.copy());
    }
}

export class PlayerMove implements ISerializable
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

    extract(filter: (m: Move) => m is Move): Move[]
    {
        return extract(this.moves, filter);
    }

    serialize(): string
    {
        let s = this.moves.map(m => m.serialize());
        s.unshift(serialize_player(this.player));
        return JSON.stringify(s);
    }

    static deserialize(payload: string): PlayerMove
    {
        let data = JSON.parse(payload);
        let player = deserialize_player(data.shift());
        let moves = data.map((m: string) => Move.deserialize(m));
        return new PlayerMove(player, moves);
    }
}

export class Action implements ICopyable<Action>, ISerializable
{
    constructor(public move: Move, public type: ActionType, public unit: Unit)
    {
    }

    copy(): Action
    {
        return new Action(this.move.copy(), this.type, this.unit.copy());
    }

    get cost(): number
    {
        switch (this.type)
        {
            case ActionType.Defend:
                return 1;
            case ActionType.Move:
                return this.move_cost(this.unit, this.move);
            case ActionType.Upgrade:
                return this.upgrade_cost(this.unit, this.move);
            case ActionType.Attack:
                return this.move_cost(this.unit, this.move) + 1;
        }
    }

    private move_cost(unit: Unit, move: Move): number
    {
        if (unit.level == 1)
        {
            return 1;
        }
        
        if (unit.level == 2)
        {
            if (unit.type == Rider)
            {
                return 2;
            }
            else
            {
                let cost: number;
                if (move.which_skill().is_leap())
                {
                    cost = 4;
                }
                else
                {
                    cost = 2;
                }
    
                if (unit.type == Warrior)
                {
                    cost /= 2;
                }
    
                return cost;
            }
        }
        
        return 4;
    }

    private upgrade_cost(unit: Unit, move: Move): number
    {
        if (unit.is_promotion_ready())
        {
            return 15;
        }

        switch(unit.type)
        {
            case Soldier:
                return 6;
            case Barbarian:
                return 5;
            case Archer:
                return 4;
            case Rider:
                return 8;
            case Warrior:
                return move.which_skill().is_leap() ? 8 : 7;
            case Swordsman:
                return move.which_skill().is_adjacent() ? 12 : 10;
            case Spearman:
                return move.which_skill().is_leap() ? 12 : 10;
            case Lancer:
                return 9;
            case Knight:
                return 12;
            default:
                throw new Error("Wrong type");
        }
    }

    serialize(): string 
    {
        return JSON.stringify([this.type, this.move.serialize(), this.unit.serialize()])
    }

    static deserialize(payload: string): Action
    {
        let action_type: string;
        let move_literal: string;
        let unit: string;
        [action_type, move_literal, unit] = JSON.parse(payload);
        return new Action(
            Move.deserialize(move_literal), 
            parseInt(action_type), 
            UnitConstructor.deserialize(unit));
    }
}

export enum ActionType
{
    Upgrade = 1,
    Defend = 2,
    Move = 3,
    Attack = 4
}

export const action_style = new Map<ActionType, string>([
    [ActionType.Attack, g.const.STYLE_RED_LIGHT],
    [ActionType.Defend, g.const.STYLE_GREEN_LIGHT],
    [ActionType.Move, g.const.STYLE_BLACK],
    [ActionType.Upgrade, g.const.STYLE_CYAN],
]);

export class PlayerAction implements ISerializable
{
    constructor(public player: Player, public actions: Action[] = [])
    {
    }

    cost(): number
    {
        return this.actions.map((a) =>
        {
            return a.cost;
        }).reduce((a, b) => a + b, 0);
    }

    extract(filter: (a: Action) => a is Action): Action[]
    {
        return extract(this.actions, filter);
    }

    serialize(): string 
    {
        return JSON.stringify([this.player, this.actions.map((a) => a.serialize())]);
    }

    static deserialize(payload: string): PlayerAction
    {
        let s = JSON.parse(payload);
        let player = deserialize_player(s[0]);
        let actions: Action[] = [];
        for (let action_literal of s[1])
        {
            actions.push(Action.deserialize(action_literal));
        }

        return new PlayerAction(player, actions);
    }
}

export abstract class Unit implements ISerializable, ICopyable<Unit>
{
    current: SkillSet;
    readonly promotion_options: AdvancedUnitConstructor[] = [];
    readonly level: number = 0;

    constructor(public owner: Player, current: SkillSet | null = null)
    {
        this.current = current == null ? new SkillSet() : current;
    }

    get perfect(): SkillSet
    {
        return perfect_skills[this.type.id];
    }

    serialize(): string
    {
        return JSON.stringify([this.type.name, this.owner, this.current.serialize()]);
    }

    copy(): Unit
    {
        let ctor = <UnitConstructor> this.constructor;
        let u = new ctor(this.owner, this.current.copy());
        return u;
    }

    endow_inborn(): void
    {
        let inborn = inborn_skills[this.type.id];
        if (!inborn)
        {
            return;
        }
        this.current = this.owner == Player.P1 ? inborn.copy() : inborn.flip();
    }

    get type(): UnitConstructor
    {
        return <UnitConstructor> this.constructor;
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

    is_advanced(): boolean
    {
        return false;
    }

    duel(other: Unit): Unit | null
    {
        if (this.level == other.level)
        {
            return null;
        }
        else if (this.level > other.level)
        {
            return this;
        }
        else
        {
            return other;
        }
    }

    promote(skill: Skill): Unit | null
    {
        if (!this.is_promotion_ready())
        {
            return null;
        }

        let ctor = Unit.which_has_skill(skill, this.promotion_options);
        if (ctor == null)
        {
            return null;
        }

        let promoted = new (<AdvancedUnitConstructor> ctor)(this.owner, this.current);
        promoted.endow(skill);
        return promoted;
    }

    static spawn_perfect(player: Player, ctor: UnitConstructor): Unit
    {
        let unit = new ctor(player, null);
        unit.perfect.as_list().forEach(s => { unit.endow(s); });
        return unit;
    }

    static which_has_skill(skill: Skill, ctors: UnitConstructor[]): UnitConstructor | null
    {
        for (let c of ctors)
        {
            if (perfect_skills[c.id].has(skill))
            {
                return c;
            }
        }
        return null;
    }
}

export interface UnitConstructor extends IDeserializable<Unit>
{
    new(owner: Player, current: SkillSet | null): Unit;
    deserialize(payload: string): Unit;
    readonly id: number;
    discriminator: string;
}

export const UnitConstructor: UnitConstructor = class _ extends Unit
{
    static readonly id = 0;
    static discriminator = '';

    static deserialize(payload: string): Unit
    {
        let display: string, owner: string, current: string;
        [display, owner, current] = <[string, string, string]> JSON.parse(payload);

        let type = unit_type_by_name.get(display);
        if (!type)
        {
            throw new Error('Unit.deserialize: no constructor');
        }
        let unit = new type(deserialize_player(owner), SkillSet.deserialize(current));
        return unit;
    }
};

export interface BasicUnitConstructor extends UnitConstructor
{
    new(owner: Player, current: SkillSet | null): BasicUnit;
    discriminator: 'BasicUnitConstructor';
}

export interface AdvancedUnitConstructor extends UnitConstructor
{
    new(owner: Player, current: SkillSet | null): AdvancedUnit;
    discriminator: 'AdvancedUnitConstructor';
}

export function is_basic_unit_ctor(ctor: UnitConstructor): ctor is BasicUnitConstructor 
{
    return 'discriminator' in ctor && ctor['discriminator'] == 'BasicUnitConstructor';
}

export function is_advanced_unit_ctor(ctor: UnitConstructor): ctor is AdvancedUnitConstructor 
{
    return 'discriminator' in ctor && ctor['discriminator'] == 'AdvancedUnitConstructor';
}

abstract class BasicUnit extends UnitConstructor
{
    is_promotion_ready(): boolean
    {
        return this.is_perfect();
    }

    potential(): SkillSet
    {
        let potentials = new SkillSet();
        if (this.is_promotion_ready())
        {
            for (let future_type of this.promotion_options)
            {
                potentials = potentials.union(perfect_skills[future_type.id]);
            }
        }
        else
        {
            potentials = this.perfect;
        }
        return potentials.subtract(this.current);;
    }
}

abstract class AdvancedUnit extends UnitConstructor
{
    is_advanced(): boolean
    {
        return true;
    }
}

export const AdvancedUnitConstructor: AdvancedUnitConstructor = class _ extends AdvancedUnit
{
    static discriminator: 'AdvancedUnitConstructor' = 'AdvancedUnitConstructor';
};

export const BasicUnitConstructor: BasicUnitConstructor = class _ extends BasicUnit
{
    static discriminator: 'BasicUnitConstructor' = 'BasicUnitConstructor';
};

export class Rider extends BasicUnitConstructor
{
    static readonly id = 1;
    readonly promotion_options = [Lancer, Knight];
    readonly level = 2;
}

export class Soldier extends BasicUnitConstructor
{
    static readonly id = 2;
    readonly promotion_options = [Swordsman, Spearman];
    readonly level = 1;
}

export class Archer extends BasicUnitConstructor
{
    static readonly id = 3;
    readonly promotion_options = [Warrior, Spearman];
    readonly level = 1;
}

export class Barbarian extends BasicUnitConstructor
{
    static readonly id = 4;
    readonly promotion_options = [Warrior, Swordsman];
    readonly level = 1;
}

export class Lancer extends AdvancedUnitConstructor
{
    static readonly id = 5;
    readonly level = 3;
}

export class Knight extends AdvancedUnitConstructor
{
    static readonly id = 6;
    readonly level = 3;
}

export class Swordsman extends AdvancedUnitConstructor
{
    static readonly id = 7;
    readonly level = 2;
}

export class Spearman extends AdvancedUnitConstructor
{
    static readonly id = 8;
    readonly level = 2;
}

export class Warrior extends AdvancedUnitConstructor
{
    static readonly id = 9;
    readonly level = 2;
}

export class King extends UnitConstructor
{
    static readonly id = 10;
    readonly level = 1;
}

export const all_unit_types: UnitConstructor[] = [
    King, Rider, Soldier, Archer, Barbarian, Lancer, Knight, Spearman, Swordsman, Warrior
];

const unit_type_by_name = new Map<string, UnitConstructor>();

const perfect_skills: SkillSet[] = [];
const inborn_skills: SkillSet[] = [];

const perfect_skills_literal: { [unit_name: string]: string | undefined; } =
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
};

const inborn_skills_literal: { [unit_name: string]: string | undefined; } =
{
    'King':
    `-----
    -----
    -----
    -----
    -----`,
    
    'Rider':
    `-x-x-
    -----
    -----
    -----
    -x-x-`,
    
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
    -----`
};

all_unit_types.forEach((type: UnitConstructor) =>
{
    unit_type_by_name.set(type.name, type);

    let literal = perfect_skills_literal[type.name];
    if (!literal)
    {
        throw new Error(`${ type.name } not found`);
    }
    perfect_skills[type.id] = SkillSet.from_literal(literal);

    let inborn = inborn_skills_literal[type.name];

    if (inborn)
    {
        inborn_skills[type.id] = SkillSet.from_literal(inborn);
    }
});