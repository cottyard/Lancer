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
            if (this.is_king_side(board, player, move.from))
            {
                let recalled = board.at(move.to);
                if (recalled == null)
                {
                    throw new InvalidMove("recalled grid is empty");
                }
                if (recalled.owner != player)
                {
                    throw new InvalidMove("recalled unit is enemy");
                }

                let heat = this.get_heat(board);
                if (heat.at(move.to).hostile(player) > 0)
                {
                    throw new InvalidMove("recalled unit is under attack");
                }
                if (heat.at(move.from).hostile(player) > 0)
                {
                    throw new InvalidMove("recall destination is under attack");
                }

                return new Action(move, ActionType.Recall, recalled.type());
            }

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

    static is_king_side(board: Board<Unit>, player: Player, coord: Coordinate): boolean
    {
        let king_coord = this.where(board, player, King);
        if (king_coord.length != 1)
        {
            return false;
        }

        let king_side: Coordinate[] = this.reachable_by(board, king_coord[0]);
        return king_side.findIndex((c) => c.equals(coord)) > -1;
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

    static where(board: Board<Unit>, player: Player, unit_type: UnitConstructor): Coordinate[]
    {
        let found: Coordinate[] = [];
        board.iterate_units((unit, coord) => {
            if (unit.owner == player && unit.constructor == unit_type)
            {
                found.push(coord);
            }
        })
        return found;
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
            return [];
        }

        return Rule.reachable_by_skills(coord, unit.potential().as_list());
    }

    static spawnable_by(board: Board<Unit>, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (unit)
        {
            return [];
        }
        for (let row of this.spawn_row.values())
        {
            if (coord.y == row)
            {
                return Rule.reachable_by_skills(coord, g.spawning_skills!.as_list());
            }
        }
        return [];
    }

    static recallable_by(board: Board<Unit>, player: Player, coord: Coordinate): Coordinate[]
    {
        let unit = board.at(coord);
        if (unit)
        {
            return [];
        }

        if (!this.is_king_side(board, player, coord))
        {
            return [];
        }

        let heat = this.get_heat(board);
        if (heat.at(coord).hostile(player) > 0)
        {
            return [];
        }

        let all: Coordinate[] = [];
        board.iterate_units((u, c) => {
            if (u.owner == player && heat.at(c).hostile(player) == 0)
            {
                all.push(c);
            }
        });

        return all;
    }

    static make_move(board: Board<Unit>, moves: Map<Player, PlayerMove>): [Board<Unit>, Martyr[]]
    {
        let actions = new Map<Player, PlayerAction>([
            [Player.P1, this.validate_player_move(board, moves.get(Player.P1)!)],
            [Player.P2, this.validate_player_move(board, moves.get(Player.P2)!)]
        ]);

        let next_board = board.copy();
        let force_board = new FullBoard<Force>(() => new Force());
        let martyrs: Martyr[] = [];

        this.process_upgrade_phase(next_board, actions);
        this.process_defend_phase(next_board, actions, force_board);
        martyrs = martyrs.concat(this.process_clash_phase(next_board, actions));
        martyrs = martyrs.concat(this.process_battle_phase(next_board, actions, force_board));
        this.process_recall_phase(next_board, actions);
        this.process_recruit_phase(next_board, actions);

        return [next_board, martyrs];
    }

    static process_upgrade_phase(board: Board<Unit>, player_actions: Map<Player, PlayerAction>)
    {
        for (let player_action of player_actions.values())
        {
            for (let action of player_action.extract((a) => a.type == ActionType.Upgrade))
            {
                let unit = board.at(action.move.from)!;
                let skill = action.move.get_skill();
                if (unit.is_promotion_ready())
                {
                    let promoted = unit.promote(skill);
                    if (promoted == null)
                    {
                        throw new Error("promotion error");
                    }
                    board.put(action.move.from, promoted);
                }
                else
                {
                    if (!unit.endow(skill))
                    {
                        throw new Error("upgrade error");
                    }
                }
            }
        }
    }

    static process_defend_phase(board: Board<Unit>, player_actions: Map<Player, PlayerAction>, force_board: FullBoard<Force>)
    {
        for (let player_action of player_actions.values())
        {
            for (let action of player_action.extract((a) => a.type == ActionType.Defend))
            {
                let unit = board.at(action.move.from)!;
                force_board.at(action.move.to).reinforcers.get(player_action.player)!.push(unit);
            }
        }
    }

    static process_clash_phase(board: Board<Unit>, player_actions: Map<Player, PlayerAction>): Martyr[]
    {
        let clash_board = new Board<Action>();
        let martyrs: Martyr[] = [];

        type ClashPair = {
            [k in Player]: Action
        };
        let clashes: ClashPair[] = [];
 
        for (let player_action of player_actions.values())
        {
            for (let action of player_action.actions)
            {
                if (action.type != ActionType.Attack)
                {
                    continue;
                }

                let other = clash_board.at(action.move.to);
                if (other != null && other.move.to == action.move.from)
                {
                    clashes.push(<ClashPair>{
                        [player_action.player]: action,
                        [opponent(player_action.player)]: other
                    });
                }
                clash_board.put(action.move.from, action);
            }
        }

        for (let clash of clashes)
        {
            let a1 = clash[Player.P1];
            let a2 = clash[Player.P2];
            let u1 = board.at(a1.move.from)!;
            let u2 = board.at(a2.move.from)!;
            
            let surviver = u1.duel(u2);

            let ceased = [];
            if (surviver == null)
            {
                player_actions.get(Player.P1)!.extract((a) => a == a1);
                player_actions.get(Player.P2)!.extract((a) => a == a2);
                ceased.push(a1, a2);
            }
            else
            {
                let action = clash[surviver.owner];
                player_actions.get(surviver.owner)!.extract((a) => a == action);
                ceased.push(action);
            }

            for (let action of ceased)
            {
                let martyr = board.remove(action.move.from)!;
                martyrs.push(new Martyr(new Quester(martyr, action.move.from), martyr.get_trophy()));
            }
        }

        return martyrs;
    }

    static process_battle_phase(board: Board<Unit>, player_actions: Map<Player, PlayerAction>, force_board: FullBoard<Force>): Martyr[]
    {
        for (let player_action of player_actions.values())
        {
            for (let action of player_action.extract((a) => a.type == ActionType.Attack || a.type == ActionType.Move))
            {
                let target = action.move.to;
                if (force_board.at(target).arriver.get(player_action.player) == null)
                {
                    let unit = board.remove(action.move.from)!;
                    force_board.at(target).arriver.set(player_action.player, new Quester(unit, action.move.from));
                }
                else
                {
                    let unit = board.at(action.move.from)!;
                    force_board.at(target).reinforcers.get(player_action.player)!.push(unit);
                }
            }
        }

        let martyrs: Martyr[] = [];

        function settle_battle(force: Force, where: Coordinate)
        {
            let q1 = force.arriver.get(Player.P1);
            let q2 = force.arriver.get(Player.P2);

            if (q1 == null && q2 == null)
            {
                return;
            }

            let r1 = force.reinforcers.get(Player.P1)!.length;
            let r2 = force.reinforcers.get(Player.P2)!.length;
            
            let conqueror: Unit | null;

            if (q1 && q2)
            {
                if (r1 == r2)
                {
                    conqueror = q1.unit.duel(q2.unit);
                    if (conqueror)
                    {
                        let fallen = force.arriver.get(opponent(conqueror.owner))!;
                        martyrs.push(new Martyr(fallen, 0));
                    }
                    else
                    {
                        martyrs.push(new Martyr(q1, 0), new Martyr(q2, 0));
                    }
                }
                else
                {
                    conqueror = r1 > r2 ? q1.unit : q2.unit;
                    let defeated = r1 > r2 ? q2 : q1;
                    martyrs.push(new Martyr(defeated, 0));
                }
            }
            else
            {
                let invader: Quester;
                let accomplice: number;
                let resistance: number;
                if (q1)
                {
                    invader = q1;
                    accomplice = r1;
                    resistance = r2;
                }
                else
                {
                    invader = q2!;
                    accomplice = r2;
                    resistance = r1;
                }

                if (accomplice >= resistance)
                {
                    conqueror = invader.unit;
                    let resident = board.at(where);
                    if (resident)
                    {
                        martyrs.push(new Martyr(new Quester(resident, where), resident.get_trophy()));
                    }
                }
                else
                {
                    conqueror = null;
                    martyrs.push(new Martyr(invader, 0));
                }
            }

            if (conqueror)
            {
                board.put(where, conqueror);
            }
        }

        force_board.iterate_units(settle_battle);
        return martyrs;
    }

    static process_recall_phase(board: Board<Unit>, player_actions: Map<Player, PlayerAction>)
    {
        for (let player_action of player_actions.values())
        {
            for (let action of player_action.extract((a) => a.type == ActionType.Recall))
            {
                if (board.at(action.move.from) == null)
                {
                    let recalled = board.at(action.move.to);
                    if (recalled != null && recalled.owner == player_action.player)
                    {
                        board.remove(action.move.to);
                        board.put(action.move.from, recalled);
                    }
                }
            }
        }
    }

    static process_recruit_phase(board: Board<Unit>, player_actions: Map<Player, PlayerAction>)
    {
        for (let player_action of player_actions.values())
        {
            for (let action of player_action.actions)
            {
                if (action.type != ActionType.Recruit)
                {
                    throw new Error("unprocessed action");
                }
                if (board.at(action.move.from) == null)
                {
                    let skill = action.move.get_skill();
                    let recruited = Unit.spawn_from_skill(player_action.player, skill);
                    board.put(action.move.from, recruited);
                }
            }
        }
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
        return this.map.get(opponent(player))!;
    }
}

class Force
{
    reinforcers = new Map<Player, Unit[]>([[Player.P1, []], [Player.P2, []]]);
    arriver = new Map<Player, Quester | null>([[Player.P1, null], [Player.P2, null]]);
}

class Martyr
{
    constructor(public quester: Quester, public relic: number)
    {
    }
}

class Quester
{
    constructor(public unit: Unit, public hometown: Coordinate)
    {
    }
}