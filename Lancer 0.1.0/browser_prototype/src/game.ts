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
        new Renderer(this.canvas.bg_ctx).line(1, 1, 100, 100, 3);
    }
}

window.onload = () => {
    new Game().run();
};