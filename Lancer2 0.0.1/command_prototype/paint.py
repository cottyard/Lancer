import renderer
from entity import player_1, player_2, ActionType, ForceBoard
import rule

no_color = 'WHITE'

action_type_color_map = {
    ActionType.Upgrade: 'BLUE',
    ActionType.Defend: 'GREEN',
    ActionType.Move: None,
    ActionType.Attack: 'RED',
    ActionType.Recruit: 'CYAN'
}

player_color = {
    player_1: "LIGHTMAGENTA_EX",
    player_2: "YELLOW"
}

def get_painted_canvas(game, player_name, side=None):
    canvas = renderer.init_canvas()
    zero = renderer.get_zero_renderer(canvas)
    grid_renderer = renderer.get_grid_renderer(zero)
    highlight_renderer = renderer.get_highlight_renderer(zero)
    hint_renderer = renderer.get_hint_renderer(zero)
    hint_board = get_hint_board(game.board)
    
    def render_unit(u, position):
        grid_renderer(
            position.x, position.y, player_name[u.owner],
            u.display, player_color[u.owner], u.is_perfect(),
            u.skillset.map, u.potential_skillset().map)
    
    game.board.iterate_units(render_unit)

    if side is None:
        side = player_1

    def render_hint(force, position):
        hint_renderer(
            position.x, position.y,
            hint_board.read(position, player_1 if side != player_1 else player_2), 
            hint_board.read(position, side)
        )

    hint_board.iterate(render_hint)

    for player in [player_1, player_2]:
        paint_last_move_hint(highlight_renderer, game, player, player_color[player])

    return canvas

def paint_last_move_hint(renderer, game, player, color):
    if not game.player_moved(player):
        return

    player_action = game.get_last_player_action(player)

    for action in player_action.action_list:
        hint_color = action_type_color_map[action.type]
        if hint_color is None:
            hint_color = color

        move = action.move
        renderer(
            move.position_from.x, move.position_from.y, 
            hint_color, -4, ActionType.show(action.type))
        renderer(
            move.position_from.x, move.position_from.y, 
            color, 3, str(move.position_to))
        renderer(
            move.position_from.x, move.position_from.y, 
            no_color, -5, str(action.unit_type.letter))
        renderer(
            move.position_from.x, move.position_from.y, 
            no_color, -1, '[')
        renderer(
            move.position_from.x, move.position_from.y, 
            no_color, 2, ']')

def get_hint_board(board):
    hint_board = ForceBoard()
    for player in [player_1, player_2]:
        for move in rule.all_valid_moves(board, player):
            hint_board.increase(move.position_to, player)
    return hint_board
