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
    player: Player;
    last: GameRound | null;
    present: GameRound;
    status: GameContextStatus;
    consumed_msecs: Players<number>;
    players_name: Players<string>;
    players_moved: Players<boolean>;

    new_round(round: GameRound): void;
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
        public player: Player,
        public players_name: Players<string>)
    {
    }

    new_round(round: GameRound): void 
    {
        this.rounds.push(round);
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
}

interface IGameUiFacade
{
    context: IGameContext;
    player_name: string;
    staging_area: IPlayerMoveStagingArea;
    action: PlayerAction;
    cost: number;
    prepare_move(move: Move): void;
    prepare_moves(moves: Move[]): void;
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
        public staging_area: IPlayerMoveStagingArea,
        public server_agent: IServerAgent)
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

    prepare_move(move: Move): void 
    {
         this.staging_area.prepare_move(this.context.present.board, move);
    }

    prepare_moves(moves: Move[]): void 
    {
        this.staging_area.prepare_moves(this.context.present.board, moves);
    }

    submit_move(): void 
    {
        let m = this.staging_area.move;
        this.staging_area.reset();
        this.server_agent.submit_move(m);
    }

    new_game(): void
    {
        this.server_agent.new_game();
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
