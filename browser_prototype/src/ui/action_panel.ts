import { Move, Unit } from '../entity';
import { IGameUiFacade } from '../game'
import { g } from '../global';
import { using } from '../language/language';
import { DisplayAction, DisplayActionType, 
    DisplayPlayerAction, IBoardDisplay } from './board_display'
import { Position } from './canvas';
import { CanvasUnitFactory } from './canvas_entity';
import { DomHelper, IComponent } from './dom_helper';
import { Renderer } from './renderer';

export class ActionPanel implements IComponent
{
    dragging: null | {
        action: DisplayAction,
        offsetX: number,
        offsetY: number,
        clientY: number,
        pos_offset: number,
        placeholder: HTMLElement,
    };

    static padding = 5;
    static margin = 5;
    static scale = 0.75;
    static item_height = (
        g.settings.grid_size * ActionPanel.scale +
        (ActionPanel.padding + ActionPanel.margin) * 2
    );

    constructor(
        public dom_element: HTMLDivElement,
        public board_display: IBoardDisplay,
        public game: IGameUiFacade) 
    {
        this.dragging = null;

        DomHelper.apply_style(this.dom_element, {
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            userSelect: "none",
        });
    }

    render()
    {
        this.dom_element.innerHTML = "";
        new DisplayPlayerAction(this.game.action).actions.forEach(
            (action, index) =>
            {
                this.dom_element.appendChild(this.render_action(action, index));
            });
    }

    render_action(action: DisplayAction, index: number): HTMLElement
    {
        const div = DomHelper.create_div({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: g.const.STYLE_GREY,
            borderRadius: "5px",
            margin: ActionPanel.margin.toString() + "px",
            padding: ActionPanel.padding.toString() + "px",
            cursor: "pointer",
            boxSizing: "border-box",
            order: index * 2,
        });

        // Action unit.
        div.appendChild(this.render_unit(this.get_main_unit(action)));

        // Action name.
        div.appendChild(DomHelper.create_text(
            this.get_action_type_text(action.type),
            {
                color: DisplayAction.display_action_style.get(action.type) || "black",
                'font-weight': 'bold',
                padding: "10px"
            }
        ));

        // Action target.
        const target_unit = this.getTargetUnit(action);
        if (target_unit != null)
        {
            div.appendChild(this.render_unit(target_unit));
        }

        // Space between supply and action name/target.
        div.appendChild(DomHelper.create_div({
            flexGrow: "1",
        }));

        // cost.
        div.appendChild(DomHelper.create_text(
            "🍞" + action.action.cost().toString(),
            { 'font-weight': 'bold' }
        ));

        // Cross & callback.
        const cross = div.appendChild(DomHelper.create_text("✘", {
            fontSize: "20px",
            padding: "20px",
            margin: "-10px"
        }));
        cross.addEventListener("mouseenter", () =>
        {
            DomHelper.apply_style(cross, {
                color: "red",
            });
        });
        cross.addEventListener("mouseleave", () =>
        {
            DomHelper.apply_style(cross, {
                color: "black",
            });
        });
        cross.addEventListener("mousedown", (e: MouseEvent) =>
        {
            this.game.staging_area.delete_moves(
                (m: Move): m is Move => m.equals(action.action.move));
            e.cancelBubble = true;
            g.event_box.emit("refresh ui", null);
        });

        // Drag support.
        div.addEventListener("mousedown", (e: MouseEvent) =>
        {
            this.dragging = {
                action,
                offsetX: e.clientX - div.getBoundingClientRect().left + ActionPanel.margin,
                offsetY: e.clientY - div.getBoundingClientRect().top + ActionPanel.margin,
                clientY: e.clientY,
                pos_offset: 0,
                placeholder: this.dom_element.insertBefore(
                    DomHelper.create_div({
                        height: ActionPanel.item_height.toString() + "px",
                        order: (index * 2).toString(),
                    }),
                    div,
                ),
            };

            // Draw an empty placeholder.
            DomHelper.apply_style(div, {
                position: "fixed",
                width: div.clientWidth.toString() + "px",
                top: (e.clientY - this.dragging.offsetY).toString() + "px",
                left: (e.clientX - this.dragging.offsetX).toString() + "px",
                zIndex: 100,
            });
        });

        const get_dragging_order = (): number =>
        {
            if (this.dragging == null)
            {
                throw new Error("not dragging");
            }
            return (
                (index + this.dragging.pos_offset) * 2
                + Math.sign(this.dragging.pos_offset)
            );
        };

        const mouseup = () =>
        {
            if (this.dragging == null)
            {
                return;
            }

            const dragging_move = this.dragging.action.action.move;

            const ordered_moves = this.game.staging_area.move.moves
                .map((move, index) =>
                {
                    const order = move.equals(dragging_move) ? get_dragging_order() : index * 2;
                    return { move, order };
                })
                .sort((a, b) => a.order - b.order)
                .map(({ move }) => move);

            this.game.prepare_moves(ordered_moves);

            this.dragging.placeholder.remove();
            this.dragging = null;
            DomHelper.apply_style(div, {
                position: "static",
                width: "auto",
                zIndex: 0,
            });
        };

        div.addEventListener("mouseup", mouseup);

        div.addEventListener("mousemove", (e: MouseEvent) =>
        {
            if (this.dragging == null)
            {
                return;
            }

            // Update state and display. Not yet passed to game model.
            this.dragging.pos_offset = Math.round(
                (e.clientY - this.dragging.clientY) / ActionPanel.item_height
            );
            this.dragging.placeholder.style.order = get_dragging_order().toString();

            DomHelper.apply_style(div, {
                position: "fixed",
                top: (e.clientY - this.dragging.offsetY).toString() + "px",
                left: (e.clientX - this.dragging.offsetX).toString() + "px",
            });
        });

        // Hover effect.
        div.addEventListener("mouseenter", () =>
        {
            DomHelper.apply_style(div, {
                backgroundColor: "#b0b0b0",
            });
            this.board_display.highlight(action.action.move.from);
        });

        div.addEventListener("mouseleave", () =>
        {
            DomHelper.apply_style(div, {
                backgroundColor: g.const.STYLE_GREY,
            });
            mouseup();
            g.event_box.emit("refresh ui", null);
        });

        return div;
    }

    get_main_unit(action: DisplayAction): Unit 
    {
        return this.game.context.present.board.unit.at(action.action.move.from)!;
    }

    getTargetUnit(action: DisplayAction): Unit | null
    {
        if (action.type === DisplayActionType.Attack || action.type === DisplayActionType.Defend)
        {
            return this.game.context.present.board.unit.at(action.action.move.to);
        }
        return null;
    }

    render_unit(unit: Unit): HTMLElement
    {
        const canvas = DomHelper.create_canvas({
            zoom: "0.7",
        });
        canvas.width = g.settings.grid_size + 10;
        canvas.height = g.settings.grid_size + 10;
        const context = canvas.getContext("2d");
        if (context == null)
        {
            throw new Error("Your browser is outdated.");
        }
        const canvas_unit = CanvasUnitFactory(unit);

        using(new Renderer(context), (renderer) =>
        {
            renderer.translate(new Position(g.settings.grid_size / 2 + 5, g.settings.grid_size / 2 + 5));
            canvas_unit.paint(renderer);
        });

        return canvas;
    }

    get_action_type_text(type: DisplayActionType): string
    {
        switch (type)
        {
            case DisplayActionType.Upgrade:
                return "upgrading";
            case DisplayActionType.Defend:
                return "defends";
            case DisplayActionType.Move:
                return "moving";
            case DisplayActionType.Attack:
                return "attacks";
            case DisplayActionType.MoveAssist:
                return "assisting";
            case DisplayActionType.AttackAssist:
                return "assisting";
        }
    }
}
