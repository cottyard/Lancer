class Renderer implements IDisposable
{
    ctx: CanvasRenderingContext2D;
    
    static STYLE_GREY = "#DDD";
    static STYLE_BLACK = "#000";
    static STYLE_WHITE = "#FFF";
    static STYLE_CYAN = '#01cdfe';

    constructor(ctx: CanvasRenderingContext2D)
    {
        this.ctx = ctx;
        this.ctx.save();
    }

    line(from: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    }

    circle(position: Position, radius: number, width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
        if (fill_style != null)
        {
            this.ctx.fillStyle = fill_style;
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    arc(position: Position, radius: number, angle: Angle, width: number): void
    {
        this.ctx.lineWidth = width;
        angle.as_radian();
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, angle.start, angle.end, false);
        this.ctx.stroke();
    }

    curve(from: Position, control: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
        this.ctx.stroke();
    }

    triangle(point_1: Position, point_2: Position, point_3: Position, width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(point_1.x, point_1.y);
        this.ctx.lineTo(point_2.x, point_2.y);
        this.ctx.lineTo(point_3.x, point_3.y);
        
        this.ctx.closePath();
        if (fill_style != null)
        {
            this.ctx.fillStyle = fill_style;
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    rectangle(position: Position, width: number, height: number, fill: boolean = false): void
    {
        if (fill)
        {
            this.ctx.fillRect(position.x, position.y, width, height);
        }
        else 
        {
            this.ctx.strokeRect(position.x, position.y, width, height);
        }
    }

    knight(center: Position)
    {
        this.set_style(Renderer.STYLE_BLACK);
        
        let head_height = 0;
        let head_size = 13;
        let ear_size = 10;
        let body_size_x = 17;
        let body_size_y = 21;
        let width = 2;

        let body_left = center.add(new PositionDelta(-body_size_x, body_size_y));
        let body_right = center.add(new PositionDelta(body_size_x, body_size_y));
        let body_top = center.add(new PositionDelta(body_size_x, -12));
        
        let head_left_down = center.add(new PositionDelta(-body_size_x + 3, -head_height));
        let head_left_up = center.add(new PositionDelta(-body_size_x, -head_height - head_size));
        let head_right_down = center.add(new PositionDelta(body_size_x, -head_height));
        let head_right_up = center.add(new PositionDelta(body_size_x, -head_height - head_size - 10));

        let ear_left = center.add(new PositionDelta(-10, -head_height));
        let ear_right = center.add(new PositionDelta(body_size_x, -head_height));
        let ear_top = center.add(new PositionDelta(body_size_x, -head_height - 20 - ear_size));

        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_left.x, body_left.y);
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_right.x, body_right.y);
        this.ctx.stroke();

        this.curve(body_left, center.add(new PositionDelta(0, body_size_y + 10)), body_right, width);
        this.triangle(ear_left, ear_right, ear_top, width);

        this.ctx.beginPath();
        this.ctx.moveTo(head_right_down.x, head_right_down.y);
        this.ctx.lineTo(head_left_down.x, head_left_down.y);
        this.ctx.lineTo(head_left_up.x, head_left_up.y);
        this.ctx.lineTo(head_right_up.x, head_right_up.y);
        this.ctx.closePath();
        
        this.ctx.fillStyle = Renderer.STYLE_WHITE;
        this.ctx.fill();
        this.ctx.stroke();
        
        this.circle(center.add(new PositionDelta(4, -13)), 1, width, Renderer.STYLE_BLACK);
    }

    set_style(style: string): void
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = style;
    }

    dispose() {
        this.ctx.restore();
    }
}
