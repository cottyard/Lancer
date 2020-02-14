abstract class CanvasUnit
{
    static readonly color_map = new Map<Player, string>([
        [Player.P1, g.const.STYLE_RED_LIGHT],
        [Player.P2, g.const.STYLE_BLUE_LIGHT]
    ]);

    constructor(private unit: Unit)
    {
    }

    color(): string
    {
        return <string>CanvasUnit.color_map.get(this.unit.owner);
    }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           
    abstract paint(ctx: CanvasRenderingContext2D, center: Position): void;
}

class CanvasSoldier extends CanvasUnit
{
    paint(ctx: CanvasRenderingContext2D, center: Position): void 
    {
        let color = this.color();
        using(new Renderer(ctx), (renderer) => {
            ctx.translate(center.x, center.y);
            renderer.soldier(color);
            
            let angles = [Angle.create(Direction.Up, GameCanvas.halo_size_large), Angle.create(Direction.Down, GameCanvas.halo_size_large)];
            for (let angle of angles)
            {
                renderer.halo(angle, color);
            }
        });
    }
}

class CanvasArcher extends CanvasUnit
{
    paint(ctx: CanvasRenderingContext2D, center: Position): void 
    {
        let color = this.color();
        using(new Renderer(ctx), (renderer) => {
            ctx.translate(center.x, center.y);
            renderer.soldier(color);

            let angles = [Angle.create(Direction.Up, GameCanvas.halo_size_large), Angle.create(Direction.Down, GameCanvas.halo_size_large)];
            for (let angle of angles)
            {
                renderer.halo(angle, color);
            }

            ctx.translate(3, -30);
            renderer.hat();
            
        });
    }
}

class CanvasBarbarian extends CanvasUnit
{
    paint(ctx: CanvasRenderingContext2D, center: Position): void 
    {
        let color = this.color();
        using(new Renderer(ctx), (renderer) => {
            ctx.translate(center.x, center.y - 15);
            renderer.horns();
            ctx.translate(0, 15);
            renderer.soldier(color);

            let angles = [Angle.create(Direction.DownLeft, GameCanvas.halo_size_large), Angle.create(Direction.DownRight, GameCanvas.halo_size_large)];
            for (let angle of angles)
            {
                renderer.halo(angle, color);
            }
        });
    }
}

class CanvasRider extends CanvasUnit
{
    paint(ctx: CanvasRenderingContext2D, center: Position): void 
    {
        let color = this.color();
        using(new Renderer(ctx), (renderer) => {
            ctx.translate(center.x, center.y);
            renderer.rider(color);
            let angles = [Angle.create(Direction.UpLeftRight, GameCanvas.halo_size_small), Angle.create(Direction.UpRightLeft, GameCanvas.halo_size_small)];
            for (let angle of angles)
            {
                renderer.halo(angle, color);
            }
        });
    }
}

class CanvasWagon extends CanvasUnit
{
    paint(ctx: CanvasRenderingContext2D, center: Position): void 
    {
        let color = this.color();
        using(new Renderer(ctx), (renderer) => {
            ctx.translate(center.x, center.y);
            renderer.wagon(color);
        });
    }
}

class CanvasKing extends CanvasUnit
{
    paint(ctx: CanvasRenderingContext2D, center: Position): void 
    {
        let color = this.color();
        using(new Renderer(ctx), (renderer) => {
            ctx.translate(center.x, center.y);
            renderer.soldier(color);
            renderer.crown();
        });
    }
}
