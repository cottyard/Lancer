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
        this.ctx.closePath();                        
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
        this.ctx.closePath();
    }

    arc(position: Position, radius: number, angle: Angle, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        angle.as_radian();
        this.ctx.arc(position.x, position.y, radius, angle.start, angle.end, false);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    curve(from: Position, control: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    triangle(point_1: Position, point_2: Position, point_3: Position, width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(point_1.x, point_1.y);
        this.ctx.lineTo(point_2.x, point_2.y);
        this.ctx.lineTo(point_3.x, point_3.y);
        this.ctx.lineTo(point_1.x, point_1.y);
        if (fill_style != null)
        {
            this.ctx.fillStyle = fill_style;
            this.ctx.fill();
        }
        this.ctx.stroke();
        this.ctx.closePath();
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

    set_style(style: string): void
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = style;
    }

    dispose() {
        this.ctx.restore();
    }
}
