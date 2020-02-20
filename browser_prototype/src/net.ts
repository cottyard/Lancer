type callback = (res: string) => void;

function remote_post(url: string, next: callback): void
{
    let req = new XMLHttpRequest();
    req.open('POST', `${g.settings.server_url}/${url}`);
    req.timeout = 8000;

    req.onreadystatechange = () => {
        if (req.readyState == req.DONE)
        {
            if (req.status == 200)
            {
                next(req.responseText);
            }
        }
    }

    req.onerror = (e) => {
        console.log('error', e);
    }

    req.ontimeout = (e) => {
        console.log('timeout', e);
    }

    req.send();
}

function remote_get(url: string, next: callback): void
{
    let req = new XMLHttpRequest();
    req.open('GET', `${g.settings.server_url}/${url}`);
    req.timeout = 8000;

    req.onreadystatechange = () => {
        if (req.readyState == req.DONE)
        {
            if (req.status == 200)
            {
                next(req.responseText);
            }
        }
    }

    req.onerror = (e) => {
        console.log('error', e);
    }

    req.ontimeout = (e) => {
        console.log('timeout', e);
    }

    req.send();
}

function new_match(player_name: string, next: callback)
{
    remote_post(`match/${player_name}`, next);
}

function query_match(session_id: string, next: callback)
{
    remote_get(`session/${session_id}/current_game_id`, next);
}

function fetch_game(game_id: string, next: callback)
{
    remote_get(`game/${game_id}`, next);
}
