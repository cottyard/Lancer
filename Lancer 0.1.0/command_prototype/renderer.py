import colorama
import rule
colorama.init()

def render_square(renderer, begin_x, begin_y, end_x, end_y, content, offset=0):
    step_x = 1 if begin_x < end_x else -1
    step_y = 1 if begin_y < end_y else -1
    for i in range(begin_x, end_x + step_x, step_x):
        for j in range(begin_y, end_y + step_y, step_y):
            renderer(i, j, content)

def render_column(renderer, width, content, offset=0):
    for i in range(offset, canvas_width, width):
        render_square(renderer, i, 0, i, canvas_height - 1, content)

def render_row(renderer, height, content, offset=0):
    for i in range(canvas_height - 1 - offset, -1, -height):
        render_square(renderer, 0, i, canvas_width - 1, i, content)

def show_canvas(canvas):
    for j in range(canvas_height - 1, -1, -1):
        for i in range(canvas_width):
            print(canvas[i][j], end='')
        print()

def get_zero_renderer(canvas):
    def renderer(x, y, content):
        canvas[x][y] = content
    return renderer

def get_text_renderer(renderer):
    def text_renderer(x, y, text):
        for i in range(len(text)):
            renderer(x + i, y, text[i])
    return text_renderer

def get_condensed_text_renderer(renderer):
    def condensed_text_renderer(x, y, text, text_length):
        renderer(x, y, text)
        for i in range(text_length - 1):
            renderer(x + i + 1, y, '')
    return condensed_text_renderer

def get_highlight_renderer(renderer):
    def highlight_renderer(grid_x, grid_y):
        renderer(
            grid_width * grid_x + grid_width // 2 - 1,
            grid_height * (grid_y + 1),
            paint("BLUE", '[')
        )
        renderer(
            grid_width * grid_x + grid_width // 2 + 2,
            grid_height * (grid_y + 1),
            paint("BLUE", ']')
        )
        
    return highlight_renderer

def get_grid_renderer(renderer):
    text_renderer = get_text_renderer(renderer)
    c_text_renderer = get_condensed_text_renderer(renderer)
    def grid_renderer(grid_x, grid_y, player, player_name, unit_name, perfected_flag, attackers_defenders, skillset):
        text_renderer(
            grid_width * grid_x + 2,
            grid_height * grid_y + grid_height // 2 + 1,
            player_name)

        c_text_renderer(
            grid_width * grid_x + 2,
            grid_height * grid_y + grid_height // 2,
            paint("LIGHTMAGENTA_EX" if player == rule.p1 else "YELLOW", unit_name),
            len(unit_name))

        if perfected_flag:
            renderer(
                grid_width * grid_x + 3,
                grid_height * grid_y + grid_height // 2 - 1,
                pixel_flag
            )

        [attackers, defenders] = attackers_defenders

        if attackers > 0:
            c_text_renderer(
                grid_width * grid_x + 2,
                grid_height * grid_y + grid_height // 2 - 2,
                paint("RED", str(attackers)),
                len(str(attackers))
            )
        if defenders > 0:
            c_text_renderer(
                grid_width * grid_x + 4,
                grid_height * grid_y + grid_height // 2 - 2,
                paint("GREEN", str(defenders)),
                len(str(defenders))
            )

        dx = grid_width * (grid_x + 1) - skillset_size
        dy = grid_height * grid_y + 1
        [renderer(i + dx, j + dy, skillset[i][j]) for j in range(skillset_size) for i in range(skillset_size)]

    return grid_renderer

def paint(color, text):
    return colorama.Fore.__dict__[color] + text + colorama.Fore.WHITE

def render_reference(renderer):
    text_renderer = get_text_renderer(renderer)

    for i in range(grid_size):
        for j in range(grid_size):
            text_renderer(
                grid_width * i + grid_width // 2,
                grid_height * (j + 1),
                str(i + 1) + str(j + 1)
            )

def get_skillset_display(skillset, ultimate_skillset):
    def get_display(skilled, ultimate_skilled):
        if skilled:
            return pixel_skill_lit
        if ultimate_skilled:
            return pixel_skill_unlit
        return pixel_noskill
    
    return [
        [get_display(skillset[i][j], ultimate_skillset[i][j]) for j in range(skillset_size)]
        for i in range(skillset_size)
    ]

pixel_empty = ' '
pixel_skill_lit = 'o'
pixel_skill_unlit = 'x'
pixel_noskill = '.'
pixel_flag = '*'
skillset_size = 5
canvas_width = 109
canvas_height = 55
grid_width = 12
grid_height = 6
grid_size = 9

def init_canvas():
    canvas = [[pixel_empty] * canvas_height for i in range(canvas_width)]
    renderer = get_zero_renderer(canvas)
    grid_renderer = get_grid_renderer(renderer)
    render_row(renderer, grid_height, '-')
    render_column(renderer, grid_width, '|')
    render_reference(renderer)
    return canvas

