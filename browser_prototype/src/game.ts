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
                this.canvas.paint_soldier(
                    new Position(i * grid_size + 40, j * grid_size + 40));
            }   
        }
    }
}

window.onload = () => {
    new Game().run();
};