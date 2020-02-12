class Game
{
    canvas: GameCanvas;

    layout_1st = ['Archer', 'Wagon', 'Archer', 'Knight', 'King', 'Knight', 'Archer', 'Wagon', 'Archer'];
    layout_2nd = ['Barbarian', 'Soldier', 'Barbarian', 'Soldier', 'Barbarian', 'Soldier', 'Barbarian', 'Soldier', 'Barbarian'];

    constructor()
    {
        this.initialize();
    }

    initialize()
    {
        this.canvas = new GameCanvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'));
    }

    run()
    {
        this.canvas.paint_background();
        
        let grid_size = g.settings.grid_size;
        let grids = g.settings.grid_count;

        let paint_map = new Map<string, (p: Position, c: string, h: Angle[]) => void>([
            ['Archer', this.canvas.paint_archer],
            ['Knight', this.canvas.paint_knight],
            ['King', this.canvas.paint_king],
            ['Soldier', this.canvas.paint_soldier],
            ['Barbarian', this.canvas.paint_barbarian],
            ['Wagon', this.canvas.paint_wagon]
        ]);

        let halo_map: Map<string, Angle[]>[] = [];
        halo_map[1] = new Map<string, Angle[]>();
        halo_map[2] = new Map<string, Angle[]>();
        
        halo_map[1].set('Archer', [Angle.create(Direction.Up, GameCanvas.halo_size_large), Angle.create(Direction.Down, GameCanvas.halo_size_large)]);
        halo_map[1].set('Knight', [Angle.create(Direction.DownLeftRight, GameCanvas.halo_size_small), Angle.create(Direction.DownRightLeft, GameCanvas.halo_size_small)]);
        halo_map[1].set('Soldier', [Angle.create(Direction.Up, GameCanvas.halo_size_large), Angle.create(Direction.Down, GameCanvas.halo_size_large)]);
        halo_map[1].set('Barbarian', [Angle.create(Direction.DownLeft, GameCanvas.halo_size_large), Angle.create(Direction.DownRight, GameCanvas.halo_size_large)]);

        halo_map[2].set('Archer', [Angle.create(Direction.Up, GameCanvas.halo_size_large), Angle.create(Direction.Down, GameCanvas.halo_size_large)]);
        halo_map[2].set('Knight', [Angle.create(Direction.UpLeftRight, GameCanvas.halo_size_small), Angle.create(Direction.UpRightLeft, GameCanvas.halo_size_small)]);
        halo_map[2].set('Soldier', [Angle.create(Direction.Up, GameCanvas.halo_size_large), Angle.create(Direction.Down, GameCanvas.halo_size_large)]);
        halo_map[2].set('Barbarian', [Angle.create(Direction.UpLeft, GameCanvas.halo_size_large), Angle.create(Direction.UpRight, GameCanvas.halo_size_large)]);

        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, 40);
            let name = this.layout_1st[i];
            let f = paint_map.get(name);
            if (f !== undefined)
            {
                f.call(this.canvas, p, Renderer.STYLE_RED_LIGHT, halo_map[1].get(name));
            }
        }
        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, grid_size + 40);
            let name = this.layout_2nd[i];
            let f = paint_map.get(name);
            if (f !== undefined)
            {
                f.call(this.canvas, p, Renderer.STYLE_RED_LIGHT, halo_map[1].get(name));
            }
        }

        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, grid_size * 8 + 40);
            let name = this.layout_1st[i];
            let f = paint_map.get(name);
            if (f !== undefined)
            {
                f.call(this.canvas, p, Renderer.STYLE_BLUE_LIGHT, halo_map[2].get(name));
            }
        }
        for (let i = 0; i < grids; ++i) {
            let p = new Position(i * grid_size + 40, grid_size * 7 + 40);
            let name = this.layout_2nd[i];
            let f = paint_map.get(name);
            if (f !== undefined)
            {
                f.call(this.canvas, p, Renderer.STYLE_BLUE_LIGHT, halo_map[2].get(name));
            }
        }
    }
}

window.onload = () => {
    new Game().run();
};