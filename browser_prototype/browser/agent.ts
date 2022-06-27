import { monkey } from "./ai/monkey";
import { opponent, Player, PlayerMove, Players } from "../common/entity";
import { GameContextStatus, IGameContext } from "./game";
import { GameRound, GameStatus } from "../common/game_round";
import { Net } from "./net";
import { event_box } from "./ui/ui";
import { gorilla } from "./ai/gorilla";
import { KingKong } from "./ai/kingkong";

export interface IServerAgent
{
    submit_move(): void;
    new_game(name: string): void;
}

abstract class ServerAgent implements IServerAgent
{
    constructor(protected context: IGameContext)
    {
    }

    abstract submit_move(): void
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
    submit_move(): void
    {
        let op = opponent(this.context.player);
        let moves = <Players<PlayerMove>>{
            [this.context.player]: this.context.staging_area.move,
            [op]: new KingKong().think(this.context.present, op),
        };

        try
        {
            let next = this.context.present.proceed(moves);
            this.context.new_round(next);
        }
        catch(e)
        {
            console.log("received invalid move");
            console.log(e);
            return;
        }

        update_context_status(this.context);
        this.context.clear_staged_moves();

        event_box.emit("show last round", null);
        event_box.emit("refresh ui", null);
    }

    new_game(): void 
    {
        this.context.clear_all();
        this.context.new_round(GameRound.new_game());
        this.context.status = GameContextStatus.WaitForPlayer;
        event_box.emit("refresh board", null);
        event_box.emit("refresh ui", null);
    }
}

export class AiBattleAgent extends ServerAgent
{
    constructor(context: IGameContext)
    {
        super(context);

        // setInterval(() =>
        // {
        //     if (!this.context.is_not_started() && !this.context.is_finished())
        //     {
        //         this.submit_move(new PlayerMove(this.context.player));
        //     }
        // }, 1000);
    }

    submit_move(): void
    {
        let moves : Players<PlayerMove> = {
            [Player.P1]: gorilla(this.context.present, Player.P1),
            [Player.P2]: monkey(this.context.present, Player.P2)
        };
        
        try
        {
            let next = this.context.present.proceed(moves);
            this.context.new_round(next);
        }
        catch(e)
        {
            console.log("received invalid move");
            console.log(e);
            return;
        }

        update_context_status(this.context);
        this.context.clear_staged_moves();
        
        event_box.emit("refresh board", null);
        event_box.emit("refresh ui", null);
    }

    new_game(): void 
    {
        this.context.clear_all();
        this.context.new_round(GameRound.new_game());
        this.context.status = GameContextStatus.WaitForPlayer;
        event_box.emit("refresh board", null);
        event_box.emit("refresh ui", null);
    }
}

export class OnlineAgent extends ServerAgent
{
    readonly allowed_round_time = 70;
    private session_id: string | null = null;
    private current_game_id: string | null = null;
    private latest_game_id: string | null = null;
    private player_name: string = "";
    private timer_handle: NodeJS.Timeout | null = null;
    private observer_mode: boolean = false;

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

    submit_move(): void
    {
        while (!this.context.sufficient_fund())
        {
            this.context.staging_area.pop_move();
        }

        if (this.current_game_id)
        {
            this.context.status = GameContextStatus.Submitting;
            this.stop_count_down();
            event_box.emit("refresh counter", null);
            event_box.emit("refresh ui", null);
            let msec_consumed: number = Date.now() - this.context.round_begin_time;
            Net.submit_move(
                this.current_game_id, 
                this.context.staging_area.move,
                msec_consumed, 
                (_: string) =>
                {
                    this.context.status = GameContextStatus.WaitForOpponent;
                    event_box.emit("refresh ui", null);
                });
        }
    }

    new_game(name: string): void
    {
        if (name.startsWith('ob:'))
        {
            this.observer_mode = true;
            name = name.slice(3);
        }
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
        let updated = false;
        for (let player of Players.both())
        {
            if (this.context.players_name[player] != status['players_name'][player])
            {
                this.context.players_name[player] = status['players_name'][player];
                updated = true;
            }
            if (this.context.players_moved[player] != status['players_moved'][player])
            {
                this.context.players_moved[player] = status['players_moved'][player];
                updated = true;
            }
            if (this.context.consumed_msec[player] != status['players_time'][player])
            {
                this.context.consumed_msec[player] = status['players_time'][player];
                updated = true;
            }
            if (this.player_name == this.context.players_name[player])
            {
                name_check = true;
                if (this.context.player != player)
                {
                    this.context.player = player;
                    updated = true;
                }
            }
        }

        if (!name_check)
        {
            throw Error("player name not found");
        }

        if (updated)
        {
            /* refresh ui only when context is updated here
               because this method is called on a regular basis
               refreshing the ui too often will interfere with the buttons
               when the user clicks a button but it refreshes before mouse release
               the click will become ineffective */
            event_box.emit("refresh ui", null);
        }

        if (this.latest_game_id != this.current_game_id)
        {
            this.load_game_round(this.latest_game_id);
        }
    }

    load_game_round(game_id: string)
    {
        if (this.context.status == GameContextStatus.Loading)
        {
            return;
        }

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
            if (this.context.status == GameContextStatus.WaitForPlayer)
            {
                this.start_count_down();
            }
            event_box.emit("refresh ui", null);
        });
    }

    timer()
    {
        let elapsed_secs : number = 
            Math.floor((Date.now() - this.context.round_begin_time) / 1000);
        
        let remaining_secs : number = this.allowed_round_time - elapsed_secs;
        // if (remaining_secs <= 10)
        // {
        //     beep();
        // }

        if (remaining_secs <= 0)
        {
            this.submit_move();
        }
        else
        {
            event_box.emit("refresh counter", remaining_secs);
        }
    }

    start_count_down()
    {
        if (this.observer_mode)
        {
            return;
        }
        this.stop_count_down();
        this.timer_handle = setInterval(this.timer.bind(this), 1000);
        this.timer();
    }

    stop_count_down()
    {
        if (this.timer_handle)
        {
            clearInterval(this.timer_handle);
            this.timer_handle = null;
        }
    }
}
