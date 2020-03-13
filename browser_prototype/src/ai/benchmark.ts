class AI
{
    static core_benchmark()
    {
        g.initialize();
        let game = Game.new_game();

        let m = 0;
        let begin = new Date().getTime();
        for (let i = 0; i < 100; ++i)
        {
            let [p1, m1] = AI.random_player_move(game, Player.P1);
            let [p2, m2] = AI.random_player_move(game, Player.P2);
            game.make_move({
                [Player.P1]: p1,
                [Player.P2]: p2
            });

            m += m1 + m2;
        }
        let end = new Date().getTime();
        console.log("total:", (end - begin) / 1000);
        console.log("m:", m / 1000);
    }

    static random_player_move(game: Game, player: Player): [PlayerMove, number]
    {
        let player_move = new PlayerMove(player);
        let supply = game.supply(player);

        let begin_m = new Date().getTime();
        let buff = Rule.get_buff(game.board);

        let all_moves = Rule.valid_moves(game.board, player);

        if (!all_moves)
        {
            return [player_move, 0];
        }

        let all = all_moves.map((m) =>
        {
            return Rule.validate_move(game.board, m, player);
        });

        let end_m = new Date().getTime();

        let picked = new HashSet<Coordinate>();

        let total_cost = 0;
        do
        {
            let random_action = all[Math.floor(Math.random() * all.length)];
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
                player_move.append(random_action.move);
            }
            else
            {
                break;
            }
        } while (1);


        return [player_move, end_m - begin_m];
    }
}
