import { Player, PlayerMove } from "../../common/entity";
import { GameRound } from "../../common/game_round";
import { Rule } from "../../common/rule";

export function monkey(round: GameRound, player: Player): PlayerMove
{
    let all_moves = Rule.valid_moves(round.board, player);
    let all_actions = Rule.validate_player_move(
        round.board, new PlayerMove(player, all_moves)).actions;
    let cost = 0;
    let res = new PlayerMove(player);
    let supply = round.supply(player);
    let move_set = new Set();
    
    do
    {
        if (all_actions.length <= 0)
        {
            break;
        }
        let random_index = Math.floor(Math.random() * all_actions.length);
        let action = all_actions[random_index];
        all_actions.splice(random_index, 1);
        if (action.cost + cost > supply)
        {
            break;
        }
        if (move_set.has(action.unit))
        {
            continue;
        }
        move_set.add(action.unit);
        res.moves.push(action.move);
        cost += action.cost;
    } while (1);
    return res;
}

// export class Benchmark
// {
    // static core_benchmark()
    // {
    //     g.initialize();
    //     let game = Game.new_game();

    //     let begin = new Date().getTime();

    //     let p1_supply = game.supply(Player.P1);
    //     let p2_supply = game.supply(Player.P2);
    //     let p1_moves = Rule.valid_moves(game.board, Player.P1);
    //     let p2_moves = Rule.valid_moves(game.board, Player.P2);
    //     let p1_actions = p1_moves.map((m) =>
    //     {
    //         return Rule.validate_move(game.board, m, Player.P1);
    //     });;
    //     let p2_actions = p2_moves.map((m) =>
    //     {
    //         return Rule.validate_move(game.board, m, Player.P2);
    //     });;

    //     for (let i = 0; i < 10000; ++i)
    //     {
    //         let p1 = new PlayerMove(Player.P1, AI.pick_moves(p1_actions, game.board.buff, p1_supply));
    //         let p2 = new PlayerMove(Player.P2, AI.pick_moves(p2_actions, game.board.buff, p2_supply));
    //         game.make_move({
    //             [Player.P1]: p1,
    //             [Player.P2]: p2
    //         });

    //     }
    //     let end = new Date().getTime();
    //     console.log("total:", (end - begin) / 1000);
    // }

    // static pick_moves(actions: Action[], buff: FullBoard<Buff>, supply: number): Move[]
    // {
    //     let picked = new HashSet<Coordinate>();
    //     let picked_moves = [];
    //     let total_cost = 0;
    //     do
    //     {
    //         let random_action = actions[Math.floor(Math.random() * actions.length)];
    //         if (picked.has(random_action.move.from))
    //         {
    //             break;
    //         }
    //         else
    //         {
    //             picked.put(random_action.move.from);
    //         }
    //         let cost = random_action.cost(buff);
    //         if (total_cost + cost <= supply)
    //         {
    //             total_cost += cost;
    //             picked_moves.push(random_action.move);
    //         }
    //         else
    //         {
    //             break;
    //         }
    //     } while (1);

    //     return picked_moves;
    // }
// }
