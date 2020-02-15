class InvalidMove extends Error {}

// def validate_player_move(board, player_move):
//     moves = player_move.move_list
//     position_from_list = [move.position_from for move in moves]
//     if len(set(position_from_list)) != len(moves):
//         raise InvalidMoveException("unit moved more than once")

//     return PlayerAction(
//         player_move.player,
//         [
//             validate_move(board, move, player_move.player)
//             for move in moves
//         ])
class Rule
{
    static spawn_row = new Map<Player, number>([
        [Player.P1, 0],
        [Player.P2, g.board_size_y - 1]
    ]);

    static validate_move(board: Board<Unit>, move: Move, player: Player)//: Action
    {
        let unit = board.at(move.from);
        if (unit == null)
        {
            if (move.from.y != this.spawn_row.get(player))
            {
                throw new InvalidMove("grid is empty");
            }
            // else if (count_unit)
            else
            {
                try
                {
                    let skill = move.get_skill();
                }
                catch (InvalidParameter)
                {
                    throw new InvalidMove("this skill recruits nothing");
                }
            }
        }
    }
}

// def validate_move(board, move, player):
//     unit = board.at(move.position_from)
//     if unit is None:
//         if move.position_from.y != spawn_row[player]:
//             raise InvalidMoveException("grid is empty")
//         elif count_unit(board, player) >= max_unit_count:
//             raise InvalidMoveException("units limit exceeded - cannot recruit anymore")
//         else:
//             try:
//                 skill = move.get_skill()
//             except InvalidParameter:
//                 raise InvalidMoveException("this skill recruits nothing")
//             unit_recruited = Unit.create_from_skill(player, skill)
//             return Action(move, ActionType.Recruit, type(unit_recruited))

//     if unit.owner != player:
//         raise InvalidMoveException("grid is enemy")

//     try:
//         skill = move.get_skill()
//     except InvalidParameter:
//         raise InvalidMoveException("not a valid skill")

//     if not unit.ultimate_skillset().has(skill):
//         raise InvalidMoveException("skill not available")
    
//     if not unit.skillset.has(skill):
//         return Action(move, ActionType.Upgrade, type(unit))

//     target_unit = board.at(move.position_to)

//     if target_unit is None:
//         return Action(move, ActionType.Move, type(unit))

//     if unit.owner == target_unit.owner:
//         return Action(move, ActionType.Defend, type(unit))
//     else:
//         return Action(move, ActionType.Attack, type(unit))
