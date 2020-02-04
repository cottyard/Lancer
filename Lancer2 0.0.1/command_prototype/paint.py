import renderer
from entity import player_1, player_2, ActionType

no_color = 'WHITE'

action_type_color_map = {
    ActionType.Upgrade: 'BLUE',
    ActionType.Defend: 'GREEN',
    ActionType.Move: None,
    ActionType.Attack: 'RED',
    ActionType.Spawn: None
}

def get_painted_canvas(game, player_name, player_color):
    canvas = renderer.init_canvas()
    zero = renderer.get_zero_renderer(canvas)
    grid_renderer = renderer.get_grid_renderer(zero)
    highlight_renderer = renderer.get_highlight_renderer(zero)
    #hint_board = gen_hints(board)
    
    def render_unit(u, position):
        grid_renderer(
            position.x, position.y, player_name[u.owner], u.display, player_color[u.owner],
            u.is_perfect(), 0, 0, u.skillset.map, u.potential_skillset().map)
            #hint_board[x][y]

    game.board.iterate_units(render_unit)

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
            no_color, -1, '[')
        renderer(
            move.position_from.x, move.position_from.y, 
            no_color, 2, ']')

# def gen_hints(board):
#     hint_board = [
#         [[0, 0] for j in range(rule.board_size_y)]
#         for i in range(rule.board_size_x)
#     ]
    
#     def each(u, i, j):
#         for (x, y) in rule.pos_in_reach(i, j, u.skills()):
#             u2 = board[x][y]
#             if u2 is None:
#                 continue
#             if u2.owner == u.owner:
#                 hint_board[x][y][1] += 1
#             else:
#                 hint_board[x][y][0] += 1

#     iterate_units(board, each)
#     return hint_board
