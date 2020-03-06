class InsufficientSupply extends Error {}

enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

class Game
{
    static readonly supply_basic_incremental = 20;
    constructor(
        readonly round_count: number,
        readonly board: Board<Unit>, 
        readonly supplies: Players<number>,
        readonly last_actions: Players<PlayerAction> | null,
        readonly martyrs: Martyr[])
    {
    }

    make_move(moves: Players<PlayerMove>): Game
    {
        let actions = {
            [Player.P1]: this.validate_move(moves[Player.P1]),
            [Player.P2]: this.validate_move(moves[Player.P2])
        }

        let [next_board, martyrs] = Rule.make_move(this.board, moves);
        let supplies = {
            [Player.P1]: 0,
            [Player.P2]: 0
        };

        let buff = Rule.get_buff(this.board);
        for (let player of Player.both())
        {
            let supply = this.supplies[player];
            supply -= actions[player].cost(buff);
            supply += this.supply_income(player);
            supply += martyrs.reduce<number>((total: number, martyr: Martyr) => {
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
        let king_1 = Rule.count_unit(this.board, Player.P1, King);
        let king_2 = Rule.count_unit(this.board, Player.P2, King);
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
        let buff = Rule.get_buff(this.board);
        if (action.cost(buff) > this.supplies[action.player])
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
        this.board.iterate_units((unit: Unit, _) => {
            if (unit.owner == player && is_wagon(unit))
            {
                wagon_revenue += unit.revenue();
            }
        })
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
                let unit = new setting[i](player);
                board.put(new Coordinate(i, row), unit);
            }
        }
    }

    static new_game(): Game
    {
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        let board = new board_ctor();
        this.set_out(board);
        let supplies = {
            [Player.P1]: Game.supply_basic_incremental,
            [Player.P2]: Game.supply_basic_incremental
        };
        return new Game(0, board, supplies, null, []);
    }
}

interface IGameContext
{
    last: Game | null;
    buff: FullBoard<Buff>;
    present: Game;
    actions: Players<PlayerAction>;
    move(player: Player): PlayerMove;
    action(player: Player): PlayerAction;
    action_cost(player: Player): number;
    prepare_move(player: Player, move: Move): boolean;
    prepare_moves(player: Player, moves: Move[]): boolean;
    delete_moves(player: Player, filter: (move: Move) => move is Move): Move[];
    make_move(player: Player): void;
    player_name(player: Player): string;
    on_new(listener: Function): void;
}

interface IOnlineGameContext extends IGameContext
{
    player: Player;
}

class GameContext implements IGameContext
{
    protected _buff: FullBoard<Buff>;
    protected history: Game[] = [];
    protected listeners: Function[] = [];

    readonly player_moved: Players<boolean> = {
        [Player.P1]: false,
        [Player.P2]: false,
    };
    
    readonly player_moves: Players<PlayerMove> = {
        [Player.P1]: new PlayerMove(Player.P1),   
        [Player.P2]: new PlayerMove(Player.P2),
    };

    readonly player_actions: Players<PlayerAction> = {
        [Player.P1]: new PlayerAction(Player.P1),
        [Player.P2]: new PlayerAction(Player.P2),
    }

    constructor(protected player_names: Players<string>, protected _present: Game)
    {
        this._buff = Rule.get_buff(_present.board);
    }

    get last(): Game | null
    {
        if (this.history.length > 0)
        {
            return this.history[this.history.length - 1];
        }
        return null;
    }

    get present(): Game
    {
        return this._present;
    }

    get buff(): FullBoard<Buff>
    {
        return this._buff;
    }

    get actions(): Players<PlayerAction>
    {
        return this.player_actions;
    }

    on_new(listener: Function)
    {
        this.listeners.push(listener);
    }

    moved(player: Player): boolean
    {
        return this.player_moved[player];
    }

    move(player: Player): PlayerMove
    {
        return this.player_moves[player];
    }

    action(player: Player): PlayerAction
    {
        return this.player_actions[player];
    }

    action_cost(player: Player): number
    {
        return this.player_actions[player].cost(this._buff);
    }

    delete_moves(player: Player, which: (move: Move) => move is Move)
    {
        let removed = this.player_moves[player].extract(which);
        this.update_action(player);
        return removed;
    }

    update_action(player: Player)
    {
        this.player_actions[player] = Rule.validate_player_move(this._present.board, this.player_moves[player]);
        this.player_actions[player].actions.sort((a1, a2) => a2.type - a1.type);
    }

    prepare_move(player: Player, move: Move): boolean
    {
        this.delete_moves(player, (m: Move): m is Move => m.from.equals(move.from));
        this.player_moves[player].moves.push(move);
        try
        {
            this.update_action(player);
        }
        catch
        {
            this.player_moves[player].moves.pop();
            return false;
        }
        return true;
    }

    prepare_moves(player: Player, moves: Move[]): boolean
    {
        let old = this.player_moves[player].moves;
        this.player_moves[player].moves = moves;
        try
        {
            this.update_action(player);
        }
        catch
        {
            this.player_moves[player].moves = old;
            return false;
        }
        return true;
    }

    make_move(player: Player)
    {
        this.player_moved[player] = true;

        if (this.player_moved[opponent(player)])
        {
            this.next_game();
        }
    }

    next_game(): boolean
    {
        let next_game;
        try
        {
            next_game = this._present.make_move(this.player_moves);
        }
        catch
        {
            return false;
        }
        this.history.push(this._present);
        this._present = next_game;
        this._buff = Rule.get_buff(this._present.board);

        for (let player of Player.both())
        {
            this.player_moved[player] = false;
            this.player_moves[player] = new PlayerMove(player);
            this.player_actions[player] = new PlayerAction(player);
        }

        for (let listener of this.listeners)
        {
            listener();
        }
        return true;
    }

    player_name(player: Player): string
    {
        return this.player_names[player];
    }
}

class OnlineGameContext extends GameContext implements IOnlineGameContext
{
    constructor(public player: Player, public player_names: Players<string>, public _present: Game)
    {
        super(player_names, _present);
    }

    make_move(): void
    {

    }
}
