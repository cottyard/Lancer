import { Request, Response, NextFunction } from 'express';
import { Players, Player, PlayerMove } from '../../common/entity'
import { GameRound } from '../../common/game_round'

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
let players_move_store: { 
    [server_game_round_id: ServerGameRoundId]: ServerPlayersMove 
} = {};
let session_store: {[id: SessionId]: Session} = {};

class ServerGameRound
{
    id: ServerGameRoundId;
    constructor(public round: GameRound)
    {
        this.id = server_game_round_id_generator.gen();
        players_move_store[this.id] = new ServerPlayersMove();
    }
}

class ServerPlayersMove
{
    players_move: Players<PlayerMove | null>;
    constructor()
    {
        this.players_move = {
            [Player.P1]: null,
            [Player.P2]: null
        }
    }

    reset()
    {
        this.players_move = {
            [Player.P1]: null,
            [Player.P2]: null
        }
    }

    update(player: Player, move: PlayerMove)
    {
        this.players_move[player] = move;
    }

    all_players_moved(): boolean
    {
        return this.players_move[Player.P1] != null
            && this.players_move[Player.P2] != null;
    }
}

class Session
{
    
    private rounds: ServerGameRound[] = [ new ServerGameRound(GameRound.new_game()) ];
    update_time: number = Date.now();
    constructor(public id: SessionId, players_name: Players<string>)
    {
        session_store[id] = this;
    }

    touch()
    {
        this.update_time = Date.now();
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
            if (!(session.current_game_round().id in players_move_store))
            {
                continue;
            }


        }
    }
}

// class Session:
//     def is_ended(self):
//         return self.current_game().status != game.GameStatus.Ongoing
//     @classmethod
//     def process_sessions(cls):
//         ended_sessions = []
//         for session in cls.session_map.values():
//             if session.current_game_id() not in game_player_move_map:
//                 continue

//             sg_player_move = game_player_move_map[session.current_game_id()]
//             if not sg_player_move.all_players_moved():
//                 continue
            
//             server_game = session.current_game()
//             next_server_game = server_game.next(sg_player_move)

//             if next_server_game is None:
//                 # when this happen, there is a bug 
//                 # with client move validation
//                 sg_player_move.reset()
//                 return
            
//             session.update(next_server_game.game_id)

//             if session.is_ended():
//                 ended_sessions.append(session)

//         for session in ended_sessions:
//             cls.ended_session_map[session.session_id] = session
//             del cls.session_map[session.session_id]


const get_game = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id;
    return res.status(200).json({
        message: null
    });
};

const get_session_status = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id;
    return res.status(200).json({
        latest: id
    });
};

const submit_move = async (req: Request, res: Response, next: NextFunction) => {
    let id: string = req.params.id;
    return res.status(200).json({
        message: null
    });
};

const join_new_session = async (req: Request, res: Response, next: NextFunction) => {
    let name: string = req.params.name;

    if (match_queue.length > 0)
    {
        let item = match_queue.pop()!;

        if (item.player_name == name)
        {
            return res.status(500).json(null);
        }

        //create new session here
        // let response = new NewSessionResponse(
        //     item.session_id,
        //     {
        //         [Player.P1]: item.player_name,
        //         [Player.P2]: name
        //     }
        // );
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