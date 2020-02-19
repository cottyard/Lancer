class GameCanvas 
{
    background: HTMLCanvasElement;
    static: HTMLCanvasElement;
    animate: HTMLCanvasElement;

    bg_ctx: CanvasRenderingContext2D;
    st_ctx: CanvasRenderingContext2D;
    am_ctx: CanvasRenderingContext2D;

    static halo_size_large = 45;
    static halo_size_small = 30;

    constructor(background: HTMLCanvasElement, static_: HTMLCanvasElement, animate: HTMLCanvasElement) 
    {
        this.background = background;
        this.static = static_;
        this.animate = animate;
        
        this.bg_ctx = this.set_canvas_attr(this.background, 1, g.settings.cvs_size, g.settings.cvs_border_width, false);
        this.st_ctx = this.set_canvas_attr(this.static, 2, g.settings.cvs_size, g.settings.cvs_border_width, true);
        this.am_ctx = this.set_canvas_attr(this.animate, 3, g.settings.cvs_size, g.settings.cvs_border_width, true);
    }

    set_canvas_attr(cvs: HTMLCanvasElement, z_index: number, size: number, border_width: number, absolute: boolean): CanvasRenderingContext2D
    {
        cvs.style.border = `solid #000 ${border_width}px`;
        if (absolute) {
            cvs.style.position = "absolute";
            cvs.style.setProperty("z-index", `${z_index}`);
        }
        cvs.width = cvs.height = size;
        let ctx = cvs.getContext('2d');
        if (ctx == null)
        {
            throw new Error("null context");
        }
        return ctx;
    }

    static get_grid_center(coord: Coordinate): Position
    {
        return new Position(
            coord.x * g.settings.grid_size + g.settings.grid_size / 2, 
            coord.y * g.settings.grid_size + g.settings.grid_size / 2);
    }

    static to_coordinate(pixel_x: number, pixel_y: number): Coordinate
    { 
        function gridify(pixel: number)
        {
            let i = Math.floor(pixel / g.settings.grid_size);
            if (i < 0) { return 0 };
            if (i >= g.grid_count ) { return g.grid_count - 1 };
            return i;
        }

        return new Coordinate(gridify(pixel_x), gridify(pixel_y));
    }

    paint_background()
    {
        let grid_size = g.settings.grid_size;
        let grids = g.grid_count;

        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.set_style(g.const.STYLE_GREY);
            
            for (let i = 0; i < grids; ++i) {
                for (let j = 0; j < grids; ++j) {
                    if ((i + j) % 2 != 0) {
                        renderer.rectangle(
                            new Position(i * grid_size, j * grid_size), 
                            grid_size, grid_size, 0, g.const.STYLE_GREY);
                    }
                }
            }
        });
    }
    
    paint_indicator(coordinate: Coordinate, width: number = 2)
    {
        let center = GameCanvas.get_grid_center(coordinate);
        let size = 15;
        let p: number, q: number;
        let half_grid = g.settings.grid_size / 2;
        for ([p, q] of [[-1, -1], [-1, 1], [1, -1], [1, 1]])
        {
            using(new Renderer(this.am_ctx), (renderer) => {
                renderer.set_style(g.const.STYLE_BLACK);
                renderer.translate(center);
                renderer.translate(new Position(p * half_grid, q * half_grid));
                let zero = new Position(0, 0);
                renderer.line(zero.add(new PositionDelta(p * width / 2, 0)), new Position(-p * size, 0), width);
                renderer.line(zero, new Position(0, -q * size), width);
            });
        }
    }

    paint_actions(actions: Action[])
    {
        for (let action of actions)
        {
            using(new Renderer(this.am_ctx), (renderer) => {
                renderer.arrow(
                    GameCanvas.get_grid_center(action.move.from),
                    GameCanvas.get_grid_center(action.move.to),
                    g.action_style.get(action.type)!,
                    g.settings.grid_size / 2 - 5);
            });
        }
    }

    clear_canvas(ctx: CanvasRenderingContext2D)
    {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();
    }
}

class Position
{
    x: number;
    y: number;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    add(d: PositionDelta): Position
    {
        return new Position(this.x + d.dx, this.y + d.dy);
    }

    delta(other: Position): PositionDelta
    {
        return new PositionDelta(other.x - this.x, other.y - this.y);
    }

    equals(other: Position): boolean
    {
        return this.x == other.x && this.y == other.y;
    }
}

class PositionDelta
{
    dx: number;
    dy: number;

    constructor(dx: number, dy: number)
    {
        this.dx = dx;
        this.dy = dy;
    }

    opposite() : PositionDelta
    {
        return new PositionDelta(-this.dx, -this.dy);
    }
}

class Direction
{
    constructor(public value: number)
    {
    }

    to_radian(): RadianDirection
    {
        return new RadianDirection(this.value / 180 * Math.PI);
    }

    add(value: number): Direction
    {
        return new Direction(this.value + value);
    }

    opposite() : Direction
    {
        return new Direction((this.value + 180) % 360);
    }

    static from_radian(value: number): Direction
    {
        return new Direction(value * 180 / Math.PI);
    }
}

class RadianDirection
{
    constructor(public value: number)
    {
    }
}

class HaloDirection {
    static Up = new Direction(-90);
    static Down = new Direction(90);
    static Left = new Direction(180);
    static Right = new Direction(0);
    static UpLeft = new Direction(-135);
    static UpRight = new Direction(-45);
    static DownLeft = new Direction(135);
    static DownRight = new Direction(45);
    static UpLeftLeft = new Direction(-157.5);
    static UpLeftRight = new Direction(-112.5);
    static UpRightLeft = new Direction(-67.5);
    static UpRightRight = new Direction(-22.5);
    static DownLeftLeft = new Direction(157.5);
    static DownLeftRight = new Direction(112.5);
    static DownRightLeft = new Direction(67.5);
    static DownRightRight = new Direction(22.5);
};

class Angle
{
    start: Direction;
    end: Direction;

    constructor(start: Direction, end: Direction)
    {
        this.start = start;
        this.end = end;
    }

    static create(direction: Direction, size: number) : Angle
    {
        return new Angle(direction.add(-size / 2), direction.add(size / 2));
    }

    to_radian()
    {
        return new RadianAngle(this.start.to_radian(),  this.end.to_radian())
    }
}

class RadianAngle
{
    start: RadianDirection;
    end: RadianDirection;

    constructor(start: RadianDirection, end: RadianDirection)
    {
        this.start = start;
        this.end = end;
    }
}
