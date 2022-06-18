import { Board, create_serializable_board_ctor, SerializableBoard } from "./board";
import { all_unit_types, Coordinate, deserialize_player, King, Player, PlayerAction, PlayerMove, Players, Unit, UnitConstructor } from "./entity";
import { g } from "./global";
import { ISerializable } from "./language";
import { GameBoard, Martyr, Rule } from "./rule";

export class InsufficientSupply extends Error { }

export enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

export class ResourceStatus implements ISerializable
{
    static readonly full: number = 6;

    constructor(public player: Player,
                public captured: boolean,
                public progress: number = -1)
    {
        if (this.progress == -1)
        {
            this.progress = captured ? ResourceStatus.full : 0;
        }
    }

    neutral(): boolean
    {
        return !this.captured && this.progress == 0;
    }

    serialize(): string
    {
        return JSON.stringify([this.player, this.progress, this.captured]);
    }

    static deserialize(payload: string): ResourceStatus
    {
        let [player, progress, captured] = JSON.parse(payload);
        return new ResourceStatus(player, captured, progress);
    }
}

export class GameRound implements ISerializable
{
    private constructor(
        readonly round_count: number,
        readonly board: GameBoard,
        readonly supplies: Players<number>,
        readonly last_actions: Players<PlayerAction> | null,
        readonly martyrs: Martyr[],
        readonly resources: ResourceStatus[]
        )
    {
    }

    proceed(moves: Players<PlayerMove>): GameRound
    {
        let actions = {
            [Player.P1]: this.validate_move(moves[Player.P1]),
            [Player.P2]: this.validate_move(moves[Player.P2])
        };

        let [next_board, martyrs] = Rule.proceed_board_with_moves(this.board, moves);
        let supplies = {
            [Player.P1]: 0,
            [Player.P2]: 0
        };

        for (let player of Players.both())
        {
            supplies[player] = this.supplies[player] 
                             + this.supply_income(player)
                             - actions[player].cost();
        }

        return new GameRound(
            this.round_count + 1,
            next_board,
            supplies,
            actions,
            martyrs,
            this.resources_updated(next_board));
    }

    resources_updated(board: GameBoard): ResourceStatus[]
    {
        let resources: ResourceStatus[] = [];
        for (let i = 0; i < this.resources.length; ++i)
        {
            let status = this.resources[i];
            let coord = Rule.resource_grids[i];
            let unit = board.unit.at(coord);
            resources[i] = Rule.updated_resource_status(status, unit);
        }
        return resources;
    }

    status(): GameStatus
    {
        let king_1 = Rule.count_unit(this.board.unit, Player.P1, King);
        let king_2 = Rule.count_unit(this.board.unit, Player.P2, King);
        if (king_1 && king_2)
        {
            return GameStatus.Ongoing;
        }
        else if (king_1)
        {
            return GameStatus.WonByPlayer1;
        }
        else if (king_2)
        {
            return GameStatus.WonByPlayer2;
        }
        else
        {
            return GameStatus.Tied;
        }
    }

    validate_move(move: PlayerMove): PlayerAction
    {
        let action = Rule.validate_player_move(this.board, move);
        if (action.cost() > this.supplies[action.player])
        {
            throw new InsufficientSupply();
        }
        return action;
    }

    supply(player: Player): number
    {
        return this.supplies[player];
    }

    supply_income(player: Player): number 
    {
        let resource_income = 0;
        for (let i = 0; i < this.resources.length; ++i)
        {
            let status = this.resources[i];
            if (status.captured && status.player == player)
            {
                resource_income += Rule.resource_grid_supplies[i];
            }
        }
        return Rule.supply_basic + resource_income;
    }

    static set_out(board: Board<Unit>): void
    {
        let board_layout: [number, UnitConstructor[], Player][] = [
            [0, Rule.layout_1st, Player.P2],
            [1, Rule.layout_2nd, Player.P2],
            [g.board_size_y - 1, Rule.layout_1st, Player.P1],
            [g.board_size_y - 2, Rule.layout_2nd, Player.P1]
        ];

        let row, setting, player;
        for ([row, setting, player] of board_layout)
        {
            for (let i = 0; i < g.board_size_x; i++)
            {
                let unit = new setting[i](player, null);
                unit.endow_inborn();
                board.put(new Coordinate(i, row), unit);
            }
        }
    }

    static new_game(): GameRound
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        let board = new board_ctor();
        this.set_out(board);
        
        let resources: ResourceStatus[] = [
            new ResourceStatus(Player.P2, true), 
            new ResourceStatus(Player.P2, true),
            new ResourceStatus(Player.P2, true),
            new ResourceStatus(Player.P2, false),
            new ResourceStatus(Player.P2, false),
            new ResourceStatus(Player.P2, false),
            new ResourceStatus(Player.P1, true), 
            new ResourceStatus(Player.P1, true),
            new ResourceStatus(Player.P1, true),
        ]; 
        
        return new GameRound(
            0, new GameBoard(board),
            {
                [Player.P1]: Rule.supply_basic,
                [Player.P2]: Rule.supply_basic
            }, null, [],
            resources);
    }

    static new_showcase(): GameRound
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        let board = new board_ctor();
        let random_unit = all_unit_types[Math.floor(Math.random() * all_unit_types.length)];
        let random_player = Math.floor(Math.random() * 2) + 1;
        board.put(new Coordinate(4, 4), Unit.spawn_perfect(random_player, random_unit));
        return new GameRound(
            0, new GameBoard(board),
            {
                [Player.P1]: 0,
                [Player.P2]: 0
            }, null, [], []);
    }

    serialize(): string 
    {
        return JSON.stringify([
            this.round_count, 
            this.supplies, 
            this.board.unit.serialize(), 
            this.last_actions == null? [] : [this.last_actions[Player.P1].serialize(),
                                             this.last_actions[Player.P2].serialize()],
            this.martyrs.map((martyr) => martyr.serialize()),
            this.resources.map((r) => r.serialize())
        ]);
    }

    static deserialize(payload: string): GameRound
    {
        let [round_count, players_supply, board_payload, 
             players_actions, victims, resources] = JSON.parse(payload);

        let last_round_actions = {
            [Player.P1]: new PlayerAction(Player.P1),
            [Player.P2]: new PlayerAction(Player.P2)
        };

        for (let player_action_payload of players_actions)
        {
            let player_action = PlayerAction.deserialize(player_action_payload);
            last_round_actions[player_action.player] = player_action;
        }

        let supplies = {
            [Player.P1]: 0,
            [Player.P2]: 0
        };

        for (let player in players_supply)
        {
            supplies[deserialize_player(player)] = players_supply[player];
        }

        let martyrs: Martyr[] = victims.map((v: string) => Martyr.deserialize(v));

        let board = <SerializableBoard<Unit>> create_serializable_board_ctor(
            UnitConstructor).deserialize(board_payload);

        let resource_states: ResourceStatus[] = [];
        
        for (let r of resources)
        {
            resource_states.push(ResourceStatus.deserialize(r));
        }

        return new GameRound(
            round_count, 
            new GameBoard(board), 
            supplies, 
            last_round_actions, 
            martyrs, 
            resource_states);
    }
}
