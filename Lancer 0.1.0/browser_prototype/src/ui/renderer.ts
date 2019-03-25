class Renderer
{
    ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D)
    {
        this.ctx = ctx;
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
}
