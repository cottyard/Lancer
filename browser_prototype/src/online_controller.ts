interface IOnlineController
{
    status: OnlineGameStatus;
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
    WaitForOpponent,
    Loading,
    Victorious,
    Defeated,
    Tied
}

class OnlineController implements IOnlineController
{
    player_name: string = `player${ Math.floor(10000 * Math.random()) }`;
    private _status: OnlineGameStatus = OnlineGameStatus.NotStarted;
    context: IOnlineGameContext;
    action_panel: IComponent | null = null;
    status_bar: IComponent | null = null;
    button_bar: IComponent | null = null;
    render_ctrl: IRenderController;

    constructor()
    {
        this.context = new OnlineGameContext();

        this.context.on_new_session(this.on_new_session.bind(this));
        this.context.on_new_game(this.on_new_game.bind(this));
        this.context.on_new_status(() => this.render_ctrl.refresh());
        this.context.on_loading(() => { this.status = OnlineGameStatus.Loading; });
        this.context.on_move(() => { this.status = OnlineGameStatus.WaitForOpponent; });

        let stub = new class _ implements IComponent { render() { } };
        let components = {
            action_panel: stub,
            status_bar: stub,
            button_bar: stub
        };

        this.render_ctrl = new RenderController(this.context, components);

        components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), this.render_ctrl, this.context);
        components.status_bar = new StatusBar(<HTMLDivElement> document.getElementById('status-bar'), this.context);
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
        this.context.make_move(this.context.player);
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
        if (this._status != value)
        {
            this._status = value;
            this.render_ctrl.refresh();
        }

        if ([OnlineGameStatus.WaitForPlayer,
        OnlineGameStatus.Victorious,
        OnlineGameStatus.Defeated,
        OnlineGameStatus.Tied].indexOf(value) > -1)
        {
            this.render_ctrl.show_present();
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
            default:
                this.status = OnlineGameStatus.WaitForPlayer;
                break;
        }
    }

    on_new_session(session_id: string)
    {
        console.log('new session:', session_id);
        this.status = OnlineGameStatus.InQueue;
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