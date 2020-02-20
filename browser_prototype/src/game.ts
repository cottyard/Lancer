class Game
{
    canvas: GameCanvas;
    action_panel: ActionPanel;
    status_bar: StatusBar;

    current: Coordinate | null = null;
    selected: Coordinate | null = null;
    options_capable: Coordinate[] = [];
    options_upgrade: Coordinate[] = [];

    player_move: PlayerMove;
    player_action: PlayerAction;
    player: Player;
    board: Board<Unit>;

    player_name: string | null = null;
    session_id: string | null = null;
    latest_game_id: string | null = null;
    current_game_id: string | null = null;

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

        this.canvas.animate.addEventListener("mousedown", this.on_mouse_down.bind(this));
        this.canvas.animate.addEventListener("mouseup", this.on_mouse_up.bind(this));
        this.canvas.animate.addEventListener("mousemove", this.on_mouse_move.bind(this));
        // this.canvas.animate.addEventListener("touchstart",  this.on_mouse_down.bind(this));
        // this.canvas.animate.addEventListener("touchmove", this.on_mouse_move.bind(this));
        // this.canvas.animate.addEventListener("touchend", this.on_mouse_up.bind(this));

        this.player = Player.P1;
        this.player_move = new PlayerMove(this.player);
        this.player_action = new PlayerAction(this.player, []);

        let board_ctor = create_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        this.board = new board_ctor();

        this.canvas.paint_background();

        setInterval(this.update_game.bind(this), 2000);
    }

    render_indicators(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx);
        this.canvas.clear_canvas(this.canvas.am_ctx_t);

        for (let option of this.options_upgrade)
        {
            this.canvas.paint_indicator(option, g.const.STYLE_CYAN, 2);
        }
        for (let option of this.options_capable)
        {
            this.canvas.paint_indicator(option);
        }
        if (this.current)
        {
            this.canvas.paint_indicator(this.current);
        }
        if (this.selected)
        {
            this.canvas.paint_indicator(this.selected);
        }

        if (this.player_action)
        {
            this.canvas.paint_actions(this.player_action, this.board);
        }
    }

    get_coordinate(event: MouseEvent): Coordinate
    {
        let rect = this.canvas.background.getBoundingClientRect();
        let mouse_x = event.clientX - rect.left - g.settings.cvs_border_width;
        let mouse_y = event.clientY - rect.top - g.settings.cvs_border_width;

        return GameCanvas.to_coordinate(mouse_x, mouse_y);
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
        this.selected = this.get_coordinate(event);
    }
    
    on_mouse_up(event: MouseEvent): void
    {
        this.current = this.get_coordinate(event);
        if (this.selected)
        {
            let selected = this.selected;
            this.player_move.moves = this.player_move.moves.filter(
                (move) => !move.from.equals(selected));

            this.player_move.append(new Move(this.selected, this.current));

            try
            {
                this.update_player_action();
            }
            catch (e)
            {
                console.log(e);
                this.player_move.pop();
                this.update_player_action();
            }
        }
        this.selected = null;
        this.update_options(this.current);
        this.render_indicators();
    }

    update_player_action()
    {
        this.player_action = Rule.validate_player_move(this.board, this.player_move);
        this.action_panel.render();
        this.status_bar.render();
    }

    update_options(coord: Coordinate)
    {
        this.options_capable = [];
        this.options_upgrade = [];
        let unit = this.board.at(coord);
        if (!unit || unit.owner != this.player)
        {
            return;
        }
        for (let skill of unit.current.as_list())
        {
            let option = coord.add(skill.x, skill.y);
            if (option)
            {
                this.options_capable.push(option);
            }
        }
        for (let skill of unit.potential().as_list())
        {
            let option = coord.add(skill.x, skill.y);
            if (option)
            {
                this.options_upgrade.push(option);
            }
        }
    }

    run()
    {
        //set_out(this.board);
        //console.log('standard', create_board_ctor(UnitConstructor).deserialize(this.board.serialize()).serialize());
        
        //this.action_panel.render();
        this.status_bar.render();
    }

    new_match()
    {
        let player_name = (<HTMLTextAreaElement>document.getElementById('player-name'))?.value;
        if (player_name)
        {
            this.player_name = player_name;
        }
        new_match(player_name, (session: string) => {
            console.log('session', session)
            this.session_id = session;
        });
    }

    update_board(board: Board<Unit>)
    {
        this.board = board;
        if (this.board)
        {
            this.canvas.clear_canvas(this.canvas.st_ctx);
            this.board.iterate_units((unit, coord) => {
                this.canvas.paint_unit(CanvasUnitFactory(unit), coord)
            });
        }
    }

    update_game()
    {
        if (this.session_id)
        {
            query_match(this.session_id, (game_id: string) => {
                console.log('game', game_id)
                this.latest_game_id = game_id;
            });
        }

        if (this.latest_game_id)
        {
            if (this.latest_game_id != this.current_game_id)
            {
                fetch_game(this.latest_game_id, (serialized_game) => {
                    let game_payload: string;
                    let game_id: string;
                    let game_status: number;
                    let player_name_map: any;

                    [game_payload, game_id, game_status, player_name_map] = JSON.parse(serialized_game);
                    console.log(game_payload)
                    console.log(game_id)
                    console.log(game_status)
                    console.log(player_name_map)

                    this.current_game_id = game_id;

                    let round_count: number;
                    let supply: any;
                    let board_payload: string;
                    [round_count, supply, board_payload] = JSON.parse(game_payload);

                    this.update_board(<Board<Unit>>create_board_ctor(UnitConstructor).deserialize(board_payload));
                    console.log(this.board);
                });

            }
        }
    }

    get_player_name(player: Player): string {
        // TODO: placeholder
        return player === Player.P1 ? "zc" : "xyt";
    }

    get_player_supply(player: Player): number {
        // TODO: placeholder
        return 20 + player;
    }

    get_player_supply_income(player: Player): number {
        // TODO: placeholder
        return 18 + player;
    }
}

