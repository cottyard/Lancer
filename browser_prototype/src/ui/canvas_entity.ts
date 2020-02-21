type CanvasUnitConstructor = new (unit: Unit) => CanvasUnit;

let CanvasUnitFactory = function(unit: Unit): CanvasUnit
{
    let cmap: Map<UnitConstructor, CanvasUnitConstructor> = new Map([
        [Rider, CanvasRider],
        [Soldier, CanvasSoldier],
        [Archer, CanvasArcher],
        [Barbarian, CanvasBarbarian],
        [King, CanvasKing],
        [Wagon, CanvasWagon],
        [Warrior, CanvasWarrior],
        [Spearman, CanvasSpearman],
        [Swordsman, CanvasSwordsman],
        [Lancer, CanvasLancer],
        [Knight, CanvasKnight]
    ]);

    let constructor = cmap.get(unit.type());
    if (!constructor)
    {
        throw new Error(`Canvas ${unit.type().name} missing`);
    }
    return new constructor(unit);
}

abstract class CanvasUnit
{
    color: string;
    
    static halo_size_small = 30;
    static halo_size_large = 45;
    static halo_radius_small = g.settings.grid_size / 2 - 5;
    static halo_radius_medium = g.settings.grid_size / 2 - 2;
    static halo_radius_large = g.settings.grid_size / 2 + 1;

    constructor(protected unit: Unit)
    {
        this.color = g.settings.player_color_map.get(this.unit.owner)!;
    }

    paint(renderer: Renderer): void
    {
        this.paint_unit(renderer);
    }

    abstract paint_unit(renderer: Renderer): void;
}

abstract class CanvasHaloUnit extends CanvasUnit
{
    abstract skill_direction: HashMap<Skill, Direction>;
    abstract halo_size: number;
    abstract halo_radius: number;

    constructor(protected unit: Unit)
    {
        super(unit);
    }

    paint(renderer: Renderer): void
    {
        renderer.record();
        super.paint(renderer);
        renderer.rewind();
        this.paint_halo(renderer);
    }

    get_halo_angles_and_radius(): [Angle, number][]
    {
        return this.get_directions(this.skill_direction).map(dir => {
            return [Angle.create(dir, this.halo_size), this.halo_radius];
        });
    }

    get_directions(map: HashMap<Skill, Direction>): Direction[]
    {
        return this.unit.current.as_list().map(
            (skill: Skill) => {
                return map.get(skill);
            }
        ).filter((d: Direction | undefined): d is Direction => !!d);
    }

    paint_halo(renderer: Renderer): void
    {
        if (this.unit.is_advanced() && this.unit.is_perfect())
        {
            return;
        }

        for (let [angle, radius] of this.get_halo_angles_and_radius())
        {
            renderer.halo(angle, this.color, radius);
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
    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_medium;

    paint_unit(renderer: Renderer): void
    {
        renderer.soldier(this.color, this.unit.is_perfect());
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
    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_medium;

    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color, this.unit.is_perfect());
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
    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_medium;

    paint_unit(renderer: Renderer): void 
    {
        renderer.translate(new Position(0, -15));
        renderer.horns();
        renderer.translate(new Position(0, 15));
        renderer.soldier(this.color, this.unit.is_perfect());
    }
}

class CanvasWarrior extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(-1, 1), HaloDirection.DownLeft],
        [new Skill(1, 1), HaloDirection.DownRight],
        [new Skill(-1, -1), HaloDirection.UpLeft],
        [new Skill(1, -1), HaloDirection.UpRight],
        [new Skill(0, -2), HaloDirection.Up],
        [new Skill(0, 2), HaloDirection.Down],
        [new Skill(-2, 0), HaloDirection.Left],
        [new Skill(2, 0), HaloDirection.Right]
    ]);
    halo_size = CanvasUnit.halo_size_small;
    halo_radius = CanvasUnit.halo_radius_medium;

    paint_unit(renderer: Renderer): void 
    {
        renderer.translate(new Position(0, -15));
        renderer.horns();
        renderer.translate(new Position(0, 15));
        renderer.soldier(this.color, this.unit.is_perfect());
        renderer.translate(new Position(-g.settings.grid_size / 4, -1));
        renderer.rotate(new Direction(-30).to_radian().value);
        renderer.axe();
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
    halo_size = CanvasUnit.halo_size_small;
    halo_radius = CanvasUnit.halo_radius_large;

    paint_unit(renderer: Renderer): void 
    {
        renderer.rider(this.color, this.unit.is_perfect());
    }
}

class CanvasLancer extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(0, -2), HaloDirection.Up],
        [new Skill(0, 2), HaloDirection.Down],
        [new Skill(-2, 0), HaloDirection.Left],
        [new Skill(2, 0), HaloDirection.Right]
    ]);
    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_large;

    paint_unit(renderer: Renderer): void 
    {
        renderer.rider(this.color, this.unit.is_perfect());
        renderer.translate(new Position(-g.settings.grid_size / 4 + 2, 7));
        renderer.rotate(new Direction(-30).to_radian().value);
        renderer.spear();
    }
}

class CanvasKnight extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(-1, 1), HaloDirection.DownLeft],
        [new Skill(1, 1), HaloDirection.DownRight],
        [new Skill(-1, -1), HaloDirection.UpLeft],
        [new Skill(1, -1), HaloDirection.UpRight]
    ]);
    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_large;

    paint_unit(renderer: Renderer): void 
    {
        renderer.rider(this.color, this.unit.is_perfect());
        renderer.translate(new Position(-g.settings.grid_size / 4, 5));
        renderer.rotate(new Direction(-30).to_radian().value);
        renderer.sword();
    }
}

class CanvasSpearman extends CanvasHaloUnit
{
    skill_direction = new HashMap<Skill, Direction>();
    inner_skill_direction = new HashMap([
        [new Skill(0, -1), HaloDirection.Up],
        [new Skill(0, 1), HaloDirection.Down],
        [new Skill(-1, 0), HaloDirection.Left],
        [new Skill(1, 0), HaloDirection.Right]
    ]);
    outer_skill_direction = new HashMap([
        [new Skill(0, -2), HaloDirection.Up],
        [new Skill(0, 2), HaloDirection.Down],
        [new Skill(-2, 0), HaloDirection.Left],
        [new Skill(2, 0), HaloDirection.Right],
    ]);

    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_medium;

    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color, this.unit.is_perfect());
        renderer.translate(new Position(-g.settings.grid_size / 4 + 2, 3));
        renderer.rotate(new Direction(-30).to_radian().value);
        renderer.spear();
    }

    get_halo_angles_and_radius(): [Angle, number][]
    {
        let a1: [Angle, number][] = this.get_directions(this.inner_skill_direction).map(d => {
            return [Angle.create(d, this.halo_size), CanvasUnit.halo_radius_small];
        });
        let a2: [Angle, number][] = this.get_directions(this.outer_skill_direction).map(d => {
            return [Angle.create(d, this.halo_size), CanvasUnit.halo_radius_large];
        });

        return a1.concat(a2);
    }
}

class CanvasSwordsman extends CanvasHaloUnit
{
    skill_direction = new HashMap([
        [new Skill(0, -1), HaloDirection.Up],
        [new Skill(0, 1), HaloDirection.Down],
        [new Skill(-1, 0), HaloDirection.Left],
        [new Skill(1, 0), HaloDirection.Right],
        [new Skill(-1, 1), HaloDirection.DownLeft],
        [new Skill(1, 1), HaloDirection.DownRight],
        [new Skill(-1, -1), HaloDirection.UpLeft],
        [new Skill(1, -1), HaloDirection.UpRight]
    ]);
    halo_size = CanvasUnit.halo_size_small;
    halo_radius = CanvasUnit.halo_radius_medium;

    paint_unit(renderer: Renderer): void 
    {
        renderer.soldier(this.color, this.unit.is_perfect());
        renderer.translate(new Position(-g.settings.grid_size / 4, -3));
        renderer.rotate(new Direction(-30).to_radian().value);
        renderer.sword();
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
    halo_size = CanvasUnit.halo_size_large;
    halo_radius = CanvasUnit.halo_radius_small;

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
