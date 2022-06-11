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

        switch (this.context.present.status())
        {
            case GameStatus.WonByPlayer1:
                this.context.status = this.context.player == Player.P1 ? 
                                      GameContextStatus.Victorious :
                                      GameContextStatus.Defeated;
                break;
            case GameStatus.WonByPlayer2:
                this.context.status = this.context.player == Player.P2 ?
                                      GameContextStatus.Victorious : 
                                      GameContextStatus.Defeated;
                break;
            case GameStatus.Tied:
                this.context.status = GameContextStatus.Tied;
                break;
            case GameStatus.Ongoing:
                this.context.status = GameContextStatus.WaitForPlayer;
                break;
            default:
                throw new Error("Unknown status");
        }

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