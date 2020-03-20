import { IComponent } from '../ui/ui';
import { IRenderController, DisplayAction, DisplayPlayerAction, DisplayActionType } from '../ui/render_controller';
import { IGameContext } from '../client/game_context';
import { Player, Unit, Move } from '../core/entity';
import { cg } from '../client/client_global';
import { Renderer } from '../ui/renderer';
import { CanvasUnitFactory } from '../ui/canvas_entity';
import { Position } from '../ui/canvas';

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

    padding = 5;
    margin = 5;
    scale = 0.75;
    item_height = (
        cg.settings.grid_size * this.scale +
        (this.padding + this.margin) * 2
    );

    constructor(
        public dom_element: HTMLDivElement,
        public render_ctrl: IRenderController,
        public context: IGameContext) 
    {
        this.dragging = null;

        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            userSelect: "none",
        });
    }

    render()
    {
        this.dom_element.innerHTML = "";

        for (let player of Player.both())
        {
            new DisplayPlayerAction(this.context.action(player)).actions.forEach((action, index) =>
            {
                this.dom_element.appendChild(this.renderAction(action, index));
            });
        }
    }

    renderAction(action: DisplayAction, index: number): HTMLElement
    {
        const div = DomHelper.createDiv({
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: cg.const.STYLE_GREY,
            borderRadius: "5px",
            margin: this.margin.toString() + "px",
            padding: this.padding.toString() + "px",
            cursor: "pointer",
            boxSizing: "border-box",
            order: index * 2,
        });

        // Action unit.
        div.appendChild(this.renderUnit(this.getMainUnit(action)));

        // Action name.
        div.appendChild(DomHelper.createText(
            this.getActionTypeText(action.type),
            {
                color: cg.display_action_style.get(action.type) || "black",
                'font-weight': 'bold',
                padding: "10px"
            }
        ));

        // Action target.
        const target_unit = this.getTargetUnit(action);
        if (target_unit != null)
        {
            div.appendChild(this.renderUnit(target_unit));
        }

        // Space between supply and action name/target.
        div.appendChild(DomHelper.createDiv({
            flexGrow: "1",
        }));

        // cost.
        div.appendChild(DomHelper.createText(
            "🍞" + action.action.cost(this.context.present.board.buff).toString(),
            { 'font-weight': 'bold' }
        ));

        // Cross & callback.
        const cross = div.appendChild(DomHelper.createText("✘", {
            fontSize: "20px",
            padding: "20px",
            margin: "-10px"
        }));
        cross.addEventListener("mouseenter", () =>
        {
            DomHelper.applyStyle(cross, {
                color: "red",
            });
        });
        cross.addEventListener("mouseleave", () =>
        {
            DomHelper.applyStyle(cross, {
                color: "black",
            });
        });
        cross.addEventListener("mousedown", (e: MouseEvent) =>
        {
            this.context.delete_moves(action.player, (m: Move): m is Move => m.equals(action.action.move));
            this.render_ctrl.refresh();
            e.cancelBubble = true;
        });

        // Drag support.
        div.addEventListener("mousedown", (e: MouseEvent) =>
        {
            this.dragging = {
                action,
                offsetX: e.clientX - div.getBoundingClientRect().left + this.margin,
                offsetY: e.clientY - div.getBoundingClientRect().top + this.margin,
                clientY: e.clientY,
                pos_offset: 0,
                placeholder: this.dom_element.insertBefore(
                    DomHelper.createDiv({
                        height: this.item_height.toString() + "px",
                        order: (index * 2).toString(),
                    }),
                    div,
                ),
            };

            // Draw an empty placeholder.
            DomHelper.applyStyle(div, {
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

            let player = this.dragging.action.player;
            const ordered_moves = this.context.move(player).moves
                .map((move, index) =>
                {
                    const order = move.equals(dragging_move) ? get_dragging_order() : index * 2;
                    return { move, order };
                })
                .sort((a, b) => a.order - b.order)
                .map(({ move }) => move);

            this.context.prepare_moves(player, ordered_moves);

            this.dragging.placeholder.remove();
            this.dragging = null;
            DomHelper.applyStyle(div, {
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
                (e.clientY - this.dragging.clientY) / this.item_height
            );
            this.dragging.placeholder.style.order = get_dragging_order().toString();

            DomHelper.applyStyle(div, {
                position: "fixed",
                top: (e.clientY - this.dragging.offsetY).toString() + "px",
                left: (e.clientX - this.dragging.offsetX).toString() + "px",
            });
        });

        // Hover effect.
        div.addEventListener("mouseenter", () =>
        {
            DomHelper.applyStyle(div, {
                backgroundColor: "#b0b0b0",
            });
            this.render_ctrl.highlight(action.action.move.from);
        });

        div.addEventListener("mouseleave", () =>
        {
            DomHelper.applyStyle(div, {
                backgroundColor: cg.const.STYLE_GREY,
            });
            mouseup();
            this.render_ctrl.refresh();
        });

        return div;
    }

    getMainUnit(action: DisplayAction): Unit 
    {
        if (action.type === DisplayActionType.Recruit)
        {
            return new action.action.unit_type(action.player, null);
        }
        else if (action.type === DisplayActionType.Recall)
        {
            return this.context.present.board.unit.at(action.action.move.to)!;
        }
        else
        {
            return this.context.present.board.unit.at(action.action.move.from)!;
        }
    }

    getTargetUnit(action: DisplayAction): Unit | null
    {
        if (action.type === DisplayActionType.Attack || action.type === DisplayActionType.Defend)
        {
            return this.context.present.board.unit.at(action.action.move.to);
        }
        return null;
    }

    renderUnit(unit: Unit): HTMLElement
    {
        const canvas = DomHelper.createCanvas({
            zoom: "0.7",
        });
        canvas.width = cg.settings.grid_size + 10;
        canvas.height = cg.settings.grid_size + 10;
        const context = canvas.getContext("2d");
        if (context == null)
        {
            throw new Error("Your browser is outdated.");
        }
        const canvas_unit = CanvasUnitFactory(unit);

        using(new Renderer(context), (renderer) =>
        {
            renderer.translate(new Position(cg.settings.grid_size / 2 + 5, cg.settings.grid_size / 2 + 5));
            canvas_unit.paint(renderer);
        });

        return canvas;
    }

    getActionTypeText(type: DisplayActionType): string
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
            case DisplayActionType.Recruit:
                return "recruited";
            case DisplayActionType.Recall:
                return "recalled";
            case DisplayActionType.MoveAssist:
                return "assisting";
            case DisplayActionType.AttackAssist:
                return "assisting";
        }
    }
}
