import { AI } from "./ai/benchmark";
import { deserialize_player, opponent, Player, PlayerMove, Players } from "../common/entity";
import { GameContextStatus, IGameContext } from "./game";
import { GameRound, GameStatus } from "../common/game_round";
import { Net } from "./net";
import { event_box } from "./ui/ui";

export interface IServerAgent
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

    constructor(context: IGameContext)
    {
        super(context);

        setInterval(() =>
        {
            if (this.session_id)
            {
                Net.query_match(this.session_id, this.process_session_status.bind(this));
            }
        }, 2000);
    }

    submit_move(move: PlayerMove): void 
    {
        if (this.current_game_id)
        {
            this.context.status = GameContextStatus.Submitting;
            event_box.emit("refresh ui", null);
            //let milliseconds_consumed: number = new Date().getTime() - this.round_begin_time.getTime();
            Net.submit_move(this.current_game_id, move, 0, (_: string) =>
            {
                this.context.status = GameContextStatus.WaitForOpponent;
                event_box.emit("refresh ui", null);
            });
        }

        event_box.emit("refresh ui", null);
    }

    new_game(): void
    {
        Net.new_game(
            this.context.players_name[this.context.player], 
            (session: string) =>
            {
                let session_id = JSON.parse(session);
                console.log('new session:', session_id);
                this.context.status = GameContextStatus.InQueue;
                this.session_id = session_id;
                this.latest_game_id = null;
                this.current_game_id = null;
                event_box.emit("refresh ui", null);
            });
        
        // event_box.emit("refresh ui", null);
    }

    process_session_status(session_status: string)
    {
        let status = JSON.parse(session_status);
        console.log('latest game:', status['latest']);
        this.latest_game_id = status['latest'];

        if (!this.latest_game_id)
        {
            return;
        }

        // let updated = false;

        // for (let player of Players.both())
        // {
        //     let current_moved = this.context.players_moved[player];
        //     let moved = status['player_moved'][player];

        //     if (current_moved != moved)
        //     {
        //         this.context.players_moved[player] = moved;
        //         updated = true;
        //     }

        //     let current_time = this.context.consumed_msecs[player];
        //     let time = status['player_time'][player];
        //     if (current_time != time)
        //     {
        //         this.context.consumed_msecs[player] = time;
        //         updated = true;
        //     }
        // }

        // if (updated)
        // {
        //     event_box.emit("refresh ui", null);
        // }

        // if (this.latest_game_id != this.current_game_id)
        // {
        //     this.load_game_round(this.latest_game_id);
        // }
    }

    load_game_round(game_id: string)
    {
        this.context.status = GameContextStatus.Loading;
        event_box.emit("refresh ui", null);

        Net.fetch_game(game_id, (serialized_game) =>
        {
            console.log('loading game', game_id);
            
            let [game_payload, game_status, player, players_name] = JSON.parse(serialized_game);

            this.context.new_round(GameRound.deserialize(game_payload));
            this.context.status = game_status;
            this.context.player = player;
            for (let p in players_name)
            {
                let player = deserialize_player(p);
                let name = players_name[p];
                this.context.players_name[player] = name;
            }

            this.current_game_id = game_id;

            event_box.emit("refresh ui", null);
            event_box.emit("refresh board", null);
        });
    }
}
