class InsufficientSupply extends Error {}

class Game
{
    readonly supply_basic_incremental = 20;
    constructor(
        readonly round_count: number,
        readonly board: Board<Unit>, 
        readonly supplies: Map<Player, number>,
        readonly last_actions: Map<Player, PlayerAction> | null,
        readonly martyrs: Martyr[])
    {
    }

    make_move(moves: Map<Player, PlayerMove>): Game
    {
        let actions = new Map<Player, PlayerAction>();
        for (let player of moves.keys())
        {
            actions.set(player, this.validate_move(moves.get(player)!));
        }

        let [next_board, martyrs] = Rule.make_move(this.board, moves);
        let supplies = new Map<Player, number>();

        let buff = Rule.get_buff(this.board);
        for (let player of actions.keys())
        {
            let supply = this.supplies.get(player)!;
            supply -= actions.get(player)!.cost(buff);
            supply += this.get_supply_income(player);
            supply += martyrs.reduce<number>((total: number, martyr: Martyr) => {
                return total + martyr.quester.unit.owner != player ? martyr.relic : 0;
            }, 0);

            supplies.set(player, supply);
        }

        return new Game(
            this.round_count + 1,
            next_board, 
            supplies,
            actions,
            martyrs);
    }

    validate_move(move: PlayerMove): PlayerAction
    {
        let action = Rule.validate_player_move(this.board, move);
        let buff = Rule.get_buff(this.board);
        if (action.cost(buff) > this.supplies.get(action.player)!)
        {
            throw new InsufficientSupply();
        }
        return action;
    }

    get_supply(player: Player): number | undefined {
        return this.supplies.get(player);
    }

    get_supply_income(player: Player): number {
        let wagon_revenue = 0;
        this.board.iterate_units((unit: Unit, _) => {
            if (unit.owner == player && is_wagon(unit))
            {
                wagon_revenue += unit.revenue();
            }
        })
        return wagon_revenue + this.supply_basic_incremental;
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
                let unit = new setting[i](player);
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
        let supplies = new Map<Player, number>([[Player.P1, 0], [Player.P2, 0]]);
        return new Game(0, board, supplies, null, []);
    }
}

class GameContext
{
    buff: FullBoard<Buff>;
    history: Game[] = [];

    constructor(public player: Player, public player_names: Map<Player, string>, public present: Game)
    {
        this.history.push(present);
        this.buff = Rule.get_buff(present.board);
    }

    last(): Game | null
    {
        if (this.history.length > 0)
        {
            return this.history[this.history.length - 1];
        }
        return null;
    }

    make_move(moves: Map<Player, PlayerMove>): boolean
    {
        let next_game;
        try
        {
            next_game = this.present.make_move(moves);
        }
        catch
        {
            return false;
        }
        this.history.push(this.present);
        this.present = next_game;
        this.buff = Rule.get_buff(this.present.board);
        return true;
    }

    get_player_name(player: Player): string | undefined 
    {
        return this.player_names.get(player);
    }
}