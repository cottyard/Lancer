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

  