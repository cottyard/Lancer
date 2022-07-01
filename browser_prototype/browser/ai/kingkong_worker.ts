import { deserialize_player } from "../../common/entity";
import { GameRound } from "../../common/game_round";
import { DefaultParams, KingKong } from "./kingkong";

var kingkong: KingKong | null = null;

onmessage = function (e) {
  if (e.data == null) {
    if (kingkong != null) {
      kingkong.stopThinkingAsync();
    }
  }

  var timeStart: number = Date.now();
  
  kingkong = new KingKong({...DefaultParams, iterations: 150});
  kingkong.thinkAsync(
    GameRound.deserialize(e.data[0]),
    deserialize_player(e.data[1]),
    true,
    move => {
      const now = Date.now();
      const timeConsumed = now - timeStart;
      timeStart = now;
      this.postMessage([e.data[0], move.serialize(), timeConsumed])
    }
  );
};
