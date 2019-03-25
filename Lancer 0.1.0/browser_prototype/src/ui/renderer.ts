class Renderer implements IDisposable
{
    ctx: CanvasRenderingContext2D;
    
    static STYLE_GREY = "#DDD";

    constructor(ctx: CanvasRenderingContext2D)
    {
        this.ctx = ctx;
        this.ctx.save();
    }

    line(x: number, y: number, to_x: number, to_y: number, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(to_x, to_y);
        this.ctx.stroke();
        this.ctx.closePath();
    }

    rectangle(x: number, y: number, width: number, height: number, fill: boolean = false): void
    {
        if (fill)
        {
            this.ctx.fillRect(x, y, width, height);
        }
        else 
        {
            this.ctx.strokeRect(x, y, width, height);
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
