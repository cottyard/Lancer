import { PlayerMove } from '../core/entity';
import { cg } from '../client/client_global';

type callback = (res: string) => void;

function remote_post(url: string, next: callback, data: string | null = null): void
{
    (function try_post()
    {
        let req = new XMLHttpRequest();
        req.open('POST', `${ cg.settings.server_url }${ url }`);
        req.timeout = 8000;

        req.onreadystatechange = () =>
        {
            if (req.readyState == req.DONE)
            {
                if (req.status == 200)
                {
                    next(req.responseText);
                }
            }
        };

        req.onerror = () =>
        {
            console.log('post error:', url);
        };

        req.ontimeout = () =>
        {
            console.log('post timeout:', url);
            console.log('retrying...');
            try_post();
        };

        req.send(data);
    })();
}

function remote_get(url: string, next: callback): void
{
    let req = new XMLHttpRequest();
    req.open('GET', `${ cg.settings.server_url }${ url }`);
    req.timeout = 8000;

    req.onreadystatechange = () =>
    {
        if (req.readyState == req.DONE)
        {
            if (req.status == 200)
            {
                next(req.responseText);
            }
        }
    };

    req.onerror = () =>
    {
        console.log('error:', url);
    };

    req.ontimeout = () =>
    {
        console.log('timeout:', url);
    };

    req.send();
}

function new_game(player_name: string, next: callback)
{
    remote_post(`match/${ player_name }`, next);
}

function submit_move(game_id: string, player_move: PlayerMove, milliseconds_consumed: number, next: callback)
{
    remote_post(`game/${ game_id }/move?consumed=${ milliseconds_consumed }`, next, player_move.serialize());
}

function query_match(session_id: string, next: callback)
{
    remote_get(`session/${ session_id }/status`, next);
}

function fetch_game(game_id: string, next: callback)
{
    remote_get(`game/${ game_id }`, next);
}

export { new_game, submit_move, query_match, fetch_game };