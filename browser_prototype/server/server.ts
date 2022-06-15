//import http from 'http';
import express, { Express } from 'express';
import morgan from 'morgan';
import routes from './routes/main';

import https from 'https'
import fs from 'fs'

const options = {
    key: fs.readFileSync(process.env.KEY_FILE!),
    cert: fs.readFileSync(process.env.CERT_FILE!),
    requestCert: false,
    hostname: 'www.cottyard.xyz',
    port: 8000
}

const app: Express = express();

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.text());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'origin, X-Requested-With,Content-Type,Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
        return res.status(200).json({});
    }
    next();
});

app.use(express.static('../target'));
app.use('/', routes);

app.use((req, res, next) => {
    const error = new Error('not found');
    return res.status(404).json({
        message: error.message
    });
});

// const httpServer = http.createServer(app);
 const PORT: any = process.env.PORT ?? 8000;
// httpServer.listen(PORT, () => console.log(`The server is running on port ${PORT}`));

https.createServer(options, app).listen(
    8000, () => console.log(`The server is running on port ${PORT}`));