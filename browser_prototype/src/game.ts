class Game
{
    canvas: GameCanvas;
    bounding_rectangle: DOMRect;

    current: Coordinate | null = null;
    selected: Coordinate | null = null;

    player_move: PlayerMove;
    player: Player;

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

        // this.canvas.animate.addEventListener("touchstart", on_touch);
        // this.canvas.animate.addEventListener("touchmove", on_touch);
        // this.canvas.animate.addEventListener("touchend", on_touch);
        this.player = Player.P1;
        this.player_move = new PlayerMove(this.player);
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

        for (let move of this.player_move.moves)
        {
            using(new Renderer(this.canvas.am_ctx), (renderer) => {
                renderer.arrow(
                    GameCanvas.get_grid_center(move.from),
                    GameCanvas.get_grid_center(move.to),
                    g.const.STYLE_BLACK,
                    g.settings.grid_size / 2 - 5);
            });
        }
    }

    get_coordinate(event: MouseEvent): Coordinate
    {
        let rect = this.canvas.background.getBoundingClientRect();
        let mouse_x = event.clientX - rect.left - g.settings.cvs_border_width;
        let mouse_y = event.clientY - rect.top - g.settings.cvs_border_width;

        return new Coordinate(this.to_coord(mouse_x), this.to_coord(mouse_y));
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
            this.player_move.append(
                new Move(this.selected, this.current)
            );
            this.render_indicators();
        }
        this.selected = null;
    }

    to_coord = function(pixel: number): number
    { 
        let coord = Math.floor(pixel / g.settings.grid_size);
        if (coord < 0) { return 0 };
        if (coord >= g.grid_count ) { return g.grid_count - 1 };
        return coord;
    }

    run()
    {
        this.canvas.paint_background();
        
        let grid_size = g.settings.grid_size;
        let grids = g.grid_count;

        let board = new Board<Unit>(() => null);
        set_out(board);

        board.iterate_units((unit, coord) => {
            let canvas_unit = CanvasUnitFactory(unit);
            canvas_unit.paint(this.canvas.st_ctx, GameCanvas.get_grid_center(coord));
        });
    }
}

