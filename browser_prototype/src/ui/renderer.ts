class Renderer implements IDisposable
{
    transform_matrix: DOMMatrix | null = null;
    alpha: number = 1;
    constructor(public ctx: CanvasRenderingContext2D)
    {
        this.ctx.save();
    }

    translate(position: Position)
    {
        this.ctx.translate(position.x, position.y);
    }

    rotate(radian: number)
    {
        this.ctx.rotate(radian);
    }

    record()
    {
        this.transform_matrix = this.ctx.getTransform();
    }

    rewind()
    {
        if (this.transform_matrix)
        {
            this.ctx.setTransform(this.transform_matrix);
        }
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
            this.set_fill_color(fill_style);
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    arc(position: Position, radius: number, angle: Angle, width: number): void
    {
        this.ctx.lineWidth = width;
        let radian_angle = angle.to_radian();
        this.ctx.beginPath();
        this.ctx.arc(position.x, position.y, radius, radian_angle.start.value, radian_angle.end.value, false);
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
            this.set_fill_color(fill_style);
            this.ctx.fill();
        }
        this.ctx.stroke();
    }

    rectangle(position: Position, width: number, height: number, border_width: number, fill_style: string | null = null): void
    {
        this.ctx.lineWidth = border_width;
        if (fill_style != null)
        {
            this.set_fill_color(fill_style);
            this.ctx.fillRect(position.x, position.y, width, height);
        }
        if (border_width != 0)
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
        this.set_fill_color(g.const.STYLE_GOLD);

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

    soldier(color: string, with_ribbon: boolean = false)
    {
        this.set_color(g.const.STYLE_BLACK);
        
        let head_center = new Position(0, -10);
        let head_size = 13;
        let size_x = 17;
        let size_y = 31;
        let width = 2;

        let corner_left = head_center.add(new PositionDelta(-size_x, size_y));
        let corner_right = head_center.add(new PositionDelta(size_x, size_y));

        this.ctx.lineWidth = width;
        this.set_fill_color(color);

        this.ctx.beginPath();
        this.ctx.moveTo(head_center.x, head_center.y);
        this.ctx.lineTo(corner_left.x, corner_left.y);
        this.ctx.moveTo(head_center.x, head_center.y);
        this.ctx.lineTo(corner_right.x, corner_right.y);
        this.ctx.quadraticCurveTo(head_center.x, head_center.y + size_y + 10, corner_left.x, corner_left.y);
        this.ctx.fill();
        this.ctx.stroke();

        this.circle(head_center, head_size, width, g.const.STYLE_WHITE);
        if (with_ribbon)
        {
            this.ctx.save();
            this.ctx.clip();
            this.rectangle(new Position(-15, -17), 30, 5, 2, color);
            this.circle(head_center, head_size, width);
            this.ctx.restore();
        }
    }

    spear()
    {
        this.set_color(g.const.STYLE_BLACK);
        let head_size = 9;
        let body_size = 5;
        let width = 2;
        let overlay_size = body_size - width;
        this.rectangle(
            new Position(-body_size / 2, 0),
            body_size,
            body_size * 5,
            width,
            g.const.STYLE_WHITE);

        this.triangle(
            new Position(0,  -head_size), 
            new Position(-head_size / 2, 0), 
            new Position(head_size / 2, 0), 
            width, g.const.STYLE_WHITE);

        this.rectangle(
            new Position(-overlay_size / 2, -width),
            overlay_size,
            width * 2,
            0,
            g.const.STYLE_WHITE);
    }

    sword()
    {
        this.set_color(g.const.STYLE_BLACK);
        let size = 6;
        let guard_size = 5;
        let handle_size = 2;
        let width = 2;
        let overlay_size = size - width;
        this.rectangle(
            new Position(-size / 2, 0),
            size,
            size * 3,
            width,
            g.const.STYLE_WHITE);

        this.triangle(
            new Position(0,  -size), 
            new Position(-size / 2, 0), 
            new Position(size / 2, 0), 
            width, g.const.STYLE_WHITE);

        this.rectangle(
            new Position(-overlay_size / 2, -width / 2),
            overlay_size,
            width * 1.5,
            0,
            g.const.STYLE_WHITE);

        this.rectangle(
            new Position(-guard_size, size * 3 - guard_size * 0.8),
            guard_size * 2,
            guard_size * 0.8,
            width,
            g.const.STYLE_WHITE);

        this.rectangle(
            new Position(-handle_size, size * 3),
            handle_size * 2,
            handle_size * 2,
            width,
            g.const.STYLE_WHITE);
    }

    axe()
    {
        this.set_color(g.const.STYLE_BLACK);
        let size = 5;
        let width = 2;

        let mid = size * 2;
        let handle_top = new Position(-size / 2, 0);
        let handle_mid = new Position(-size / 2, mid);

        let axe_top = new Position(-size * 2, -size);
        let axe_bottom = new Position(-size * 2, mid * 1.5);
        let control_1 = new Position(-size, mid / 2);
        let control_2 = new Position(-size * 3, mid / 2);

        this.rectangle(
            handle_top,
            size,
            mid * 2,
            width,
            g.const.STYLE_WHITE);

        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(handle_top.x, handle_top.y);
        this.ctx.quadraticCurveTo(control_1.x, control_1.y, axe_top.x, axe_top.y);
        this.ctx.quadraticCurveTo(control_2.x, control_2.y, axe_bottom.x, axe_bottom.y);
        this.ctx.quadraticCurveTo(control_1.x, control_1.y, handle_mid.x, handle_mid.y);
        this.ctx.stroke();
        this.ctx.closePath();
        
        this.ctx.save();
        this.ctx.clip();
        this.ctx.translate(4, 0);
        this.curve(axe_top, control_2, axe_bottom, width);
        this.ctx.restore();
    }

    rider(color: string, with_muzzle: boolean = false)
    {
        this.set_color(g.const.STYLE_BLACK);
        
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
        this.set_fill_color(color);

        this.ctx.beginPath();
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_left.x, body_left.y);
        this.ctx.moveTo(body_top.x, body_top.y);
        this.ctx.lineTo(body_right.x, body_right.y);
        this.ctx.quadraticCurveTo(0, body_size_y + 10, body_left.x, body_left.y);
        this.ctx.fill();
        this.ctx.stroke();
        
        this.triangle(ear_left, ear_right, ear_top, width);

        this.set_fill_color(g.const.STYLE_WHITE);

        this.ctx.beginPath();
        this.ctx.moveTo(head_right_down.x, head_right_down.y);
        this.ctx.lineTo(head_left_down.x, head_left_down.y);
        this.ctx.lineTo(head_left_up.x, head_left_up.y);
        this.ctx.lineTo(head_right_up.x, head_right_up.y);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        if (with_muzzle)
        {
            this.ctx.save();
            this.ctx.clip();
            this.rotate(new Direction(-15).to_radian().value);
            this.rectangle(new Position(-body_size_x + 9, -head_height - head_size - 10), 5, 25, width, color);
            this.ctx.restore();

            this.ctx.beginPath();
            this.ctx.moveTo(head_right_down.x, head_right_down.y);
            this.ctx.lineTo(head_left_down.x, head_left_down.y);
            this.ctx.lineTo(head_left_up.x, head_left_up.y);
            this.ctx.lineTo(head_right_up.x, head_right_up.y);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        
        this.circle(new Position(4, -13), 1, width, g.const.STYLE_BLACK);
    }

    wagon(color: string)
    {
        let size_x = 30;
        let size_y = 22;
        let width = 2;
        let tyre_size = 8;

        this.set_color(g.const.STYLE_BLACK);
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
        this.set_fill_color(color);
        this.ctx.fill();
        this.ctx.stroke();

        this.circle(new Position(-size_x / 2 * 0.8, size_y / 2), tyre_size, width, g.const.STYLE_WHITE);
        this.circle(new Position(size_x / 2 * 0.8, size_y / 2), tyre_size, width, g.const.STYLE_WHITE);
    }

    halo(angle: Angle, color: string, radius: number)
    {
        let width = 4;
        this.set_color(color);
        this.ctx.globalAlpha = 0.5;

        let halo_center = new Position(0, 0);
        this.arc(halo_center, radius, angle, width);

        this.ctx.globalAlpha = 1;
    }

    hat(ribbon_color: string | null = null)
    {
        this.set_color(g.const.STYLE_BLACK);
        let hat_size = 18
        this.triangle(
            new Position(0, 0), 
            new Position(-hat_size * 1.2, hat_size),
            new Position(hat_size * 0.8, hat_size),
            2, g.const.STYLE_WHITE);

        if (ribbon_color)
        {
            this.ctx.save();
            this.ctx.clip();
            this.rectangle(new Position(-15, 7), 30, 5, 2, ribbon_color);
            this.triangle(
                new Position(0, 0), 
                new Position(-hat_size * 1.2, hat_size),
                new Position(hat_size * 0.8, hat_size),
                2);
            this.ctx.restore();
        }
    }

    horns()
    {
        this.set_color(g.const.STYLE_BLACK);
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

    curved_arrow(from: Position, control: Position, to: Position, style: string, width: number = 3): void
    {
        this.set_color(style);
        let size = 3;

        this.curve(from, control, to, width);

        let direction = this.get_direction(control, to);
        this.ctx.save();
        this.ctx.translate(to.x, to.y);
        this.ctx.rotate(direction.add(90).to_radian().value);
        this.triangle(
            new Position(0, 0), new Position(-size / 1.5, size), new Position(size / 1.5, size), 
            width, style);
        this.ctx.restore();
    }

    arrow(from: Position, to: Position, style: string, shrink_length: number, width: number = 3, arrow_head = 0.6): void
    {
        this.set_color(style);
        let size = 3;
        let head_size = size * arrow_head;

        from = this.go_towards(from, to, shrink_length);
        to = this.go_towards(to, from, shrink_length);

        this.line(from, to, width);

        let direction = this.get_direction(from, to);
        this.ctx.save();
        this.ctx.translate(to.x, to.y);
        this.ctx.rotate(direction.add(90).to_radian().value);
        this.triangle(
            new Position(0, 0), new Position(-head_size, size), new Position(head_size, size), 
            width, style);
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

    set_color(style: string): void
    {
        this.ctx.strokeStyle = this.ctx.fillStyle = style;
        this.ctx.globalAlpha = this.alpha;
    }

    set_fill_color(style: string): void
    {
        this.ctx.fillStyle = style;
        this.ctx.globalAlpha = this.alpha;
    }

    set_alpha(alpha: number): void
    {
        this.alpha = alpha;
    }

    dispose() 
    {
        this.ctx.restore();
    }
}
