import {
  Action,
  ActionType,
  Coordinate,
  King,
  Move,
  Player,
  PlayerAction,
  PlayerMove,
  Skill,
  Unit,
} from "../../common/entity";
import { GameRound, GameStatus } from "../../common/game_round";
import { /*GameBoard, Heat,*/ GameBoard, Rule } from "../../common/rule";
import { randint } from "../../common/language";
import { g } from "../../common/global";

class StagingArea {
  move: PlayerMove;
  constructor(player: Player) {
    this.move = new PlayerMove(player);
  }

  action(board: GameBoard): PlayerAction {
    return Rule.validate_player_move(board, this.move);
  }

  rough_cost(board: GameBoard): number {
    // roughly estimate the cost in exchange for complexity
    // the rough cost will always be >= real cost to avoid over spending
    return this.move.moves.reduce<number>((total, m) => {
      let unit = board.unit.at(m.from)!;
      let skill = m.which_skill();
      let a;
      if (unit.capable(skill)) {
        let target = board.unit.at(m.to);
        if (target == null || unit.owner == target.owner) {
          // assume the more expensive action Move here instead of Defend
          a = new Action(m, ActionType.Move, unit);
        } else {
          a = new Action(m, ActionType.Attack, unit);
        }
      } else {
        a = new Action(m, ActionType.Upgrade, unit);
      }
      return total + a.cost;
    }, 0);
  }

  pop_move(): Move | null {
    let removed = this.move.moves.pop();
    return removed || null;
  }

  prepare_move(move: Move): void {
    this.move.extract((m: Move): m is Move => m.from.equals(move.from));
    this.move.moves.push(move);
  }

  prepare_moves(moves: Move[]): void {
    this.move.moves = moves;
  }
}

export type KingKongParams = {
  iterations: number;

  // Example: [{size: 100, iterations: 20}, {size: 50, iterations: 0}]
  // Means if current iteration >= 20, use 100 as size
  // Otherwise use 50 as size.
  // Note that it must be order by iterations (descending order).
  movePoolSize: { size: number; iterations: number }[];

  // Top X% moves will be used to generate next batch of moves.
  // Range: [0, 1]
  reproduceRate: number;

  // X% moves will be purely defends.
  defendMoveRate: number;

  // Top X% moves will be carried to next batch of moves without change.
  // Range: [0, 1]
  surviveRate: number;

  // X% moves generated from reproducing will keep relative order from parent.
  keepOrderRate: number;

  // There's X% chance to pick random move instead of using parent moves in reproduction.
  mutationRate: number;

  // Only lowest X% evals will be used.
  evalRate: number;

  // Let's say evalRate picked lowest 10 values.
  // Average returns average of them.
  // Max returns the 10th value.
  // Min returns the 1st value (evalRate is not needed for this mode).
  evalMode: "average" | "max" | "min";

  // Fluctuation in evaluation result to add some randomness.
  evalFluctuation: number;

  // Value of each skill.
  skillValue: number;

  // Value of each level.
  levelValueBase: { [level: number]: number };

  // Extra multiplier for skill value from high-level piece.
  // Their skills are stronger when encounter lower-level pieces.
  skillLevelMultiplier: { [level: number]: number };

  // Penalty for pieces advanced too aggressively without retreat skill.
  penaltyNoRetreatSkillInLast3Rows: number;

  // Needed for Value -> Win rate conversion.
  // E.g. if set to 100,
  //      it means win rate = 25% if opponent value leads by 100
  //      if means win rate = 12.5% if opponent value leads by 200
  valueToHalveWinRate: number;

  // Value of advancing N rows.
  valueOfAdvancing1Row: number;
  valueOfAdvancing2Rows: number;
  valueOfAdvancing3RowsOrMore: number;

  // Penalty for staying at edge. Should be negative.
  edgePenalty: number;

  // Penalty for being threatened (but defendable).
  threatenAndDefendablePenalty: number;

  // Penalty for being threatened and not defendable (need to run).
  // Will be multilied with unit level when evaluated.
  threatenAndNotDefendablePenalty: { [level: number]: number };

  // Value of each point of supply income.
  supplyIncomeValue: number;

  // Value of having piece on neutral/enemy resources.
  // Will be multiplied by supply in evaluation.
  valueOfCapturingNeutralResources: number;
  valueOfCapturingEnemyResources: number;

  // Penalty for King being threatened (but defendable).
  kingThreatenedAndDefendablePenalty: number;

  // Penalty for King being threatened and not defendable (but moveable).
  kingThreatenedAndNotDefendableButMovablePenalty: number;

  // Penalty for King being threatened and not defendable nor moveable.
  // Note that movable is just proxy.
  kingThreatenedAndNotDefendableNorMovablePenalty: number;

  // Penalty for King being not moveable.
  kingNotMoveablePenalty: number;

  // Penalty for King being surrounded by enemy pieces in +-2 area.
  kingSurroundedByEnemyUnitPenalty: { [level: number]: number };

  // Bonus for King being surrounded by friendly pieces in +-2 area.
  kingSurroundedByFriendlyUnitBonus: { [level: number]: number };

  // Bonus to incentivize king to take resource square.
  kingOnResourceSquareBonus: number;

  // Bonus to incentivize king to upgrade its move to take nearby resource sqaure.
  kingNextMoveIsResourceSqaureBonus: number;

  // Bonus to incentivize AI to unblock king from moving into/outof resource sqaure.
  kingNextResourceMoveNotBlockedBonus: number;

  // Extra multiplier to king summon bonuses for center resource sqaure.
  kingCenterResourceSquareMultiplier: number;

  // Value of non-central grid that you piece can reach.
  valueOfNonCentralGrid: number;

  // Value of central grid that you piece can reach.
  valueOfCentralGrid: number;

  // Value of resource grid that you piece can reach (mulitplied by supply).
  valueOfResourceGrid: number;
};

export const DefaultParams: KingKongParams = {
  iterations: 25,
  movePoolSize: [
    { iterations: 100, size: 140 },
    { iterations: 75, size: 120 },
    { iterations: 50, size: 100 },
    { iterations: 25, size: 80 },
    { iterations: 0, size: 60 },
  ],
  reproduceRate: 0.5,
  defendMoveRate: 0.1,
  surviveRate: 0.1,
  keepOrderRate: 0.9,
  mutationRate: 0.05,
  evalRate: 0.05,
  evalMode: "min",
  evalFluctuation: 5,

  skillValue: 8,
  levelValueBase: {
    1: 10,
    2: 20,
    3: 30,
  },
  skillLevelMultiplier: {
    1: 1,
    2: 1.5,
    3: 2,
  },
  penaltyNoRetreatSkillInLast3Rows: -5,
  valueToHalveWinRate: 100,
  valueOfAdvancing1Row: 2,
  valueOfAdvancing2Rows: 4,
  valueOfAdvancing3RowsOrMore: 6,
  edgePenalty: -3,
  threatenAndDefendablePenalty: -2,
  threatenAndNotDefendablePenalty: {
    1: -3,
    2: -5,
    3: -7,
  },
  supplyIncomeValue: 5,
  valueOfCapturingNeutralResources: 3,
  valueOfCapturingEnemyResources: 6,
  kingThreatenedAndDefendablePenalty: -8,
  kingThreatenedAndNotDefendableButMovablePenalty: -12,
  kingThreatenedAndNotDefendableNorMovablePenalty: -16,
  kingNotMoveablePenalty: -8,
  kingSurroundedByEnemyUnitPenalty: {
    1: -3,
    2: -5,
    3: -7,
  },
  kingSurroundedByFriendlyUnitBonus: {
    1: 2,
    2: 4,
    3: 6,
  },
  kingOnResourceSquareBonus: 10,
  kingNextMoveIsResourceSqaureBonus: 5,
  kingNextResourceMoveNotBlockedBonus: 5,
  kingCenterResourceSquareMultiplier: 1,
  valueOfNonCentralGrid: 0.25,
  valueOfCentralGrid: 1,
  valueOfResourceGrid: 0.5,
};

type MovePool = {
  [player: number]: Array<{
    move: PlayerMove;
    eval: number;
    values: Array<number>;
    action: PlayerAction | null;
  }>;
};

export class KingKong {
  params: KingKongParams;
  movePool: MovePool = {};
  round: GameRound = GameRound.new_game();
  player: Player = Player.P1;
  iter: number = 0;
  stopAsyncThink: boolean = false;

  constructor(params: KingKongParams = DefaultParams) {
    this.params = params;
  }

  think(round: GameRound, player: Player, verbose: boolean = true): PlayerMove {
    this.round = round;
    this.player = player;
    this.iter = 0;
    for (this.iter = 0; this.iter < this.params.iterations; this.iter++) {
      this.thinkForOneIteration(verbose, () => {});
    }
    return this.pickMove();
  }

  async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async thinkAsync(
    round: GameRound,
    player: Player,
    verbose: boolean = true,
    onMoveCallback: (move: PlayerMove) => void
  ): Promise<void> {
    this.round = round;
    this.player = player;
    this.iter = 0;
    this.stopAsyncThink = false;

    for (
      this.iter = 0;
      !this.stopAsyncThink && this.iter < this.params.iterations;
      this.iter++
    ) {
      this.thinkForOneIteration(verbose, onMoveCallback);
      // Sleep some time so the worker thread can process stopThinkingAsync message.
      await this.sleep(10);
    }
  }

  stopThinkingAsync(): void {
    this.stopAsyncThink = true;
  }

  thinkForOneIteration(
    verbose: boolean = true,
    onMoveCallback: (move: PlayerMove) => void
  ): void {
    if (this.iter == 0) {
      this.initiateMovePoolWithMonkeyMoves();
    } else {
      this.generateMovePool();
    }
    this.testMoves();
    if (verbose) {
      console.log(
        `Player=${this.player} Iteration=${this.iter}, Win Rate=${(
          this.movePool[this.player][0].eval * 100.0
        ).toFixed(2)}, Pool Size=${
          this.movePool[this.player].length
        } Best Move=${this.movePool[this.player][0].move.serialize()}}`
      );
    }
    onMoveCallback(this.pickMove());
  }

  getPoolSize(): number {
    for (var i = 0; i < this.params.movePoolSize.length; i++) {
      const config = this.params.movePoolSize[i];
      if (this.iter >= config.iterations) {
        return config.size;
      }
    }
    throw new Error(`Can not find move pool size for iteration ${this.iter}.`);
  }

  initiateMovePoolWithMonkeyMoves(): void {
    [Player.P1, Player.P2].forEach((player) => {
      this.movePool[player] = [];
      const allMoves = Rule.valid_moves(this.round.board, player);
      for (var i = 0; i < this.getPoolSize(); i++) {
        this.movePool[player].push({
          move: this.randMove(player, allMoves, false, []),
          eval: 0,
          values: [],
          action: null,
        });
      }
    });
  }

  randMove(
    player: Player,
    moves: Move[],
    keepOrder: boolean,
    allMoves: Move[]
  ): PlayerMove {
    const selectedMove: Set<number> = new Set();
    const moveIndex: { [moveStr: string]: number } = {};
    var area = new StagingArea(player);
    const supply = this.round.supply(player);
    while (moves.length > selectedMove.size) {
      const i = randint(moves.length);
      if (selectedMove.has(i)) {
        continue;
      }
      selectedMove.add(i);
      var move = moves[i];
      if (allMoves.length > 0 && Math.random() < this.params.mutationRate) {
        move = allMoves[randint(allMoves.length)];
      }
      const moveStr = move.serialize();
      if (moveIndex[moveStr] != null) {
        continue;
      }
      area.prepare_move(move);
      if (area.rough_cost(this.round.board) > supply) {
        area.pop_move();
        break;
      }
      moveIndex[moveStr] = i;
    }
    if (keepOrder) {
      const sortedMoves = [...area.move.moves];
      sortedMoves.sort(
        (a, b) => moveIndex[a.serialize()] - moveIndex[b.serialize()]
      );
      area = new StagingArea(player);
      area.prepare_moves(sortedMoves);
      while (area.rough_cost(this.round.board) > supply) {
        area.pop_move();
      }
    }
    return area.move;
  }

  generateMovePool(): void {
    const newPool: MovePool = {};

    [Player.P1, Player.P2].forEach((player) => {
      newPool[player] = [];
      const oldPool = this.movePool[player];
      const numSurvivedMoves = Math.floor(
        this.params.surviveRate * oldPool.length
      );
      const numDefendMoves = Math.floor(
        this.params.defendMoveRate * this.getPoolSize()
      );
      const numNewMoves =
        this.getPoolSize() - numDefendMoves - numSurvivedMoves;
      const numReproduceMoves = oldPool.length * this.params.reproduceRate;
      for (var i = 0; i < numSurvivedMoves; i++) {
        newPool[player].push({
          move: oldPool[i].move,
          eval: 0,
          values: [],
          action: oldPool[i].action,
        });
      }
      const allMoves = Rule.valid_moves(this.round.board, player);
      for (var i = 0; i < numDefendMoves; i++) {
        const defendMoves = allMoves.filter((m) => {
          const fromUnit = this.round.board.unit.at(m.from);
          const toUnit = this.round.board.unit.at(m.to);
          return (
            fromUnit!.capable(m.which_skill()) &&
            toUnit != null &&
            toUnit.owner == player
          );
        });
        newPool[player].push({
          move: this.randMove(player, defendMoves, false, defendMoves),
          eval: 0,
          values: [],
          action: null,
        });
      }
      for (var i = 0; i < numNewMoves; i++) {
        const move1 = oldPool[randint(numReproduceMoves)].move.moves;
        const move2 = oldPool[randint(numReproduceMoves)].move.moves;
        newPool[player].push({
          move: this.randMove(
            player,
            [...move1, ...move2],
            Math.random() < this.params.keepOrderRate,
            allMoves
          ),
          eval: 0,
          values: [],
          action: null,
        });
      }
    });
    this.movePool = newPool;
  }

  testMoves(): void {
    [Player.P1, Player.P2].forEach((player) => {
      this.movePool[player].forEach((move) => {
        move.action = Rule.validate_player_move(this.round.board, move.move);
      });
    });
    this.movePool[Player.P1].forEach((move1) => {
      this.movePool[Player.P2].forEach((move2) => {
        const round = this.round.proceed_with_action({
          [Player.P1]: move1.action!,
          [Player.P2]: move2.action!,
        });
        const value = this.evaluate(round);
        const winRate = this.valueToWinrate(value);
        move1.values.push(winRate);
        move2.values.push(1 - winRate);
      });
    });

    [Player.P1, Player.P2].forEach((player) => {
      this.movePool[player].forEach((m) => {
        m.values.sort();
        m.eval = this.evalValues(m.values);
      });
      this.movePool[player].sort((a, b) => b.eval - a.eval);
    });
  }

  evalValues(values: Array<number>): number {
    if (this.params.evalMode == "min") {
      return values[0];
    } else {
      const end = Math.floor((values.length - 1) * this.params.evalRate);
      if (this.params.evalMode == "max") {
        return values[end];
      } else {
        var result = 0;
        for (var i = 0; i <= end; i++) {
          result += values[i];
        }
        return result / (end + 1);
      }
    }
  }

  valueToWinrate(value: number): number {
    if (value >= 0) {
      return 1 - Math.pow(0.5, 1 + value / this.params.valueToHalveWinRate);
    } else {
      return Math.pow(0.5, 1 - value / this.params.valueToHalveWinRate);
    }
  }

  pickMove(): PlayerMove {
    const pool = this.movePool[this.player];
    return pool[0].move;
  }

  evaluate(round: GameRound): number {
    const status = round.status();
    if (status == GameStatus.Tied) {
      return 0;
    }
    if (status == GameStatus.WonByPlayer1) {
      return Infinity;
    }
    if (status == GameStatus.WonByPlayer2) {
      return -Infinity;
    }

    const board = round.board;
    var result = (Math.random() * 2 - 1) * this.params.evalFluctuation;
    board.unit.iterate_units((unit, coord) => {
      result +=
        this.getUnitValue(board, unit, coord) *
        (unit.owner == Player.P1 ? 1 : -1);
    });
    result += this.getResourceValue(round);
    result += this.getSupplyValue(round);
    result += this.getMapControlValue(round);
    return result;
  }

  getMapControlValue(round: GameRound): number {
    var value = 0;
    for (var x = 0; x < g.board_size_x; x++) {
      for (var y = 0; y < g.board_size_y; y++) {
        const heat = round.board.heat.at(new Coordinate(x, y));
        var scale = this.params.valueOfNonCentralGrid;
        if (
          Math.abs(x - Rule.resource_grid_center.x) <= 2 &&
          Math.abs(y - Rule.resource_grid_center.y) <= 2
        ) {
          scale += this.params.valueOfCentralGrid;
        }
        // TODO: inefficient.
        const resourceGridIndex = Rule.resource_grids.findIndex(
          (coord) => coord.x == x && coord.y == y
        );
        if (resourceGridIndex >= 0) {
          scale +=
            this.params.valueOfResourceGrid *
            Rule.resource_grid_supplies[resourceGridIndex];
        }
        if (heat.friendly(Player.P1)) {
          value += scale;
        }
        if (heat.hostile(Player.P1)) {
          value -= scale;
        }
      }
    }
    return value;
  }

  getSupplyValue(round: GameRound): number {
    return (
      round.supply(Player.P1) -
      round.supply(Player.P2) +
      this.params.supplyIncomeValue *
        (round.supply_income(Player.P1) - round.supply_income(Player.P2))
    );
  }

  getResourceValue(round: GameRound): number {
    var value: number = 0;
    for (var i = 0; i < round.resources.length; i++) {
      const position = Rule.resource_grids[i];
      const unit = round.board.unit.at(position);
      if (unit == null) {
        continue;
      }

      const resource = round.resources[i];
      const supply = Rule.resource_grid_supplies[i];
      const sign = unit.owner == Player.P1 ? 1 : -1;
      if (!resource.captured) {
        value += this.params.valueOfCapturingNeutralResources * supply * sign;
      } else if (resource.captured && resource.player != unit.owner) {
        value += this.params.valueOfCapturingEnemyResources * supply * sign;
      }
    }

    return value;
  }

  getUnitValue(board: GameBoard, unit: Unit, coord: Coordinate): number {
    if (unit.type == King) {
      return (
        this.getKingPenalty(board, unit, coord) +
        this.getKingSummonBonus(board, unit, coord)
      );
    }
    return (
      this.getUnitSkillAndLevelValue(unit, coord) +
      this.getUnitPositionalValue(board, unit, coord)
    );
  }

  getKingSummonBonus(board: GameBoard, unit: Unit, coord: Coordinate): number {
    var minDist = g.board_size_x + g.board_size_y;
    var nearbyResource = Rule.resource_grid_center;
    Rule.resource_grids.forEach((r) => {
      const dist = Math.max(Math.abs(r.x - coord.x), Math.abs(r.y - coord.y));
      if (dist < minDist) {
        minDist = dist;
        nearbyResource = r;
      }
    });

    const multiplier = nearbyResource.equals(Rule.resource_grid_center)
      ? this.params.kingCenterResourceSquareMultiplier
      : 1;

    var canMoveToNextStep = false;
    const nextMove: Skill | null = unit.current.as_list()[0];
    const nextPosition =
      nextMove != null ? coord.add(nextMove.x, nextMove.y) : null;
    if (nextPosition != null) {
      const nextPositionIsThreatened =
        board.heat.at(nextPosition).hostile(unit.owner) == 0;
      const pieceAtNextPosition = board.unit.at(nextPosition);
      const nextPositionIsBlocked =
        pieceAtNextPosition == null || pieceAtNextPosition.owner != unit.owner;
      if (!nextPositionIsThreatened && !nextPositionIsBlocked) {
        canMoveToNextStep = true;
      }
    }

    var value = 0;
    if (minDist == 0) {
      value += this.params.kingOnResourceSquareBonus;
      if (canMoveToNextStep) {
        value += this.params.kingNextResourceMoveNotBlockedBonus;
      }
    } else {
      const hasSkill =
        nextPosition != null && nextPosition.equals(nearbyResource);
      if (hasSkill) {
        value += this.params.kingNextMoveIsResourceSqaureBonus;
        if (canMoveToNextStep) {
          value += this.params.kingNextResourceMoveNotBlockedBonus;
        }
      }
    }

    return value * multiplier;
  }

  getKingPenalty(board: GameBoard, unit: Unit, coord: Coordinate): number {
    const defended = board.heat.at(coord).friendly(unit.owner) > 0;
    const attacked = board.heat.at(coord).hostile(unit.owner) > 0;
    const skills = unit.current.as_list();
    var moveable = false;
    if (skills.length > 0) {
      const next = coord.add(skills[0].x, skills[0].y);
      if (next != null) {
        const targetUnit = board.unit.at(next);
        if (
          (targetUnit == null || targetUnit.owner != unit.owner) &&
          board.heat.at(next).hostile(unit.owner) == 0
        ) {
          moveable = true;
        }
      }
    }

    var value = 0;
    if (attacked) {
      if (defended) {
        value += this.params.kingThreatenedAndDefendablePenalty;
      } else {
        if (moveable) {
          value += this.params.kingThreatenedAndNotDefendableButMovablePenalty;
        } else {
          value += this.params.kingThreatenedAndNotDefendableNorMovablePenalty;
        }
      }
    }
    if (!moveable) {
      value += this.params.kingNotMoveablePenalty;
    }

    for (var dx = -2; dx <= 2; dx++) {
      for (var dy = -2; dy <= 2; dy++) {
        const nearbyCoord = coord.add(dx, dy);
        if (nearbyCoord == null) {
          continue;
        }
        const nearbyUnit = board.unit.at(nearbyCoord);
        if (nearbyUnit != null) {
          value +=
            nearbyUnit.owner != unit.owner
              ? this.params.kingSurroundedByEnemyUnitPenalty[nearbyUnit.level]
              : this.params.kingSurroundedByFriendlyUnitBonus[nearbyUnit.level];
        }
      }
    }
    return value;
  }

  getUnitSkillAndLevelValue(unit: Unit, coord: Coordinate): number {
    // TODO: inefficient.
    const skills = unit.current.as_list();
    const skillValue = skills.length * this.params.skillValue;

    var penalty = 0;
    if (unit.level == 1 && this.getUnitAdvancedRows(unit, coord) >= 6) {
      const hasRetreatSkill =
        skills.findIndex(
          (skill) =>
            (skill.y > 0 && unit.owner == Player.P1) ||
            (skill.y < 0 && unit.owner == Player.P2)
        ) >= 0;
      if (!hasRetreatSkill) {
        penalty = this.params.penaltyNoRetreatSkillInLast3Rows;
      }
    }

    return (
      penalty +
      this.params.levelValueBase[unit.level] +
      this.params.skillLevelMultiplier[unit.level] * skillValue
    );
  }

  getUnitPositionalValue(
    board: GameBoard,
    unit: Unit,
    coord: Coordinate
  ): number {
    return (
      this.getUnitPositionalValueFromAdvancing(unit, coord) +
      this.getUnitPositionalPenaltyAtEdge(coord) +
      this.getUnitThreatenPenalty(board, unit, coord)
    );
  }

  getUnitAdvancedRows(unit: Unit, coord: Coordinate): number {
    const advancedRows =
      unit.owner == Player.P1 ? g.board_size_y - 1 - coord.y : coord.y;
    return advancedRows;
  }

  getUnitPositionalValueFromAdvancing(unit: Unit, coord: Coordinate): number {
    const advancedRows = this.getUnitAdvancedRows(unit, coord);
    if (advancedRows < 2) {
      return 0;
    } else if (advancedRows == 2) {
      return this.params.valueOfAdvancing1Row;
    } else if (advancedRows == 3) {
      return this.params.valueOfAdvancing2Rows;
    } else {
      return this.params.valueOfAdvancing3RowsOrMore;
    }
  }

  getUnitPositionalPenaltyAtEdge(coord: Coordinate): number {
    if (coord.x == 0 || coord.x == g.board_size_x - 1) {
      return this.params.edgePenalty;
    }
    return 0;
  }

  getUnitThreatenPenalty(
    board: GameBoard,
    unit: Unit,
    coord: Coordinate
  ): number {
    const hostile = board.heat.at(coord).hostile(unit.owner);
    if (hostile == 0) {
      return 0;
    }
    const friendly = board.heat.at(coord).friendly(unit.owner);
    if (friendly > 0) {
      return this.params.threatenAndDefendablePenalty;
    } else {
      return this.params.threatenAndNotDefendablePenalty[unit.level];
    }
  }
}
