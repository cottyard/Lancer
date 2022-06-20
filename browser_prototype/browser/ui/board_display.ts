import { ResourceStatus } from '../../common/game_round'
import { IGameUiFacade } from '../game'
import { GameCanvas } from './canvas';
import { CanvasUnitFactory } from './canvas_entity';
import { GameBoard, Rule } from '../../common/rule';
import { Action, ActionType, Coordinate, Move, Player, PlayerAction, Players } from '../../common/entity';
import { g } from '../../common/global';
import { HashSet } from '../../common/language';
import { IComponent } from './dom_helper';
import { event_box } from './ui';

export interface IBoardDisplay extends IComponent
{
    displaying_board: GameBoard;
    show_last_round: boolean;
    highlight(coord: Coordinate): void;
    show_last(): void;
    show_present(): void;
    show_heat(): void;
    hide_heat(): void;
    freeze_selection(): void;
    unfreeze_selection(): void;
}

export class BoardDisplay implements IBoardDisplay
{
    canvas: GameCanvas;

    current: Coordinate | null = null;
    selected: Coordinate | null = null;
    options_capable: Coordinate[] = [];
    options_upgrade: Coordinate[] = [];
    _show_heat: boolean = false;
    show_threats: boolean = true;
    _selection_frozen: boolean = false;

    show_last_round: boolean = false;
    displaying_board: GameBoard;
    displaying_actions: Players<PlayerAction>;

    displaying_resources: ResourceStatus[];

    constructor(public game: IGameUiFacade)
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

        this.canvas.paint_background();

        this.displaying_board = this.game.context.present.board;
        this.displaying_actions = Players.create((p) => new PlayerAction(p));
        this.displaying_resources = this.game.context.present.resources;

        this.show_present();
    }

    render(): void 
    {
        this.render_indicators();
    }

    highlight(coord: Coordinate)
    {
        this.canvas.paint_grid_indicator(coord);
    }

    update_displaying_items()
    {
        if (this.show_last_round)
        {
            this.displaying_actions = this.game.context.present.last_actions 
                                    || Players.create((p) => new PlayerAction(p));
            this.displaying_board = this.game.context.last!.board;
            this.displaying_resources = this.game.context.last!.resources;
        }
        else
        {
            this.displaying_actions = Players.create((p) => new PlayerAction(p));
            this.displaying_actions[this.game.context.player] = this.game.context.action;
            this.displaying_board = this.game.context.present.board;
            this.displaying_resources = this.game.context.present.resources;
        }
    }

    show_last()
    {
        this.show_last_round = true;
        this.render_board();
        this.render_indicators();
    }

    show_present()
    {
        this.show_last_round = false;
        this.render_board();
        this.render_indicators();
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

        try
        {
            this.update_displaying_items();
            for (let player_action of Array.from(Players.values(this.displaying_actions)))
            {
                this.canvas.paint_actions(
                    new DisplayPlayerAction(player_action), this.displaying_board.unit);
            }
            if (this.show_last_round)
            {
                for (let martyr of this.game.context.present.martyrs)
                {
                    this.canvas.paint_victim_indicator(martyr.quester.from_grid);
                }
            }
        }
        catch (e)
        {
            console.log("error rendering indicators", e);
        }
    }

    clear_grid_incicators(): void
    {
        this.current = null;
        this.selected = null;
        this.show_threats = true;
        this.options_capable = [];
        this.options_upgrade = [];
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
            try 
            {
                let m = new Move(this.selected, this.current);
                this.game.context.prepare_move(m);
            }
            catch {};
        }

        this.selected = null;
        this.show_threats = true;
        this.update_options(this.current);
        
        event_box.emit("refresh ui", null);
    }

    update_options(coord: Coordinate)
    {
        if (this.show_threats)
        {
            this.options_capable = Rule.which_can_reach(this.displaying_board.unit, coord);
            this.options_upgrade = [];
        }
        else
        {
            let unit = this.displaying_board.unit.at(coord);
            if (unit)
            {
                this.options_capable = Rule.reachable_by(this.displaying_board.unit, coord);
                this.options_upgrade = Rule.upgradable_by(this.displaying_board.unit, coord);
            }
        }
    }

    render_board()
    {
        this.update_displaying_items();
        this.canvas.clear_canvas(this.canvas.st_ctx);

        function get_resource_style(owner: Player): string
        {
            return owner == Player.P2 ? g.const.STYLE_BLUE_LIGHT
                                      : g.const.STYLE_RED_LIGHT;
        }

        for (let i = 0; i < this.displaying_resources.length; ++i)
        {
            let coord = Rule.resource_grids[i];
            let status = this.displaying_resources[i];
            let style;
            let progress;

            if (status.neutral())
            {
                style = g.const.STYLE_BLACKISH;
                progress = 0;
            }
            else
            {
                style = get_resource_style(status.player);
                progress = status.progress / ResourceStatus.full;
            }

            this.canvas.paint_resource(coord, style, progress, status.captured ? 3 : 2);
        }
        
        this.displaying_board.unit.iterate_units((unit, coord) =>
        {
            this.canvas.paint_unit(CanvasUnitFactory(unit), coord);
        });
    }
}

export enum DisplayActionType
{
    Upgrade = 1,
    Defend = 2,
    Move = 3,
    Attack = 4,
    MoveAssist = 7,
    AttackAssist = 8
}

export class DisplayAction
{
    //display_action_style = new Map<DisplayActionType, string>();
    static display_action_style = new Map<DisplayActionType, string>([
        [DisplayActionType.Attack, g.const.STYLE_RED_LIGHT],
        [DisplayActionType.Defend, g.const.STYLE_GREEN_LIGHT],
        [DisplayActionType.Move, g.const.STYLE_BLACK],
        [DisplayActionType.Upgrade, g.const.STYLE_CYAN],
        [DisplayActionType.AttackAssist, g.const.STYLE_RED_LIGHT],
        [DisplayActionType.MoveAssist, g.const.STYLE_BLACK]
    ]);

    constructor(public player: Player, public type: DisplayActionType, public action: Action)
    {
    }
}

export class DisplayPlayerAction
{
    player: Player;
    actions: DisplayAction[];

    constructor(player_action: PlayerAction)
    {
        this.player = player_action.player;

        let first_arriver = new HashSet<Coordinate>();

        player_action.actions.sort((a1, a2) => a2.type - a1.type);

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