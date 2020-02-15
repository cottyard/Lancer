class Renderer implements IDisposable
{
    constructor(public ctx: CanvasRenderingContext2D)
    {
        this.ctx.save();
    }

    translate(position: Position)
    {
        this.ctx.translate(position.x, position.y);
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
        this.ctx.arc(position.x, position.y, radius, angle.start.value, angle.end.value, false);
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
        else
        {
            this.ctx.strokeRect(position.x, position.y, width, height);
        }
    }

    crown()
    {
        let size = 10;
        let height = 20;
        let jewel_height = height + 8;
        let control_left = new Position(-size / 3, -height);
        let control_right = new Position(+size / 3, -height);
        let left = new Position(-size, -height); 
        let right = new Position(size, -height); 
        let pointy_1 = new Position(-size - 2, -jewel_height);
        let pointy_2 = new Position(0, -jewel_height * 1.1);
        let pointy_3 = new Position(size + 2, -jewel_height);

        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = g.const.STYLE_GOLD;

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

    soldier(color: string)
    {
        this.set_style(g.const.STYLE_BLACK);
        
        let head_center = new Position(0, -10);
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

        this.circle(head_center, head_size, width, g.const.STYLE_WHITE);
    }

    rider(color: string)
    {
        this.set_style(g.const.STYLE_BLACK);
        
        let head_height = 0;
        let head_size = 13;
        let ear_size = 10;
        let body_size_x = 17;
        let body_size_y = 21;
        let width = 2;

        let body_left = new Position(-body_size_x, body_size_y);
        let body_right = new Position(body_size_x, body_size_y);
        let body_top = new Position(body_size_x, -12);
        
        let head_left_down = new Position(-body_size_x + 3, -head_height);
        let head_left_up = new Position(-body_size_x, -head_height - head_size);
        let head_right_down = new Position(body_size_x, -head_height);
        let head_right_up = new Position(body_size_x, -head_height - head_size - 10);

        let ear_left = new Position(-10, -head_height);
        let ear_right = new Position(body_size_x, -head_height);
        let ear_top = new Position(body_size_x, -head_height - 20 - ear_size);

        this.ctx.lineWidth = width;
        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_left.x, body_left.y);
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_right.x, body_right.y);
        this.ctx.quadraticCurveTo(0, body_size_y + 10, body_left.x, body_left.y);
        this.ctx.fill();
        this.ctx.stroke();

        
        this.triangle(ear_left, ear_right, ear_top, width);

        this.ctx.fillStyle = g.const.STYLE_WHITE;

        this.ctx.beginPath();
        this.ctx.moveTo(head_right_down.x, head_right_down.y);
        this.ctx.lineTo(head_left_down.x, head_left_down.y);
        this.ctx.lineTo(head_left_up.x, head_left_up.y);
        this.ctx.lineTo(head_right_up.x, head_right_up.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        this.circle(new Position(4, -13), 1, width, g.const.STYLE_BLACK);
    }

    wagon(color: string)
    {
        let size_x = 30;
        let size_y = 22;
        let width = 2;
        let tyre_size = 8;

        this.set_style(g.const.STYLE_BLACK);
        this.ctx.lineWidth = width;

        let upleft = new Position(-size_x * 1.3 / 2, -size_y / 2);
        let upright = new Position(size_x * 1.3 / 2, -size_y / 2);
        let downleft = new Position(-size_x / 2, size_y / 2);
        let downright = new Position(size_x / 2, size_y / 2);

        this.ctx.beginPath();
        this.ctx.moveTo(upleft.x, upleft.y);
        this.ctx.lineTo(upright.x, upright.y);
        this.ctx.lineTo(downright.x, downright.y);
        this.ctx.lineTo(downleft.x, downleft.y);
        this.ctx.closePath();
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.stroke();

        this.circle(new Position(-size_x / 2 * 0.8, size_y / 2), tyre_size, width, g.const.STYLE_WHITE);
        this.circle(new Position(size_x / 2 * 0.8, size_y / 2), tyre_size, width, g.const.STYLE_WHITE);
    }

    halo(angle: Angle, color: string)
    {
        let width = 4;
        this.set_style(color);
        this.ctx.globalAlpha = 0.5;

        let halo_center = new Position(0, 0);
        let halo_radius = g.settings.grid_size / 2 - 5

        this.arc(halo_center, halo_radius, angle, width);

        this.ctx.globalAlpha = 1;
    }

    hat()
    {
        this.set_style(g.const.STYLE_BLACK);
        let hat_size = 18
        this.triangle(
            new Position(0, 0), 
            new Position(-hat_size * 1.2, hat_size),
            new Position(hat_size * 0.8, hat_size),
            2, g.const.STYLE_WHITE);
    }

    horns()
    {
        this.set_style(g.const.STYLE_BLACK);
        let width = 2;
        let horn_size = 10;

        let center = new Position(0, 0);
        this.curve(
            center, 
            new Position(-horn_size, 0),
            new Position(-horn_size * 1.5, -horn_size),
            width);
        
        this.curve(
            center, 
            new Position(-horn_size - horn_size, horn_size),
            new Position(-horn_size * 1.5, -horn_size),
            width);
        
        this.curve(
            center, 
            new Position(horn_size, 0),
            new Position(horn_size * 1.5, -horn_size),
            width);
        
        this.curve(
            center, 
            new Position(horn_size + horn_size, horn_size),
            new Position(horn_size * 1.5, -horn_size),
            width);
    }

    arrow(from: Position, to: Position, fill_style: string, shrink_length: number)
    {
        let size = 3, width = 3;

        from = this.go_towards(from, to, shrink_length);
        to = this.go_towards(to, from, shrink_length);

        this.line(from, to, width);

        let direction = this.get_direction(from, to);
        this.ctx.save();
        this.ctx.translate(to.x, to.y);
        this.ctx.rotate(direction.add(90).to_radian().value);
        this.triangle(
            new Position(0, 0), new Position(-size / 1.5, size), new Position(size / 1.5, size), 
            width, fill_style);
        this.ctx.restore();
    }

    go_towards(from: Position, to: Position, length: number): Position
    {
        let direction = this.get_direction(from, to);
        let dy = length * Math.sin(direction.to_radian().value);
        let dx = length * Math.cos(direction.to_radian().value);
        return from.add(new PositionDelta(dx, dy));
    }

    get_direction(from: Position, to: Position): Direction
    {
        let delta = from.delta(to);
        
        if (delta.dx == 0)
        {
            if (delta.dy > 0)
            {
                return new Direction(90);
            }
            else if (delta.dy < 0)
            {
                return new Direction(270);
            }
            else
            {
                return new Direction(0);
            }
        }
        else
        {
            let direction = Direction.from_radian(Math.atan(delta.dy / delta.dx));
            
            if (delta.dx < 0)
            {
                return direction.opposite();
            }
            else
            {
                return direction;
            }
        }
    }

    set_style(style: string): void
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = style;
    }

    dispose() {
        this.ctx.restore();
    }
}
