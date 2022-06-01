interface IRenderController
{
    displaying_board: BoardContext;
    components: {
        action_panel: IComponent,
        status_bar: IComponent,
        button_bar: IButtonBar;
    };
    show_last_round: boolean;
    refresh(): void;
    highlight(coord: Coordinate): void;
    show_last(): void;
    show_present(): void;
    show_heat(): void;
    hide_heat(): void;
    refresh_all(): void;
    freeze_selection(): void;
    unfreeze_selection(): void;
}

class RenderController implements IRenderController
{
    canvas: GameCanvas;

    current: Coordinate | null = null;
    selected: Coordinate | null = null;
    options_capable: Coordinate[] = [];
    options_upgrade: Coordinate[] = [];
    // options_recall: Coordinate[] = [];
    _show_heat: boolean = false;
    show_threats: boolean = true;
    _selection_frozen: boolean = false;

    _displaying_board: BoardContext;
    private _show_last_round: boolean = false;

    displaying_actions: Players<PlayerAction>;

    constructor(
        public context: IGameContext,
        public components: {
            action_panel: IComponent,
            status_bar: IComponent,
            button_bar: IButtonBar;
        })
    {
        this.canvas = new GameCanvas(
            <HTMLCanvasElement> document.getElementById('background'),
            <HTMLCanvasElement> document.getElementById('static'),
            <HTMLCanvasElement> document.getElementById('animate'),
            <HTMLCanvasElement> document.getElementById('animate-transparent'));

        this.canvas.animate.addEventListener("mousedown", this.on_mouse_down.bind(this));
        this.canvas.animate.addEventListener("mouseup", this.on_mouse_up.bind(this));
        this.canvas.animate.addEventListener("mousemove", this.on_mouse_move.bind(this));
        this.canvas.animate.addEventListener("mouseleave", this.clear_grid_incicators.bind(this));
        this.canvas.animate.addEventListener("touchstart", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchmove", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchend", this.on_touch.bind(this));
        this.canvas.animate.addEventListener("touchleave", this.clear_grid_incicators.bind(this));

        this.displaying_actions = Players.map((p) => new PlayerAction(p));

        this.canvas.paint_background();

        this._displaying_board = this.context.present.board;
        this.show_present();
    }

    refresh_all()
    {
        this.render_board();
        this.refresh();
    }

    // test_run()
    // {
    //     this.canvas.paint_background();

    //     this.context.present.board.put(new Coordinate(4,4), this.create_perfect(Player.P1, Lancer));
    //     this.context.present.board.put(new Coordinate(5,5), this.create_perfect(Player.P1, Knight));
    //     this.context.present.board.put(new Coordinate(3,5), this.create_perfect(Player.P1, Knight));
    //     this.context.present.board.put(new Coordinate(5,7), this.create_perfect(Player.P2, Warrior));
    //     this.context.present.board.put(new Coordinate(6,7), this.create_perfect(Player.P1, Spearman));
    //     this.context.present.board.put(new Coordinate(7,7), this.create_perfect(Player.P1, Spearman));
    //     this.context.present.board.put(new Coordinate(4,2), this.create_perfect(Player.P1, Soldier));
    //     this.context.present.board.put(new Coordinate(4,1), this.create_perfect(Player.P2, Soldier));
    //     this.context.present.board.put(new Coordinate(1,1), this.create_perfect(Player.P2, Soldier));
    //     this.context.present.board.put(new Coordinate(4,8), new Swordsman(Player.P1));

    //     this.context.present.board.put(new Coordinate(2,2), this.create_perfect(Player.P1, King));

    //     this.run();
    // }

    highlight(coord: Coordinate)
    {
        this.canvas.paint_grid_indicator(coord);
    }

    refresh()
    {
        this.render_indicators();
        this.components.button_bar.render();
    }

    set displaying_board(value: BoardContext)
    {
        this._displaying_board = value;
        this.render_board();
        this.render_indicators();
    }

    get displaying_board()
    {
        return this._displaying_board;
    }

    set show_last_round(value: boolean)
    {
        if (value && this.context.last)
        {
            this._show_last_round = true;
            this.displaying_actions = this.context.present.last_actions!;
            this.displaying_board = this.context.last!.board;
        }
        else if (!value)
        {
            this._show_last_round = false;
            this.displaying_actions = this.context.actions;
            this.displaying_board = this.context.present.board;
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
        // for (let option of this.options_recall)
        // {
        //     this.canvas.paint_grid_indicator(option, g.const.STYLE_GOLD, 3);
        // }

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
        for (let player_action of Array.from(Player.values(this.displaying_actions)))
        {
            this.canvas.paint_actions(new DisplayPlayerAction(player_action), this.displaying_board.unit);
        }
        if (this.show_last_round)
        {
            for (let martyr of this.context.present.martyrs)
            {
                this.canvas.paint_victim_indicator(martyr.quester.hometown, martyr.relic);
            }
        }
        this.components.action_panel.render();
        this.components.status_bar.render();
    }

    clear_grid_incicators(): void
    {
        this.current = null;
        this.selected = null;
        this.show_threats = true;
        this.options_capable = [];
        this.options_upgrade = [];
        // this.options_recall = [];
        this.render_indicators();
    }

    clear_animate(): void
    {
        this.canvas.clear_canvas(this.canvas.am_ctx);
        this.canvas.clear_canvas(this.canvas.am_ctx_t);
    }

    render_heat(): void
    {
        this.displaying_board.heat.iterate_units((heat, coord) =>
        {
            this.canvas.paint_heat(coord, heat);
        });
        // this.displaying_board.buff.iterate_units((buff, coord) =>
        // {
        //     this.canvas.paint_buff(coord, buff);
        // });
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
        let type = "";

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
        if (!this.selection_frozen)
        {
            this.selected = coord;
        }
        this.show_threats = false;
        this.update_options(coord);
        this.render_indicators();
    }

    freeze_selection(): void
    {
        this._selection_frozen = true;
    }

    unfreeze_selection(): void
    {
        this._selection_frozen = false;
    }

    get selection_frozen(): boolean
    {
        return this._selection_frozen || this.show_last_round;
    }

    on_mouse_up(event: MouseEvent): void
    {
        this.current = this.get_coordinate(event);

        if (this.selected && !this.selection_frozen)
        {
            for (let player of Player.both())
            {
                if (this.context.prepare_move(player, new Move(this.selected, this.current)) != "invalid")
                {
                    break;
                }
            }
        }

        this.selected = null;
        this.show_threats = true;
        this.update_options(this.current);
        this.refresh();
    }

    update_options(coord: Coordinate)
    {
        if (this.show_threats)
        {
            this.options_capable = Rule.which_can_reach(this.displaying_board.unit, coord);
            this.options_upgrade = [];
            // this.options_recall = [];
        }
        else
        {
            let unit = this.displaying_board.unit.at(coord);
            if (unit)
            {
                this.options_capable = Rule.reachable_by(this.displaying_board.unit, coord);
                this.options_upgrade = Rule.upgradable_by(this.displaying_board.unit, coord);
                // this.options_recall = [];
            }
            else
            {
                // this.options_capable = [];
                // this.options_upgrade = Rule.spawnable_by(this.displaying_board.unit, coord);

                // for (let player of Player.both())
                // {
                //     if (Rule.is_king_side(this.displaying_board.unit, player, coord))
                //     {
                //         this.options_recall = Rule.recallable_by(this.displaying_board, player, coord);
                //         return;
                //     }
                // }
            }
        }
    }

    render_board()
    {
        this.canvas.clear_canvas(this.canvas.st_ctx);
        this.displaying_board.unit.iterate_units((unit, coord) =>
        {
            this.canvas.paint_unit(CanvasUnitFactory(unit), coord);
        });
    }
}

enum DisplayActionType
{
    Upgrade = 1,
    Defend = 2,
    Move = 3,
    Attack = 4,
    // Recruit = 5,
    // Recall = 6,
    MoveAssist = 7,
    AttackAssist = 8
}

class DisplayAction
{
    constructor(public player: Player, public type: DisplayActionType, public action: Action)
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

        let first_arriver = new HashSet<Coordinate>();
        this.actions = player_action.actions.map((a: Action) =>
        {
            let type = <DisplayActionType> <unknown> a.type;
            if (a.type == ActionType.Attack || a.type == ActionType.Move)
            {
                let is_first = !first_arriver.has(a.move.to);
                first_arriver.put(a.move.to);
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
            return new DisplayAction(this.player, type, a);
        });
    }
}