import { Player, PlayerData, PlayerAction, PlayerMove, deserialize_player, King, UnitConstructor, is_wagon, Unit, Coordinate, Wagon } from '../core/entity';
import { Rule, Martyr, Quester, BoardContext } from '../core/rule';
import { create_serializable_board_ctor, Board, SerializableBoard } from '../core/board';
import { g } from '../core/global';
class InsufficientSupply extends Error { }

export enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

export class Game
{
    static readonly supply_basic_incremental = 20;
    constructor(
        readonly round_count: number,
        readonly board: BoardContext,
        readonly supplies: PlayerData<number>,
        readonly last_actions: PlayerData<PlayerAction> | null,
        readonly martyrs: Martyr[])
    {
    }

    make_move(moves: PlayerData<PlayerMove>): Game
    {
        let actions = {
            [Player.P1]: this.validate_move(moves[Player.P1]),
            [Player.P2]: this.validate_move(moves[Player.P2])
        };

        let [next_board, martyrs] = Rule.make_move(this.board, moves);
        let supplies = {
            [Player.P1]: 0,
            [Player.P2]: 0
        };

        for (let player of Player.both())
        {
            let supply = this.supplies[player];
            supply -= actions[player].cost(this.board.buff);
            supply += this.supply_income(player);
            supply += martyrs.reduce<number>((total: number, martyr: Martyr) =>
            {
                return total + martyr.quester.unit.owner != player ? martyr.relic : 0;
            }, 0);

            supplies[player] = supply;
        }

        return new Game(
            this.round_count + 1,
            next_board,
            supplies,
            actions,
            martyrs);
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
        if (action.cost(this.board.buff) > this.supplies[action.player])
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
        let wagon_revenue = 0;
        this.board.unit.iterate_units((unit: Unit, _) =>
        {
            if (unit.owner == player && is_wagon(unit))
            {
                wagon_revenue += unit.revenue();
            }
        });
        return wagon_revenue + Game.supply_basic_incremental;
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

    static new_game(): Game
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        let board = new board_ctor();
        this.set_out(board);
        return new Game(
            0, new BoardContext(board),
            {
                [Player.P1]: Game.supply_basic_incremental,
                [Player.P2]: Game.supply_basic_incremental
            }, null, []);
    }

    static new_showcase(): Game
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        let board = new board_ctor();
        let random_unit = g.all_unit_types[Math.floor(Math.random() * g.all_unit_types.length)];
        let random_player = Math.floor(Math.random() * 2) + 1;
        board.put(new Coordinate(4, 4), Unit.spawn_perfect(random_player, random_unit));
        return new Game(
            0, new BoardContext(board),
            {
                [Player.P1]: 0,
                [Player.P2]: 0
            }, null, []);
    }

    static deserialize(payload: string): Game
    {
        let [round_count, player_supply_map, board_payload, player_actions, victims] = JSON.parse(payload);

        let last_round_actions = {
            [Player.P1]: new PlayerAction(Player.P1),
            [Player.P2]: new PlayerAction(Player.P2)
        };

        for (let player_action_payload of player_actions)
        {
            let player_action = PlayerAction.deserialize(player_action_payload);
            last_round_actions[player_action.player] = player_action;
        }

        let supplies = {
            [Player.P1]: 0,
            [Player.P2]: 0
        };

        for (let player in player_supply_map)
        {
            supplies[deserialize_player(player)] = player_supply_map[player];
        }

        let martyrs: Martyr[] = [];
        for (let [victim, trophy] of victims)
        {
            let coord = Coordinate.deserialize(victim);

            // TODO: temporarily stub all deserialized martyr as wagon
            martyrs.push(new Martyr(new Quester(new Wagon(Player.P1, null), coord), trophy));
        }

        let board = <SerializableBoard<Unit>> create_serializable_board_ctor(UnitConstructor).deserialize(board_payload);
        return new Game(round_count, new BoardContext(board), supplies, last_round_actions, martyrs);
    }
}
