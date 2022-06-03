class InsufficientSupply extends Error { }

const supply_basic_incremental: number = 9;

enum GameStatus
{
    Ongoing,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

class CapturingState
{
    constructor(public by: Player, public remaining_duration: number)
    {
    }
}

class CapturedState
{
    constructor(public by: Player)
    {
    }
}

class NeutralizingState
{
    constructor(public owner: Player, public remaining_duration: number)
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
            this.resources_updated());
    }

    resources_updated(): ResourceStatus[]
    {
        for (let i = 0; i < this.resources.length; ++i)
        {
        }
        return this.resources;
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

    supply_income(_player: Player): number 
    {
        return supply_basic_incremental;
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
            new CapturedState(Player.P1), new CapturedState(Player.P1), new CapturedState(Player.P1),
            new NeutralState(), new NeutralState(), new NeutralState(),
            new CapturedState(Player.P2), new CapturedState(Player.P2), new CapturedState(Player.P2)
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

interface IGameContext
{
    last: GameRound | null;
    present: GameRound;
    actions: Players<PlayerAction>;
    status: GameStatus;
    move(player: Player): PlayerMove;
    action(player: Player): PlayerAction;
    action_cost(player: Player): number;
    prepare_move(player: Player, move: Move): "accepted" | "overridden" | "invalid";
    prepare_moves(player: Player, moves: Move[]): boolean;
    delete_moves(player: Player, filter: (move: Move) => move is Move): Move[];
    pop_move(player: Player): Move | null;
    make_move(player: Player): void;
    player_name(player: Player): string;
    on_new_game(listener: Function): void;
}

interface IOnlineGameContext extends IGameContext
{
    player: Player;
    moved(player: Player): boolean;
    consumed_milliseconds(player: Player): number;
    new_session(player_name: string): void;
    on_new_status(listener: Function): void;
    on_new_session(listener: Function): void;
    on_loading(listener: Function): void;
    on_move(listener: Function): void;
    load_session(session: string, player_name: string): void;
}

class GameContext implements IGameContext
{
    protected history: GameRound[] = [];
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
    };

    constructor(protected player_names: Players<string>, protected _present: GameRound)
    {
    }

    get status(): GameStatus
    {
        return this.present.status();
    }

    get last(): GameRound | null
    {
        if (this.history.length > 0)
        {
            return this.history[this.history.length - 1];
        }
        return null;
    }

    get present(): GameRound
    {
        return this._present;
    }

    get actions(): Players<PlayerAction>
    {
        return this.player_actions;
    }

    on_new_game(listener: Function)
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
        return this.player_actions[player].cost();
    }

    delete_moves(player: Player, which: (move: Move) => move is Move): Move[]
    {
        let removed = this.player_moves[player].extract(which);
        if (removed)
        {
            this.update_action(player);
        }
        return removed;
    }

    pop_move(player: Player): Move | null
    {
        let removed = this.player_moves[player].moves.pop();
        if (removed)
        {
            this.update_action(player);
        }
        return removed || null;
    }

    update_action(player: Player)
    {
        this.player_actions[player] = Rule.validate_player_move(this._present.board, this.player_moves[player]);
        this.player_actions[player].actions.sort((a1, a2) => a2.type - a1.type);
    }

    prepare_move(player: Player, move: Move): "accepted" | "overridden" | "invalid"
    {
        let overrided = this.delete_moves(player, (m: Move): m is Move => m.from.equals(move.from));
        this.player_moves[player].moves.push(move);
        try
        {
            this.update_action(player);
        }
        catch
        {
            this.player_moves[player].moves.pop();
            return "invalid";
        }
        return overrided.length > 0 ? "overridden" : "accepted";
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
            this.next(this._present.proceed(this.player_moves));
        }
    }

    next(game: GameRound): void
    {
        this.history.push(this._present);
        this._present = game;

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
    }

    player_name(player: Player): string
    {
        return this.player_names[player];
    }
}

class OnlineGameContext extends GameContext implements IOnlineGameContext
{
    player: Player = Player.P1;
    current_player_name: string = '';
    round_begin_time: Date = new Date();
    session_id: string | null = null;
    latest_game_id: string | null = null;
    current_game_id: string | null = null;
    // query_handle: number;
    _status: GameStatus = GameStatus.Ongoing;
    status_listeners: Function[] = [];
    loading_listeners: Function[] = [];
    session_listeners: ((session_id: string) => void)[] = [];
    move_listeners: (() => void)[] = [];

    _consumed_milliseconds: Players<number> = Players.map(() => 0);

    constructor()
    {
        super(Players.map(() => ''), GameRound.new_showcase());
        // this.query_handle = setInterval(() =>
        // {
        //     if (this.session_id)
        //     {
        //         query_match(this.session_id, this.query_session.bind(this));
        //     }
        // }, 2000);
    }

    get status(): GameStatus
    {
        return this._status;
    }

    new_session(player_name: string)
    {
        new_game(player_name, (session: string) =>
        {
            this.load_session(session, player_name);
            for (let listener of this.session_listeners)
            {
                listener(session);
            }
        });
    }

    load_session(session: string, player_name: string)
    {
        this.session_id = session;
        this.current_player_name = player_name;
        this.latest_game_id = null;
        this.current_game_id = null;
    }

    consumed_milliseconds(player: Player): number
    {
        return this._consumed_milliseconds[player];
    }

    on_new_status(listener: Function)
    {
        this.status_listeners.push(listener);
    }

    on_new_session(listener: (session_id: string) => void)
    {
        this.session_listeners.push(listener);
    }

    on_loading(listener: Function)
    {
        this.loading_listeners.push(listener);
    }

    on_move(listener: () => void)
    {
        this.move_listeners.push(listener);
    }

    prepare_move(player: Player, move: Move): "accepted" | "overridden" | "invalid"
    {
        if (this.player == player)
        {
            return super.prepare_move(player, move);
        }
        return "invalid";
    }

    make_move(): void
    {
        let move = this.move(this.player);
        if (this.current_game_id && move)
        {
            let milliseconds_consumed: number = new Date().getTime() - this.round_begin_time.getTime();
            submit_move(this.current_game_id, move, milliseconds_consumed, (_: string) =>
            {
                for (let listener of this.move_listeners)
                {
                    listener();
                }
            });
        }
    }

    // update_game()
    // {
    //     if (!this.latest_game_id)
    //     {
    //         return;
    //     }

    //     if (this.latest_game_id == this.current_game_id)
    //     {
    //         return;
    //     }

    //     for (let listener of this.loading_listeners)
    //     {
    //         listener();
    //     }

    //     fetch_game(this.latest_game_id, (serialized_game) =>
    //     {
    //         let [game_payload, game_id, game_status, player_name_map, player_time_map] = JSON.parse(serialized_game);
    //         console.log('loading game', game_id);

    //         if (this.current_game_id == game_id)
    //         {
    //             return;
    //         }

    //         this.current_game_id = game_id;

    //         let name_valid = false;
    //         for (let p in player_name_map)
    //         {
    //             let player = deserialize_player(p);
    //             let name = player_name_map[p];
    //             this.player_names[player] = name;

    //             if (this.current_player_name == name)
    //             {
    //                 this.player = player;
    //                 name_valid = true;
    //             }
    //         }

    //         if (!name_valid)
    //         {
    //             throw new Error("player name not found in game");
    //         }

    //         for (let p in player_time_map)
    //         {
    //             let player = deserialize_player(p);
    //             let consumed = player_time_map[p];
    //             this._consumed_milliseconds[player] = consumed;
    //         }

    //         this._status = game_status;
    //         let game = GameRound.deserialize(game_payload);
    //         this.next(game);
    //     });
    // }

    next(game: GameRound): void
    {
        this.round_begin_time = new Date();
        super.next(game);
    }

    // query_session(session_status: string)
    // {
    //     let status = JSON.parse(session_status);
    //     console.log('latest game:', status['latest']);
    //     this.latest_game_id = status['latest'];

    //     if (!this.latest_game_id)
    //     {
    //         return;
    //     }

    //     let updated = false;

    //     for (let player of Player.both())
    //     {
    //         let current_moved = this.player_moved[player];
    //         let moved = status['player_moved'][player];

    //         if (current_moved != moved)
    //         {
    //             this.player_moved[player] = moved;
    //             updated = true;
    //         }

    //         let current_time = this.consumed_milliseconds(player);
    //         let time = status['player_time'][player];
    //         if (current_time != time)
    //         {
    //             this._consumed_milliseconds[player] = time;
    //             updated = true;
    //         }
    //     }

    //     if (updated)
    //     {
    //         for (let listener of this.status_listeners)
    //         {
    //             listener();
    //         }
    //     }

    //     this.update_game();
    // }
}
