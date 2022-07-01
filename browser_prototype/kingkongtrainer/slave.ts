import { KingKong, KingKongParams } from "../browser/ai/kingkong";
import { Players, PlayerMove, Player } from "../common/entity";
import { GameStatus, GameRound } from "../common/game_round";
import { Task } from "./trainer";
import axios from 'axios';

function duel(param1: KingKongParams, param2: KingKongParams): GameStatus {
  var round = GameRound.new_game();
  while (round.status() == GameStatus.Ongoing) {
    const moves: Players<PlayerMove> = {
      [Player.P1]: new KingKong(param1).think(round, Player.P1, false),
      [Player.P2]: new KingKong(param2).think(round, Player.P2, false),
    };
    round = round.proceed(moves);
  }
  return round.status();
}

var prevArg: string | null = null;
var masterHostname: string = "";
var hostPort: number = 8844;

process.argv.forEach((arg) => {
  if (arg.startsWith('--')) {
    prevArg = arg;
    return;
  }

  if (prevArg == "--master") {
    masterHostname = arg;
    return;
  }

  if (prevArg == "--port") {
    hostPort = parseInt(arg);
    return;
  }
});

async function getTask(): Promise<Task | null> {
  const task = await axios.get<Task|null>(`http://${masterHostname}:${hostPort}/getTask`);
  return task.data;
}

async function submitTask(pin:number, result:GameStatus): Promise<void> {
  await axios.get<void>(`http://${masterHostname}:${hostPort}/submitTask/${pin}/${result}`);
}

async function rest(): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 5000);
  });
}

async function workwork() {
  while (true) {
    try {
      const task = await getTask();
      if (task == null) {
        console.log(`No task. Resting...`);
        await rest();
        continue;
      }

      console.log(`Working on task ${task.pin}...`);
      const result = duel(task.p1, task.p2);
      await submitTask(task.pin, result);
      console.log(`Task ${task.pin} completes.`);
    } catch (error) {
      console.error(error);
      console.log(`Ignoring error. Sleep and continue.`);
      await rest();
    }
  }
}

workwork();
