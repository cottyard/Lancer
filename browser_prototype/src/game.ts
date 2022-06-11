enum GameContextStatus
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

interface IGameContext
{
    game_id: string;
    player: Player;
    last: GameRound | null;
    present: GameRound;
    status: GameContextStatus;
    consumed_msecs: Players<number>;
    players_name: Players<string>;
    players_moved: Players<boolean>;

    new_round(round: GameRound): void;
    //make_move(moves: Players<PlayerMove>): void;
}

class GameContext implements IGameContext
{
    private rounds: GameRound[] = [ GameRound.new_showcase() ];

    status: GameContextStatus = GameContextStatus.NotStarted;

    players_moved: Players<boolean> = Players.create(() => false);

    consumed_msecs: Players<number> = {
        [Player.P1]: 0,
        [Player.P2]: 0
    }

    constructor(
        public game_id: string,
        public player: Player,
        public players_name: Players<string>)
    {
    }

    new_round(round: GameRound): void 
    {
        this.rounds.push(round);
        g.event_box.emit("GameContext round changed", null);
    }

    get last(): GameRound | null
    {
        if (this.rounds.length >= 2)
        {
            return this.rounds[this.rounds.length - 2];
        }
        return null;
    }

    get present(): GameRound
    {
        return this.rounds[this.rounds.length - 1];
    }

    // make_move(moves: Players<PlayerMove>): void
    // {
    //     this.history.push(this._present);
    //     this._present = this._present.proceed(moves);
    // }
}

interface IGameUiFacade
{
    context: IGameContext;
    player_name: string;
    staging_area: IPlayerMoveStagingArea;
    action: PlayerAction;
    cost: number;
    sufficient_fund(): boolean;

    is_playing(): boolean;
    is_in_queue(): boolean;
    is_finished(): boolean;
    is_not_started(): boolean;
    is_first_round(): boolean;

    submit_move(): void;
    new_game(): void;
}

class GameUiFacade implements IGameUiFacade
{
    public player_name: string = "Anonymous";

    constructor(
        public context: GameContext, 
        public staging_area: PlayerMoveStagingArea)
    {
    }

    sufficient_fund(): boolean
    {
        return this.context.present.supply(this.staging_area.move.player) 
            >= this.staging_area.cost(this.context.present.board);
    }

    get action(): PlayerAction
    {
        return this.staging_area.action(this.context.present.board);
    }

    get cost(): number
    {
        return this.staging_area.cost(this.context.present.board);
    }

    submit_move(): void 
    {
        let moves = Players.create((p) => new PlayerMove(p));
        moves[this.staging_area.move.player] = this.staging_area.move;
        //this.context.make_move(moves);
    }

    new_game(): void
    {
        // queue match with this.player_name;
    }

    is_playing(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.Submitting,
            GameContextStatus.WaitForPlayer,
            GameContextStatus.Loading,
        ].indexOf(this.context.status) > -1;
    }

    is_in_queue(): boolean
    {
        return this.context.status == GameContextStatus.InQueue;
    }

    is_finished(): boolean
    {
        return [
            GameContextStatus.Victorious,
            GameContextStatus.Defeated,
            GameContextStatus.Tied
        ].indexOf(this.context.status) > -1;
    }

    is_not_started(): boolean
    {
        return this.context.status == GameContextStatus.NotStarted;
    }

    is_first_round(): boolean
    {
        return this.context.last == null;
    }
}
