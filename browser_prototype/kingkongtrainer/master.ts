import express, { Express } from "express";
import morgan from "morgan";
import http from "http";
import { Trainer } from "./trainer";

// =========================================================

const app: Express = express();
const trainer: Trainer = new Trainer("data/state.txt", "data/log.txt");

// Periodically swipe timeout tasks.
setInterval(() => trainer.stateUpdate(), 10 * 1000);

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.text());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "origin, X-Requested-With,Content-Type,Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "GET PATCH DELETE POST");
    return res.status(200).json({});
  }
  next();
});

app.use(express.static("data"));

app.get("/", (req, res) => {
  var result =
    "/state.txt to see all states<br/>" +
    "/log.txt to see all logs<br/>" +
    "/stop to stop current training<br/>" +
    "/manualTrain/[name] to manually stop current training schedule and override with [name]<br/>";
  res.send(result);
});

app.get("/stop", (req, res) => {
  trainer.stopTraining();
  res.send("Done.");
});

app.get("/manualTrain/:name", (req, res) => {
  trainer.manualTrain(req.params.name);
  res.send("Done.");
});

app.get("/getTask", (req, res) => {
  const task = trainer.getNextTask();
  res.send(JSON.stringify(task));
});

app.get("/submitTask/:pin/:result", (req, res) => {
  trainer.submitTask(parseInt(req.params.pin), parseInt(req.params.result));
  res.send("Done.");
});

app.use((req, res, next) => {
  const error = new Error("not found");
  return res.status(404).json({
    message: error.message,
  });
});

const HTTP_PORT: any = process.env.HTTP_PORT ?? 8844;

const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () =>
  console.log(`http server is running on port ${HTTP_PORT}`)
);
