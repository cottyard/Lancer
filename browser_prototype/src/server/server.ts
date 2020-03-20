import express from 'express';
import { Coordinate } from '../core/entity';

const app = express();
const port = 3000;

app.get('/coordinate', (_req, res) =>
{
    res.send(new Coordinate(1, 2));
});

app.listen(port, err =>
{
    if (err)
    {
        return console.error(err);
    }
    return console.log(`server is listening on ${ port }`);
});
