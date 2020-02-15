class Board<T>
{
    private board: (T | null)[][];

    constructor(initializer: () => (T | null))
    {
        this.board = [];

        for (let i = 0; i <= g.board_size_x; i++) {
            this.board[i] = [];
            for (let j = 0; j <= g.board_size_y; j++) {
                this.board[i][j] = initializer();
            }
        }
    }

    at(coord: Coordinate): T | null
    {
        return this.board[coord.x][coord.y];
    }

    put(coord: Coordinate, unit: T): void
    {
        this.board[coord.x][coord.y] = unit;
    }
    
    remove(coord: Coordinate): T | null
    {
        let unit = this.board[coord.x][coord.y];
        this.board[coord.x][coord.y] = null;
        return unit;
    }
        
    move(move: Move): void
    {
        let unit = this.at(move.from);
        if (unit != null)
        {
            this.put(move.to, unit);
            this.remove(move.from);
        }
    }

    iterate_units(foreach: (unit: T, coord: Coordinate) => void): void
    {
        for (let i = 0; i <= g.board_size_x; i++) {
            for (let j = 0; j <= g.board_size_y; j++) {
                if (this.board[i][j] != null)
                {
                    foreach(this.board[i][j]!, new Coordinate(i, j));
                }
            }
        }
    }
}

let set_out = function(board: Board<Unit>): void
{
    let board_layout: [number, UnitConstructor[], Player][] = [
        [0, g.layout_1st, Player.P2],
        [1, g.layout_2nd, Player.P2],
        [g.board_size_y - 1, g.layout_1st, Player.P1],
        [g.board_size_y - 2, g.layout_2nd, Player.P1]
    ];

    let row, setting, player;
    for ([row, setting, player] of board_layout)
    {
        for (let i = 0; i < g.board_size_x; i++)
        {
            board.put(
                new Coordinate(i, row),
                new setting[i](player));
        }
    }
}


    // def copy(self):
    //     return deepcopy(self)
