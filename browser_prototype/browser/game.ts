import { IServerAgent } from "./agent";
import { Move, Player, PlayerAction, Players } from "../common/entity";
import { GameRound } from "../common/game_round";
import { IPlayerMoveStagingArea, PlayerMoveStagingArea } from "./staging_area";

export enum GameContextStatus
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

export interface IGameContext
{
    player: Player;
    last: GameRound | null;
    present: GameRound;
    status: GameContextStatus;
    consumed_msec: Players<number>;
    players_name: Players<string>;
    players_moved: Players<boolean>;
    staging_area: IPlayerMoveStagingArea;
    action: PlayerAction;
    cost: number;
    round_begin_time: number;
    sufficient_fund(): boolean;
    prepare_move(move: Move): void;
    prepare_moves(moves: Move[]): void;
    new_round(round: GameRound): void;
    clear_all(): void;
    clear_staged_moves(): void;
    is_playing(): boolean;
    is_waiting(): boolean;
    is_in_queue(): boolean;
    is_finished(): boolean;
    is_not_started(): boolean;
    is_first_round(): boolean;
}

export class GameContext implements IGameContext
{
    private rounds: GameRound[] = [ GameRound.new_showcase() ];

    status: GameContextStatus = GameContextStatus.NotStarted;
    players_moved: Players<boolean> = Players.create(() => false);
    staging_area: IPlayerMoveStagingArea;
    round_begin_time: number = Date.now();

    consumed_msec: Players<number> = {
        [Player.P1]: 0,
        [Player.P2]: 0
    }

    private _player: Player;

    constructor(
        player: Player,
        public players_name: Players<string>)
    {
        this._player = player;
        this.staging_area = new PlayerMoveStagingArea(player);
    }

    get player()
    {
        return this._player;
    }

    set player(value: Player)
    {
        if (value != this._player)
        {
            this.staging_area.reset(value);
        }
        this._player = value;
    }

    new_round(round: GameRound): void 
    {
        this.rounds.push(round);
        this.round_begin_time = Date.now();
    }

    clear_all(): void 
    {
        this.rounds = [ GameRound.new_showcase() ];
        this.clear_staged_moves();
    }

    clear_staged_moves(): void 
    {
        this.staging_area.reset(this.player);
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

    sufficient_fund(): boolean
    {
        return this.present.supply(this.staging_area.move.player) 
            >= this.staging_area.cost(this.present.board);
    }

    get action(): PlayerAction
    {
        return this.staging_area.action(this.present.board);
    }

    get cost(): number
    {
        return this.staging_area.cost(this.present.board);
    }

    prepare_move(move: Move): void 
    {
         this.staging_area.prepare_move(this.present.board, move);
    }

    prepare_moves(moves: Move[]): void 
    {
        this.staging_area.prepare_moves(this.present.board, moves);
    }

    is_playing(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.Submitting,
            GameContextStatus.WaitForPlayer,
            GameContextStatus.Loading,
        ].indexOf(this.status) > -1;
    }

    is_waiting(): boolean
    {
        return [
            GameContextStatus.WaitForOpponent,
            GameContextStatus.WaitForPlayer
        ].indexOf(this.status) > -1;
    }

    is_in_queue(): boolean
    {
        return this.status == GameContextStatus.InQueue;
    }

    is_finished(): boolean
    {
        return [
            GameContextStatus.Victorious,
            GameContextStatus.Defeated,
            GameContextStatus.Tied
        ].indexOf(this.status) > -1;
    }

    is_not_started(): boolean
    {
        return this.status == GameContextStatus.NotStarted;
    }

    is_first_round(): boolean
    {
        return this.last == null;
    }
}

export interface IGameUiFacade
{
    context: IGameContext;
    player_name: string;
    submit_move(): void;
    new_game(): void;
}

export class GameUiFacade implements IGameUiFacade
{
    public player_name: string = "Anonymous";

    constructor(
        public context: IGameContext, 
        public server_agent: IServerAgent)
    {
    }

    submit_move(): void 
    {
        this.server_agent.submit_move();
    }

    new_game(): void
    {
        this.server_agent.new_game(this.player_name);
    }
}
