import {
  Coordinate,
  King,
  Move,
  Player,
  PlayerAction,
  PlayerMove,
  Unit,
} from "../../common/entity";
import { GameRound } from "../../common/game_round";
import { /*GameBoard, Heat,*/ GameBoard, Rule } from "../../common/rule";
import { PlayerMoveStagingArea } from "../staging_area";
import { randint } from "../../common/language";
import { g } from "../../common/global";

type Params = {
  iterations: number;
  movePoolSize: number;

  // Top X% moves will be used to generate next batch of moves.
  // Range: [0, 1]
  reproduceRate: number;

  // Top X% moves will be carried to next batch of moves without change.
  // Range: [0, 1]
  surviveRate: number;

  // Top X% moves of the last iteration will be picked as final result.
  pickRate: number;

  // X% moves generated from reproducing will keep relative order from parent.
  keepOrderRate: number;

  // There's X% chance to pick random move instead of using parent moves in reproduction.
  mutationRate: number;

  // Value of king - should be very large.
  kingValue: number;

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

  // Penalty of King being away from center.
  kingAwayFromCenterPenaltyPerDist: number;

  // Penalty of King skill not towards center.
  kingSkillNotTowardsCenterPenalty: number;

  // Value of non-central grid that you piece can reach.
  valueOfNonCentralGrid: number;

  // Value of central grid that you piece can reach.
  valueOfCentralGrid: number;

  // Value of resource grid that you piece can reach (mulitplied by supply).
  valueOfResourceGrid: number;
};

const DefaultParams: Params = {
  iterations: 20,
  movePoolSize: 50,
  reproduceRate: 0.5,
  surviveRate: 0.1,
  pickRate: 0.05,
  keepOrderRate: 0.9,
  mutationRate: 0.05,

  kingValue: 1000000,
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
  valueOfCapturingNeutralResources: 2,
  valueOfCapturingEnemyResources: 4,
  kingThreatenedAndDefendablePenalty: -3,
  kingThreatenedAndNotDefendableButMovablePenalty: -5,
  kingThreatenedAndNotDefendableNorMovablePenalty: -15,
  kingNotMoveablePenalty: -3,
  kingSurroundedByEnemyUnitPenalty: {
    1: -2,
    2: -4,
    3: -6,
  },
  kingAwayFromCenterPenaltyPerDist: -3,
  kingSkillNotTowardsCenterPenalty: -3,
  valueOfNonCentralGrid: 0.25,
  valueOfCentralGrid: 1,
  valueOfResourceGrid: 0.5,
};

type MovePool = {
  [player: number]: Array<{ move: PlayerMove; eval: number; action: PlayerAction | null }>;
};

export class KingKong {
  params: Params;
  movePool: MovePool = {};
  round: GameRound = GameRound.new_game();
  player: Player = Player.P1;

  constructor(params: Params = DefaultParams) {
    this.params = params;
  }

  think(round: GameRound, player: Player): PlayerMove {
    this.round = round;
    this.player = player;

    for (var iter = 0; iter < this.params.iterations; iter++) {
      if (iter == 0) {
        this.initiateMovePoolWithMonkeyMoves();
      } else {
        this.generateMovePool();
      }
      this.testMoves();
      console.log(
        `Iteration=${iter}, Win Rate=${(
          this.movePool[player][0].eval * 100.0
        ).toFixed(2)}, Best Move=${this.movePool[
          player
        ][0].move.serialize()}, Worse Move Win Rate=${(
          this.movePool[player][this.params.movePoolSize - 1].eval * 100.0
        ).toFixed(2)}, Worst Move=${this.movePool[player][
          this.params.movePoolSize - 1
        ].move.serialize()}`
      );
    }
    return this.pickMove();
  }

  initiateMovePoolWithMonkeyMoves(): void {
    [Player.P1, Player.P2].forEach((player) => {
      this.movePool[player] = [];
      const allMoves = Rule.valid_moves(this.round.board, player);
      for (var i = 0; i < this.params.movePoolSize; i++) {
        this.movePool[player].push({
          move: this.randMove(player, allMoves, false, []),
          eval: 0,
          action: null
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
    var area = new PlayerMoveStagingArea(player);
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
      area.prepare_move(this.round.board, move);
      if (area.cost(this.round.board) > supply) {
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
      area = new PlayerMoveStagingArea(player);
      area.prepare_moves(this.round.board, sortedMoves);
      while (area.cost(this.round.board) > supply) {
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
      const numNewMoves = oldPool.length - numSurvivedMoves;
      const numReproduceMoves = oldPool.length * this.params.reproduceRate;
      for (var i = 0; i < numSurvivedMoves; i++) {
        newPool[player].push({
          move: oldPool[i].move,
          eval: 0,
          action: oldPool[i].action
        });
      }
      const allMoves = Rule.valid_moves(this.round.board, player);
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
          action: null
        });
      }
    });
    this.movePool = newPool;
  }

  testMoves(): void {
    [Player.P1, Player.P2].forEach((player) => {
      this.movePool[player].forEach((move) => {
        move.action = Rule.validate_player_move(this.round.board, move.move)
      });
    });
    this.movePool[Player.P1].forEach((move1) => {
      this.movePool[Player.P2].forEach((move2) => {
        const round = this.round.proceed_with_action({
          [Player.P1]: move1.action!,
          [Player.P2]: move2.action!
        });
        const value = this.evaluate(round);
        const winRate = this.valueToWinrate(value);
        move1.eval += winRate / this.params.movePoolSize;
        move2.eval += (1 - winRate) / this.params.movePoolSize;
      });
    });

    [Player.P1, Player.P2].forEach((player) => {
      this.movePool[player].sort((a, b) => b.eval - a.eval);
    });
  }

  valueToWinrate(value: number): number {
    if (value >= 0) {
      return 1 - Math.pow(0.5, 1 + value / this.params.valueToHalveWinRate);
    } else {
      return Math.pow(0.5, 1 - value / this.params.valueToHalveWinRate);
    }
  }

  pickMove(): PlayerMove {
    return this.movePool[this.player][
      randint(this.params.pickRate * this.params.movePoolSize)
    ].move;
  }

  evaluate(round: GameRound): number {
    const board = round.board;
    var result = 0;
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
      return this.params.kingValue + this.getKingPenalty(board, unit, coord);
    }
    return (
      this.getUnitSkillAndLevelValue(unit, coord) +
      this.getUnitPositionalValue(board, unit, coord)
    );
  }

  getKingPenalty(board: GameBoard, unit: Unit, coord: Coordinate): number {
    const dist = Math.max(
      Math.abs(Rule.resource_grid_center.x - coord.x),
      Math.abs(Rule.resource_grid_center.y - coord.y)
    );
    var value = dist * this.params.kingAwayFromCenterPenaltyPerDist;

    const defended = board.heat.at(coord).friendly(unit.owner) > 0;
    const attacked = board.heat.at(coord).hostile(unit.owner) > 0;
    const skills = unit.current.as_list();
    var moveable = false;
    if (skills.length > 0) {
      const next = coord.add(skills[0].x, skills[0].y);
      if (next != null) {
        const targetUnit = board.unit.at(next);
        if (
          targetUnit == null ||
          (targetUnit.owner != unit.owner &&
            board.heat.at(next).hostile(unit.owner) == 0)
        ) {
          moveable = true;
        }

        if (dist > 0) {
          const distNext = Math.max(
            Math.abs(Rule.resource_grid_center.x - next.x),
            Math.abs(Rule.resource_grid_center.y - next.y)
          );
          if (distNext >= dist) {
            value += this.params.kingSkillNotTowardsCenterPenalty;
          }
        }
      }
    }

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
        if (nearbyUnit != null && nearbyUnit.owner != unit.owner) {
          value +=
            this.params.kingSurroundedByEnemyUnitPenalty[nearbyUnit.level];
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
