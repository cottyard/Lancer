import { Player, PlayerData, PlayerAction, Move, PlayerMove, opponent, deserialize_player } from '../core/entity';
import { Game, GameStatus } from '../core/game';
import { Rule } from '../core/rule';
import { new_game, submit_move, query_match, fetch_game } from '../client/net';

interface IGameContext
{
    last: Game | null;
    present: Game;
    actions: PlayerData<PlayerAction>;
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
    protected history: Game[] = [];
    protected listeners: Function[] = [];

    readonly player_moved: PlayerData<boolean> = {
        [Player.P1]: false,
        [Player.P2]: false,
    };

    readonly player_moves: PlayerData<PlayerMove> = {
        [Player.P1]: new PlayerMove(Player.P1),
        [Player.P2]: new PlayerMove(Player.P2),
    };

    readonly player_actions: PlayerData<PlayerAction> = {
        [Player.P1]: new PlayerAction(Player.P1),
        [Player.P2]: new PlayerAction(Player.P2),
    };

    constructor(protected player_names: PlayerData<string>, protected _present: Game)
    {
    }

    get status(): GameStatus
    {
        return this.present.status();
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

    get actions(): PlayerData<PlayerAction>
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
        return this.player_actions[player].cost(this._present.board.buff);
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
            this.next(this._present.make_move(this.player_moves));
        }
    }

    next(game: Game): void
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
    query_handle: number;
    _status: GameStatus = GameStatus.Ongoing;
    status_listeners: Function[] = [];
    loading_listeners: Function[] = [];
    session_listeners: ((session_id: string) => void)[] = [];
    move_listeners: (() => void)[] = [];

    _consumed_milliseconds: PlayerData<number> = PlayerData.empty(() => 0);

    constructor()
    {
        super(PlayerData.empty(() => ''), Game.new_showcase());
        this.query_handle = window.setInterval(() =>
        {
            if (this.session_id)
            {
                query_match(this.session_id, this.query_session.bind(this));
            }
        }, 2000);
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

    update_game()
    {
        if (!this.latest_game_id)
        {
            return;
        }

        if (this.latest_game_id == this.current_game_id)
        {
            return;
        }

        for (let listener of this.loading_listeners)
        {
            listener();
        }

        fetch_game(this.latest_game_id, (serialized_game) =>
        {
            let [game_payload, game_id, game_status, player_name_map, player_time_map] = JSON.parse(serialized_game);
            console.log('loading game', game_id);

            if (this.current_game_id == game_id)
            {
                return;
            }

            this.current_game_id = game_id;

            let name_valid = false;
            for (let p in player_name_map)
            {
                let player = deserialize_player(p);
                let name = player_name_map[p];
                this.player_names[player] = name;

                if (this.current_player_name == name)
                {
                    this.player = player;
                    name_valid = true;
                }
            }

            if (!name_valid)
            {
                throw new Error("player name not found in game");
            }

            for (let p in player_time_map)
            {
                let player = deserialize_player(p);
                let consumed = player_time_map[p];
                this._consumed_milliseconds[player] = consumed;
            }

            this._status = game_status;
            let game = Game.deserialize(game_payload);
            this.next(game);
        });
    }

    next(game: Game): void
    {
        this.round_begin_time = new Date();
        super.next(game);
    }

    query_session(session_status: string)
    {
        let status = JSON.parse(session_status);
        console.log('latest game:', status['latest']);
        this.latest_game_id = status['latest'];

        if (!this.latest_game_id)
        {
            return;
        }

        let updated = false;

        for (let player of Player.both())
        {
            let current_moved = this.player_moved[player];
            let moved = status['player_moved'][player];

            if (current_moved != moved)
            {
                this.player_moved[player] = moved;
                updated = true;
            }

            let current_time = this.consumed_milliseconds(player);
            let time = status['player_time'][player];
            if (current_time != time)
            {
                this._consumed_milliseconds[player] = time;
                updated = true;
            }
        }

        if (updated)
        {
            for (let listener of this.status_listeners)
            {
                listener();
            }
        }

        this.update_game();
    }
}

export { OnlineGameContext, IOnlineGameContext, GameContext, IGameContext };