import { Player, PlayerMove, Players } from "../common/entity";
import { GameRound, GameStatus } from "../common/game_round";
import { randint } from "../common/language";
import {
  DefaultParams,
  KingKong,
  KingKongParams,
} from "../browser/ai/kingkong";
import * as fs from "fs";

export type ParamSearchConfig =
  | {
      type: "string";
      path: string;
      values: Array<string>;
    }
  | {
      type: "number";
      path: string;
      step: number;
      min: number | null;
      max: number | null;
      numSteps: number;
    };

export type TrainingConfig = {
  taskExecutionTimeout: number;
  numDuelsPerTest: number;
  paramSearchConfigs: { [name: string]: ParamSearchConfig[] };
};

export const DefaultTrainingConfig: TrainingConfig = {
  taskExecutionTimeout: 60 * 15,
  numDuelsPerTest: 10,
  paramSearchConfigs: {
    reproduceRate: [
      {
        path: "reproduceRate",
        type: "number",
        numSteps: 2,
        step: 0.1,
        min: 0,
        max: 1,
      },
    ],
    defendMoveRate: [
      {
        path: "defendMoveRate",
        type: "number",
        numSteps: 2,
        step: 0.05,
        min: 0,
        max: 1,
      },
    ],
    surviveRate: [
      {
        path: "surviveRate",
        type: "number",
        numSteps: 2,
        step: 0.05,
        min: 0,
        max: 1,
      },
    ],
    keepOrderRate: [
      {
        path: "keepOrderRate",
        type: "number",
        numSteps: 2,
        step: 0.05,
        min: 0,
        max: 1,
      },
    ],
    mutationRate: [
      {
        path: "mutationRate",
        type: "number",
        numSteps: 2,
        step: 0.05,
        min: 0,
        max: 1,
      },
    ],
    evalCombos: [
      {
        path: "evalRate",
        type: "number",
        numSteps: 2,
        step: 0.05,
        min: 0,
        max: 1,
      },
      {
        path: "evalMode",
        type: "string",
        values: ["average", "min", "max"],
      },
    ],
    skillValue: [
      {
        path: "skillValue",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    levelValueBase1: [
      {
        path: "levelValueBase.1",
        type: "number",
        numSteps: 2,
        step: 2,
        min: 0,
        max: null,
      },
    ],
    levelValueBase2: [
      {
        path: "levelValueBase.2",
        type: "number",
        numSteps: 2,
        step: 4,
        min: 0,
        max: null,
      },
    ],
    levelValueBase3: [
      {
        path: "levelValueBase.3",
        type: "number",
        numSteps: 2,
        step: 6,
        min: 0,
        max: null,
      },
    ],
    skillLevelMultiplier2: [
      {
        path: "skillLevelMultiplier.2",
        type: "number",
        numSteps: 2,
        step: 0.1,
        min: 0,
        max: null,
      },
    ],
    skillLevelMultiplier3: [
      {
        path: "skillLevelMultiplier.3",
        type: "number",
        numSteps: 2,
        step: 0.1,
        min: 0,
        max: null,
      },
    ],
    penaltyNoRetreatSkillInLast3Rows: [
      {
        path: "penaltyNoRetreatSkillInLast3Rows",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    valueToHalveWinRate: [
      {
        path: "valueToHalveWinRate",
        type: "number",
        numSteps: 2,
        step: 10,
        min: 20,
        max: null,
      },
    ],
    valueOfAdvancing1Row: [
      {
        path: "valueOfAdvancing1Row",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    valueOfAdvancing2Rows: [
      {
        path: "valueOfAdvancing2Rows",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    valueOfAdvancing3RowsOrMore: [
      {
        path: "valueOfAdvancing3RowsOrMore",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    edgePenalty: [
      {
        path: "edgePenalty",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    threatenAndDefendablePenalty: [
      {
        path: "threatenAndDefendablePenalty",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    threatenAndNotDefendablePenalty1: [
      {
        path: "threatenAndNotDefendablePenalty.1",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    threatenAndNotDefendablePenalty2: [
      {
        path: "threatenAndNotDefendablePenalty.2",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    threatenAndNotDefendablePenalty3: [
      {
        path: "threatenAndNotDefendablePenalty.3",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    supplyIncomeValue: [
      {
        path: "supplyIncomeValue",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    valueOfCapturingNeutralResources: [
      {
        path: "supplyIncomeValue",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    valueOfCapturingEnemyResources: [
      {
        path: "supplyIncomeValue",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    kingThreatenedAndDefendablePenalty: [
      {
        path: "kingThreatenedAndDefendablePenalty",
        type: "number",
        numSteps: 2,
        step: 2,
        min: null,
        max: 0,
      },
    ],
    kingThreatenedAndNotDefendableButMovablePenalty: [
      {
        path: "kingThreatenedAndNotDefendableButMovablePenalty",
        type: "number",
        numSteps: 2,
        step: 2,
        min: null,
        max: 0,
      },
    ],
    kingThreatenedAndNotDefendableNorMovablePenalty: [
      {
        path: "kingThreatenedAndNotDefendableNorMovablePenalty",
        type: "number",
        numSteps: 2,
        step: 2,
        min: null,
        max: 0,
      },
    ],
    kingNotMoveablePenalty: [
      {
        path: "kingNotMoveablePenalty",
        type: "number",
        numSteps: 2,
        step: 2,
        min: null,
        max: 0,
      },
    ],
    kingSurroundedByEnemyUnitPenalty1: [
      {
        path: "kingSurroundedByEnemyUnitPenalty.1",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    kingSurroundedByEnemyUnitPenalty2: [
      {
        path: "kingSurroundedByEnemyUnitPenalty.2",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    kingSurroundedByEnemyUnitPenalty3: [
      {
        path: "kingSurroundedByEnemyUnitPenalty.3",
        type: "number",
        numSteps: 2,
        step: 1,
        min: null,
        max: 0,
      },
    ],
    kingSurroundedByFriendlyUnitBonus1: [
      {
        path: "kingSurroundedByFriendlyUnitBonus.1",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    kingSurroundedByFriendlyUnitBonus2: [
      {
        path: "kingSurroundedByFriendlyUnitBonus.2",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    kingSurroundedByFriendlyUnitBonus3: [
      {
        path: "kingSurroundedByFriendlyUnitBonus.3",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    kingOnResourceSquareBonus: [
      {
        path: "kingOnResourceSquareBonus",
        type: "number",
        numSteps: 2,
        step: 2,
        min: 0,
        max: null,
      },
    ],
    kingNextMoveIsResourceSqaureBonus: [
      {
        path: "kingNextMoveIsResourceSqaureBonus",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    kingNextResourceMoveNotBlockedBonus: [
      {
        path: "kingNextResourceMoveNotBlockedBonus",
        type: "number",
        numSteps: 2,
        step: 1,
        min: 0,
        max: null,
      },
    ],
    kingCenterResourceSquareMultiplier: [
      {
        path: "kingCenterResourceSquareMultiplier",
        type: "number",
        numSteps: 2,
        step: 0.25,
        min: 0,
        max: null,
      },
    ],
    valueOfNonCentralGrid: [
      {
        path: "valueOfNonCentralGrid",
        type: "number",
        numSteps: 2,
        step: 0.25,
        min: 0,
        max: null,
      },
    ],
    valueOfCentralGrid: [
      {
        path: "valueOfCentralGrid",
        type: "number",
        numSteps: 2,
        step: 0.25,
        min: 0,
        max: null,
      },
    ],
    valueOfResourceGrid: [
      {
        path: "valueOfResourceGrid",
        type: "number",
        numSteps: 2,
        step: 0.25,
        min: 0,
        max: null,
      },
    ],
  },
};

// Hardcoded from binominal test.
// From excel: BINON.DIST(N, K, 0.5, TRUE).
// min: N, minimum samples required.
// rejectIfScoreLessThenOrEqualTo: K, reject if testScore is lower.
const EarlyRejects = [
  { min: 5, rejectIfScoreLessThenOrEqualTo: 0 },
  { min: 8, rejectIfScoreLessThenOrEqualTo: 1 },
  { min: 11, rejectIfScoreLessThenOrEqualTo: 2 },
  { min: 13, rejectIfScoreLessThenOrEqualTo: 3 },
  { min: 16, rejectIfScoreLessThenOrEqualTo: 4 },
  { min: 18, rejectIfScoreLessThenOrEqualTo: 5 },
  { min: 21, rejectIfScoreLessThenOrEqualTo: 6 },
  { min: 23, rejectIfScoreLessThenOrEqualTo: 7 },
  { min: 26, rejectIfScoreLessThenOrEqualTo: 8 },
  { min: 28, rejectIfScoreLessThenOrEqualTo: 9 },
  { min: 30, rejectIfScoreLessThenOrEqualTo: 10 },
  { min: 33, rejectIfScoreLessThenOrEqualTo: 11 },
  { min: 35, rejectIfScoreLessThenOrEqualTo: 12 },
  { min: 37, rejectIfScoreLessThenOrEqualTo: 13 },
  { min: 40, rejectIfScoreLessThenOrEqualTo: 14 },
  { min: 42, rejectIfScoreLessThenOrEqualTo: 15 },
  { min: 44, rejectIfScoreLessThenOrEqualTo: 16 },
  { min: 47, rejectIfScoreLessThenOrEqualTo: 17 },
  { min: 49, rejectIfScoreLessThenOrEqualTo: 18 },
];

type TestGroup = {
  change: Partial<KingKongParams>;
  testScore: number;
  controlScore: number;
  isComplete: boolean;
  rejected: boolean;
};

const TaskPinRange = 1000000;

export type TaskRecord = {
  testGroupIndex: number;
  testGroupPlayer: Player;
  startTimeStamp: number;
  pin: number;
};

export type TrainingState = {
  bestParams: KingKongParams;
  currentTrainingState: {
    name: string;
    testGroups: TestGroup[];
  } | null;
  tasks: TaskRecord[];
};

export type Task = {
  p1: KingKongParams;
  p2: KingKongParams;
  pin: number;
};

export class Trainer {
  config: TrainingConfig;
  statePath: string;
  state: TrainingState;
  logStream: fs.WriteStream;

  constructor(
    statePath: string,
    logPath: string,
    config: TrainingConfig = DefaultTrainingConfig
  ) {
    this.config = config;
    this.statePath = statePath;
    this.logStream = fs.createWriteStream(logPath, { flags: "a" });
    this.state = this._readTrainingState();
  }

  _log(line: string): void {
    this.logStream.write(`[${(new Date()).toLocaleString()}]    ${line}\n`);
  }

  _readTrainingState(): TrainingState {
    this._log(`Loading state file: ${this.statePath}`);
    try {
      const data = fs.readFileSync(this.statePath);
      return JSON.parse(this.statePath);
    } catch (e) {
      this._log(`Failed to load state, using default internal state.`);
      return {
        bestParams: DefaultParams,
        currentTrainingState: null,
        tasks: [],
      };
    }
  }

  _saveTrainingState(): void {
    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  _getParam(params: Partial<KingKongParams>, path: string): any {
    const pathSplit = path.split(".");
    var result: any = params;
    for (var i = 0; i < pathSplit.length; i++) {
      result = result[pathSplit[i]];
      if (result == null) {
        throw new Error(`Can not access path ${path} from param ${params}.`);
      }
    }
    return result;
  }

  _setParam(params: Partial<KingKongParams>, path: string, value: any): void {
    const pathSplit = path.split(".");
    var obj: any = params;
    for (var i = 0; i < pathSplit.length; i++) {
      if (i == pathSplit.length - 1) {
        obj[pathSplit[i]] = value;
      } else {
        if (obj[pathSplit[i]] == null) {
          obj[pathSplit[i]] = {};
        }
        obj = obj[pathSplit[i]];
      }
    }
  }

  _initializeTestGroups(
    currentParams: KingKongParams,
    configs: ParamSearchConfig[],
    index: number,
    change: Partial<KingKongParams>,
    outTestGroups: TestGroup[]
  ): void {
    if (index >= configs.length) {
      outTestGroups.push({
        change: JSON.parse(JSON.stringify(change)),
        testScore: 0,
        controlScore: 0,
        isComplete: false,
        rejected: false,
      });
      return;
    }
    const config = configs[index];
    const currentVal = this._getParam(currentParams, config.path);
    if (config.type == "string") {
      config.values.forEach((val) => {
        if (val == currentVal) {
          return;
        }
        this._setParam(change, config.path, val);
        this._initializeTestGroups(
          currentParams,
          configs,
          index + 1,
          change,
          outTestGroups
        );
      });
    } else {
      for (var i = -config.numSteps; i <= config.numSteps; i++) {
        if (i == 0) {
          continue;
        }
        const newVal = currentVal + i * config.step;
        if (
          (config.min != null && newVal < config.min) ||
          (config.max != null && newVal > config.max)
        ) {
          continue;
        }
        this._setParam(change, config.path, newVal);
        this._initializeTestGroups(
          currentParams,
          configs,
          index + 1,
          change,
          outTestGroups
        );
      }
    }
  }

  _startNewState(): void {
    const names = Object.keys(this.config.paramSearchConfigs);
    const name = names[randint(names.length)];
    this._initTraining(name);
    this._saveTrainingState();
  }

  _initTraining(name: string): void {
    const config = this.config.paramSearchConfigs[name];
    const testGroups: TestGroup[] = [];
    this._initializeTestGroups(
      this.state.bestParams,
      config,
      0,
      {},
      testGroups
    );
    this.state.currentTrainingState = {
      name,
      testGroups,
    };
    this._log(`Start tuning ${name}, with ${testGroups.length} test groups.`);
    testGroups.forEach((group, i) => {
      this._log(`Group ${i}: ${JSON.stringify(group.change)}`);
    });
  }

  _pickGroup(): number | null {
    const current = this.state.currentTrainingState;
    if (current == null) {
      throw new Error(`currentTrainingState should not be null.`);
    }

    const validGroupIndex: number[] = [];
    current.testGroups.forEach((g, i) => {
      if (!g.isComplete) {
        const runningTasks = this.state.tasks.filter(
          (task) => task.testGroupIndex == i
        ).length;
        if (
          runningTasks + g.testScore + g.controlScore <
          this.config.numDuelsPerTest
        ) {
          validGroupIndex.push(i);
        }
      }
    });
    if (validGroupIndex.length == 0) {
      return null;
    }
    return validGroupIndex[randint(validGroupIndex.length)];
  }

  // Return true if we are 95% confident that result is worse than null hypothesis.
  _binominalTest(n: number, k: number): boolean {
    if (n >= 50) {
      const z = (k - n / 2 - 0.5) / Math.sqrt(n / 4);
      if (z < -1.65) {
        return true;
      }
    } else {
      const reject =
        EarlyRejects.findIndex(
          (rule) => n >= rule.min && k <= rule.rejectIfScoreLessThenOrEqualTo
        ) >= 0;
      if (reject) {
        return true;
      }
    }
    return false;
  }

  _groupStatsUpdate(group: TestGroup): void {
    const n = group.testScore + group.controlScore;
    const k = group.testScore;
    group.rejected = this._binominalTest(n, k);
    if (group.rejected) {
      group.isComplete = true;
    }

    if (n >= this.config.numDuelsPerTest) {
      group.isComplete = true;
    }
  }

  stateUpdate(): void {
    const current = this.state.currentTrainingState;
    if (current != null) {
      const completed =
        current.testGroups.findIndex((group) => !group.isComplete) < 0;
      if (completed) {
        this._log(
          `[Important] Param search on ${current.name} is completed.`
        );
        const groups = [...current.testGroups];
        groups.sort(
          (a, b) =>
            -(
              a.testScore / (a.testScore + a.controlScore) -
              b.testScore / (b.testScore + b.controlScore)
            )
        );
        groups.forEach((g) => {
          this._log(
            `Group ${JSON.stringify(g.change)}, Score: ${g.testScore}:${
              g.controlScore
            }, Win rate: ${Math.round(
              (g.testScore / (g.testScore + g.controlScore)) * 100
            )}%, Reject: ${g.rejected}`
          );
        });
        const bestGroup = groups[0];
        const bestGroupWinrate =
          bestGroup.testScore / (bestGroup.testScore + bestGroup.controlScore);
        if (bestGroupWinrate <= 0.5) {
          this._log(
            `Best test param ${JSON.stringify(
              bestGroup.change
            )} is no better than current param.`
          );
        } else {
          const statsSig = this._binominalTest(
            bestGroup.testScore + bestGroup.controlScore,
            bestGroup.controlScore
          );
          this._log(
            `Best test param ${JSON.stringify(
              bestGroup.change
            )} is better than current param, stats-sig=${statsSig}.`
          );
          this.state.bestParams = this._generateParam(
            this.state.bestParams,
            bestGroup.change
          );
        }

        this._stopCurrentTraining();
      }
    }

    this.state.tasks.forEach((task) => {
      if (this._isTaskTimeout(task)) {
        this._log(`Task time out: ${JSON.stringify(task)}`);
      }
    });
    this.state.tasks = this.state.tasks.filter(
      (task) => !this._isTaskTimeout(task)
    );

    this._saveTrainingState();
  }

  _isTaskTimeout(task: TaskRecord): boolean {
    const time = Date.now() / 1000;
    return task.startTimeStamp + this.config.taskExecutionTimeout < time;
  }

  _apply(out: any, change: any): void {
    Object.keys(change).forEach((key) => {
      const val = change[key];
      const isObject = typeof val === "object" && val !== null;
      if (isObject) {
        this._apply(out[key], val);
      } else {
        out[key] = val;
      }
    });
  }

  _generateParam(
    base: KingKongParams,
    change: Partial<KingKongParams>
  ): KingKongParams {
    const out = JSON.parse(JSON.stringify(base));
    this._apply(out, change);
    return out;
  }

  _stopCurrentTraining(): void {
    this.state.currentTrainingState = null;
    if (this.state.tasks.length > 0) {
      this._log(
        `Current training finishes with ${
          this.state.tasks.length
        } aborted tasks: ${JSON.stringify(this.state.tasks)}.`
      );
      this.state.tasks = [];
    }
  }

  manualTrain(name: string): void {
    this._stopCurrentTraining();
    this._initTraining(name);
    this._saveTrainingState();
  }

  stopTraining(): void {
    this._log(`Manually stop training.`);
    this._stopCurrentTraining();
    this._saveTrainingState();
  }

  getNextTask(): Task | null {
    if (this.state.currentTrainingState == null) {
      this._startNewState();
    }
    const testGroupIndex = this._pickGroup();
    if (testGroupIndex == null) {
      return null;
    }

    const testGroupPlayer = Math.random() < 0.5 ? Player.P2 : Player.P1;
    const pin = randint(TaskPinRange);
    const taskRecord = {
      testGroupIndex,
      testGroupPlayer,
      startTimeStamp: Date.now() / 1000,
      pin,
    };
    this.state.tasks.push(taskRecord);
    this._saveTrainingState();

    const testParams = this._generateParam(
      this.state.bestParams,
      this.state.currentTrainingState!.testGroups[testGroupIndex].change
    );
    const task =
      testGroupPlayer == Player.P1
        ? {
            pin,
            p1: testParams,
            p2: this.state.bestParams,
          }
        : {
            pin,
            p1: this.state.bestParams,
            p2: testParams,
          };
    return task;
  }

  submitTask(pin: number, result: GameStatus): void {
    const taskIndex = this.state.tasks.findIndex((task) => task.pin == pin);
    if (taskIndex < 0) {
      this._log(`Task pin ${pin} can not be found.`);
      return;
    }
    const task = this.state.tasks.splice(taskIndex, 1)[0];
    const group =
      this.state.currentTrainingState!.testGroups[task.testGroupIndex];

    if (result == GameStatus.Tied) {
      group.testScore += 0.5;
      group.controlScore += 0.5;
    } else if (
      (result == GameStatus.WonByPlayer1 &&
        task.testGroupPlayer == Player.P1) ||
      (result == GameStatus.WonByPlayer2 && task.testGroupPlayer == Player.P2)
    ) {
      group.testScore += 1;
    } else if (
      (result == GameStatus.WonByPlayer2 &&
        task.testGroupPlayer == Player.P1) ||
      (result == GameStatus.WonByPlayer1 && task.testGroupPlayer == Player.P2)
    ) {
      group.controlScore += 1;
    } else {
      throw new Error(
        `Unexpected game result ${result} and testGroupPlayer ${task.testGroupPlayer}`
      );
    }

    this._groupStatsUpdate(group);
    this._log(
      `Testing ${JSON.stringify(group.change)}, TestGroup ${
        task.testGroupPlayer
      }, Winner ${result}, Score ${group.testScore}:${
        group.controlScore
      }, Completed ${group.isComplete}, Rejected ${group.rejected}`
    );
    this.stateUpdate();
  }
}
