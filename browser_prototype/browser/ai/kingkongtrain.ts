import { Player, PlayerMove, Players } from "../../common/entity";
import { GameRound, GameStatus } from "../../common/game_round";
import { randint } from "../../common/language";
import { DefaultParams, KingKong, KingKongParams } from "./kingkong";
const fs = require("fs");

type ParamSearchConfig =
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

const NumDuelsPerTest = 10;

const TrainingConfig: { [name: string]: ParamSearchConfig[] } = {
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
      values: ["average", "min", "max"]
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
};

type TestGroup = {
  change: Partial<KingKongParams>;
  testScore: number;
  controlScore: number;
  isComplete: boolean;
  rejected: boolean;
};

type TrainingState = {
  bestParams: KingKongParams;
  currentTrainingState: {
    name: string;
    testGroups: TestGroup[];
  } | null;
};

function readTrainingState(path: string): TrainingState {
  console.log(`Loading state file: ${path}`);
  try {
    const data = fs.readFileSync(path);
    return JSON.parse(data);
  } catch (e) {
    console.log(`Failed to load state, using default internal state.`);
    return {
      bestParams: DefaultParams,
      currentTrainingState: null,
    };
  }
}

function saveTrainingState(path: string, state: TrainingState): void {
  fs.writeFileSync(path, JSON.stringify(state, null, 2));
}

function getParam(params: Partial<KingKongParams>, path: string): any {
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

function setParam(
  params: Partial<KingKongParams>,
  path: string,
  value: any
): void {
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

function initializeTestGroups(
  currentParams: KingKongParams,
  configs: ParamSearchConfig[],
  index: number,
  change: Partial<KingKongParams>,
  outTestGroups: TestGroup[]
): void {
  if (index >= configs.length) {
    outTestGroups.push({
      change: {...change},
      testScore: 0,
      controlScore: 0,
      isComplete: false,
      rejected: false,
    });
    return;
  }
  const config = configs[index];
  const currentVal = getParam(currentParams, config.path);
  if (config.type == "string") {
    config.values.forEach((val) => {
      if (val == currentVal) {
        return;
      }
      setParam(change, config.path, val);
      initializeTestGroups(
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
      setParam(change, config.path, newVal);
      initializeTestGroups(
        currentParams,
        configs,
        index + 1,
        change,
        outTestGroups
      );
    }
  }
}

function startNewState(state: TrainingState): void {
  const names = Object.keys(TrainingConfig);
  const name = names[randint(names.length)];
  const config = TrainingConfig[name];
  const testGroups: TestGroup[] = [];
  initializeTestGroups(state.bestParams, config, 0, {}, testGroups);
  state.currentTrainingState = {
    name,
    testGroups,
  };
  console.log(`Start tuning ${name}, with ${testGroups.length} test groups.`);
  testGroups.forEach((group, i) => {
    console.log(`Group ${i}: ${JSON.stringify(group.change)}`);
  });
  saveTrainingState(stateFilePath, state);
}

function pickGroup(state: TrainingState): TestGroup {
  const current = state.currentTrainingState;
  if (current == null) {
    throw new Error(`currentTrainingState should not be null.`);
  }

  const validGroups = current.testGroups.filter(g => !g.isComplete);
  return validGroups[randint(validGroups.length)];
}

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

// Return true if we are 95% confident that result is worse than null hypothesis.
function binominalTest(n: number, k: number): boolean {
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

function groupStatsUpdate(group: TestGroup): void {
  const n = group.testScore + group.controlScore;
  const k = group.testScore;
  group.rejected = binominalTest(n, k);

  if (n >= NumDuelsPerTest) {
    group.isComplete = true;
  }
}

function stateUpdate(state: TrainingState): void {
  const current = state.currentTrainingState;
  if (current == null) {
    throw new Error(`currentTrainingState should not be null.`);
  }

  const completed =
    current.testGroups.findIndex((group) => !group.isComplete) < 0;
  if (completed) {
    console.log(`[Important] Param search on ${current.name} is completed.`);
    const groups = [...current.testGroups];
    groups.sort(
      (a, b) =>
        -(
          a.testScore / (a.testScore + a.controlScore) -
          b.testScore / (b.testScore + b.controlScore)
        )
    );
    groups.forEach((g) => {
      console.log(
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
      console.log(
        `Best test param ${JSON.stringify(
          bestGroup.change
        )} is no better than current param.`
      );
    } else {
      const statsSig = binominalTest(
        bestGroup.testScore + bestGroup.controlScore,
        bestGroup.controlScore
      );
      console.log(
        `Best test param ${JSON.stringify(
          bestGroup.change
        )} is better than current param, stats-sig=${statsSig}.`
      );
      state.bestParams = { ...state.bestParams, ...bestGroup.change };
    }
    state.currentTrainingState = null;
  }
  saveTrainingState(stateFilePath, state);
}

// ======================= Main =======================

var prevArg: string | null = null;
var stateFilePath: string = "state.txt";

process.argv.forEach((arg) => {
  if (arg == "--state") {
    prevArg = arg;
    return;
  }

  if (prevArg == "--state") {
    stateFilePath = arg;
    return;
  }
});

var trainingState: TrainingState = readTrainingState(stateFilePath);

while (true) {
  if (trainingState.currentTrainingState == null) {
    startNewState(trainingState);
  }

  const group = pickGroup(trainingState);
  const testParams = { ...trainingState.bestParams, ...group.change };

  var testGroupPlayer, result;
  if (Math.random() < 0.5) {
    result = duel(trainingState.bestParams, testParams);
    testGroupPlayer = Player.P2;
  } else {
    result = duel(testParams, trainingState.bestParams);
    testGroupPlayer = Player.P1;
  }

  if (result == GameStatus.Tied) {
    group.testScore += 0.5;
    group.controlScore += 0.5;
  } else if (
    (result == GameStatus.WonByPlayer1 && testGroupPlayer == Player.P1) ||
    (result == GameStatus.WonByPlayer2 && testGroupPlayer == Player.P2)
  ) {
    group.testScore += 1;
  } else if (
    (result == GameStatus.WonByPlayer2 && testGroupPlayer == Player.P1) ||
    (result == GameStatus.WonByPlayer1 && testGroupPlayer == Player.P2)
  ) {
    group.controlScore += 1;
  } else {
    throw new Error(
      `Unexpected game result ${result} and testGroupPlayer ${testGroupPlayer}`
    );
  }
  groupStatsUpdate(group);
  console.log(
    `Testing ${JSON.stringify(
      group.change
    )}, TestGroup ${testGroupPlayer}, Winner ${result}, Score ${
      group.testScore
    }:${group.controlScore}, Completed ${group.isComplete}, Rejected ${
      group.rejected
    }`
  );

  stateUpdate(trainingState);
}
