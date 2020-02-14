class Game
{
    canvas: GameCanvas;
    bounding_rectangle: DOMRect;


    constructor()
    {
        this.initialize();
    }

    initialize()
    {
        this.canvas = new GameCanvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'));

        // this.canvas.animate.addEventListener("mousedown", on_user_mousedown);
        // this.canvas.animate.addEventListener("mouseup", on_user_mouseup);
        this.canvas.animate.addEventListener("mousemove", this.get_mouse_position.bind(this));

        // this.canvas.animate.addEventListener("touchstart", on_touch);
        // this.canvas.animate.addEventListener("touchmove", on_touch);
        // this.canvas.animate.addEventListener("touchend", on_touch);
    }

    get_mouse_position(event: MouseEvent): void
    {
        let rect = this.canvas.background.getBoundingClientRect();
        let mouse_x = event.clientX - rect.left - g.settings.cvs_border_width;
        let mouse_y = event.clientY - rect.top - g.settings.cvs_border_width;

        let to_coord = function(pixel: number)
        { 
            let coord = Math.floor(pixel / g.settings.grid_size);
            if (coord < 0) { return 0 };
            if (coord >= g.grid_count ) { return g.grid_count - 1 };
            return coord;
        };

        this.canvas.paint_indicator(
            GameCanvas.get_grid_center(
                new Coordinate(to_coord(mouse_x), to_coord(mouse_y))));
    }

    run()
    {
        this.canvas.paint_background();
        
        let grid_size = g.settings.grid_size;
        let grids = g.grid_count;

        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, 40);
            let constructor = g.layout_1st[i];
            let canvas_unit = CanvasUnitFactory(new constructor(Player.P1));
            canvas_unit.paint(this.canvas.am_ctx, p);
        }
        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, grid_size + 40);
            let constructor = g.layout_2nd[i];
            let canvas_unit = CanvasUnitFactory(new constructor(Player.P1));
            canvas_unit.paint(this.canvas.am_ctx, p);
        }

        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, grid_size * 8 + 40);
            let constructor = g.layout_1st[i];
            let canvas_unit = CanvasUnitFactory(new constructor(Player.P2));
            canvas_unit.paint(this.canvas.am_ctx, p);
        }
        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, grid_size * 7 + 40);
            let constructor = g.layout_2nd[i];
            let canvas_unit = CanvasUnitFactory(new constructor(Player.P2));
            canvas_unit.paint(this.canvas.am_ctx, p);
        }
    }
}

