import { Player, Move, Action, Coordinate, PlayerMove } from '../core/entity';
import { Game } from '../core/game';
import { Rule, Buff } from '../core/rule';
import { FullBoard } from '../core/board';
import { g } from '../core/global';

export class AI
{
    static core_benchmark()
    {
        g.initialize();

        let game = Game.new_game();

        let begin = new Date().getTime();

        let p1_supply = game.supply(Player.P1);
        let p2_supply = game.supply(Player.P2);
        let p1_moves = Rule.valid_moves(game.board, Player.P1);
        let p2_moves = Rule.valid_moves(game.board, Player.P2);
        let p1_actions = p1_moves.map((m) =>
        {
            return Rule.validate_move(game.board, m, Player.P1);
        });;
        let p2_actions = p2_moves.map((m) =>
        {
            return Rule.validate_move(game.board, m, Player.P2);
        });;

        for (let i = 0; i < 10000; ++i)
        {
            let p1 = new PlayerMove(Player.P1, AI.pick_moves(p1_actions, game.board.buff, p1_supply));
            let p2 = new PlayerMove(Player.P2, AI.pick_moves(p2_actions, game.board.buff, p2_supply));
            game.make_move({
                [Player.P1]: p1,
                [Player.P2]: p2
            });

        }
        let end = new Date().getTime();
        console.log("total:", (end - begin) / 1000);
    }

    static pick_moves_for_player(game: Game, player: Player): PlayerMove
    {
        let supply = game.supply(player);
        let moves = Rule.valid_moves(game.board, player);
        let actions = moves.map((m) =>
        {
            return Rule.validate_move(game.board, m, player);
        });;
        return new PlayerMove(player, AI.pick_moves(actions, game.board.buff, supply));
    }

    static pick_moves(actions: Action[], buff: FullBoard<Buff>, supply: number): Move[]
    {
        let picked = new HashSet<Coordinate>();
        let picked_moves = [];
        let total_cost = 0;
        do
        {
            let random_action = actions[Math.floor(Math.random() * actions.length)];
            if (picked.has(random_action.move.from))
            {
                break;
            }
            else
            {
                picked.put(random_action.move.from);
            }
            let cost = random_action.cost(buff);
            if (total_cost + cost <= supply)
            {
                total_cost += cost;
                picked_moves.push(random_action.move);
            }
            else
            {
                break;
            }
        } while (1);

        return picked_moves;
    }
}
