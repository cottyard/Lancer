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

    let constructor = cmap.get(unit.type())!;
    return new constructor(unit);
}

abstract class CanvasUnit
{
    color: string;

    static readonly color_map = new Map<Player, string>([
        [Player.P1, g.const.STYLE_RED_LIGHT],
        [Player.P2, g.const.STYLE_BLUE_LIGHT]
    ]);

    constructor(protected unit: Unit)
    {
        this.color = CanvasUnit.color_map.get(this.unit.owner)!;
    }

    paint(ctx: CanvasRenderingContext2D, center: Position): void
    {
        using(new Renderer(ctx), (renderer) => {
            renderer.translate(center);
            this.paint_unit(renderer);
        });
    }

    abstract paint_unit(renderer: Renderer): void;
}


abstract class CanvasHaloUnit extends CanvasUnit
{
    abstract skill_direction: HashMap<Skill, Direction>;
    abstract halo_size: number;

    constructor(protected unit: Unit)
    {
        super(unit);
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

    get_halo_angles(): Angle[]
    {
        return this.unit.current.as_list().map(
            (skill: Skill) => {
                return this.skill_direction.get(skill);
            }
        ).map(
            (dir: Direction) => {
                return Angle.create(dir, this.halo_size);
            }
        )
    }

    paint_halo(renderer: Renderer): void
    {
        for (let angle of this.get_halo_angles())
        {
            renderer.halo(angle, this.color);
        }
    }
}

class CanvasSoldier extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(0, -1), HaloDirection.Up],
        [new Skill(0, 1), HaloDirection.Down],
        [new Skill(-1, 0), HaloDirection.Left],
        [new Skill(1, 0), HaloDirection.Right]
    ]);
    halo_size = GameCanvas.halo_size_large;

    paint_unit(renderer: Renderer): void
    {
        renderer.soldier(this.color);
    }
}

class CanvasArcher extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(0, -2), HaloDirection.Up],
        [new Skill(0, 2), HaloDirection.Down],
        [new Skill(-2, 0), HaloDirection.Left],
        [new Skill(2, 0), HaloDirection.Right]
    ]);
    halo_size = GameCanvas.halo_size_large;

    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color);
        renderer.translate(new Position(3, -30));
        renderer.hat();
    }
}

class CanvasBarbarian extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(-1, 1), HaloDirection.DownLeft],
        [new Skill(1, 1), HaloDirection.DownRight],
        [new Skill(-1, -1), HaloDirection.UpLeft],
        [new Skill(1, -1), HaloDirection.UpRight]
    ]);
    halo_size = GameCanvas.halo_size_large;

    paint_unit(renderer: Renderer): void 
    {
        renderer.translate(new Position(0, -15));
        renderer.horns();
        renderer.translate(new Position(0, 15));
        renderer.soldier(this.color);
    }
}

class CanvasRider extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(-1, -2), HaloDirection.UpLeftRight],
        [new Skill(1, -2), HaloDirection.UpRightLeft],
        [new Skill(-1, 2), HaloDirection.DownLeftRight],
        [new Skill(1, 2), HaloDirection.DownRightLeft],
        [new Skill(-2, -1), HaloDirection.UpLeftLeft],
        [new Skill(2, -1), HaloDirection.UpRightRight],
        [new Skill(-2, 1), HaloDirection.DownLeftLeft],
        [new Skill(2, 1), HaloDirection.DownRightRight]
    ]);
    halo_size = GameCanvas.halo_size_small;

    paint_unit(renderer: Renderer): void 
    {
        renderer.rider(this.color);
    }
}

class CanvasWagon extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(0, -1), HaloDirection.Up],
        [new Skill(0, 1), HaloDirection.Down],
        [new Skill(-1, 0), HaloDirection.Left],
        [new Skill(1, 0), HaloDirection.Right]
    ]);
    halo_size = GameCanvas.halo_size_large;

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
