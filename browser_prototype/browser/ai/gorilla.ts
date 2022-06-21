import { FullBoard } from "../../common/board";
import { Coordinate, King, Move, Player, PlayerMove, Unit } from "../../common/entity";
import { GameRound } from "../../common/game_round";
import { Heat, Rule } from "../../common/rule";
import { PlayerMoveStagingArea } from "../staging_area";

export function gorilla(round: GameRound, player: Player): PlayerMove
{
    let all_moves = Rule.valid_moves(round.board, player);
    let evaluated: [number, Move][] = all_moves.map(
        (m) => [evaluate(round, player, m), m]);
    
    evaluated.sort((a, b) => a[0] - b[0]);

    let supply = round.supply(player);
    let staging_area = new PlayerMoveStagingArea(player);
    do
    {
        if (evaluated.length <= 0)
        {
            break;
        }
        let [points, move] = evaluated.pop()!;

        if (decide_pick(points))
        {
            staging_area.prepare_move(round.board, move);
            if (staging_area.cost(round.board) > supply)
            {
                staging_area.pop_move();
                break;
            }
        }
    } while (1);
    return staging_area.move;
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

function evaluate(round: GameRound, player: Player, move: Move): number
{
    let from: Coordinate = move.from;
    let to: Coordinate = move.to;
    let heat_board: FullBoard<Heat> = round.board.heat;
    let to_enemies = heat_board.at(to).hostile(player);
    let from_enemies = heat_board.at(from).hostile(player);
    let unit: Unit = round.board.unit.at(move.from)!;
    let target_unit: Unit | null = round.board.unit.at(to);

    let points = 0;

    if (unit.capable(move.which_skill()))
    {
        if (target_unit)
        {
            if (target_unit.owner == player && to_enemies > 0)
            {
                points += 30;
            }
            else if (target_unit.owner != player && to_enemies == 0)
            {
                points += 20;
            }
        }
        else
        {
            points += from_enemies > 0 ? 15 : 5;
            points += to_enemies == 0 ? 5 : -5;
        }
    }
    else
    {
        points += unit.level == 1 ? 10 : 3;
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
        if (!target_unit || target_unit.owner != player)
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

    if (target_unit && target_unit.type == King && 
        target_unit.owner != player && unit.type != King)
    {
        points += 20;
    }

    return points > 0 ? points : 0;
}