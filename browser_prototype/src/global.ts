class Module
{
    game: Game | null = null;

    readonly cvs_size: number = 720;
    readonly board_size_x: number = 9;
    readonly board_size_y: number = 9;
    readonly grid_count: number = 9;
    readonly skill_range: number = 2;
    readonly max_unit_count: number = 28;
    readonly layout_1st: UnitConstructor[] = [Archer, Wagon, Archer, Rider, King, Rider, Archer, Wagon, Archer];
    readonly layout_2nd: UnitConstructor[] = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian];
    readonly all_unit_types: UnitConstructor[] = [
        King, Rider, Soldier, Archer, Barbarian, Wagon, Lancer, Knight, Spearman, Swordsman, Warrior
    ];
    spawning_skills: SkillSet | null = null;
    unit_type_by_name = new Map<string, UnitConstructor>();
    readonly const = {
        'STYLE_GREY': "rgb(228, 228, 228)",
        'STYLE_BLACK': "#000",
        'STYLE_WHITE': "#FFF",
        'STYLE_CYAN': '#01cdfe',
        'STYLE_RED_LIGHT': '#ff8080',
        'STYLE_RED': '#ff0000',
        'STYLE_GOLD': '#ffd700',
        'STYLE_BLUE_LIGHT': '#80ccff',
        'STYLE_GREEN_LIGHT': '#80e080',
        'STYLE_GREEN': '#079400'
    };
    settings = {
        'cvs_size': this.cvs_size,
        'cvs_border_width': 3,
        'grid_size': this.cvs_size / 9,
        'piece_font': "40px Courier New",
        'server_url': window.location.href,
        'player_color_map': new Map<Player, string>()
    };
    display_action_style = new Map<DisplayActionType, string>();
    action_style = new Map<ActionType, string>();

    readonly perfect_skills_literal: { [unit_name: string]: string | undefined } =
    {
        'King':
            `-----
            --x--
            -x-x-
            --x--
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
            -x-x-
            --x--
            -----`
    };

    readonly inborn_skills_literal: { [unit_name: string]: string | undefined } =
    {
        'King':
            `-----
            --x--
            -x-x-
            --x--
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
            -----
            -----
            -----`
    };

    readonly spawning_skills_literal: string =
        `-xxx-
         -xxx-
         --x--
         -xxx-
         -xxx-`;

    readonly perfect_skills = new Map<UnitConstructor, SkillSet>();
    readonly inborn_skills = new Map<UnitConstructor, SkillSet>();

    initialize()
    {
        g.settings.player_color_map = new Map<Player, string>([
            [Player.P1, g.const.STYLE_RED_LIGHT],
            [Player.P2, g.const.STYLE_BLUE_LIGHT]
        ]);
        
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

        this.spawning_skills = SkillSet.from_literal(this.spawning_skills_literal);

        this.display_action_style = new Map<DisplayActionType, string>([
            [DisplayActionType.Attack, g.const.STYLE_RED_LIGHT],
            [DisplayActionType.Defend, g.const.STYLE_GREEN_LIGHT],
            [DisplayActionType.Move, g.const.STYLE_BLACK],
            [DisplayActionType.Upgrade, g.const.STYLE_CYAN],
            [DisplayActionType.Recruit, g.const.STYLE_CYAN],
            [DisplayActionType.AttackAssist, g.const.STYLE_RED_LIGHT],
            [DisplayActionType.MoveAssist, g.const.STYLE_BLACK]
        ]);

        this.action_style = new Map<ActionType, string>([
            [ActionType.Attack, g.const.STYLE_RED_LIGHT],
            [ActionType.Defend, g.const.STYLE_GREEN_LIGHT],
            [ActionType.Move, g.const.STYLE_BLACK],
            [ActionType.Upgrade, g.const.STYLE_CYAN],
            [ActionType.Recruit, g.const.STYLE_CYAN],
        ]);
    }
}

let g: Module = new Module();
