class AI
{
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

    static get_random_move(round: GameRound, player: Player): PlayerMove
    {
        let supply = round.supply(player);
        let cost = 0;
        let stage = new PlayerMoveStagingArea(player);

        while (cost < supply)
        {
            let all = Rule.valid_moves(round.board, player);
            if (!all)
            {
                break;
            }
            let random_move = all[Math.floor(Math.random() * all.length)];

            let res = stage.prepare_move(round.board, random_move);
            if (res == "overridden")
            {
                break;
            }
            cost = stage.cost(round.board);
        }

        while (cost > supply)
        {
            stage.pop_move();
            cost = stage.cost(round.board);
        }

        return stage.move;
    }
}
