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

    constructor()
    {
        g.initialize();

        this.canvas = new GameCanvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'));
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
        this.board = new Board<Unit>(() => null);

        this.canvas.paint_background();
    }

    render_indicators(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx);
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

        // TODO: highlight first movers/attackers
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
        set_out(this.board);

        let man = new Spearman(Player.P1, <BasicUnit>this.board.at(new Coordinate(1,7)));
        man.endow(new Skill(0, -2));
        this.board.put(new Coordinate(1,2), man);
        let man2 = new Swordsman(Player.P1, <BasicUnit>this.board.at(new Coordinate(1,7)));
        man2.endow(new Skill(1, -1));
        this.board.put(new Coordinate(2,2), man2);
        let lancer = new Lancer(Player.P1, <BasicUnit>this.board.at(new Coordinate(3,8)));
        lancer.endow(new Skill(0, -2));
        lancer.endow(new Skill(0, 2));
        lancer.endow(new Skill(-2, 0));
        lancer.endow(new Skill(2, 0));
        this.board.put(new Coordinate(3,2), lancer);
        let knight = new Knight(Player.P1, <BasicUnit>this.board.at(new Coordinate(3,8)));
        knight.endow(new Skill(1, -1));
        this.board.put(new Coordinate(4,2), knight);
        this.board.remove(new Coordinate(0, 8));
        this.board.remove(new Coordinate(1, 8));
        this.board.remove(new Coordinate(2, 8));
        this.board.remove(new Coordinate(3, 8));

        this.board.iterate_units((unit, coord) => {
            this.canvas.paint_unit(CanvasUnitFactory(unit), coord)
        });

        this.action_panel.render();
        this.status_bar.render();
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

