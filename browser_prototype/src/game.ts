class Game
{
    canvas: GameCanvas;
    bounding_rectangle: DOMRect;

    current: Coordinate | null = null;
    selected: Coordinate | null = null;

    player_move: PlayerMove;
    player_action: PlayerAction;
    player: Player;
    board: Board<Unit>;

    constructor()
    {
        g.initialize();
        this.initialize();
    }

    initialize()
    {
        this.canvas = new GameCanvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'));

        this.canvas.animate.addEventListener("mousedown", this.on_mouse_down.bind(this));
        this.canvas.animate.addEventListener("mouseup", this.on_mouse_up.bind(this));
        this.canvas.animate.addEventListener("mousemove", this.on_mouse_move.bind(this));
        this.canvas.animate.addEventListener("touchstart", this.on_mouse_down.bind(this));
        this.canvas.animate.addEventListener("touchmove", this.on_mouse_move.bind(this));
        this.canvas.animate.addEventListener("touchend", this.on_mouse_up.bind(this));

        this.player = Player.P1;
        this.player_move = new PlayerMove(this.player);

        this.board = new Board<Unit>(() => null);

        this.canvas.paint_background();
    }

    render_indicators(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx);
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
            this.canvas.paint_actions(this.player_action.actions);
            console.log('Total cost:', this.player_action.cost());
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
            this.render_indicators();
        }
    }

    on_mouse_down(event: MouseEvent): void
    {
        if (this.current)
        {
            this.selected = this.current.copy();
        }
    }
    
    on_mouse_up(event: MouseEvent): void
    {
        if (this.selected && this.current)
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
        this.render_indicators();
    }

    update_player_action()
    {
        this.player_action = Rule.validate_player_move(this.board, this.player_move);
    }

    run()
    {
        set_out(this.board);

        this.board.iterate_units((unit, coord) => {
            let canvas_unit = CanvasUnitFactory(unit);
            canvas_unit.paint(this.canvas.st_ctx, GameCanvas.get_grid_center(coord));
        });
    }
}

