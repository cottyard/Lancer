import { Request, Response, NextFunction } from 'express';

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
    return res.status(200).json(name);
};

export default { get_game, get_session_status, submit_move, join_new_session };