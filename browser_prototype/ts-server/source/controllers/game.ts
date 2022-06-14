import { Request, Response, NextFunction } from 'express';
import { Players, Player } from '../entity'

class SessionIdGenerator
{
    private static next_session_id = 1;
    static gen(): string
    {
        SessionIdGenerator.next_session_id++;
        return (SessionIdGenerator.next_session_id - 1).toString();
    }
}

class QueueItem
{
    constructor(public session_id: string, public player_name: string)
    {
    }
}

let match_queue: QueueItem[] = [];

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
        let session_id = SessionIdGenerator.gen();
        match_queue.push(new QueueItem(session_id, name));
        return res.status(200).json(session_id);
    }
};

export default { get_game, get_session_status, submit_move, join_new_session };