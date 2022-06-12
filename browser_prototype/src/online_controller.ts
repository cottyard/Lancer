// class OnlineController implements IOnlineController
// {
//     readonly round_time = 60;
//     player_name: string = `player${ Math.floor(10000 * Math.random()) }`;
//     private _status: OnlineGameStatus = OnlineGameStatus.NotStarted;
//     context: IOnlineGameContext;
//     render_ctrl: IRenderController;
//     seconds_before_submit = 0;
//     timer_handle: number | null = null;
//     enable_sound = false;

//     status_listeners: Function[] = [];
//     loading_listeners: Function[] = [];
//     session_listeners: ((session_id: string) => void)[] = [];
//     move_listeners: (() => void)[] = [];

//     //latest_game_id
//     //session_id
//     round_begin_time: Date = new Date();



//     // query_handle: number;

//     constructor()
//     {
//         this.context = new OnlineGameContext();

//         this.context.on_new_session(this.on_new_session.bind(this));
//         this.context.on_new_game(this.on_new_game.bind(this));
//         this.context.on_new_status(() => this.render_ctrl.refresh());
//         this.context.on_loading(() => { this.status = OnlineGameStatus.Loading; });
//         this.context.on_move(() => { this.status = OnlineGameStatus.WaitForOpponent; });

//         let stub = class stub implements IComponent { render() { } };
//         let components = {
//             action_panel: new stub,
//             status_bar: new stub,
//             button_bar: new class _ extends stub implements IButtonBar { view_last_round: boolean = true; render_text = () => { }; }
//         };

//         this.render_ctrl = new RenderController(this.context, components);

//         components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), this.render_ctrl, this.context);
//         components.status_bar = new StatusBar(<HTMLDivElement> document.getElementById('status-bar'), this.render_ctrl, this.context);
//         components.button_bar = new ButtonBar(<HTMLDivElement> document.getElementById('button-bar'), this.render_ctrl, this);

//         this.render_ctrl.refresh_all();


//     }

//     submit_move(): void
//     {
//         this.stop_count_down();
//         this.context.make_move(this.context.player);
//         this.status = OnlineGameStatus.Submitting;
//     }

//     set status(value: OnlineGameStatus)
//     {


//         if (value == OnlineGameStatus.WaitForPlayer)
//         {
//             this.start_count_down();
//             this.render_ctrl.unfreeze_selection();
//         }

//         if (value == OnlineGameStatus.Submitting)
//         {
//             this.render_ctrl.freeze_selection();
//         }

//         if (this._status != value)
//         {
//             if (value == OnlineGameStatus.WaitForOpponent)
//             {
//                 if (this.status != OnlineGameStatus.Submitting)
//                 {
//                     return;
//                 }
//             }

//             this._status = value;
//             this.render_ctrl.refresh();
//         }
//     }

//     get status(): OnlineGameStatus
//     {
//         return this._status;
//     }




//     start_count_down()
//     {
//         this.stop_count_down();
//         this.seconds_before_submit = this.round_time;
//         this.render_ctrl.components.button_bar.render_text();
//         this.timer_handle = setInterval(this.timer.bind(this), 1000);
//     }

//     stop_count_down()
//     {
//         if (this.timer_handle)
//         {
//             clearInterval(this.timer_handle);
//             this.timer_handle = null;
//         }
//     }

//     timer()
//     {
//         this.seconds_before_submit--;
//         this.render_ctrl.components.button_bar.render_text();

//         if (this.enable_sound &&
//             this.seconds_before_submit > 0 &&
//             this.seconds_before_submit <= 10)
//         {
//             beep();
//         }

//         if (this.seconds_before_submit <= 0)
//         {

//             while (!this.adequate_supply())
//             {
//                 this.context.pop_move(this.context.player);
//             }
//             this.submit_move();
//         }
//     }

  