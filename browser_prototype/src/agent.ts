interface IServerAgent
{
    submit_move(move: PlayerMove): void;
    new_game(): void;
}

abstract class ServerAgent implements IServerAgent
{
    constructor(protected context: IGameContext)
    {
    }

    abstract submit_move(_: PlayerMove): void
    abstract new_game(): void
}

class LocalAgent extends ServerAgent
{
    submit_move(move: PlayerMove): void 
    {
        let moves = Players.create((p) => new PlayerMove(p));
        moves[move.player] = move;
        this.context.new_round(this.context.present.proceed(moves));
        this.context.status = GameContextStatus.WaitForPlayer;
        g.event_box.emit("GameContext changed", null);
        g.event_box.emit("GameContext round changed", null);
    }

    new_game(): void 
    {
        this.context.new_round(GameRound.new_game());
        this.context.status = GameContextStatus.WaitForPlayer;
        g.event_box.emit("GameContext changed", null);
        g.event_box.emit("GameContext round changed", null);
    }
}