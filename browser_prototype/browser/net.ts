import { PlayerMove } from "../common/entity";

type callback = (res: string) => void;

export class Net
{
    static remote_post(url: string, next: callback, data: string | null = null): void
    {
        (function try_post()
        {
            let req = new XMLHttpRequest();
            req.open('POST', `${ url }`);
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
    
    static remote_get(url: string, next: callback): void
    {
        let req = new XMLHttpRequest();
        req.open('GET', `${ url }`);
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
    
    static new_game(player_name: string, next: callback)
    {
        this.remote_post(`session/join-as/${ player_name }`, next);
    }
    
    static submit_move(game_id: string, 
                       player_move: PlayerMove, 
                       milliseconds_consumed: number, 
                       next: callback)
    {
        this.remote_post(
            `game/${ game_id }/move?consumed=${ milliseconds_consumed }`, 
            next, 
            player_move.serialize());
    }
    
    static query_match(session_id: string, next: callback)
    {
        this.remote_get(`session/${ session_id }/status`, next);
    }
    
    static fetch_game(game_id: string, next: callback)
    {
        this.remote_get(`game/${ game_id }`, next);
    }
}

