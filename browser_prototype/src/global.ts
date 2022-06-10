class Module
{
    global_lifecycle_objects = {};
    audio_context = new AudioContext();
    event_box = new EventBox();

    readonly cvs_size: number = 720;
    readonly board_size_x: number = 9;
    readonly board_size_y: number = 9;
    readonly grid_count: number = 9;
    readonly skill_range: number = 2;
    readonly skillset_size: number = this.skill_range * 2 + 1;
    readonly layout_1st: UnitConstructor[] = [Archer, Rider, Archer, Rider, King, Rider, Archer, Rider, Archer];
    readonly layout_2nd: UnitConstructor[] = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian];
    readonly all_unit_types: UnitConstructor[] = [
        King, Rider, Soldier, Archer, Barbarian, Lancer, Knight, Spearman, Swordsman, Warrior
    ];
    unit_type_by_name = new Map<string, UnitConstructor>();
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
        'server_url': window.location.href,
        'player_color_map': {
            [Player.P1]: this.const.STYLE_RED_LIGHT,
            [Player.P2]: this.const.STYLE_BLUE_LIGHT
        }
    };
    display_action_style = new Map<DisplayActionType, string>();
    action_style = new Map<ActionType, string>();

    readonly perfect_skills_literal: { [unit_name: string]: string | undefined; } =
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
    };

    readonly inborn_skills_literal: { [unit_name: string]: string | undefined; } =
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
        -----`
    };

    readonly perfect_skills: SkillSet[] = [];
    readonly inborn_skills: SkillSet[] = [];

    initialize()
    {
        this.all_unit_types.forEach((type: UnitConstructor) =>
        {
            this.unit_type_by_name.set(type.name, type);

            let literal = this.perfect_skills_literal[type.name];
            if (!literal)
            {
                throw new Error(`${ type.name } not found`);
            }
            this.perfect_skills[type.id] = SkillSet.from_literal(literal);

            let inborn = this.inborn_skills_literal[type.name];

            if (inborn)
            {
                this.inborn_skills[type.id] = SkillSet.from_literal(inborn);
            }
        });

        this.display_action_style = new Map<DisplayActionType, string>([
            [DisplayActionType.Attack, g.const.STYLE_RED_LIGHT],
            [DisplayActionType.Defend, g.const.STYLE_GREEN_LIGHT],
            [DisplayActionType.Move, g.const.STYLE_BLACK],
            [DisplayActionType.Upgrade, g.const.STYLE_CYAN],
            [DisplayActionType.AttackAssist, g.const.STYLE_RED_LIGHT],
            [DisplayActionType.MoveAssist, g.const.STYLE_BLACK]
        ]);

        this.action_style = new Map<ActionType, string>([
            [ActionType.Attack, g.const.STYLE_RED_LIGHT],
            [ActionType.Defend, g.const.STYLE_GREEN_LIGHT],
            [ActionType.Move, g.const.STYLE_BLACK],
            [ActionType.Upgrade, g.const.STYLE_CYAN],
        ]);
    }
}

let g: Module = new Module();

function notify_changes_for_object(event: string, object: any): any
{
    let handler = {
        get: (target: any, key: any): any => {
            if(typeof target[key] == "object" && target[key] != null) 
            {
                return new Proxy(target[key], handler)
            }
            return target[key];
        },
        set: (target: any, prop: any, value: any) => {
            target[prop] = value;
            g.event_box.emit(event, object);
            return true;
        }
      }
      
      return new Proxy(object, handler);
}

function beep(): void
{
    let v = g.audio_context.createOscillator();
    let u = g.audio_context.createGain();
    v.connect(u);
    v.frequency.value = 880;
    u.gain.value = 0.01;
    v.type = "square";
    u.connect(g.audio_context.destination);
    v.start(g.audio_context.currentTime);
    v.stop(g.audio_context.currentTime + 0.05);
}

function clear_intervals()
{
    let interval_id = setInterval(() => { }, 10000);
    for (let i = 1; i <= interval_id; i++)
    {
        clearInterval(i);
    }
}
