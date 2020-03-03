interface IRenderableGame
{
    get_context(): GameContext;
    get_action(): PlayerAction;
    get_action_cost(): number;
    get_move(): PlayerMove;
    get_buff(): FullBoard<Buff>;
    delete_move(move: Move): void;
    set_moves(moves: Move[]): void;
    refresh(): void;
    highlight(coord: Coordinate): void;
    show_last(): void;
    show_present(): void;
    show_heat(): void;
    hide_heat(): void;
}

class RenderableGame implements IRenderableGame
{
    game: GameContext;

    canvas: GameCanvas;
    action_panel: ActionPanel;
    // status_bar: StatusBar;
    // button_bar: ButtonBar;
    player_moved = new Map<Player, boolean>();
    player_consumed_milliseconds = new Map<Player, number>();

    current: Coordinate | null = null;
    selected: Coordinate | null = null;
    options_capable: Coordinate[] = [];
    options_upgrade: Coordinate[] = [];
    options_recall: Coordinate[] = [];
    _show_heat: boolean = false;
    show_threats: boolean = true;

    _displaying_board: Board<Unit>;
    displaying_heat_board: FullBoard<Heat>;
    displaying_buff_board: FullBoard<Buff>;
    private _show_last_round: boolean = false;

    displaying_actions: PlayerAction[] = [];

    player_move: PlayerMove = new PlayerMove(this.game.player);
    player_action: [PlayerAction] = [new PlayerAction(this.game.player)];

    constructor()
    {
        this.game = new GameContext(
            Player.P1, 
            new Map<Player, string>([[Player.P1, 'player1'], [Player.P2, 'player2']]), 
            Game.new_game());

        this.canvas = new GameCanvas(
            <HTMLCanvasElement>document.getElementById('background'),
            <HTMLCanvasElement>document.getElementById('static'), 
            <HTMLCanvasElement>document.getElementById('animate'),
            <HTMLCanvasElement>document.getElementById('animate-transparent'));

        this.action_panel = new ActionPanel(<HTMLDivElement>document.getElementById('action-panel'), this);

        this.canvas.animate.addEventListener("mousedown", this.on_mouse_down.bind(this));
        this.canvas.animate.addEventListener("mouseup", this.on_mouse_up.bind(this));
        this.canvas.animate.addEventListener("mousemove", this.on_mouse_move.bind(this));
        this.canvas.animate.addEventListener("mouseleave", this.clear_grid_incicators.bind(this));
        this.canvas.animate.addEventListener("touchstart",  this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchmove", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchend", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchleave", this.clear_grid_incicators.bind(this));

        let board_ctor = create_serializable_board_ctor<Unit, UnitConstructor>(UnitConstructor);
        this._displaying_board = new board_ctor();
        this.displaying_heat_board = new FullBoard<Heat>(() => new Heat());
        this.displaying_buff_board = new FullBoard<Buff>(() => new Buff());

        this.canvas.paint_background();

        let random_unit = g.all_unit_types[Math.floor(Math.random() * g.all_unit_types.length)];
        let random_player = Math.floor(Math.random() * 2) + 1;
        this.displaying_board.put(new Coordinate(4,4), this.create_perfect(random_player, random_unit));
        
        this.render_board();
        this.render_indicators();
        // this.status_bar.render();
        // this.button_bar.render();
    }

    create_perfect(player: Player, ctor: UnitConstructor): Unit
    {
        let unit = new ctor(player, null);
        unit.perfect.as_list().forEach(s => {unit.endow(s);});
        return unit;
    }

    get_action(): PlayerAction
    {
        return this.player_action[0];
    }

    get_buff(): FullBoard<Buff>
    {
        return this.game.buff;
    }

    get_context(): GameContext
    {
        return this.game;
    }

    delete_move(move: Move)
    {
        this.player_move.moves.splice(
            this.player_move.moves.findIndex(m => m.equals(move)),
            1);
        this.update_player_action();
        return this.player_move
    }

    get_move(): PlayerMove
    {
        return this.player_move;
    }

    set_moves(moves: Move[])
    {
        this.player_move.moves = moves;
        this.update_player_action();
    }

    highlight(coord: Coordinate)
    {
        this.canvas.paint_grid_indicator(coord);
    }

    refresh()
    {
        this.render_indicators();
    }

    set displaying_board(value: Board<Unit>)
    {
        this._displaying_board = value;
        this.displaying_heat_board = Rule.get_heat(value);
        this.displaying_buff_board = Rule.get_buff(value);
        this.render_board();
        this.render_indicators();
    }

    get displaying_board()
    {
        return this._displaying_board;
    }

    set board(value: Board<Unit>)
    {
        this._board = value;
        if (value)
        {
            this.buff_board = Rule.get_buff(value);
        }
    }

    get board(): Board<Unit>
    {
        return this._board;
    }

    set show_last_round(value: boolean)
    {
        if (value && this.last_round_board)
        {
            this._show_last_round = true;
            this.displaying_actions = this.last_round_actions;
            this.displaying_board = this.last_round_board;
        }
        else if (!value)
        {
            this._show_last_round = false;
            this.displaying_actions = this.player_action;
            this.displaying_board = this.board;
        }
    }

    get show_last_round()
    {
        return this._show_last_round;
    }

    show_last()
    {
        this.show_last_round = true;
    }

    show_present()
    {
        this.show_last_round = false;
    }

    get_action_cost(): number
    {
        if (this.game.buff)
        {
            return this.player_action[0].cost(this.game.buff);
        }
        return 0;
    }

    render_indicators(): void
    {
        this.clear_animate();

        for (let option of this.options_upgrade)
        {
            this.canvas.paint_grid_indicator(option, g.const.STYLE_TERQUOISE, 2);
        }
        for (let option of this.options_capable)
        {
            this.canvas.paint_grid_indicator(option);
        }
        for (let option of this.options_recall)
        {
            this.canvas.paint_grid_indicator(option, g.const.STYLE_GOLD, 3);
        }
        
        if (this.current)
        {
            this.canvas.paint_grid_indicator(this.current);
        }
        if (this.selected)
        {
            this.canvas.paint_grid_indicator(this.selected);
        }
        if (this._show_heat)
        {
            this.render_heat();
        }
        for (let player_action of this.displaying_actions)
        {
            this.canvas.paint_actions(new DisplayPlayerAction(player_action), this.displaying_board);
        }
        if (this.show_last_round)
        {
            let last = this.game.last();
            if (last)
            {
                for (let martyr of last.martyrs)
                {
                    this.canvas.paint_victim_indicator(martyr.quester.hometown, martyr.relic);
                }
            }
        }
        this.action_panel.render();
    }

    clear_grid_incicators(): void
    {
        this.current = null;
        this.selected = null;
        this.show_threats = true;
        this.options_capable = [];
        this.options_upgrade = [];
        this.options_recall = [];
        this.render_indicators();
    }

    clear_animate(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx);
        this.canvas.clear_canvas(this.canvas.am_ctx_t);
    }
    
    render_heat(): void
    {
        this.displaying_heat_board.iterate_units((heat, coord) => {
            this.canvas.paint_heat(coord, heat);
        });
        this.displaying_buff_board.iterate_units((buff, coord) => {
            this.canvas.paint_buff(coord, buff);
        });
    }

    show_heat(): void
    {
        this._show_heat = true;
        this.render_indicators();
    }

    hide_heat(): void
    {
        this._show_heat = false;
        this.render_indicators();
    }

    get_coordinate(event: MouseEvent): Coordinate
    {
        let rect = this.canvas.background.getBoundingClientRect();
        let mouse_x = event.clientX - rect.left - g.settings.cvs_border_width;
        let mouse_y = event.clientY - rect.top - g.settings.cvs_border_width;

        return GameCanvas.to_coordinate(mouse_x, mouse_y);
    }

    on_touch(event: TouchEvent)
    {
        let touches = event.changedTouches;
        let first = touches[0];
        let type = ""

        switch (event.type)
        {
            case "touchstart":
                type = "mousedown";
                break;
            case "touchmove":
                type = "mousemove";
                break;
            case "touchend":
                type = "mouseup";
                break;
        }

        let simulated = document.createEvent("MouseEvent");
        simulated.initMouseEvent(
            type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0, null);

        first.target.dispatchEvent(simulated);
        event.preventDefault();
    }

    on_mouse_move(event: MouseEvent): void
    {
        let coord = this.get_coordinate(event);

        if (!this.current?.equals(coord))
        {
            this.current = coord;
            if (!this.selected)
            {
                this.update_options(coord);
            }
            this.render_indicators();
        }
    }

    on_mouse_down(event: MouseEvent): void
    {
        let coord = this.get_coordinate(event);
        this.selected = coord;
        this.show_threats = false;
        this.update_options(coord);
        this.render_indicators();
    }
    
    on_mouse_up(event: MouseEvent): void
    {
        this.current = this.get_coordinate(event);
        if (this.selected && !this.show_last_round)
        {
            let selected = this.selected;

            this.player_move.moves = this.player_move.moves.filter(
                (move) => !move.from.equals(selected)
            );

            this.player_move.append(new Move(this.selected, this.current));

            try
            {
                this.update_player_action();
            }
            catch (e)
            {
                this.player_move.pop();
                this.update_player_action();
            }
        }
        this.selected = null;
        this.show_threats = true;
        this.update_options(this.current);
        this.render_indicators();
    }

    update_player_action()
    {
        this.player_action[0] = Rule.validate_player_move(this.board, this.player_move);
        this.player_action[0].actions.sort((a1, a2) => a2.type - a1.type);
        this.render_indicators();
        this.status_bar.render();
        this.button_bar.render();
    }

    update_options(coord: Coordinate)
    {
        if (this.show_threats)
        {
            this.options_capable = Rule.able_to_reach(this.displaying_board, coord);
            this.options_upgrade = [];
            this.options_recall = [];
        }
        else
        {
            let unit = this.displaying_board.at(coord);
            if (unit)
            {
                this.options_capable = Rule.reachable_by(this.displaying_board, coord);
                this.options_upgrade = Rule.upgradable_by(this.displaying_board, coord);    
                this.options_recall = [];
            }
            else
            {
                this.options_capable = [];
                if (Rule.is_king_side(this.displaying_board, this.player, coord))
                {
                    this.options_upgrade = [];
                    this.options_recall = Rule.recallable_by(this.displaying_board, this.player, coord);
                }
                else
                {
                    this.options_upgrade = Rule.spawnable_by(this.displaying_board, coord);
                    this.options_recall = [];
                }
            }
        }
    }

    render_board()
    {
        this.canvas.clear_canvas(this.canvas.st_ctx);
        this.displaying_board.iterate_units((unit, coord) => {
            this.canvas.paint_unit(CanvasUnitFactory(unit), coord)
        });
    }
}

enum DisplayActionType
{
    Upgrade = 1,
    Defend = 2,
    Move = 3,
    Attack = 4,
    Recruit = 5,
    Recall = 6,
    MoveAssist = 7,
    AttackAssist = 8
}

class DisplayAction
{
    constructor(public type: DisplayActionType, public action: Action)
    {
    }
}

class DisplayPlayerAction
{
    player: Player;
    actions: DisplayAction[];

    constructor(player_action: PlayerAction)
    {
        this.player = player_action.player;

        let first_arriver = new HashMap<Coordinate, true>();
        this.actions = player_action.actions.map((a: Action) =>
        {
            let type = <DisplayActionType><unknown>a.type;
            if (a.type == ActionType.Attack || a.type == ActionType.Move)
            {
                let arriver = first_arriver.get(a.move.to);
                first_arriver.put(a.move.to, true);
                let is_first = !arriver;
                if (!is_first)
                {
                    if (a.type == ActionType.Attack)
                    {
                        type = DisplayActionType.AttackAssist;
                    }
                    else
                    {
                        type = DisplayActionType.MoveAssist;
                    }
                }
            }
            return new DisplayAction(type, a);
        });
    }
}