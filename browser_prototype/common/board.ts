import { Coordinate, Move } from "./entity";
import { g } from "./global";
import { ICopyable, IDeserializable, ISerializable } from "./language";

export class FullBoard<T>
{
    protected board: (T)[];
    protected index_of(coord: Coordinate)
    {
        return coord.x * g.board_size_x + coord.y;
    }
    constructor(initializer: () => T)
    {
        let value = initializer();
        let type = typeof value;
        this.board = [];
        let value_is_basic: boolean = value == null || type == "number" || 
            type == "string" || type == "boolean" || type == "undefined";

        for (let i = 0; i < g.board_size_x * g.board_size_y; i++)
        {
            this.board[i] = value_is_basic ? value : initializer();
        }
    }

    
    at(coord: Coordinate): T
    {
        return this.board[this.index_of(coord)];
    }

    put(coord: Coordinate, unit: T): void
    {
        this.board[this.index_of(coord)] = unit;
    }

    iterate_units(foreach: (unit: T, coord: Coordinate) => void): void
    {
        for (let i = 0; i < g.board_size_x; i++)
        {
            for (let j = 0; j < g.board_size_y; j++)
            {
                let c = new Coordinate(i, j);
                foreach(this.board[this.index_of(c)], c);
            }
        }
    }
}

export class Board<T extends ICopyable<T>> extends FullBoard<T | null>
{
    constructor(initializer: () => (T | null) = () => null)
    {
        super(initializer);
    }

    remove(coord: Coordinate): T | null
    {
        let unit = this.board[this.index_of(coord)];
        this.board[this.index_of(coord)] = null;
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
        super.iterate_units((unit, coord) =>
        {
            if (unit != null)
            {
                foreach(unit, coord);
            }
        });
    }

    iterate_everything(foreach: (unit: T | null, coord: Coordinate) => void): void
    {
        super.iterate_units(foreach);
    }
}

export class SerializableBoard<T extends ISerializable & ICopyable<T>> 
    extends Board<T> implements ISerializable, ICopyable<SerializableBoard<T>>
{
    serialize(): string
    {
        let s: (string | number)[] = [];
        for (let i = 0; i < g.board_size_x * g.board_size_y; i++)
        {
            let unit = this.board[i];
            if (unit)
            {
                s.push(unit.serialize());
            }
            else
            {
                s.push(0);
            }
        }
        return JSON.stringify(s);
    }

    copy(): SerializableBoard<T>
    {
        let board = new SerializableBoard<T>();

        for (let i = 0; i < g.board_size_x * g.board_size_y; i++)
        {
            let u = this.board[i];
            if (u)
            {
                board.board[i] = u.copy();
            }
        }

        return board;
    }
}

interface SerializableBoardConstructor<T extends ISerializable & ICopyable<T>, _> 
    extends IDeserializable<SerializableBoard<T>>
{
    new(): SerializableBoard<T>;
    deserialize(payload: string): SerializableBoard<T>;
}

export function create_serializable_board_ctor<T extends ISerializable & ICopyable<T>, 
                                               C extends IDeserializable<T>>
    (unit_ctor: C): SerializableBoardConstructor<T, C>
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
            for (let i = 0; i < g.board_size_x; i++)
            {
                for (let j = 0; j < g.board_size_y; j++)
                {
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
