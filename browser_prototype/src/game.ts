class Game
{
    canvas: GameCanvas;
    action_panel: ActionPanel;
    status_bar: StatusBar;

    current: Coordinate | null = null;
    selected: Coordinate | null = null;
    options_capable: Coordinate[] = [];
    options_upgrade: Coordinate[] = [];

    player: Player = Player.P1;
    player_move: PlayerMove = new PlayerMove(this.player);
    player_action: PlayerAction = new PlayerAction(this.player);

    board: Board<Unit>;
    player_name: string = `player${Math.floor(10000 * Math.random())}`;
    player_name_map: Map<Player, string> = new Map<Player, string>();
    player_supply_map: Map<Player, number> = new Map<Player, number>();

    session_id: string | null = null;
    latest_game_id: string | null = null;
    current_game_id: string | null = null;
    query_handle: number | null = null;

    supply_wagon = 2
    supply_basic_incremental = 16

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
        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        this.board = new board_ctor();
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
    
    render_heat(): void
    {
        let heatmap = new Board<Heat>(() => new Heat());

        this.board.iterate_units((unit, coord) => {
            for (let c of Rule.reachable_by_unit(this.board, coord))
            {
                console.log(c);
                heatmap.at(c)?.heatup(unit.owner);
            }
        });

        heatmap.iterate_units((heat, coord) => {
            console.log(heat)
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
        let unit = this.board.at(coord);
        if (unit && unit.owner != this.player)
        {
            return;
        }
        this.selected = coord;
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
        this.render_indicators();
    }

    update_options(coord: Coordinate)
    {
        this.options_capable = Rule.reachable_by_unit(this.board, coord);
        this.options_upgrade = Rule.upgradable_by_unit(this.board, coord);
    }

    run()
    {
        let man = new Spearman(Player.P1, <BasicUnit>this.board.at(new Coordinate(1,7)));
        man.endow(new Skill(0, -2));
        this.board.put(new Coordinate(1,2), man);
        let man2 = new Swordsman(Player.P1, <BasicUnit>this.board.at(new Coordinate(1,7)));
        man2.perfect.as_list().forEach(s => {man2.endow(s);});
        this.board.put(new Coordinate(2,2), man2);
        let man3 = new Warrior(Player.P1, <BasicUnit>this.board.at(new Coordinate(0,7)));
        man3.endow(new Skill(0, -2));
        this.board.put(new Coordinate(0,2), man3);
        let lancer = new Lancer(Player.P1, <BasicUnit>this.board.at(new Coordinate(3,8)));
        lancer.perfect.as_list().forEach(s => {lancer.endow(s);});
        this.board.put(new Coordinate(3,2), lancer);
        let knight = new Knight(Player.P1, <BasicUnit>this.board.at(new Coordinate(3,8)));
        knight.endow(new Skill(1, -1));
        this.board.put(new Coordinate(4,2), knight);
        this.board.remove(new Coordinate(0, 8));
        this.board.remove(new Coordinate(1, 8));
        this.board.remove(new Coordinate(2, 8));
        this.board.remove(new Coordinate(3, 8));
        set_out(this.board);
        this.update_board(this.board);
        this.render_heat();
        this.canvas.paint_background();
        this.action_panel.render();
        this.status_bar.render();
    }

    new_game()
    {
        let player_name = (<HTMLTextAreaElement>document.getElementById('player-name'))?.value;
        if (player_name)
        {
            this.player_name = player_name;
        }
        new_game(player_name, (session: string) => {
            console.log('session:', session)
            this.session_id = session;
            this.start_query_game();
        });
    }

    submit_move()
    {
        if (this.current_game_id && this.player_move)
        {
            console.log('submitting', this.player_move.serialize());
            submit_move(this.current_game_id, this.player_move, (res: string) => {
                console.log('submit:', res)
                this.start_query_game();
            });
        }
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

    start_query_game()
    {
        if (!this.query_handle)
        {
            this.query_handle = setInterval(this.update_game.bind(this), 2000);
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
        this.player_action = new PlayerAction(player);
    }

    update_game()
    {
        if (this.session_id)
        {
            query_match(this.session_id, (game_id: string) => {
                console.log('latest game:', game_id)
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
                    let brief: string;

                    [game_payload, game_id, game_status, player_name_map, brief] = JSON.parse(serialized_game);
                    console.log('loading game', game_id)
                    console.log(brief)

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
                        this.player_name_map.set(player, name);
                    }

                    if (!player_name_check)
                    {
                        throw new Error(`Player name ${this.player_name} not found in ${player_name_map}`);
                    }

                    this.current_game_id = game_id;

                    this.player_move.moves = [];
                    this.update_player_action();

                    let round_count: number;
                    let player_supply_map: any;
                    let board_payload: string;
                    [round_count, player_supply_map, board_payload] = JSON.parse(game_payload);

                    for (let player in player_supply_map)
                    {
                        this.player_supply_map.set(deserialize_player(player), player_supply_map[player]);
                    }

                    this.update_board(<SerializableBoard<Unit>>create_serializable_board_ctor(UnitConstructor).deserialize(board_payload));
                    this.status_bar.render();
                    this.stop_query_game();
                });
            }
        }
    }

    get_player_name(player: Player): string | undefined {
        return this.player_name_map.get(player);
    }

    get_player_supply(player: Player): number | undefined {
        return this.player_supply_map.get(player);
    }

    get_player_supply_income(player: Player): number {
        return Rule.count_unit(this.board, player, Wagon) * this.supply_wagon + this.supply_basic_incremental;
    }
}

class Heat
{
    map = new Map<Player, number>([[Player.P1, 0], [Player.P2, 0]]);
    heatup(player: Player)
    {
        this.map.set(player, this.map.get(player)! + 1);
    }

    get(player: Player): number
    {
        return this.map.get(player)!;
    }
}