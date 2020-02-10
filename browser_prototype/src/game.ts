class Game
{
    canvas: Canvas;
    constructor()
    {
        this.initialize();
    }

    initialize()
    {
        this.canvas = new Canvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'));
    }

    run()
    {
        this.canvas.paint_background();
        
        
        let grid_size = g.settings.grid_size;
        let grids = g.settings.grid_count;

        for (let i = 0; i < grids; ++i) {
            for (let j = 0; j < 2; ++j) {
                let p = new Position(i * grid_size + 40, j * grid_size + 40);
                if ((i + j) % 4 == 0)
                {
                    this.canvas.paint_soldier(p);
                }
                else if ((i + j) % 4 == 1)
                {
                    this.canvas.paint_archer(p);
                }
                else if ((i + j) % 4 == 2)
                {
                    this.canvas.paint_barbarian(p);
                }
                else
                {
                    this.canvas.paint_knight(p);
                }
            }   
        }
    }
}

window.onload = () => {
    new Game().run();
};