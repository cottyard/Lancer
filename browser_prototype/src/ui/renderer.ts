class Renderer implements IDisposable
{
    ctx: CanvasRenderingContext2D;
    
    static STYLE_GREY = "#DDD";
    static STYLE_BLACK = "#000";
    static STYLE_WHITE = "#FFF";
    static STYLE_CYAN = '#01cdfe';
    static STYLE_RED_LIGHT = '#ff8080';
    static STYLE_GOLD = '#ffd700';
    static STYLE_BLUE_LIGHT = '#80ccff';
    static STYLE_CYAN_T = "rgba(1, 205, 254, 0.5)"

    constructor(ctx: CanvasRenderingContext2D)
    {
        this.ctx = ctx;
        this.ctx.save();
    }

    line(from: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.lineTo(to.x, to.y);
        this.ctx.stroke();
    }

    circle(position: Position, radius: number, width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, 0, 2 * Math.PI, false);
        if (fill_style != null)
        {
            this.ctx.fillStyle = fill_style;
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    arc(position: Position, radius: number, angle: Angle, width: number): void
    {
        this.ctx.lineWidth = width;
        angle.as_radian();
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, angle.start, angle.end, false);
        this.ctx.stroke();
    }

    curve(from: Position, control: Position, to: Position, width: number): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(from.x, from.y);
        this.ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
        this.ctx.stroke();
    }

    triangle(point_1: Position, point_2: Position, point_3: Position, width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(point_1.x, point_1.y);
        this.ctx.lineTo(point_2.x, point_2.y);
        this.ctx.lineTo(point_3.x, point_3.y);
        
        this.ctx.closePath();
        if (fill_style != null)
        {
            this.ctx.fillStyle = fill_style;
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    rectangle(position: Position, width: number, height: number, fill_style: string | null = null): void
    {
        if (fill_style != null)
        {
            this.ctx.fillStyle = fill_style;
            this.ctx.fillRect(position.x, position.y, width, height);
        }
        this.ctx.strokeRect(position.x, position.y, width, height);
    }

    crown(center:Position)
    {
        let size = 10;
        let height = 20;
        let jewel_height = height + 8;
        let control_left = center.add(new PositionDelta(-size / 3, -height));
        let control_right = center.add(new PositionDelta(+size / 3, -height));
        let left = center.add(new PositionDelta(-size, -height)); 
        let right = center.add(new PositionDelta(size, -height)); 
        let pointy_1 = center.add(new PositionDelta(-size - 2, -jewel_height)); 
        let pointy_2 = center.add(new PositionDelta(0, -jewel_height * 1.1)); 
        let pointy_3 = center.add(new PositionDelta(size + 2, -jewel_height)); 

        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = Renderer.STYLE_GOLD;

        this.ctx.beginPath();
        this.ctx.moveTo(left.x, left.y);
        this.ctx.lineTo(right.x, right.y);
        this.ctx.lineTo(pointy_3.x, pointy_3.y);
        
        this.ctx.quadraticCurveTo(control_right.x, control_right.y, pointy_2.x, pointy_2.y);
        this.ctx.quadraticCurveTo(control_left.x, control_left.y, pointy_1.x, pointy_1.y);
        this.ctx.closePath();

        this.ctx.fill();
        this.ctx.stroke();
    }

    soldier(center: Position, color: string)
    {
        this.set_style(Renderer.STYLE_BLACK);
        
        let head_center = new Position(center.x, center.y - 10);
        let head_size = 13;
        let size_x = 17;
        let size_y = 31;
        let width = 2;

        let corner_left = head_center.add(new PositionDelta(-size_x, size_y));
        let corner_right = head_center.add(new PositionDelta(size_x, size_y));

        this.ctx.lineWidth = width;
        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.moveTo(head_center.x, head_center.y);
        this.ctx.lineTo(corner_left.x, corner_left.y);
        this.ctx.moveTo(head_center.x, head_center.y);
        this.ctx.lineTo(corner_right.x, corner_right.y);
        this.ctx.quadraticCurveTo(head_center.x, head_center.y + size_y + 10, corner_left.x, corner_left.y);
        this.ctx.fill();
        this.ctx.stroke();

        this.circle(head_center, head_size, width, Renderer.STYLE_WHITE);
    }

    knight(center: Position, color: string)
    {
        this.set_style(Renderer.STYLE_BLACK);
        
        let head_height = 0;
        let head_size = 13;
        let ear_size = 10;
        let body_size_x = 17;
        let body_size_y = 21;
        let width = 2;

        let body_left = center.add(new PositionDelta(-body_size_x, body_size_y));
        let body_right = center.add(new PositionDelta(body_size_x, body_size_y));
        let body_top = center.add(new PositionDelta(body_size_x, -12));
        
        let head_left_down = center.add(new PositionDelta(-body_size_x + 3, -head_height));
        let head_left_up = center.add(new PositionDelta(-body_size_x, -head_height - head_size));
        let head_right_down = center.add(new PositionDelta(body_size_x, -head_height));
        let head_right_up = center.add(new PositionDelta(body_size_x, -head_height - head_size - 10));

        let ear_left = center.add(new PositionDelta(-10, -head_height));
        let ear_right = center.add(new PositionDelta(body_size_x, -head_height));
        let ear_top = center.add(new PositionDelta(body_size_x, -head_height - 20 - ear_size));

        this.ctx.lineWidth = width;
        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_left.x, body_left.y);
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_right.x, body_right.y);
        this.ctx.quadraticCurveTo(center.x, center.y + body_size_y + 10, body_left.x, body_left.y);
        this.ctx.fill();
        this.ctx.stroke();

        
        this.triangle(ear_left, ear_right, ear_top, width);

        this.ctx.fillStyle = Renderer.STYLE_WHITE;

        this.ctx.beginPath();
        this.ctx.moveTo(head_right_down.x, head_right_down.y);
        this.ctx.lineTo(head_left_down.x, head_left_down.y);
        this.ctx.lineTo(head_left_up.x, head_left_up.y);
        this.ctx.lineTo(head_right_up.x, head_right_up.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.circle(center.add(new PositionDelta(4, -13)), 1, width, Renderer.STYLE_BLACK);
    }

    wagon(center: Position, color: string)
    {
        let size_x = 30;
        let size_y = 22;
        let width = 2;
        let tyre_size = 8;

        this.set_style(Renderer.STYLE_BLACK);
        this.ctx.lineWidth = width;

        let upleft = center.add(new PositionDelta(-size_x * 1.3 / 2, -size_y / 2));
        let upright = center.add(new PositionDelta(size_x * 1.3 / 2, -size_y / 2));
        let downleft = center.add(new PositionDelta(-size_x / 2, size_y / 2));
        let downright = center.add(new PositionDelta(size_x / 2, size_y / 2));

        this.ctx.beginPath();
        this.ctx.moveTo(upleft.x, upleft.y);
        this.ctx.lineTo(upright.x, upright.y);
        this.ctx.lineTo(downright.x, downright.y);
        this.ctx.lineTo(downleft.x, downleft.y);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.stroke();

        this.circle(center.add(new PositionDelta(-size_x / 2 * 0.8, size_y / 2)), tyre_size, width, Renderer.STYLE_WHITE);
        this.circle(center.add(new PositionDelta(size_x / 2 * 0.8, size_y / 2)), tyre_size, width, Renderer.STYLE_WHITE);
    }

    halo(center: Position, angle: Angle, color: string)
    {
        let width = 4;
        this.set_style(color);
        this.ctx.globalAlpha = 0.5;

        let halo_center = new Position(center.x, center.y);
        let halo_radius = g.settings.grid_size / 2 - 5

        this.arc(halo_center, halo_radius, angle, width);

        this.ctx.globalAlpha = 1;
    }

    set_style(style: string): void
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = style;
    }

    dispose() {
        this.ctx.restore();
    }
}
