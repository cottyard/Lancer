class Module
{
    settings: any;
}
let g: Module = new Module();

class Position
{
    x: number;
    y: number;

    constructor(x: number, y: number)
    {
        this.x = x;
        this.y = y;
    }

    add(d: PositionDelta) : Position
    {
        return new Position(this.x + d.dx, this.y + d.dy);
    }
}

class PositionDelta
{
    dx: number;
    dy: number;

    constructor(dx: number, dy: number)
    {
        this.dx = dx;
        this.dy = dy;
    }

    opposite() : PositionDelta
    {
        return new PositionDelta(-this.dx, -this.dy);
    }
}

enum Direction {
    Up = -90,
    Down = 90,
    Left = 180,
    Right = 0,
    UpLeft = -135,
    UpRight = -45,
    DownLeft = 135,
    DownRight = 45,
    UpLeftLeft = -157.5,
    UpLeftRight = -112.5,
    UpRightLeft = -67.5,
    UpRightRight = -22.5,
    DownLeftLeft = 157.5,
    DownLeftRight = 112.5,
    DownRightLeft = 67.5,
    DownRightRight = 22.5
};

class Angle
{
    start: number;
    end: number;
    is_radian: boolean = false;

    constructor(start: number, end: number)
    {
        this.start = start;
        this.end = end;
    }

    static create(direction: Direction, size: number) : Angle
    {
        return new Angle(direction - size / 2, direction + size / 2);
    }

    as_radian()
    {
        if (!this.is_radian)
        {
            this.start = this.start / 180 * Math.PI;
            this.end = this.end / 180 * Math.PI;
            this.is_radian = true;
        }
    }
}
