class Module
{
    readonly cvs_size: number = 720;
    readonly board_size_x: number = 9;
    readonly board_size_y: number = 9;
    readonly grid_count: number = 9;
    readonly skill_range: number = 2;
    readonly max_unit_count: number = 20;
    readonly layout_1st: UnitConstructor[] = [Archer, Wagon, Archer, Rider, King, Rider, Archer, Wagon, Archer];
    readonly layout_2nd: UnitConstructor[] = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian];
    readonly all_unit_types: UnitConstructor[] = [
        King, Rider, Soldier, Archer, Barbarian, Wagon, Lancer, Knight, Spearman, Swordsman, Warrior
    ];
    readonly spawnable_unit_types: UnitConstructor[] = [
        Rider, Soldier, Barbarian, Archer, Wagon
    ];
    settings = {
        'cvs_size': this.cvs_size,
        'cvs_border_width': 3,
        'grid_size': this.cvs_size / 9,
        'piece_font': "40px Courier New"
    };
    const = {
        'STYLE_GREY': "rgb(228, 228, 228)",
        'STYLE_BLACK': "#000",
        'STYLE_WHITE': "#FFF",
        'STYLE_CYAN': '#01cdfe',
        'STYLE_RED_LIGHT': '#ff8080',
        'STYLE_GOLD': '#ffd700',
        'STYLE_BLUE_LIGHT': '#80ccff',
        'STYLE_CYAN_T': "rgba(1, 205, 254, 0.5)",
        'STYLE_GREEN_LIGHT': '#80ff80'
    };

    readonly perfect_skills_literal: { [unit_name: string]: string } =
    {
        'King':
            `-----
            -xxx-
            -x-x-
            -xxx-
            -----`,
        'Rider':
            `-x-x-
            x---x
            -----
            x---x
            -x-x-`,
        'Lancer':
            `-xxx-
            x---x
            x---x
            x---x
            -xxx-`,
        'Knight':
            `-x-x-
            xx-xx
            -----
            xx-xx
            -x-x-`,
        'Soldier':
            `-----
            --x--
            -x-x-
            --x--
            -----`,
        'Swordsman':
            `-----
            -xxx-
            -x-x-
            -xxx-
            -----`,
        'Spearman':
            `--x--
            --x--
            xx-xx
            --x--
            --x--`,
        'Archer':
            `--x--
            -----
            x---x
            -----
            --x--`,
        'Barbarian':
            `-----
            -x-x-
            -----
            -x-x-
            -----`,
        'Warrior':
            `--x--
            -x-x-
            x---x
            -x-x-
            --x--`,
        'Wagon':
            `-----
            --x--
            -xxx-
            --x--
            -----`
    };

    inborn_skills_literal: { [unit_name: string]: string; } =
    {
        'King':
            `-----
            -xxx-
            -x-x-
            -xxx-
            -----`,
        'Rider':
            `-x-x-
            -----
            -----
            -----
            -----`,
        'Soldier':
            `-----
            --x--
            -----
            --x--
            -----`,
        'Archer':
            `--x--
            -----
            -----
            -----
            --x--`,
        'Barbarian':
            `-----
            -x-x-
            -----
            -----
            -----`,
        'Wagon':
            `-----
            -----
            --x--
            -----
            -----`
    };

    readonly perfect_skills = new Map<UnitConstructor, SkillSet>();
    readonly inborn_skills = new Map<UnitConstructor, SkillSet>();

    initialize()
    {
        this.all_unit_types.forEach((type: UnitConstructor) =>
        {
            this.perfect_skills.set(
                type, 
                SkillSet.from_literal(this.perfect_skills_literal[type.name])
            );
        
            let inborn = this.inborn_skills_literal[type.name];
        
            if (inborn != undefined)
            {
                this.inborn_skills.set(
                    type, 
                    SkillSet.from_literal(inborn)
                );
            }
        });
    }
}

let g: Module = new Module();
