import renderer
from entity import player_1, player_2

hint_from = "o>>"
hint_to = ">>o"

move_type_hint_map = {
    'E': ('UPG', 'BLUE'),
    'D': ('DEF', 'GREEN'),
    'A1': ('ATK', 'RED'),
    'A2': ('ATK', 'RED'),
    'O': ('MOV', None)
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

    paint_last_move_hint(highlight_renderer, game, player_1, player_color[player_1])
    paint_last_move_hint(highlight_renderer, game, player_2, player_color[player_2], \
        game.target_same_position())

    return canvas

def paint_last_move_hint(renderer, game, player, color, conflict=False):
    if not game.player_moved(player):
        return

    move = game.get_last_move(player)
    move_type = game.get_last_move_type(player)

    hint_content, hint_color = move_type_hint_map[move_type]
    if hint_color is None:
        hint_color = color

    renderer(move.position_from.x, move.position_from.y, color, False, hint_from)
    renderer(move.position_from.x, move.position_from.y, hint_color, True, hint_content)
    renderer(move.position_to.x, move.position_to.y, color, conflict, hint_to)

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
