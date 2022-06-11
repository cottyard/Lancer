class InsufficientSupply extends Error { }

const supply_basic_incremental: number = 7;

enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

class CapturingState
{
    constructor(public readonly by: Player, public readonly remaining_duration: number)
    {
    }
}

class CapturedState
{
    constructor(public readonly by: Player)
    {
    }
}

class NeutralizingState
{
    constructor(public readonly owner: Player, public readonly remaining_duration: number)
    {
    }
}

class NeutralState
{
}

type ResourceStatus = CapturingState | CapturedState 
                    | NeutralizingState | NeutralState

class GameRound
{
    constructor(
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

        for (let player of Player.both())
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
            if (status instanceof CapturedState && status.by == player)
            {
                resource_income += Rule.resource_grid_supplies[i];
            }
        }
        return supply_basic_incremental + resource_income;
    }

    static set_out(board: Board<Unit>): void
    {
        let board_layout: [number, UnitConstructor[], Player][] = [
            [0, g.layout_1st, Player.P2],
            [1, g.layout_2nd, Player.P2],
            [g.board_size_y - 1, g.layout_1st, Player.P1],
            [g.board_size_y - 2, g.layout_2nd, Player.P1]
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
            new CapturedState(Player.P2), new CapturedState(Player.P2), new CapturedState(Player.P2),
            new NeutralState(), new NeutralState(), new NeutralState(),
            new CapturedState(Player.P1), new CapturedState(Player.P1), new CapturedState(Player.P1)
        ]; 
        
        return new GameRound(
            0, new GameBoard(board),
            {
                [Player.P1]: supply_basic_incremental,
                [Player.P2]: supply_basic_incremental
            }, null, [],
            resources);
    }

    static new_showcase(): GameRound
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        let board = new board_ctor();
        let random_unit = g.all_unit_types[Math.floor(Math.random() * g.all_unit_types.length)];
        let random_player = Math.floor(Math.random() * 2) + 1;
        board.put(new Coordinate(4, 4), Unit.spawn_perfect(random_player, random_unit));
        return new GameRound(
            0, new GameBoard(board),
            {
                [Player.P1]: 0,
                [Player.P2]: 0
            }, null, [], []);
    }

    // static deserialize(payload: string): GameRound
    // {
    //     let [round_count, player_supply_map, board_payload, player_actions, victims] = JSON.parse(payload);

    //     let last_round_actions = {
    //         [Player.P1]: new PlayerAction(Player.P1),
    //         [Player.P2]: new PlayerAction(Player.P2)
    //     };

    //     for (let player_action_payload of player_actions)
    //     {
    //         let player_action = PlayerAction.deserialize(player_action_payload);
    //         last_round_actions[player_action.player] = player_action;
    //     }

    //     let supplies = {
    //         [Player.P1]: 0,
    //         [Player.P2]: 0
    //     };

    //     for (let player in player_supply_map)
    //     {
    //         supplies[deserialize_player(player)] = player_supply_map[player];
    //     }

    //     let martyrs: Martyr[] = [];
    //     for (let victim of victims)
    //     {
    //         let coord = Coordinate.deserialize(victim);

    //         // TODO: temporarily stub all deserialized martyr as Soldier
    //         martyrs.push(new Martyr(new Quester(new Soldier(Player.P1, null), coord)));
    //     }

    //     let board = <SerializableBoard<Unit>> create_serializable_board_ctor(UnitConstructor).deserialize(board_payload);
    //     return new GameRound(round_count, new GameBoard(board), supplies, last_round_actions, martyrs);
    // }
}
