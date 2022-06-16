import { Request, Response, NextFunction } from 'express';
import { Players, Player, PlayerMove } from '../../common/entity'
import { GameRound, GameStatus } from '../../common/game_round'

type SessionId = string;
type ServerGameRoundId = string;

class IdGenerator<T>
{
    private next_id = 1;
    gen(): T
    {
        return <T><unknown>(this.next_id++).toString();
    }
}

const session_id_generator = new IdGenerator<SessionId>();
const server_game_round_id_generator = new IdGenerator<ServerGameRoundId>();

class QueueItem
{
    constructor(public session_id: SessionId, public player_name: string)
    {
    }
}

let match_queue: QueueItem[] = [];
let move_stash_store: {[id: ServerGameRoundId]: PlayersMoveStash} = {};
let session_store: {[id: SessionId]: Session} = {};
let game_round_store: {[id: ServerGameRoundId]: ServerGameRound} = {};

class ServerGameRound
{
    id: ServerGameRoundId;

    constructor(private round: GameRound = GameRound.new_game())
    {
        this.id = server_game_round_id_generator.gen();
        move_stash_store[this.id] = new PlayersMoveStash();
        game_round_store[this.id] = this;
    }

    status(): GameStatus
    {
        return this.round.status();
    }

    proceed(move: PlayersMoveStash): ServerGameRound | null
    {
        let next_round = this.round.proceed({
            [Player.P1]: move.players_move[Player.P1]!,
            [Player.P2]: move.players_move[Player.P2]!
        });

        if (!next_round)
        {
            console.log("error proceeding next round");
            move.reset();
            return null;
        }

        return new ServerGameRound(next_round);
    }

    serialize_round(): string
    {
        return this.round.serialize();
    }
}

class PlayersMoveStash
{
    players_move!: Players<PlayerMove | null>;
    players_time!: Players<number>;
    constructor()
    {
        this.reset();
    }

    reset()
    {
        this.players_move = {
            [Player.P1]: null,
            [Player.P2]: null
        }
        this.players_time = {
            [Player.P1]: 0,
            [Player.P2]: 0
        }
    }

    update(player: Player, move: PlayerMove, msec: number)
    {
        this.players_move[player] = move;
        this.players_time[player] = msec;
    }

    all_players_moved(): boolean
    {
        return this.players_move[Player.P1] != null
            && this.players_move[Player.P2] != null;
    }
}

class Session
{
    private rounds: ServerGameRound[] = [ new ServerGameRound() ];
    private update_time: number = Date.now();

    players_time: Players<number> = {
        [Player.P1]: 0,
        [Player.P2]: 0
    }

    constructor(public id: SessionId, public players_name: Players<string>)
    {
        session_store[id] = this;
    }

    touch()
    {
        this.update_time = Date.now();
    }

    expired(): boolean
    {
        if (Date.now() - this.update_time > 1000 * 3600 * 3)
        {
            return true;
        }
        else
        {
            return false;
        }
    }

    update(round: ServerGameRound, time: Players<number>)
    {
        this.rounds.push(round);
        this.touch();
        
        for (let player of Players.both())
        {
            this.players_time[player] += time[player];
        }
    }

    current_game_round(): ServerGameRound
    {
        return this.rounds[this.rounds.length - 1];
    }

    static process_all()
    {
        for (let id in session_store)
        {
            let session = session_store[id];
            let round = session.current_game_round();
            let move_stash = move_stash_store[round.id];
            if (!move_stash.all_players_moved())
            {
                continue;
            }
            let next_round = round.proceed(move_stash);
            if (next_round)
            {
                session.update(next_round, move_stash.players_time);
            }
        }

        for (let id in session_store)
        {
            let session = session_store[id];
            if (session.expired())
            {
                for (let round of session.rounds)
                {
                    delete move_stash_store[round.id];
                    delete game_round_store[round.id];
                }
                delete session_store[id];
            }
        }
    }
}

const get_game = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id;
    let game_round = game_round_store[id];
    if (!game_round)
    {
        return res.sendStatus(404);
    }

    return res.status(200).json(game_round.serialize_round());
};

const get_session_status = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id;
    let session = session_store[id];
    if (!session)
    {
        return res.status(200).json('not started');
    }

    let game_round = session.current_game_round();
    let result = {
        latest: game_round.id,
        players_moved: {
            [Player.P1]: false,
            [Player.P2]: false
        },
        players_name: session.players_name,
        players_time: {...session.players_time}
    }

    let move_stash = move_stash_store[game_round.id];

    for (let player of Players.both())
    {
        if (move_stash.players_move[player] != null)
        {
            result.players_moved[player] = true;
            result.players_time[player] += move_stash.players_time[player];
        }
    }

    return res.status(200).json(result);
};

const submit_move = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id;
    let msec: number = parseInt(<string>req.query.consumed);
    let player_move = PlayerMove.deserialize(req.body);

    console.log("Received move ", player_move.serialize());
    move_stash_store[id].update(player_move.player, player_move, msec);

    Session.process_all();

    return res.status(200).json('done');
};

const join_new_session = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.name;

    if (match_queue.length > 0)
    {
        let item = match_queue.pop()!;

        if (item.player_name == name)
        {
            match_queue.push(item);
            return res.sendStatus(400);
        }

        new Session(item.session_id, {
            [Player.P1]: item.player_name,
            [Player.P2]: name
        });
        
        return res.status(200).json(item.session_id);
    }
    else
    {
        let session_id = session_id_generator.gen();
        match_queue.push(new QueueItem(session_id, name));
        return res.status(200).json(session_id);
    }
};

export default { get_game, get_session_status, submit_move, join_new_session };