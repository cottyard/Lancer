import { AI } from "./ai/benchmark";
import { opponent, Player, PlayerMove, Players } from "../common/entity";
import { GameContextStatus, IGameContext } from "./game";
import { GameRound, GameStatus } from "../common/game_round";
import { Net } from "./net";
import { event_box } from "./ui/ui";

export interface IServerAgent
{
    submit_move(move: PlayerMove): void;
    new_game(name: string): void;
}

abstract class ServerAgent implements IServerAgent
{
    constructor(protected context: IGameContext)
    {
    }

    abstract submit_move(_: PlayerMove): void
    abstract new_game(_: string): void
}

function update_context_status(context: IGameContext): void
{
    switch (context.present.status())
    {
        case GameStatus.WonByPlayer1:
            context.status = context.player == Player.P1 ? 
                             GameContextStatus.Victorious :
                             GameContextStatus.Defeated;
            break;
        case GameStatus.WonByPlayer2:
            context.status = context.player == Player.P2 ?
                             GameContextStatus.Victorious : 
                             GameContextStatus.Defeated;
            break;
        case GameStatus.Tied:
            context.status = GameContextStatus.Tied;
            break;
        case GameStatus.Ongoing:
            context.status = GameContextStatus.WaitForPlayer;
            break;
        default:
            throw new Error("Unknown status");
    }
}

export class LocalAgent extends ServerAgent
{
    submit_move(move: PlayerMove): void
    {
        let moves = Players.create((p) => new PlayerMove(p));
        moves[move.player] = move;
        let op = opponent(move.player);
        moves[op] = AI.get_random_move(this.context.present, op);

        try
        {
            let next = this.context.present.proceed(moves);
            this.context.new_round(next);
        }
        catch(e)
        {
            return;
        }

        update_context_status(this.context);

        event_box.emit("show last round", null);
        event_box.emit("refresh ui", null);
    }

    new_game(): void 
    {
        this.context.new_round(GameRound.new_game());
        this.context.status = GameContextStatus.WaitForPlayer;
        event_box.emit("refresh ui", null);
        event_box.emit("refresh board", null);
    }
}

export class OnlineAgent extends ServerAgent
{
    private session_id: string | null = null;
    private current_game_id: string | null = null;
    private latest_game_id: string | null = null;
    private player_name: string = "";

    constructor(context: IGameContext)
    {
        super(context);

        setInterval(() =>
        {
            if (this.session_id)
            {
                Net.query_match(this.session_id, this.process_session_status.bind(this));
            }
        }, 2500);
    }

    submit_move(move: PlayerMove): void 
    {
        if (this.current_game_id)
        {
            this.context.status = GameContextStatus.Submitting;
            event_box.emit("refresh ui", null);
            let msec_consumed: number = Date.now() - this.context.round_begin_time;
            Net.submit_move(this.current_game_id, move, msec_consumed, (_: string) =>
            {
                this.context.status = GameContextStatus.WaitForOpponent;
                event_box.emit("refresh ui", null);
            });
        }

        event_box.emit("refresh ui", null);
    }

    new_game(name: string): void
    {
        this.player_name = name;
        Net.new_game(
            name, 
            (session: string) =>
            {
                let session_id = JSON.parse(session);
                console.log('new session:', session_id);
                this.context.status = GameContextStatus.InQueue;
                this.context.clear_all();
                this.session_id = session_id;
                this.latest_game_id = null;
                this.current_game_id = null;
                event_box.emit("refresh ui", null);
            });
    }

    process_session_status(session_status: string)
    {
        if (session_status == '"not started"')
        {
            console.log('waiting for match to start...');
            return;
        }

        let status = JSON.parse(session_status);
        console.log('latest game:', status['latest']);
        this.latest_game_id = status['latest'];

        if (!this.latest_game_id)
        {
            return;
        }

        let name_check = false;
        for (let player of Players.both())
        {
            this.context.players_name[player] = status['players_name'][player];
            this.context.players_moved[player] = status['players_moved'][player];
            this.context.consumed_msec[player] = status['players_time'][player];
            
            if (this.player_name == this.context.players_name[player])
            {
                this.context.player = player;
                name_check = true;
            }
        }

        if (!name_check)
        {
            throw Error("player name not found");
        }

        event_box.emit("refresh ui", null);

        if (this.latest_game_id != this.current_game_id)
        {
            this.load_game_round(this.latest_game_id);
        }
    }

    load_game_round(game_id: string)
    {
        this.context.status = GameContextStatus.Loading;
        event_box.emit("refresh ui", null);

        Net.fetch_game(game_id, (serialized_game) =>
        {
            console.log('loading game', game_id);
            
            let game_payload = JSON.parse(serialized_game);
            this.context.new_round(GameRound.deserialize(game_payload));
            update_context_status(this.context);

            this.current_game_id = game_id;

            this.context.clear_staged_moves();
            if (this.context.present.round_count == 0)
            {
                event_box.emit("refresh board", null);
            }
            else
            {
                event_box.emit("show last round", null);
            }
            
            event_box.emit("refresh ui", null);
        });
    }
}
