import { Player } from '../core/entity';
import { GameStatus } from '../core/game';
import { cg } from '../client/client_global';
import { IOnlineGameContext, OnlineGameContext } from '../client/game_context';
import { IRenderController, RenderController } from '../ui/render_controller';
import { IComponent } from '../ui/ui';
import { IButtonBar, ButtonBar } from '../ui/button_bar';
import { ActionPanel } from '../ui/action_panel';
import { StatusBar } from '../ui/status_bar';

interface IOnlineController
{
    status: OnlineGameStatus;
    seconds_before_submit: number;
    enable_sound: boolean;
    adequate_supply(): boolean;
    is_playing(): boolean;
    is_in_queue(): boolean;
    is_finished(): boolean;
    is_not_started(): boolean;
    is_first_round(): boolean;
    new_game(): void;
    set_name(name: string): void;
    get_name(): string;
    submit_move(): void;
}

enum OnlineGameStatus
{
    NotStarted,
    InQueue,
    WaitForPlayer,
    Submitting,
    WaitForOpponent,
    Loading,
    Victorious,
    Defeated,
    Tied
}

class OnlineController implements IOnlineController
{
    readonly round_time = 60;
    player_name: string = `player${ Math.floor(10000 * Math.random()) }`;
    private _status: OnlineGameStatus = OnlineGameStatus.NotStarted;
    context: IOnlineGameContext;
    render_ctrl: IRenderController;
    seconds_before_submit = 0;
    timer_handle: number | null = null;
    enable_sound = false;

    constructor()
    {
        this.context = new OnlineGameContext();

        this.context.on_new_session(this.on_new_session.bind(this));
        this.context.on_new_game(this.on_new_game.bind(this));
        this.context.on_new_status(() => this.render_ctrl.refresh());
        this.context.on_loading(() => { this.status = OnlineGameStatus.Loading; });
        this.context.on_move(() => { this.status = OnlineGameStatus.WaitForOpponent; });

        let stub = class stub implements IComponent { render() { } };
        let components = {
            action_panel: new stub,
            status_bar: new stub,
            button_bar: new class _ extends stub implements IButtonBar { view_last_round: boolean = true; render_text = () => { }; }
        };

        this.render_ctrl = new RenderController(this.context, components);

        components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), this.render_ctrl, this.context);
        components.status_bar = new StatusBar(<HTMLDivElement> document.getElementById('status-bar'), this.render_ctrl, this.context);
        components.button_bar = new ButtonBar(<HTMLDivElement> document.getElementById('button-bar'), this.render_ctrl, this);

        this.render_ctrl.refresh_all();
    }

    adequate_supply(): boolean
    {
        let cost = this.context.action_cost(this.context.player);
        let supply = this.context.present.supply(this.context.player);
        return cost <= supply;
    }

    submit_move(): void
    {
        this.stop_count_down();
        this.context.make_move(this.context.player);
        this.status = OnlineGameStatus.Submitting;
    }

    is_first_round(): boolean
    {
        if (!this.context)
        {
            throw new Error("no context");
        }
        return this.context.last == null;
    }

    set_name(name: string): void
    {
        this.player_name = name;
    }

    get_name(): string
    {
        return this.player_name;
    }

    set status(value: OnlineGameStatus)
    {
        if ([
            OnlineGameStatus.WaitForPlayer,
            OnlineGameStatus.Victorious,
            OnlineGameStatus.Defeated,
            OnlineGameStatus.Tied].indexOf(value) > -1)
        {
            this.render_ctrl.components.button_bar.view_last_round = this.context.present.round_count > 0;
        }

        if (value == OnlineGameStatus.WaitForPlayer)
        {
            this.start_count_down();
            this.render_ctrl.unfreeze_selection();
        }

        if (value == OnlineGameStatus.Submitting)
        {
            this.render_ctrl.freeze_selection();
        }

        if (this._status != value)
        {
            if (value == OnlineGameStatus.WaitForOpponent)
            {
                if (this.status != OnlineGameStatus.Submitting)
                {
                    return;
                }
            }

            this._status = value;
            this.render_ctrl.refresh();
        }
    }

    get status(): OnlineGameStatus
    {
        return this._status;
    }

    on_new_game()
    {
        switch (this.context.status)
        {
            case GameStatus.WonByPlayer1:
                this.status = this.context.player == Player.P1 ? OnlineGameStatus.Victorious : OnlineGameStatus.Defeated;
                break;
            case GameStatus.WonByPlayer2:
                this.status = this.context.player == Player.P2 ? OnlineGameStatus.Victorious : OnlineGameStatus.Defeated;
                break;
            case GameStatus.Tied:
                this.status = OnlineGameStatus.Tied;
                break;
            case GameStatus.Ongoing:
                this.status = OnlineGameStatus.WaitForPlayer;
                break;
            default:
                throw new Error("Unknown status");
        }
    }

    on_new_session(session_id: string)
    {
        console.log('new session:', session_id);
        this.status = OnlineGameStatus.InQueue;
    }

    start_count_down()
    {
        this.stop_count_down();
        this.seconds_before_submit = this.round_time;
        this.render_ctrl.components.button_bar.render_text();
        this.timer_handle = window.setInterval(this.timer.bind(this), 1000);
    }

    stop_count_down()
    {
        if (this.timer_handle)
        {
            clearInterval(this.timer_handle);
            this.timer_handle = null;
        }
    }

    timer()
    {
        this.seconds_before_submit--;
        this.render_ctrl.components.button_bar.render_text();

        if (this.enable_sound &&
            this.seconds_before_submit > 0 &&
            this.seconds_before_submit <= 10)
        {
            beep();
        }

        if (this.seconds_before_submit <= 0)
        {

            while (!this.adequate_supply())
            {
                this.context.pop_move(this.context.player);
            }
            this.submit_move();
        }
    }

    new_game()
    {
        let player_name = (<HTMLTextAreaElement> document.getElementById('player-name'))?.value;
        if (player_name && player_name != 'undefined')
        {
            this.player_name = player_name;
        }
        this.context.new_session(this.player_name);
    }

    load_session(session: string, player_name: string)
    {
        this.player_name = player_name;
        this.context.load_session(session, player_name);
    }

    is_playing(): boolean
    {
        return [
            OnlineGameStatus.WaitForOpponent,
            OnlineGameStatus.Submitting,
            OnlineGameStatus.WaitForPlayer,
            OnlineGameStatus.Loading,
        ].indexOf(this.status) > -1;
    }

    is_in_queue(): boolean
    {
        return this.status == OnlineGameStatus.InQueue;
    }

    is_finished(): boolean
    {
        return [
            OnlineGameStatus.Victorious,
            OnlineGameStatus.Defeated,
            OnlineGameStatus.Tied
        ].indexOf(this.status) > -1;
    }

    is_not_started(): boolean
    {
        return this.status == OnlineGameStatus.NotStarted;
    }
}

function beep()
{
    let v = cg.audio_context.createOscillator();
    let u = cg.audio_context.createGain();
    v.connect(u);
    v.frequency.value = 880;
    u.gain.value = 0.01;
    v.type = "square";
    u.connect(cg.audio_context.destination);
    v.start(cg.audio_context.currentTime);
    v.stop(cg.audio_context.currentTime + 0.05);
}

export { OnlineController, IOnlineController, OnlineGameStatus };