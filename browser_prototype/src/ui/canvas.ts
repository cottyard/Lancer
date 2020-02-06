class Canvas 
{
    background: HTMLCanvasElement;
    static: HTMLCanvasElement;
    animate: HTMLCanvasElement;

    bg_ctx: CanvasRenderingContext2D;
    st_ctx: CanvasRenderingContext2D;
    am_ctx: CanvasRenderingContext2D;

    constructor(background: HTMLCanvasElement, static_: HTMLCanvasElement, animate: HTMLCanvasElement) 
    {
        this.background = background;
        this.static = static_;
        this.animate = animate;
        
        this.bg_ctx = this.set_canvas_attr(this.background, 1, m.settings.cvs_size, m.settings.cvs_border_width);
        this.st_ctx = this.set_canvas_attr(this.static, 2, m.settings.cvs_size, m.settings.cvs_border_width);
        this.am_ctx = this.set_canvas_attr(this.animate, 3, m.settings.cvs_size, m.settings.cvs_border_width);
    }

    set_canvas_attr(cvs: HTMLCanvasElement, z_index: number, size: number, border_width: number): CanvasRenderingContext2D
    {
        cvs.style.border = `solid #000 ${border_width}px`;
        cvs.style.position = "absolute";
        cvs.style.setProperty("z-index", `${z_index}`);
        cvs.width = cvs.height = size;
        let ctx = cvs.getContext('2d');
        if (ctx == null)
        {
            throw new Error("null context");
        }
        return ctx;
    }

    paint_background()
    {
        let grid_size = m.settings.grid_size;
        let grids = m.settings.grid_count;

        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.set_style(Renderer.STYLE_GREY);

            for (let i = 0; i < grids; ++i) {
                for (let j = 0; j < grids; ++j) {
                    if ((i + j) % 2 != 0) {
                        renderer.rectangle(i * grid_size, j * grid_size, grid_size, grid_size, true);
                    }
                }   
            }
        });

        let img = document.getElementById("soldier_white");
        let piece_width = 30, piece_height = 50;
        let piece_x = 20, piece_y = 10;
        this.bg_ctx.drawImage(img as CanvasImageSource, piece_x, piece_y, piece_width, piece_height);
    }
}
