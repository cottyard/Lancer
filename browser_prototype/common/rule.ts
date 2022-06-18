import { Board, FullBoard, SerializableBoard } from "./board";
import { Action, ActionType, Archer, Barbarian, Coordinate, King, Move, opponent, Player, PlayerAction, PlayerMove, Players, Rider, Skill, Soldier, Unit, UnitConstructor } from "./entity";
import { ResourceStatus } from "./game_round";
import { min, max, ISerializable } from "./language";

class InvalidMove extends Error { }

export class Rule
{
    static readonly layout_1st: UnitConstructor[] = [Archer, Rider, Archer, Rider, King, Rider, Archer, Rider, Archer];
    static readonly layout_2nd: UnitConstructor[] = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian];
    static readonly resource_grids: Coordinate[] = [
        new Coordinate(1, 1), new Coordinate(4, 1), new Coordinate(7, 1),
        new Coordinate(1, 4), new Coordinate(4, 4), new Coordinate(7, 4),
        new Coordinate(1, 7), new Coordinate(4, 7), new Coordinate(7, 7),
    ];

    static readonly supply_basic: number = 9;

    static readonly resource_grid_supplies: number[] = 
        [2, 2, 2, 2, 3, 2, 2, 2, 2];
    
    static readonly resource_capturing_speed = 2;
    static readonly resource_decapturing_speed = 3;
    static readonly resource_neutralizing_speed = 1;
    static readonly resource_recovering_speed = 1;

    static updated_resource_status(status: ResourceStatus, unit: Unit | null): ResourceStatus
    {
        if (unit)
        {
            if (status.neutral())
            {
                return new ResourceStatus(unit.owner, false, Rule.resource_capturing_speed);
            }
            else if (status.captured)
            {
                if (status.player == unit.owner)
                {
                    return new ResourceStatus(
                        status.player, 
                        true,
                        min(status.progress + Rule.resource_capturing_speed, 
                            ResourceStatus.full));
                }
                else
                {
                    if (status.progress - Rule.resource_decapturing_speed <= 0)
                    {
                        return new ResourceStatus(status.player, false);
                    }
                    else
                    {
                        return new ResourceStatus(
                            status.player, 
                            true,
                            status.progress - Rule.resource_decapturing_speed);
                    }
                }
            }
            else
            {
                if (status.player == unit.owner)
                {
                    if (status.progress + Rule.resource_capturing_speed >= ResourceStatus.full)
                    {
                        return new ResourceStatus(status.player, true);
                    }
                    else
                    {
                        return new ResourceStatus(
                            status.player,
                            false,
                            status.progress + Rule.resource_capturing_speed);
                    }
                }
                else
                {
                    return new ResourceStatus(
                        status.player, 
                        false,
                        max(status.progress - Rule.resource_decapturing_speed, 
                            0));
                }
            }
        }
        else
        {
            if (status.captured)
            {
                return new ResourceStatus(
                    status.player,
                    true,
                    min(status.progress + Rule.resource_recovering_speed, 
                        ResourceStatus.full));
            }
            else
            {
                return new ResourceStatus(
                    status.player,
                    false,
                    max(status.progress - Rule.resource_neutralizing_speed, 0));
            }
        }
    }

    static validate_player_move(board: GameBoard, player_move: PlayerMove): PlayerAction
    {
        let moves = player_move.moves;
        let move_set = new Set();
        for (let move of moves)
        {
            if (move_set.has(move.from.hash()))
            {
                throw new InvalidMove("unit moved more than once");
            }
            move_set.add(move.from.hash());
        }

        return new PlayerAction(
            player_move.player,
            moves.map((move: Move) =>
            {
                return Rule.validate_move(board, move, player_move.player);
            }));
    }

    static validate_move(board: GameBoard, move: Move, player: Player): Action
    {
        let unit = board.unit.at(move.from);
        if (unit == null)
        {
            throw new InvalidMove("unit is empty");
        }

        if (unit.owner != player)
        {
            throw new InvalidMove("grid belongs to enemy");
        }

        let skill = move.which_skill();
        if (skill == null)
        {
            throw new InvalidMove("not a valid skill");
        }

        if (unit.capable(skill))
        {
            let target = board.unit.at(move.to);
            if (target == null)
            {
                return new Action(move, ActionType.Move, unit);
            }

            if (unit.owner == target.owner)
            {
                if (target.type() != King)
                {
                    return new Action(move, ActionType.Defend, unit);
                }
                else
                {
                    throw new InvalidMove("cannot defend King");
                }
            }
            else
            {
                return new Action(move, ActionType.Attack, unit);
            }
        }
        else
        {
            if (unit.potential().has(skill))
            {
                return new Action(move, ActionType.Upgrade, unit);
            }
            else
            {
                throw new InvalidMove(`skill not available ${ skill.hash() }`);
            }
        }
    }

    static get_heat(board: Board<Unit>): FullBoard<Heat>
    {
        let heat = new FullBoard<Heat>(() => new Heat());
        board.iterate_units((unit, coord) =>
        {
            for (let c of Rule.reachable_by(board, coord))
            {
                heat.at(c).heatup(unit.owner);
            }
        });
        return heat;
    }

    static count_unit(board: Board<Unit>, player: Player, unit_type: UnitConstructor | null = null): number
    {
        let count = 0;
        board.iterate_units((unit: Unit, _) =>
        {
            if (unit.owner == player)
            {
                if (unit_type == null || unit.constructor == unit_type)
                {
                    count++;
                }
            }
        });
        return count;
    }

    static where(board: Board<Unit>, player: Player, unit_type: UnitConstructor): Coordinate[]
    {
        let found: Coordinate[] = [];
        board.iterate_units((unit, coord) =>
        {
            if (unit.owner == player && unit.constructor == unit_type)
            {
                found.push(coord);
            }
        });
        return found;
    }

    static reachable_by_skills(coord: Coordinate, skills: Skill[]): Coordinate[]
    {
        let coordinates: Coordinate[] = [];
        for (let skill of skills)
        {
            let c = coord.add(skill.x, skill.y);
            if (c)
            {
                coordinates.push(c);
            }
        }

        return coordinates;
    }

    static which_can_reach(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let able: Coordinate[] = [];
        board.iterate_units((unit, c) =>
        {
            let skill;
            if (Skill.is_valid(coord.x - c.x, coord.y - c.y))
            {
                skill = new Skill(coord.x - c.x, coord.y - c.y);
            }
            else
            {
                return;
            }

            if (unit.capable(skill))
            {
                able.push(c);
            }
        });
        return able;
    }

    static reachable_by(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (!unit)
        {
            return [];
        }
        return Rule.reachable_by_skills(coord, unit.current.as_list());
    }

    static upgradable_by(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (!unit)
        {
            return [];
        }

        return Rule.reachable_by_skills(coord, unit.potential().as_list());
    }

    static valid_moves(board: GameBoard, player: Player): Move[]
    {
        let all: Move[] = [];
        board.unit.iterate_units((unit, c) =>
        {
            if (unit.owner == player)
            {
                let reachable = this.reachable_by(board.unit, c);
                let upgradable = this.upgradable_by(board.unit, c);

                for (let dest of reachable.concat(upgradable))
                {
                    all.push(new Move(c, dest));
                }
            }
        });

        return all;
    }

    static proceed_board_with_moves(board: GameBoard, moves: Players<PlayerMove>)
        : [GameBoard, Martyr[]]
    {
        let actions: Players<PlayerAction> = {
            [Player.P1]: this.validate_player_move(board, moves[Player.P1]),
            [Player.P2]: this.validate_player_move(board, moves[Player.P2])
        };

        let next_board = board.unit.copy();
        let force_board = new FullBoard<Force>(() => new Force());
        let martyrs: Martyr[] = [];

        this.process_upgrade_phase(next_board, actions);
        this.process_defend_phase(next_board, actions, force_board);
        martyrs = martyrs.concat(this.process_clash_phase(next_board, actions));
        martyrs = martyrs.concat(this.process_battle_phase(next_board, actions, force_board));

        return [new GameBoard(next_board), martyrs];
    }

    static process_upgrade_phase(board: Board<Unit>, player_actions: Players<PlayerAction>)
    {
        for (let player_action of Players.values(player_actions))
        {
            for (let action of player_action.extract((a): a is Action => a.type == ActionType.Upgrade))
            {
                let unit = board.at(action.move.from)!;
                let skill = action.move.which_skill()!;
                if (unit.is_promotion_ready())
                {
                    let promoted = unit.promote(skill);
                    if (promoted == null)
                    {
                        throw new Error("promotion error");
                    }
                    board.put(action.move.from, promoted);
                }
                else
                {
                    if (!unit.endow(skill))
                    {
                        throw new Error("upgrade error");
                    }
                }
            }
        }
    }

    static process_defend_phase(board: Board<Unit>, player_actions: Players<PlayerAction>, force_board: FullBoard<Force>)
    {
        for (let player_action of Players.values(player_actions))
        {
            for (let action of player_action.extract((a): a is Action => a.type == ActionType.Defend))
            {
                let unit = board.at(action.move.from)!;
                force_board.at(action.move.to).reinforcers[player_action.player].push(unit);
            }
        }
    }

    static process_clash_phase(board: Board<Unit>, player_actions: Players<PlayerAction>): Martyr[]
    {
        let clash_board = new Board<Action>();
        let martyrs: Martyr[] = [];

        type ClashPair = {
            [k in Player]: Action
        };
        let clashes: ClashPair[] = [];

        for (let player_action of Players.values(player_actions))
        {
            for (let action of player_action.actions)
            {
                if (action.type != ActionType.Attack)
                {
                    continue;
                }

                let other = clash_board.at(action.move.to);
                if (other != null && other.move.to.equals(action.move.from))
                {
                    clashes.push(<ClashPair> {
                        [player_action.player]: action,
                        [opponent(player_action.player)]: other
                    });
                }
                clash_board.put(action.move.from, action);
            }
        }

        for (let clash of clashes)
        {
            let a1 = clash[Player.P1];
            let a2 = clash[Player.P2];
            let u1 = board.at(a1.move.from)!;
            let u2 = board.at(a2.move.from)!;

            let surviver = u1.duel(u2);

            let fallen: Action[] = [];
            if (surviver == null)
            {
                player_actions[Player.P1].extract((a): a is Action => a == a1);
                player_actions[Player.P2].extract((a): a is Action => a == a2);
                fallen.push(a1, a2);
            }
            else
            {
                let action = clash[opponent(surviver.owner)];
                player_actions[surviver.owner].extract((a): a is Action => a == action);
                fallen.push(action);
            }

            for (let action of fallen)
            {
                let martyr = board.remove(action.move.from)!;
                martyrs.push(new Martyr(new Quester(martyr, action.move.from)));
            }
        }

        return martyrs;
    }

    static process_battle_phase(board: Board<Unit>, 
                                player_actions: Players<PlayerAction>, 
                                force_board: FullBoard<Force>): Martyr[]
    {
        for (let player_action of Players.values(player_actions))
        {
            for (let action of player_action.extract((a): a is Action => 
                    a.type == ActionType.Attack || a.type == ActionType.Move))
            {
                let target = action.move.to;
                if (force_board.at(target).arriver[player_action.player] == null)
                {
                    let unit = board.remove(action.move.from)!;
                    force_board.at(target).arriver[player_action.player] = 
                        new Quester(unit, action.move.from);
                }
                else
                {
                    let unit = board.at(action.move.from)!;
                    force_board.at(target).reinforcers[player_action.player].push(unit);
                }
            }
        }

        let martyrs: Martyr[] = [];

        function settle_battle(force: Force, where: Coordinate)
        {
            let quester_1 = force.arriver[Player.P1];
            let quester_2 = force.arriver[Player.P2];

            if (quester_1 == null && quester_2 == null)
            {
                return;
            }

            let helper_1 = force.reinforcers[Player.P1].length;
            let helper_2 = force.reinforcers[Player.P2].length;

            let survived: Unit | null;

            if (quester_1 && quester_2)
            {
                if (helper_1 == helper_2)
                {
                    survived = quester_1.unit.duel(quester_2.unit);
                    if (survived)
                    {
                        let fallen = force.arriver[opponent(survived.owner)]!;
                        martyrs.push(new Martyr(fallen));
                    }
                    else
                    {
                        martyrs.push(
                            new Martyr(quester_1),
                            new Martyr(quester_2));
                    }
                }
                else
                {
                    survived = helper_1 > helper_2 ? quester_1.unit : quester_2.unit;
                    let defeated = helper_1 > helper_2 ? quester_2 : quester_1;
                    martyrs.push(new Martyr(defeated));
                }
            }
            else
            {
                let invader: Quester;
                let accomplice: number;
                let resistance: number;
                if (quester_1)
                {
                    invader = quester_1;
                    accomplice = helper_1;
                    resistance = helper_2;
                }
                else
                {
                    invader = quester_2!;
                    accomplice = helper_2;
                    resistance = helper_1;
                }

                if (accomplice >= resistance)
                {
                    survived = invader.unit;
                    let resident = board.at(where);
                    if (resident)
                    {
                        martyrs.push(new Martyr(new Quester(resident, where)));
                    }
                }
                else
                {
                    survived = null;
                    martyrs.push(new Martyr(invader));
                }
            }

            if (survived)
            {
                board.put(where, survived);
            }
        }

        force_board.iterate_units(settle_battle);
        return martyrs;
    }
}

export class GameBoard
{
    heat: FullBoard<Heat>;
    constructor(public unit: SerializableBoard<Unit>)
    {
        this.heat = Rule.get_heat(unit);
    }
}

export class Heat
{
    map = [0, 0, 0];

    heatup(player: Player)
    {
        this.map[player] += 1;
    }

    friendly(player: Player): number
    {
        return this.map[player];
    }

    hostile(player: Player): number
    {
        return this.map[opponent(player)];
    }
}

class Force
{
    reinforcers: Unit[][] = [[], [], []];
    arriver: (Quester | null)[] = [null, null, null];
}

export class Martyr implements ISerializable
{
    constructor(public quester: Quester)
    {
    }

    serialize(): string 
    {
        return this.quester.serialize();
    }

    static deserialize(payload: string): Martyr
    {
        return new Martyr(Quester.deserialize(payload));
    }
}

export class Quester implements ISerializable
{
    constructor(public unit: Unit, public from_grid: Coordinate)
    {
    }

    serialize(): string 
    {
        return JSON.stringify([
            this.unit.serialize(),
            this.from_grid.serialize()
        ]);
    }

    static deserialize(payload: string): Quester
    {
        let [unit, from] = JSON.parse(payload);
        return new Quester(
            UnitConstructor.deserialize(unit), 
            Coordinate.deserialize(from));
    }
}
