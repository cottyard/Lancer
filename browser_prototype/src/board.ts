class Board<T>
{
    private board: T[][];

    constructor(constructor: () => T)
    {
        this.board = [];

        for (let i = 0; i <= g.board_size_x; i++) {
            this.board[i] = [];
            for (let j = 0; j <= g.board_size_y; j++) {
                this.board[i][j] = constructor();
            }
        }
    }
}

let set_out = function(board: Board<UnitConstructor>): void
{
    let row, setting, player;
    for ([row, setting, player] of [
        [0, g.layout_1st, Player.P1],
        [1, g.layout_2nd, Player.P1],
        [g.board_size_y - 1, g.layout_1st, Player.P2],
        [g.board_size_y - 2, g.layout_2nd, Player.P2]
    ])
    {
        for (let i = 0; i < g.board_size_x; i++)
        {
            this.board[i][<number>row] = new (<UnitConstructor[]>setting)[i](player);
        }
    }
}
    // def at(self, position):
    //     return self.board[position.x][position.y]
    
    // def put(self, position, unit):
    //     self.board[position.x][position.y] = unit

    // def remove(self, position):
    //     unit = self.board[position.x][position.y]
    //     self.board[position.x][position.y] = None
    //     return unit

    // def move(self, move):
    //     unit = self.at(move.position_from)
    //     self.put(move.position_to, unit)
    //     self.remove(move.position_from)

    // def iterate_units(self, func):
    //     for i in range(board_size_x):
    //         for j in range(board_size_y):
    //             u = self.board[i][j]
    //             if u is not None:
    //                 func(u, Position(i, j))
    
    // def copy(self):
    //     return deepcopy(self)
