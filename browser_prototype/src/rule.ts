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

    static get_heat(board: Board<Unit>): FullBoard<Heat>
    {
        let heat = new FullBoard<Heat>(() => new Heat());
        board.iterate_units((unit, coord) => {
            for (let c of Rule.reachable_by(board, coord))
            {
                heat.at(c).heatup(unit.owner);
            }
        });
        return heat;
    }

    static get_buff(board: Board<Unit>): FullBoard<Buff>
    {
        let heat = this.get_heat(board);
        let buff = new FullBoard<Buff>(() => new Buff());
        board.iterate_units((unit, coord) => {
            if (unit instanceof Lancer)
            {
                for (let c of this.reachable_by(board, coord))
                {
                    if (board.at(c)?.owner == unit.owner)
                    {
                        let b = buff.at(c);
                        b.add(ActionType.Move, -1);
                        b.add(ActionType.Attack, -1);
                    }
                }
            }
            else if (unit instanceof Knight)
            {
                for (let c of this.reachable_by(board, coord))
                {
                    if (board.at(c)?.owner == unit.owner)
                    {
                        let b = buff.at(c);
                        b.add(ActionType.Defend, -1);
                    }
                }
            }
            else if (unit instanceof Warrior)
            {
                for (let c of this.reachable_by(board, coord))
                {
                    let other = board.at(c);
                    if (other && other.owner != unit.owner)
                    {
                        let b = buff.at(c);
                        b.add(ActionType.Move, 1);
                    }
                }
            }
            else if (unit instanceof Swordsman)
            {
                if (unit.is_perfect())
                {
                    return;
                }
                if (heat.at(coord).hostile(unit.owner) > 0)
                {
                    let b = buff.at(coord);
                    b.add(ActionType.Upgrade, -2);
                }
            }
            else if (unit instanceof Spearman)
            {
                let b = buff.at(coord);
                b.add(ActionType.Attack, -1);
            }
        })
        return buff;
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
    
    static able_to_reach(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let able: Coordinate[] = [];
        board.iterate_units((unit, c) => {
            let skill;
            try
            {
                skill = new Skill(coord.x - c.x, coord.y - c.y);
            }
            catch
            {
                return;
            }
            if (unit.capable(skill))
            {
                able.push(c);
            }
        })
        return able;
    } 

    static reachable_by(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (!unit)
        {
            return [];
        }
        return Rule.reachable_by_skills(coord, unit.current.as_list());
    }

    static upgradable_by(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (!unit)
        {
            for (let row of this.spawn_row.values())
            {
                if (coord.y == row)
                {
                    return Rule.reachable_by_skills(coord, g.spawning_skills!.as_list());
                }
            }
            return [];
        }

        return Rule.reachable_by_skills(coord, unit.potential().as_list());
    }
}

class Buff
{
    map = new Map<ActionType, number>([
        [ActionType.Attack, 0], 
        [ActionType.Defend, 0],
        [ActionType.Move, 0],
        [ActionType.Upgrade, 0]
    ]);

    add(type: ActionType, amount: number)
    {
        this.map.set(type, this.map.get(type)! + amount);
    }

    get(type: ActionType): number
    {
        return this.map.get(type)!;
    }
}

class Heat
{
    map = new Map<Player, number>([[Player.P1, 0], [Player.P2, 0]]);
    heatup(player: Player)
    {
        this.map.set(player, this.map.get(player)! + 1);
    }

    friendly(player: Player): number
    {
        return this.map.get(player)!;
    }

    hostile(player: Player): number
    {
        return this.map.get(player == Player.P1 ? Player.P2 : Player.P1)!;
    }
}
