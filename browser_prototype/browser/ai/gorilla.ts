import { FullBoard } from "../../common/board";
import { Action, ActionType, Coordinate, King, Player, PlayerMove, Unit } from "../../common/entity";
import { GameRound } from "../../common/game_round";
import { Heat, Rule } from "../../common/rule";

export function gorilla(round: GameRound, player: Player): PlayerMove
{
    let all_moves = Rule.valid_moves(round.board, player);
    let all_actions = Rule.validate_player_move(
        round.board, new PlayerMove(player, all_moves)).actions;
    let evaluated: [number, Action][] = all_actions.map(
        (a) => [evaluate(round, player, a), a]);
    
    evaluated.sort((a, b) => a[0] - b[0]);

    let cost = 0;
    let res = new PlayerMove(player);
    let supply = round.supply(player);
    let move_set = new Set();
    do
    {
        if (evaluated.length <= 0)
        {
            break;
        }
        let [points, action] = evaluated.pop()!;
        if (action.cost + cost > supply)
        {
            break;
        }
        if (move_set.has(action.unit))
        {
            continue;
        }
        if (decide_pick(points))
        {
            move_set.add(action.unit);
            res.moves.push(action.move);
            cost += action.cost;
        }
    } while (1);
    return res;
}

function decide_pick(points: number): boolean
{
    if (points == 0) return false; // points: [0, +INF)
    let r1 = 1 / (0.05 * points + 1); // (0, 1)
    let r2 = 0.9 * r1 + 0.1; // (0.1, 1)
    let r3 = 1 - r2; // (0, 0.9)
    return Math.random() < r3;
}

function check_resource_grid(coord: Coordinate): "no" | "yes" | "yes and is center"
{
    let i = Rule.resource_grids.indexOf(coord);
    if (i == -1)
    {
        return "no";
    }
    else if (Rule.resource_grid_supplies[i] == 1)
    {
        return "yes";
    }
    else
    {
        return "yes and is center";
    }
}

function evaluate(round: GameRound, player: Player, action: Action): number
{
    let from: Coordinate = action.move.from;
    let to: Coordinate = action.move.to;
    let heat_board: FullBoard<Heat> = round.board.heat;
    let to_enemies = heat_board.at(to).hostile(player);
    let from_enemies = heat_board.at(from).hostile(player);
    let unit: Unit = action.unit;
    let target_unit: Unit | null = round.board.unit.at(to);

    let points = 0;

    if (action.type == ActionType.Attack && to_enemies == 0)
    {
        points += 20;
    }
    if (action.type == ActionType.Defend && to_enemies > 0)
    {
        points += 30;
    }
    if (action.type == ActionType.Upgrade)
    {
        points += unit.level == 1 ? 10 : 5;
    }
    if (action.type == ActionType.Move)
    {
        points += from_enemies > 0 ? 15 : 5;
        points += to_enemies == 0 ? 5 : -5;
    }

    let resource_grid_to = check_resource_grid(to);
    if (resource_grid_to != "no")
    {
        points += resource_grid_to == "yes" ? 10 : 15;
    }
    let resource_grid_from = check_resource_grid(from);
    if (resource_grid_from != "no")
    {
        points -= 10;
    }

    if (unit.type == King && from_enemies > 0)
    {
        if (action.type == ActionType.Move || action.type == ActionType.Attack)
        {
            if (to_enemies > 0)
            {
                points += 10;
            }
            else
            {
                points += 40;
            }
        }
        else
        {
            points = 0;
        }
    }

    if (target_unit && target_unit.type == King && target_unit.owner != player && unit.type != King)
    {
        points += 20;
    }

    return points > 0 ? points : 0;
}