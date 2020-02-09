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
        
        this.bg_ctx = this.set_canvas_attr(this.background, 1, g.settings.cvs_size, g.settings.cvs_border_width);
        this.st_ctx = this.set_canvas_attr(this.static, 2, g.settings.cvs_size, g.settings.cvs_border_width);
        this.am_ctx = this.set_canvas_attr(this.animate, 3, g.settings.cvs_size, g.settings.cvs_border_width);
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
        let grid_size = g.settings.grid_size;
        let grids = g.settings.grid_count;

        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.set_style(Renderer.STYLE_GREY);

            for (let i = 0; i < grids; ++i) {
                for (let j = 0; j < grids; ++j) {
                    if ((i + j) % 2 != 0) {
                        renderer.rectangle(
                            new Position(i * grid_size, j * grid_size), 
                            grid_size, grid_size, true);
                    }
                }   
            }
        });

        // let img = document.getElementById("soldier_white");
        // let piece_width = 30, piece_height = 50;
        // let piece_x = 20, piece_y = 10;
        // this.bg_ctx.drawImage(img as CanvasImageSource, piece_x, piece_y, piece_width, piece_height);
    }

    paint_soldier(position: Position)
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.set_style(Renderer.STYLE_BLACK);
            
            let head_center = new Position(position.x, position.y - 10);
            let head_size = 13;
            let size_x = 17;
            let size_y = 31;

            let corner_left = head_center.add(new PositionDelta(-size_x, size_y));
            let corner_right = head_center.add(new PositionDelta(size_x, size_y));
            renderer.line(head_center, corner_left, 3);
            renderer.line(head_center, corner_right, 3);
            renderer.circle(head_center, head_size, 6, Renderer.STYLE_WHITE);
            renderer.curve(corner_left, new Position(head_center.x, head_center.y + size_y + 10), corner_right, 3);
            
            renderer.set_style(Renderer.STYLE_CYAN);

            let halo_center = new Position(position.x, position.y);
            let halo_size = g.settings.grid_size / 2 - 5
            
            renderer.arc(halo_center, halo_size, -120, -60, 3);
            renderer.arc(halo_center, halo_size, -30, 30, 3);
            renderer.arc(halo_center, halo_size, 60, 120, 3);
            renderer.arc(halo_center, halo_size, 150, 210, 3);
        });
    }
}
