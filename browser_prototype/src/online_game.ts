interface IOnlineGameHint
{
    move_submitted(player: Player): boolean;
}

class OnlineGameContext
{
    constructor(public game_id: string, 
                public game: GameContext, 
                public player: Player,
                public consumed_msecs: Players<number>)
    {
    }

    // prepare_move(player: Player, move: Move): "accepted" | "overridden" | "invalid"
    // {
    //     if (this.player == player)
    //     {
    //         return this.game.prepare_move(player, move);
    //     }
    //     return "invalid";
    // }

    // make_move(): void
    // {
    //     let move = this.move(this.player);
    //     if (this.current_game_id && move)
    //     {
    //         let milliseconds_consumed: number = new Date().getTime() - this.round_begin_time.getTime();
    //         submit_move(this.current_game_id, move, milliseconds_consumed, (_: string) =>
    //         {
    //             for (let listener of this.move_listeners)
    //             {
    //                 listener();
    //             }
    //         });
    //     }
    // }

    // next(game: GameRound): void
    // {
    //     this.round_begin_time = new Date();
    //     super.next(game);
    // }


}
