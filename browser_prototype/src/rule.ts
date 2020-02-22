class InvalidMove extends Error {}

class Rule
{
    static spawn_row = new Map<Player, number>([
        [Player.P1, g.board_size_y - 1],
        [Player.P2, 0]
    ]);

    static validate_player_move(board: Board<Unit>, player_move: PlayerMove): PlayerAction
    {
        let moves = player_move.moves;
        let move_set = new Set();
        for (let move of moves)
        {
            if (move_set.has(move.from.hash()))
            {
                throw new InvalidMove("unit moved more than once")
            }
            move_set.add(move.from.hash());
        }

        return new PlayerAction(
            player_move.player,
            moves.map((move: Move) => {
                return Rule.validate_move(board, move, player_move.player);
            }));
    }

    static validate_move(board: Board<Unit>, move: Move, player: Player): Action
    {
        let unit = board.at(move.from);
        if (unit == null)
        {
            if (move.from.y != this.spawn_row.get(player))
            {
                throw new InvalidMove("grid is empty");
            }
            else if (Rule.count_unit(board, player) >= g.max_unit_count)
            {
                throw new InvalidMove("units limit exceeded");
            }
            else
            {
                let skill: Skill;
                try
                {
                    skill = move.get_skill();
                }
                catch (InvalidParameter)
                {
                    throw new InvalidMove("not a valid skill");
                }

                let type = Unit.which_to_spawn(skill);
                if (type == null)
                {
                    throw new InvalidMove("this skill recruits nothing");
                }

                return new Action(move, ActionType.Recruit, type);
            }
        }

        if (unit.owner != player)
        {
            throw new InvalidMove("grid belongs to enemy");
        }

        let skill: Skill;
        try
        {
            skill = move.get_skill();
        }
        catch (InvalidParameter)
        {
            throw new InvalidMove("not a valid skill");
        }

        if (unit.capable(skill))
        {
            let target = board.at(move.to);
            if (target == null)
            {
                return new Action(move, ActionType.Move, unit.type());
            }
            
            if (unit.owner == target.owner)
            {
                return new Action(move, ActionType.Defend, unit.type());
            }
            else
            {
                return new Action(move, ActionType.Attack, unit.type());
            }
        }
        else
        {
            if (unit.potential().has(skill))
            {
                return new Action(move, ActionType.Upgrade, unit.type());
            }
            else
            {
                throw new InvalidMove(`skill not available ${skill.hash()}`);
            }
        }
    }

    static count_unit(board: Board<Unit>, player: Player, unit_type: UnitConstructor | null = null): number
    {
        let count = 0;
        board.iterate_units((unit: Unit, _) => {
            if (unit.owner == player)
            {
                if (unit_type == null || unit.constructor == unit_type)
                {
                    count++;
                }
            }
        })
        return count;
    }

    static reachable_by_skills(coord: Coordinate, skills: Skill[]): Coordinate[]
    {
        let coordinates = [];
        for (let skill of skills)
        {
            let c = coord.add(skill.x, skill.y);
            if (c)
            {
                coordinates.push(c);
            }
        }

        return coordinates;
    }
    
    static reachable_by_unit(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (!unit)
        {
            return [];
        }

        return Rule.reachable_by_skills(coord, unit.current.as_list());
    }

    static upgradable_by_unit(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (!unit)
        {
            return [];
        }

        return Rule.reachable_by_skills(coord, unit.potential().as_list());
    }
}
