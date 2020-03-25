import express from 'express';
import { Product } from './product';

const app = express();
const port = 3000;

function get_product()
{
    let p = new Product();
    p.id = "1";
    p.price = 100;
    p.title = "Cricket Bat";
    return p;
}
app.get('/products', (_req, res) =>
{
    res.send(get_product());
});

app.listen(port, err =>
{
    if (err)
    {
        return console.error(err);
    }
    return console.log(`server is listening on ${ port }`);
});
