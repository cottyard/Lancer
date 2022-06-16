import express, { Express } from 'express';
import morgan from 'morgan';
import routes from './routes/main';
import http from 'http';
// import https from 'https'
// import fs from 'fs'

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

const HTTP_PORT: any = process.env.HTTP_PORT ?? 8000;
// const HTTPS_PORT: any = process.env.HTTPS_PORT ?? 8001;

const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => console.log(`http server is running on port ${HTTP_PORT}`));

// const options = {
//     key: fs.readFileSync(process.env.KEY_FILE!, 'utf8'),
//     ca: [fs.readFileSync(process.env.CA_BUNDLE_FILE_1!, 'utf8'), fs.readFileSync(process.env.CA_BUNDLE_FILE_2!, 'utf8')],
//     cert: fs.readFileSync(process.env.CERT_FILE!, 'utf8'),
//     // rejectUnauthorized: false,
//     // requestCert: false,
//     // hostname: 'www.cottyard.xyz',
//     // port: HTTPS_PORT
// }
// https.createServer(options, app).listen(
//     HTTPS_PORT, () => console.log(`https server is running on port ${HTTPS_PORT}`));