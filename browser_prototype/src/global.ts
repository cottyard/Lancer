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
