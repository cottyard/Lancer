class Board<T>
{
    protected board: (T | null)[][];

    constructor(initializer: () => (T | null) = () => null)
    {
        this.board = [];

        for (let i = 0; i < g.board_size_x; i++) {
            this.board[i] = [];
            for (let j = 0; j < g.board_size_y; j++) {
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
        for (let i = 0; i < g.board_size_x; i++) {
            for (let j = 0; j < g.board_size_y; j++) {
                if (this.board[i][j] != null)
                {
                    foreach(this.board[i][j]!, new Coordinate(i, j));
                }
            }
        }
    }
}

class SerializableBoard<T extends ISerializable> extends Board<T> implements ISerializable
{
    serialize(): string
    {
        let s: (string | number)[] = [];
        for (let i = 0; i < g.board_size_x; i++) {
            for (let j = 0; j < g.board_size_y; j++) {
                let unit = this.board[i][j];
                if (unit)
                {
                    s.push(unit.serialize());
                }
                else
                {
                    s.push(0);
                }
            }
        }
        return JSON.stringify(s);
    }
}


interface SerializableBoardConstructor<T extends ISerializable, _> extends IDeserializable<SerializableBoard<T>>
{
    deserialize(payload: string): SerializableBoard<T>;
}

function create_serializable_board_ctor<T extends ISerializable, C extends IDeserializable<T>>(unit_ctor: C): SerializableBoardConstructor<T, C>
{
    return class _ extends SerializableBoard<T>
    {
        constructor()
        {
            super();
        }

        static deserialize(payload: string): SerializableBoard<T>
        {
            let board = new SerializableBoard<T>();
            let s: (string | number)[] = JSON.parse(payload);
            for (let i = 0; i < g.board_size_x; i++) {
                for (let j = 0; j < g.board_size_y; j++) {
                    let unit_payload = s.shift();
                    if (unit_payload)
                    {
                        if (typeof unit_payload == "number")
                        {
                            throw new Error("Board deserialize");
                        }
                        board.put(new Coordinate(i, j), unit_ctor.deserialize(unit_payload));
                    }
                }
            }
            return board;
        }
    };
}

function set_out(board: Board<Unit>): void
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
            let unit = new setting[i](player);
            unit.endow_inborn();
            board.put(new Coordinate(i, row), unit);
        }
    }
}
