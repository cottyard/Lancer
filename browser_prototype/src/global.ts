class Module
{
    game: Game | null = null;

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
    unit_type_by_name = new Map<string, UnitConstructor>();
    readonly spawnable_unit_types: UnitConstructor[] = [
        Rider, Soldier, Barbarian, Archer, Wagon
    ];
    settings = {
        'cvs_size': this.cvs_size,
        'cvs_border_width': 3,
        'grid_size': this.cvs_size / 9,
        'piece_font': "40px Courier New",
        'server_url': 'http://127.0.0.1:5000'
    };
    readonly const = {
        'STYLE_GREY': "rgb(228, 228, 228)",
        'STYLE_BLACK': "#000",
        'STYLE_WHITE': "#FFF",
        'STYLE_CYAN': '#01cdfe',
        'STYLE_RED_LIGHT': '#ff8080',
        'STYLE_GOLD': '#ffd700',
        'STYLE_BLUE_LIGHT': '#80ccff',
        'STYLE_GREEN_LIGHT': '#80e080'
    };
    private _action_style: Map<ActionType, string> | undefined;
    get action_style():  Map<ActionType, string> {
        if (this._action_style == null) {
            throw new Error("Not initialized.");
        }
        return this._action_style;
    }

    readonly perfect_skills_literal: { [unit_name: string]: string | undefined } =
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

    readonly inborn_skills_literal: { [unit_name: string]: string | undefined } =
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
            this.unit_type_by_name.set(type.name, type);

            let literal = this.perfect_skills_literal[type.name];
            if (!literal)
            {
                throw new Error(`${type.name} not found`);
            }
            this.perfect_skills.set(
                type, 
                SkillSet.from_literal(literal)
            );
        
            let inborn = this.inborn_skills_literal[type.name];
        
            if (inborn)
            {
                this.inborn_skills.set(
                    type, 
                    SkillSet.from_literal(inborn)
                );
            }
        });

        this._action_style = new Map<ActionType, string>([
            [ActionType.Attack, g.const.STYLE_RED_LIGHT],
            [ActionType.Defend, g.const.STYLE_GREEN_LIGHT],
            [ActionType.Move, g.const.STYLE_BLACK],
            [ActionType.Upgrade, g.const.STYLE_CYAN],
            [ActionType.Recruit, g.const.STYLE_CYAN]
        ]);
    }
}

let g: Module = new Module();
