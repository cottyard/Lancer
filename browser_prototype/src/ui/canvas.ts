class GameCanvas 
{
    background: HTMLCanvasElement;
    static: HTMLCanvasElement;
    animate: HTMLCanvasElement;

    bg_ctx: CanvasRenderingContext2D;
    st_ctx: CanvasRenderingContext2D;
    am_ctx: CanvasRenderingContext2D;

    static halo_size_large = 45;
    static halo_size_small = 30;

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
                            grid_size, grid_size, Renderer.STYLE_GREY);
                    }
                }   
            }
        });

        // let img = document.getElementById("soldier_white");
        // let piece_width = 30, piece_height = 50;
        // let piece_x = 20, piece_y = 10;
        // this.bg_ctx.drawImage(img as CanvasImageSource, piece_x, piece_y, piece_width, piece_height);
    }

    paint_soldier(center: Position, color: string, halo_angles: Angle[])
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.soldier(center, color);
            for (let angle of halo_angles)
            {
                this.render_halo(center, angle, renderer);
            }
        });
    }

    paint_king(center: Position, color: string)
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.soldier(center, color);
            renderer.crown(center);
        });
    }

    paint_archer(center: Position, color: string, halo_angles: [Angle])
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.soldier(center, color);
            this.render_hat(new Position(center.x + 3, center.y - 30), renderer);
            for (let angle of halo_angles)
            {
                this.render_halo(center, angle, renderer);
            }
        });
    }

    paint_barbarian(center: Position, color: string, halo_angles: [Angle])
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            this.render_horns(new Position(center.x, center.y - 15), renderer);
            renderer.soldier(center, color);
            for (let angle of halo_angles)
            {
                this.render_halo(center, angle, renderer);
            }
        });
    }

    paint_knight(center: Position, color: string, halo_angles: [Angle])
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.knight(center, color);
            for (let angle of halo_angles)
            {
                this.render_halo(center, angle, renderer);
            }
        });
    }

    paint_wagon(center: Position, color: string)
    {
        using(new Renderer(this.bg_ctx), (renderer) => {
            renderer.wagon(center, color);
        });
    }

    render_halo(center: Position, angle: Angle, renderer: Renderer)
    {
        let width = 3;
        renderer.set_style(Renderer.STYLE_CYAN_T);

        let halo_center = new Position(center.x, center.y);
        let halo_radius = g.settings.grid_size / 2 - 5

        renderer.arc(halo_center, halo_radius, angle, width);
    }

    render_hat(hat_top: Position, renderer: Renderer)
    {
        renderer.set_style(Renderer.STYLE_BLACK);
        let hat_size = 18
        renderer.triangle(
            hat_top, 
            new Position(hat_top.x - hat_size * 1.2, hat_top.y + hat_size),
            new Position(hat_top.x + hat_size * 0.8, hat_top.y + hat_size),
            2, Renderer.STYLE_WHITE);
    }

    render_horns(center: Position, renderer: Renderer)
    {
        renderer.set_style(Renderer.STYLE_BLACK);
        let width = 2;
        let horn_size = 10;

        renderer.curve(
            center, 
            center.add(new PositionDelta(-horn_size, 0)),
            center.add(new PositionDelta(-horn_size * 1.5, -horn_size)),
            width);
        
        renderer.curve(
            center, 
            new Position(center.x - horn_size - horn_size, center.y + horn_size),
            new Position(center.x - horn_size * 1.5, center.y - horn_size),
            width);
        
        renderer.curve(
            center, 
            new Position(center.x + horn_size, center.y),
            new Position(center.x + horn_size * 1.5, center.y - horn_size),
            width);
        
        renderer.curve(
            center, 
            new Position(center.x + horn_size + horn_size, center.y + horn_size),
            new Position(center.x + horn_size * 1.5, center.y - horn_size),
            width);
    }
}
