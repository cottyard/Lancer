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
    buffer = []
    for j in range(canvas_height - 1, -1, -1):
        for i in range(canvas_width):
            buffer.append(canvas[i][j])
        buffer.append('\n')
    print(''.join(buffer))

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
    def highlight_renderer(grid_x, grid_y, color, to_the_left, content):
        if to_the_left:
            offset = -4
        else:
            offset = 3

        for char in content:
            renderer(
                grid_width * grid_x + grid_width // 2 + offset,
                grid_height * (grid_y + 1),
                paint(color, char)
            )
            offset += 1
    return highlight_renderer

def get_grid_renderer(renderer):
    text_renderer = get_text_renderer(renderer)
    c_text_renderer = get_condensed_text_renderer(renderer)
    def grid_renderer(
            grid_x, grid_y, label_1, label_2, color,
            flag, counter_1, counter_2, matrix_1, matrix_2):
        text_renderer(
            grid_width * grid_x + 2,
            grid_height * grid_y + grid_height // 2 + 1,
            label_1)

        c_text_renderer(
            grid_width * grid_x + 2,
            grid_height * grid_y + grid_height // 2,
            paint(color, label_2),
            len(label_2))

        if flag:
            renderer(
                grid_width * grid_x + 3,
                grid_height * grid_y + grid_height // 2 - 1,
                pixel_flag
            )

        if counter_1 > 0:
            c_text_renderer(
                grid_width * grid_x + 2,
                grid_height * grid_y + grid_height // 2 - 2,
                paint("RED", str(counter_1)),
                len(str(counter_1))
            )

        if counter_2 > 0:
            c_text_renderer(
                grid_width * grid_x + 4,
                grid_height * grid_y + grid_height // 2 - 2,
                paint("GREEN", str(counter_2)),
                len(str(counter_2))
            )

        dx = grid_width * (grid_x + 1) - matrix_size
        dy = grid_height * grid_y + 1
        matrix = get_matrices_display(matrix_1, matrix_2)
        [
            renderer(i + dx, j + dy, matrix[i][j]) 
            for j in range(matrix_size) 
            for i in range(matrix_size)
        ]

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

def get_matrices_display(matrix_1, matrix_2):
    def get_display(marked_1, marked_2):
        if marked_1:
            return pixel_marked_1
        if marked_2:
            return pixel_marked_2
        return pixel_not_marked
    
    return [
        [get_display(matrix_1[i][j], matrix_2[i][j]) for j in range(matrix_size)]
        for i in range(matrix_size)
    ]

pixel_empty = ' '
pixel_marked_1 = 'o'
pixel_marked_2 = 'x'
pixel_not_marked = '.'
pixel_flag = '*'
pixel_row = '-'
pixel_column = '|'
matrix_size = 5
canvas_width = 109
canvas_height = 55
grid_width = 12
grid_height = 6
grid_size = 9

def init_canvas():
    canvas = [[pixel_empty] * canvas_height for i in range(canvas_width)]
    renderer = get_zero_renderer(canvas)
    render_row(renderer, grid_height, pixel_row)
    render_column(renderer, grid_width, pixel_column)
    render_reference(renderer)
    return canvas

