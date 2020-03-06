interface IOnlineController
{
    status: OnlineGameStatus;
    is_playing(): boolean;
    is_in_queue(): boolean;
    is_finished(): boolean;
    is_not_started(): boolean;
    new_game(): void;
    set_name(name: string): void;
}

enum OnlineGameStatus
{
    NotStarted,
    InQueue,
    WaitForPlayer,
    WaitForOpponent,
    Loading,
    WonByPlayer1,
    WonByPlayer2,
    Tied
}

class OnlineController implements IOnlineController
{
    player_name: string = `player${ Math.floor(10000 * Math.random()) }`;
    private _status: OnlineGameStatus = OnlineGameStatus.NotStarted;

    constructor(
        public context: IOnlineGameContext,
        public components: {
            render_ctrl: IRenderController,
            action_panel: IActionPanel,
            status_bar: IStatusBar,
            button_bar: IButtonBar;
        })
    { }

    set status(value: OnlineGameStatus)
    {
        if (this._status != value)
        {
            this._status = value;
            this.components.render_ctrl.refresh();
        }

        if (value == OnlineGameStatus.InQueue)
        {
            this.current_game_id = null;
        }

        if ([OnlineGameStatus.WaitForPlayer,
        OnlineGameStatus.WonByPlayer1,
        OnlineGameStatus.WonByPlayer2,
        OnlineGameStatus.Tied].indexOf(value) > -1)
        {
            this.components.render_ctrl.show_present();
        }
    }

    get status(): OnlineGameStatus
    {
        return this._status;
    }

    on_new_game()
    {
        switch (game_status)
        {
            case 1:
                this.set_status(OnlineGameStatus.WonByPlayer1);
                break;
            case 2:
                this.set_status(OnlineGameStatus.WonByPlayer2);
                break;
            case 3:
                this.set_status(OnlineGameStatus.Tied);
                break;
            default:
                this.set_status(OnlineGameStatus.WaitForPlayer);
        }

        this.last_round_board = this.board;
    }

    new_game()
    {
        let player_name = (<HTMLTextAreaElement> document.getElementById('player-name'))?.value;
        if (player_name && player_name != 'undefined')
        {
            this.player_name = player_name;
        }
        new_game(player_name, (session: string) =>
        {
            console.log('new session:', session);
            this.session_id = session;
            this.status = OnlineGameStatus.InQueue;
        });
    }

    load_session(session: string, player_name: string)
    {
        this.session_id = session;
        this.player_name = player_name;
        this.status = OnlineGameStatus.InQueue;
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
            OnlineGameStatus.WonByPlayer1,
            OnlineGameStatus.WonByPlayer2,
            OnlineGameStatus.Tied
        ].indexOf(this.status) > -1;
    }

    is_not_started(): boolean
    {
        return this.status == OnlineGameStatus.NotStarted;
    }
}