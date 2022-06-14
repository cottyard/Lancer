class Module
{
    readonly cvs_size: number = 720;
    readonly board_size_x: number = 9;
    readonly board_size_y: number = 9;
    readonly grid_count: number = 9;
    readonly skill_range: number = 2;
    readonly skillset_size: number = this.skill_range * 2 + 1;
    
    readonly const = {
        'STYLE_GREY': "rgb(228, 228, 228)",
        'STYLE_BLACKISH': "#555",
        'STYLE_BLACK': "#000",
        'STYLE_WHITE': "#FFF",
        'STYLE_CYAN': '#01cdfe',
        'STYLE_RED_LIGHT': '#ff8080',
        'STYLE_RED_SHALLOW': 'rgba(255, 128, 128, 0.3)',
        'STYLE_RED': '#ff0000',
        'STYLE_GOLD': '#ffd700',
        'STYLE_GOLD_LIGHT': "rgba(255, 215, 0, 0.3)",
        'STYLE_BLUE_LIGHT': '#80ccff',
        'STYLE_BLUE_SHALLOW': 'rgba(128, 204, 255, 0.4)',
        'STYLE_GREEN_LIGHT': '#80e080',
        'STYLE_GREEN': '#079400',
        'STYLE_TEAL': '#0292B7',
        'STYLE_TERQUOISE': '#1AC8DB'
    };
    settings = {
        'cvs_size': this.cvs_size,
        'cvs_border_width': 3,
        'grid_size': this.cvs_size / 9,
        'piece_font': "40px Courier New",
    };
}

export let g: Module = new Module();
