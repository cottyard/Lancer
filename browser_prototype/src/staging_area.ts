interface IPlayerMoveStagingArea
{
    move: PlayerMove;
    action(board: GameBoard): PlayerAction;
    cost(board: GameBoard): number;
    prepare_move(move: Move): "accepted" | "overridden" | "invalid";
    prepare_moves(moves: Move[]): boolean;
    delete_moves(filter: (move: Move) => move is Move): Move[];
    pop_move(): Move | null;
    clear(): void;
}

class PlayerMoveStagingArea implements IPlayerMoveStagingArea
{
    move: PlayerMove;
    constructor(player: Player)
    {
        this.move = new PlayerMove(player);
    }

    action(board: GameBoard): PlayerAction
    {
        return Rule.validate_player_move(board, this.move);
    }

    cost(board: GameBoard): number
    {
        return this.action(board).cost();
    }

    delete_moves(which: (move: Move) => move is Move): Move[]
    {
        return this.move.extract(which);
    }

    clear() : void
    {
        this.move.moves.length = 0;
    }

    pop_move(): Move | null
    {
        let removed = this.move.moves.pop();
        return removed || null;
    }

    prepare_move(move: Move): "accepted" | "overridden" | "invalid"
    {
        let overrided = this.delete_moves(
            (m: Move): m is Move => m.from.equals(move.from));
        this.move.moves.push(move);
        try
        {
            this.action;
        }
        catch
        {
            this.move.moves.pop();
            return "invalid";
        }
        return overrided.length > 0 ? "overridden" : "accepted";
    }

    prepare_moves(moves: Move[]): boolean
    {
        let old = this.move.moves;
        this.move.moves = moves;
        try
        {
            this.action;
        }
        catch
        {
            this.move.moves = old;
            return false;
        }
        return true;
    }
}
