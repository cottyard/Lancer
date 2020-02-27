enum GameStatus
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

enum DisplayActionType
{
    Upgrade = 1,
    Defend = 2,
    Move = 3,
    Attack = 4,
    Recruit = 5,
    MoveAssist = 6,
    AttackAssist = 7
}

class DisplayAction
{
    constructor(public type: DisplayActionType, public action: Action)
    {
    }
}

class DisplayPlayerAction
{
    player: Player;
    actions: DisplayAction[];

    constructor(player_action: PlayerAction)
    {
        this.player = player_action.player;

        let first_arriver = new HashMap<Coordinate, true>();
        this.actions = player_action.actions.map((a: Action) =>
        {
            let type = <DisplayActionType><unknown>a.type;
            if (a.type == ActionType.Attack || a.type == ActionType.Move)
            {
                let arriver = first_arriver.get(a.move.to);
                first_arriver.put(a.move.to, true);
                let is_first = !arriver;
                if (!is_first)
                {
                    if (a.type == ActionType.Attack)
                    {
                        type = DisplayActionType.AttackAssist;
                    }
                    else
                    {
                        type = DisplayActionType.MoveAssist;
                    }
                }
            }
            return new DisplayAction(type, a);
        });
    }
}

class Game
{
    canvas: GameCanvas;
    action_panel: ActionPanel;
    status_bar: StatusBar;
    button_bar: ButtonBar;
    player_moved = new Map<Player, boolean>();
    player_consumed_milliseconds = new Map<Player, number>();
    round_begin_time = new Date();

    current: Coordinate | null = null;
    selected: Coordinate | null = null;
    options_capable: Coordinate[] = [];
    options_upgrade: Coordinate[] = [];
    show_heat: boolean = false;
    show_threats: boolean = true;

    player: Player = Player.P1;
    _board: Board<Unit>;
    buff_board: FullBoard<Buff>;
    last_round_board: Board<Unit> | null = null;
    _displaying_board: Board<Unit>;
    heat_board: FullBoard<Heat>;
    private _show_last_round: boolean = false;

    player_name: string = `player${Math.floor(10000 * Math.random())}`;
    player_names: Map<Player, string> = new Map<Player, string>();
    supplies: Map<Player, number> = new Map<Player, number>();
    private _status: GameStatus = GameStatus.NotStarted;
    last_round_actions: PlayerAction[] = [];
    last_round_victims: Coordinate[] = [];
    last_round_trophy: number[] = [];
    displaying_actions: PlayerAction[] = [];
    round_count = 0;

    player_move: PlayerMove = new PlayerMove(this.player);
    player_action: [PlayerAction] = [new PlayerAction(this.player)];

    session_id: string | null = null;
    latest_game_id: string | null = null;
    current_game_id: string | null = null;
    query_handle: number | null = null;

    supply_wagon = 2
    supply_basic_incremental = 20

    constructor()
    {
        g.initialize();

        this.canvas = new GameCanvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'),
            <HTMLCanvasElement>document.getElementById('animate-transparent'));
        this.action_panel = new ActionPanel(
            <HTMLDivElement>document.getElementById('action-panel'),
            this);
        this.status_bar = new StatusBar(
            <HTMLDivElement>document.getElementById('status-bar'),
            this);
        this.button_bar = new ButtonBar(
            <HTMLDivElement>document.getElementById('button-bar'),
            this);

        this.canvas.animate.addEventListener("mousedown", this.on_mouse_down.bind(this));
        this.canvas.animate.addEventListener("mouseup", this.on_mouse_up.bind(this));
        this.canvas.animate.addEventListener("mousemove", this.on_mouse_move.bind(this));
        this.canvas.animate.addEventListener("mouseleave", this.clear_grid_incicators.bind(this));
        this.canvas.animate.addEventListener("touchstart",  this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchmove", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchend", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchleave", this.clear_grid_incicators.bind(this));

        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        this._displaying_board = this._board = new board_ctor();
        this.buff_board = new FullBoard<Buff>(() => new Buff());
        this.heat_board = new FullBoard<Heat>(() => new Heat());
    }

    set status(value: GameStatus)
    {
        if (this._status != value)
        {
            this._status = value;
            this.render_indicators();
            this.status_bar.render();
            this.button_bar.render();
        }

        if (value == GameStatus.InQueue)
        {
            this.current_game_id = null;
        }

        if ([GameStatus.WaitForPlayer,
             GameStatus.WonByPlayer1,
             GameStatus.WonByPlayer2, 
             GameStatus.Tied].indexOf(value) > -1)
        {
            this.round_begin_time = new Date();
            this.player_move.moves = [];
            this.update_player_action();
            this.show_last_round = false;
        }
    }

    get status()
    {
        return this._status;
    }

    set displaying_board(value: Board<Unit>)
    {
        this._displaying_board = value;
        this.heat_board = Rule.get_heat(value);
    }

    get displaying_board()
    {
        return this._displaying_board;
    }

    set board(value: Board<Unit>)
    {
        this._board = value;
        if (value)
        {
            this.buff_board = Rule.get_buff(value);
        }
    }

    get board(): Board<Unit>
    {
        return this._board;
    }

    set show_last_round(value: boolean)
    {
        if (value && this.last_round_board)
        {
            this._show_last_round = true;
            this.displaying_board = this.last_round_board;
            this.displaying_actions = this.last_round_actions;
            this.render_board();
            this.render_indicators();
        }
        else if (!value)
        {
            this._show_last_round = false;
            this.displaying_board = this.board;
            this.displaying_actions = this.player_action;
            this.render_board();
            this.render_indicators();
        }
    }

    get show_last_round()
    {
        return this._show_last_round;
    }

    get_action_cost(): number
    {
        if (this.buff_board)
        {
            return this.player_action[0].cost(this.buff_board);
        }
        return 0;
    }

    render_indicators(): void
    {
        this.clear_animate();

        for (let option of this.options_upgrade)
        {
            this.canvas.paint_grid_indicator(option, g.const.STYLE_CYAN, 2);
        }
        for (let option of this.options_capable)
        {
            this.canvas.paint_grid_indicator(option);
        }
        if (this.current)
        {
            this.canvas.paint_grid_indicator(this.current);
        }
        if (this.selected)
        {
            this.canvas.paint_grid_indicator(this.selected);
        }
        for (let player_action of this.displaying_actions)
        {
            this.canvas.paint_actions(new DisplayPlayerAction(player_action), this.displaying_board);
        }
        if (this.show_heat)
        {
            this.render_heat();
        }
        if (this.show_last_round)
        {
            for (let i in this.last_round_victims)
            {
                this.canvas.paint_victim_indicator(this.last_round_victims[i], this.last_round_trophy[i]);
            }
        }
        this.action_panel.render();
    }

    clear_grid_incicators(): void
    {
        this.current = null;
        this.selected = null;
        this.show_threats = true;
        this.options_capable = [];
        this.options_upgrade = [];
        this.render_indicators();
    }

    clear_animate(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx);
        this.canvas.clear_canvas(this.canvas.am_ctx_t);
    }
    
    render_heat(): void
    {
        this.heat_board.iterate_units((heat, coord) => {
            this.canvas.paint_heat(coord, heat);
        });
    }

    get_coordinate(event: MouseEvent): Coordinate
    {
        let rect = this.canvas.background.getBoundingClientRect();
        let mouse_x = event.clientX - rect.left - g.settings.cvs_border_width;
        let mouse_y = event.clientY - rect.top - g.settings.cvs_border_width;

        return GameCanvas.to_coordinate(mouse_x, mouse_y);
    }

    on_touch(event: TouchEvent)
    {
        let touches = event.changedTouches;
        let first = touches[0];
        let type = ""

        switch (event.type)
        {
            case "touchstart":
                type = "mousedown";
                break;
            case "touchmove":
                type = "mousemove";
                break;
            case "touchend":
                type = "mouseup";
                break;
        }

        let simulated = document.createEvent("MouseEvent");
        simulated.initMouseEvent(
            type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0, null);

        first.target.dispatchEvent(simulated);
        event.preventDefault();
    }

    on_mouse_move(event: MouseEvent): void
    {
        let coord = this.get_coordinate(event);

        if (!this.current?.equals(coord))
        {
            this.current = coord;
            if (!this.selected)
            {
                this.update_options(coord);
            }
            this.render_indicators();
        }
    }

    on_mouse_down(event: MouseEvent): void
    {
        let coord = this.get_coordinate(event);
        this.selected = coord;
        this.show_threats = false;
        this.update_options(coord);
        this.render_indicators();
    }
    
    on_mouse_up(event: MouseEvent): void
    {
        this.current = this.get_coordinate(event);
        if (this.selected && !this.show_last_round)
        {
            let selected = this.selected;

            this.player_move.moves = this.player_move.moves.filter(
                (move) => !move.from.equals(selected)
            );

            this.player_move.append(new Move(this.selected, this.current));

            try
            {
                this.update_player_action();
            }
            catch (e)
            {
                this.player_move.pop();
                this.update_player_action();
            }
        }
        this.selected = null;
        this.show_threats = true;
        this.update_options(this.current);
        this.render_indicators();
    }

    update_player_action()
    {
        this.player_action[0] = Rule.validate_player_move(this.board, this.player_move);
        this.player_action[0].actions.sort((a1, a2) => a2.type - a1.type);
        this.render_indicators();
        this.status_bar.render();
        this.button_bar.render();
    }

    update_options(coord: Coordinate)
    {
        if (this.show_threats)
        {
            this.options_capable = Rule.able_to_reach(this.displaying_board, coord);
            this.options_upgrade = [];
        }
        else
        {
            this.options_capable = Rule.reachable_by(this.displaying_board, coord);
            this.options_upgrade = Rule.upgradable_by(this.displaying_board, coord);
        }
    }

    run()
    {
        this.canvas.paint_background();

        let random_unit = g.all_unit_types[Math.floor(Math.random() * g.all_unit_types.length)];

        let lancer = new random_unit(Player.P1, <BasicUnit>this.displaying_board.at(new Coordinate(1,7)));
        lancer.perfect.as_list().forEach(s => {lancer.endow(s);});
        this.displaying_board.put(new Coordinate(4,4), lancer);
        
        this.render_board();
        this.render_indicators();
        this.status_bar.render();
        this.button_bar.render();

        this.start_query_game();
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
            this.status = GameStatus.InQueue;
        });
    }

    submit_move()
    {
        if (this.current_game_id && this.player_move)
        {
            let milliseconds_consumed: number = new Date().getTime() - this.round_begin_time.getTime();
            submit_move(this.current_game_id, this.player_move, milliseconds_consumed, (_: string) => {
                this.status = GameStatus.WaitForOpponent;
            });
        }
    }

    render_board()
    {
        this.canvas.clear_canvas(this.canvas.st_ctx);
        this.displaying_board.iterate_units((unit, coord) => {
            this.canvas.paint_unit(CanvasUnitFactory(unit), coord)
        });
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

    update_player(player: Player)
    {
        this.player = player;
        this.player_move = new PlayerMove(player);
        this.player_action[0] = new PlayerAction(player);
    }

    load_session(session: string, player_name: string)
    {
        this.session_id = session;
        this.player_name = player_name;
        this.status = GameStatus.InQueue;
    }


    query_and_update_game()
    {
        if (!this.session_id)
        {
            this._status = GameStatus.NotStarted;
            return;
        }

        query_match(this.session_id, (session_status: string) => {
            let status = JSON.parse(session_status);
            console.log('latest game:', status['latest']);
            this.latest_game_id = status['latest'];

            if (!this.latest_game_id)
            {
                this._status = GameStatus.InQueue;
                return;
            }

            let updated = false;
            [Player.P1, Player.P2].forEach((player) =>
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
            });

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

        this.status = GameStatus.Loading;

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
                this.status = GameStatus.NotStarted;
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
                    this.status = GameStatus.WonByPlayer1;
                    break;
                case 2:
                    this.status = GameStatus.WonByPlayer2;
                    break;
                case 3:
                    this.status = GameStatus.Tied;
                    break;
                default:
                    this.status = GameStatus.WaitForPlayer;
            }
        });
    }

    is_playing(): boolean
    {
        return [
            GameStatus.WaitForOpponent,
            GameStatus.WaitForPlayer,
            GameStatus.Loading,
        ].indexOf(this.status) > -1;
    }

    is_in_queue(): boolean
    {
        return this.status == GameStatus.InQueue;
    }
    
    is_finished(): boolean
    {
        return [
            GameStatus.WonByPlayer1, 
            GameStatus.WonByPlayer2, 
            GameStatus.Tied
        ].indexOf(this.status) > -1;
    }

    is_not_started(): boolean
    {
        return this.status == GameStatus.NotStarted;
    }

    get_player_name(player: Player): string | undefined {
        return this.player_names.get(player);
    }

    get_player_supply(player: Player): number | undefined {
        return this.supplies.get(player);
    }

    get_player_supply_income(player: Player): number {
        return Rule.count_unit(this.board, player, Wagon) * this.supply_wagon + this.supply_basic_incremental;
    }
}