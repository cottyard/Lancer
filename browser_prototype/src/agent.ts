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
        let op = opponent(move.player);
        moves[op] = AI.get_random_move(this.context.present, op);
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

        g.event_box.emit("refresh ui", null);
        g.event_box.emit("refresh board", null);
    }

    new_game(): void 
    {
        this.context.new_round(GameRound.new_game());
        this.context.status = GameContextStatus.WaitForPlayer;
        g.event_box.emit("refresh ui", null);
        g.event_box.emit("refresh board", null);
    }
}

class OnlineAgent extends ServerAgent
{
    private current_game_id: string | null = null;
    private latest_game_id: string | null = null;

    submit_move(move: PlayerMove): void 
    {
        if (this.current_game_id)
        {
            this.context.status = GameContextStatus.Submitting;
            g.event_box.emit("refresh ui", null);
            //let milliseconds_consumed: number = new Date().getTime() - this.round_begin_time.getTime();
            Net.submit_move(this.current_game_id, move, 0, (_: string) =>
            {
                this.context.status = GameContextStatus.WaitForOpponent;
                g.event_box.emit("refresh ui", null);
            });
        }

        g.event_box.emit("refresh ui", null);
    }

    new_game(): void 
    {
        Net.new_game(
            this.context.players_name[this.context.player], 
            (session: string) =>
            {
                console.log('new session:', session);
                this.context.status = GameContextStatus.InQueue;
                this.latest_game_id = null;
                this.current_game_id = null;
                g.event_box.emit("refresh ui", null);
            });
        
        g.event_box.emit("refresh ui", null);
    }
}
