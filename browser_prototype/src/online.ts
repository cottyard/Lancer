interface IOnlineGame
{
    player: Player;
    status: OnlineGameStatus;
    is_playing(): boolean;
    is_in_queue(): boolean;
    is_finished(): boolean;
    is_not_started(): boolean;
    new_game(): void;
    submit_move(): void;
    set_name(name: string): void;
    has_moved(player: Player): boolean;
    consumed_milliseconds(player: Player): number;
}

enum OnlineGameStatus
{
    NotStarted,
    InQueue,
    WaitForPlayer,
    WaitForOpponent,
    Loading,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

class OnlineGame implements IOnlineGame
{
    round_begin_time = new Date();

    player_name: string = `player${Math.floor(10000 * Math.random())}`;
    private _status: OnlineGameStatus = OnlineGameStatus.NotStarted;

    session_id: string | null = null;
    latest_game_id: string | null = null;
    current_game_id: string | null = null;
    query_handle: number | null = null;

    constructor(
        public components: {
            game: IRenderableGame,
            action_panel: IActionPanel,
            status_bar: IStatusBar, 
            button_bar: IButtonBar
        })
    {}

    set_status(value: OnlineGameStatus)
    {
        if (this._status != value)
        {
            this._status = value;
            this.components.game.refresh();
        }

        if (value == OnlineGameStatus.InQueue)
        {
            this.current_game_id = null;
        }

        if ([OnlineGameStatus.WaitForPlayer,
             OnlineGameStatus.WonByPlayer1,
             OnlineGameStatus.WonByPlayer2, 
             OnlineGameStatus.Tied].indexOf(value) > -1)
        {
            this.round_begin_time = new Date();
            this.components.game.set_moves(this.components.game.context.player);
            this.components.game.show_present();
        }
    }

    status(): OnlineGameStatus
    {
        return this._status;
    }

    run()
    {
        this.start_query_game();
    }

    create_perfect(player: Player, ctor: UnitConstructor): Unit
    {
        let unit = new ctor(player, null);
        unit.perfect.as_list().forEach(s => {unit.endow(s);});
        return unit;
    }
    
    new_game()
    {
        let player_name = (<HTMLTextAreaElement>document.getElementById('player-name'))?.value;
        if (player_name && player_name != 'undefined')
        {
            this.player_name = player_name;
        }
        new_game(player_name, (session: string) => {
            console.log('new session:', session)
            this.session_id = session;
            this.set_status(OnlineGameStatus.InQueue);
        });
    }

    submit_move()
    {
        let move = this.components.game.move(this.components.game.context.player);
        if (this.current_game_id && move)
        {
            let milliseconds_consumed: number = new Date().getTime() - this.round_begin_time.getTime();
            submit_move(this.current_game_id, move, milliseconds_consumed, (_: string) => {
                this.set_status(OnlineGameStatus.WaitForOpponent);
            });
        }
    }

    start_query_game()
    {
        if (!this.query_handle)
        {
            this.query_handle = setInterval(this.query_and_update_game.bind(this), 2000);
        }
    }
    
    stop_query_game()
    {
        if (this.query_handle)
        {
            clearInterval(this.query_handle);
            this.query_handle = null;
        }
    }

    load_session(session: string, player_name: string)
    {
        this.session_id = session;
        this.player_name = player_name;
        this.set_status(OnlineGameStatus.InQueue);
    }

    query_and_update_game()
    {
        if (!this.session_id)
        {
            this._status = OnlineGameStatus.NotStarted;
            return;
        }

        query_match(this.session_id, (session_status: string) => {
            let status = JSON.parse(session_status);
            console.log('latest game:', status['latest']);
            this.latest_game_id = status['latest'];

            if (!this.latest_game_id)
            {
                this._status = OnlineGameStatus.InQueue;
                return;
            }

            let updated = false;

            for (let player of Player.both())
            {
                let current_moved = this.player_moved.get(player);
                let moved = status['player_moved'][player];

                if (current_moved != moved)
                {
                    this.player_moved.set(player, moved);
                    updated = true;
                }

                let current_time = this.player_consumed_milliseconds.get(player);
                let time = status['player_time'][player];
                if (current_time != time)
                {
                    this.player_consumed_milliseconds.set(player, time);
                    updated = true;
                }
            }

            if (updated)
            {
                this.status_bar.render();
            }
            this.update_game();
        });
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

        this.set_status(OnlineGameStatus.Loading);

        fetch_game(this.latest_game_id, (serialized_game) => {
            let game_payload: string;
            let game_id: string;
            let game_status: number;
            let player_name_map: any;
            let player_time_map: any;
            let round_count: number;
            let player_supply_map: any;
            let board_payload: string;
            let player_actions: string[];
            let victims: [string, number][];

            [game_payload, game_id, game_status, player_name_map, player_time_map] = JSON.parse(serialized_game);
            console.log('loading game', game_id);
            [round_count, player_supply_map, board_payload, player_actions, victims] = JSON.parse(game_payload);
            
            if (this.current_game_id == game_id)
            {
                return;
            }

            this.current_game_id = game_id;
            
            this.round_count = round_count;

            let player_name_check = false;
            for (let p in player_name_map)
            {
                let player = deserialize_player(p);
                let name = player_name_map[p];
                if (name == this.player_name)
                {
                    this.update_player(player);
                    player_name_check = true;
                }
                this.player_names.set(player, name);
            }

            for (let p in player_time_map)
            {
                let player = deserialize_player(p);
                let consumed = player_time_map[p];
                this.player_consumed_milliseconds.set(player, consumed);
            }

            if (!player_name_check)
            {
                this.set_status(OnlineGameStatus.NotStarted);
                throw new Error(`Player name ${this.player_name} not found in ${player_name_map}`);
            }
            
            this.last_round_actions = [];
            for (let player_action_payload of player_actions)
            {
                let player_action = PlayerAction.deserialize(player_action_payload);
                this.last_round_actions.push(player_action);
            }

            for (let player in player_supply_map)
            {
                this.supplies.set(deserialize_player(player), player_supply_map[player]);
            }

            this.last_round_victims = [];
            this.last_round_trophy = [];
            for (let [victim, trophy] of victims)
            {
                let coord = Coordinate.deserialize(victim);
                this.last_round_victims.push(coord);
                this.last_round_trophy.push(trophy);
            }

            this.last_round_board = this.board;
            this.board = <SerializableBoard<Unit>>create_serializable_board_ctor(UnitConstructor).deserialize(board_payload);
            
            switch (game_status)
            {
                case 1:
                    this.set_status(OnlineGameStatus.WonByPlayer1);
                    break;
                case 2:
                    this.set_status(OnlineGameStatus.WonByPlayer2);
                    break;
                case 3:
                    this.set_status(OnlineGameStatus.Tied);
                    break;
                default:
                    this.set_status(OnlineGameStatus.WaitForPlayer);
            }
        });
    }

    is_playing(): boolean
    {
        return [
            OnlineGameStatus.WaitForOpponent,
            OnlineGameStatus.WaitForPlayer,
            OnlineGameStatus.Loading,
        ].indexOf(this.status()) > -1;
    }

    is_in_queue(): boolean
    {
        return this.status() == OnlineGameStatus.InQueue;
    }
    
    is_finished(): boolean
    {
        return [
            OnlineGameStatus.WonByPlayer1, 
            OnlineGameStatus.WonByPlayer2, 
            OnlineGameStatus.Tied
        ].indexOf(this.status()) > -1;
    }

    is_not_started(): boolean
    {
        return this.status() == OnlineGameStatus.NotStarted;
    }
}