type CanvasUnitConstructor = new (...args: any[]) => CanvasUnit;

let CanvasUnitFactory = function(unit: Unit): CanvasUnit
{
    let cmap: Map<UnitConstructor, CanvasUnitConstructor> = new Map([
        [Rider, CanvasRider],
        [Soldier, CanvasSoldier],
        [Archer, CanvasArcher],
        [Barbarian, CanvasBarbarian],
        [King, CanvasKing],
        [Wagon, CanvasWagon]
    ]);

    let constructor = cmap.get(<UnitConstructor>unit.constructor)!;
    return new constructor(unit);
}

abstract class CanvasUnit
{
    color: string;
    static readonly color_map = new Map<Player, string>([
        [Player.P1, g.const.STYLE_RED_LIGHT],
        [Player.P2, g.const.STYLE_BLUE_LIGHT]
    ]);

    constructor(private unit: Unit)
    {
        this.color = CanvasUnit.color_map.get(this.unit.owner)!;
    }

    paint(ctx: CanvasRenderingContext2D, center: Position): void
    {
        using(new Renderer(ctx), (renderer) => {
            renderer.translate(center);
            this.paint_unit(renderer);
        });

        using(new Renderer(ctx), (renderer) => {
            renderer.translate(center);
            this.paint_halo(renderer);
        });
    }

    abstract paint_unit(renderer: Renderer): void;

    get_halo_angles(): Angle[]
    {
        return [];
    }

    paint_halo(renderer: Renderer): void
    {
        for (let angle of this.get_halo_angles())
        {
            renderer.halo(angle, this.color);
        }
    }
}

class CanvasSoldier extends CanvasUnit
{
    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color);
    }

    get_halo_angles()
    {
        return [
            Angle.create(Direction.Up, GameCanvas.halo_size_large), 
            Angle.create(Direction.Down, GameCanvas.halo_size_large)
        ];
    }
}

class CanvasArcher extends CanvasUnit
{
    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color);
        renderer.translate(new Position(3, -30));
        renderer.hat();
    }

    get_halo_angles()
    {
        return [
            Angle.create(Direction.Up, GameCanvas.halo_size_large), 
            Angle.create(Direction.Down, GameCanvas.halo_size_large)
        ];
    }
}

class CanvasBarbarian extends CanvasUnit
{
    paint_unit(renderer: Renderer): void 
    {
        renderer.translate(new Position(0, -15));
        renderer.horns();
        renderer.translate(new Position(0, 15));
        renderer.soldier(this.color);
    }

    get_halo_angles()
    {
        return [
            Angle.create(Direction.DownLeft, GameCanvas.halo_size_large), 
            Angle.create(Direction.DownRight, GameCanvas.halo_size_large)
        ];
    }
}

class CanvasRider extends CanvasUnit
{
    paint_unit(renderer: Renderer): void 
    {
        renderer.rider(this.color);
    }

    get_halo_angles()
    {
        return [
            Angle.create(Direction.UpLeftRight, GameCanvas.halo_size_small), 
            Angle.create(Direction.UpRightLeft, GameCanvas.halo_size_small)
        ];
    }
}

class CanvasWagon extends CanvasUnit
{
    paint_unit(renderer: Renderer): void 
    {
        renderer.wagon(this.color);
    }
}

class CanvasKing extends CanvasUnit
{
    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color);
        renderer.crown();
    }
}
