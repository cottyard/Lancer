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
    }
}

window.onload = () => {
    new Game().run();
};