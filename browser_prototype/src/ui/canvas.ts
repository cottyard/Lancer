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
        
        this.bg_ctx = this.set_canvas_attr(this.background, 1, g.settings.cvs_size, g.settings.cvs_border_width);
        this.st_ctx = this.set_canvas_attr(this.static, 2, g.settings.cvs_size, g.settings.cvs_border_width);
        this.am_ctx = this.set_canvas_attr(this.animate, 3, g.settings.cvs_size, g.settings.cvs_border_width);
    }

    set_canvas_attr(cvs: HTMLCanvasElement, z_index: number, size: number, border_width: number): CanvasRenderingContext2D
    {
        cvs.style.border = `solid #000 ${border_width}px`;
        cvs.style.position = "absolute";
        cvs.style.setProperty("z-index", `${z_index}`);
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
                            grid_size, grid_size, g.const.STYLE_GREY);
                    }
                }
            }
        });

        // let img = document.getElementById("soldier_white");
        // let piece_width = 30, piece_height = 50;
        // let piece_x = 20, piece_y = 10;
        // this.bg_ctx.drawImage(img as CanvasImageSource, piece_x, piece_y, piece_width, piece_height);
    }
    
    paint_indicator(center: Position)
    {
        let width = 2;
        let size = 20;
        using(new Renderer(this.am_ctx), (renderer) => {
            renderer.set_style(g.const.STYLE_BLUE_LIGHT);
            let upleft = center.add(new PositionDelta(-g.settings.grid_size / 2, -g.settings.grid_size / 2));
            renderer.line(upleft, new Position(upleft.x, upleft.y + size), width);
            renderer.line(upleft, new Position(upleft.x + size, upleft.y), width);
        });
    }
    
    paint_soldier(center: Position)
    {
        let s = new Soldier(Player.P1, true);
        let cs = new CanvasSoldier(s);
        cs.paint(this.bg_ctx, center);
    }

    paint_king(center: Position, color: string)
    {
        let s = new King(Player.P1);
        let cs = new CanvasKing(s);
        cs.paint(this.bg_ctx, center);
    }

    paint_archer(center: Position, color: string, halo_angles: [Angle])
    {
        let s = new Archer(Player.P1, true);
        let cs = new CanvasArcher(s);
        cs.paint(this.bg_ctx, center);
    }

    paint_barbarian(center: Position, color: string, halo_angles: [Angle])
    {
        let s = new Barbarian(Player.P1, true);
        let cs = new CanvasBarbarian(s);
        cs.paint(this.bg_ctx, center);
    }

    paint_rider(center: Position, color: string, halo_angles: [Angle])
    {
        let s = new Rider(Player.P1, true);
        let cs = new CanvasRider(s);
        cs.paint(this.bg_ctx, center);
    }

    paint_wagon(center: Position, color: string)
    {
        let s = new Wagon(Player.P1);
        let cs = new CanvasWagon(s);
        cs.paint(this.bg_ctx, center);
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

    add(d: PositionDelta) : Position
    {
        return new Position(this.x + d.dx, this.y + d.dy);
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

enum Direction {
    Up = -90,
    Down = 90,
    Left = 180,
    Right = 0,
    UpLeft = -135,
    UpRight = -45,
    DownLeft = 135,
    DownRight = 45,
    UpLeftLeft = -157.5,
    UpLeftRight = -112.5,
    UpRightLeft = -67.5,
    UpRightRight = -22.5,
    DownLeftLeft = 157.5,
    DownLeftRight = 112.5,
    DownRightLeft = 67.5,
    DownRightRight = 22.5
};

class Angle
{
    start: number;
    end: number;
    is_radian: boolean = false;

    constructor(start: number, end: number)
    {
        this.start = start;
        this.end = end;
    }

    static create(direction: Direction, size: number) : Angle
    {
        return new Angle(direction - size / 2, direction + size / 2);
    }

    as_radian()
    {
        if (!this.is_radian)
        {
            this.start = this.start / 180 * Math.PI;
            this.end = this.end / 180 * Math.PI;
            this.is_radian = true;
        }
    }
}
