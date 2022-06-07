interface IPlayerMoveStagingArea
{
    board: GameBoard;
    move: PlayerMove;
    action: PlayerAction;
    cost: number;
    prepare_move(move: Move): "accepted" | "overridden" | "invalid";
    prepare_moves(moves: Move[]): boolean;
    delete_moves(filter: (move: Move) => move is Move): Move[];
    pop_move(): Move | null;
}

class PlayerMoveStagingArea implements IPlayerMoveStagingArea
{
    constructor(public board: GameBoard, public move: PlayerMove)
    {
    }

    get action(): PlayerAction
    {
        return Rule.validate_player_move(this.board, this.move);
        //action.actions.sort((a1, a2) => a2.type - a1.type);
    }

    get cost(): number
    {
        return this.action.cost();
    }

    delete_moves(which: (move: Move) => move is Move): Move[]
    {
        return this.move.extract(which);
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
