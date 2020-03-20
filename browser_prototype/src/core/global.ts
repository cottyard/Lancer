import
{
    UnitConstructor, King, Rider, Soldier, Archer, Barbarian, Wagon,
    Lancer, Knight, Spearman, Swordsman, Warrior, SkillSet, PlayerData, Player
} from '../core/entity';

class Global
{
    readonly board_size_x: number = 9;
    readonly board_size_y: number = 9;
    readonly grid_count: number = 9;

    readonly skill_range: number = 2;
    readonly skillset_size: number = this.skill_range * 2 + 1;
    readonly max_unit_count: number = 28;
    readonly layout_1st: UnitConstructor[] = [Archer, Wagon, Archer, Rider, King, Rider, Archer, Wagon, Archer];
    readonly layout_2nd: UnitConstructor[] = [Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian, Soldier, Barbarian];
    readonly all_unit_types: UnitConstructor[] = [
        King, Rider, Soldier, Archer, Barbarian, Wagon, Lancer, Knight, Spearman, Swordsman, Warrior
    ];
    spawning_skills: SkillSet | null = null;
    spawn_row: PlayerData<number> | null = null;
    unit_type_by_name = new Map<string, UnitConstructor>();

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
            'Wagon':
                `-----
            --x--
            -x-x-
            --x--
            -----`
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

        this.spawning_skills = SkillSet.from_literal(this.spawning_skills_literal);
        this.spawn_row = {
            [Player.P1]: g.board_size_y - 1,
            [Player.P2]: 0
        };
    }
}

let g: Global = new Global();

export { g };