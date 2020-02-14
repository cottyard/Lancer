class Module
{
    cvs_size: number = 720;
    board_size_x: number = 9;
    board_size_y: number = 9;
    grid_count: number = 9;
    skill_range: number = 2;
    layout_1st: UnitConstructor[] = [Archer, Wagon, Archer, Rider, King, Rider, Archer, Wagon, Archer];
    layout_2nd: UnitConstructor[] = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian];
    settings = {
        'cvs_size': this.cvs_size,
        'cvs_border_width': 3,
        'grid_size': this.cvs_size / 9,
        'piece_font': "40px Courier New",
    };
    const = {
        'STYLE_GREY': "rgb(228, 228, 228)",
        'STYLE_BLACK': "#000",
        'STYLE_WHITE': "#FFF",
        'STYLE_CYAN': '#01cdfe',
        'STYLE_RED_LIGHT': '#ff8080',
        'STYLE_GOLD': '#ffd700',
        'STYLE_BLUE_LIGHT': '#80ccff',
        'STYLE_CYAN_T': "rgba(1, 205, 254, 0.5)"
    };
}

let g: Module = new Module();
