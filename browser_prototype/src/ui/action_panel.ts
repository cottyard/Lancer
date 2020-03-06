interface IActionPanel extends IComponent
{
}

class ActionPanel implements IActionPanel 
{
    dom_element: HTMLDivElement;
    game: IRenderableGame;
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

    constructor(dom_element: HTMLDivElement, game: IRenderableGame) {
        this.dom_element = dom_element;
        this.game = game;
        this.dragging = null;

        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
            userSelect: "none",
        });
    }

    render() {
        this.dom_element.innerHTML = "";
        
        for (let player of Player.both())
        {
            new DisplayPlayerAction(this.game.context.action(player)).actions.forEach((action, index) => {
                this.dom_element.appendChild(this.renderAction(action, index));
            });
        }
    }

    renderAction(action: DisplayAction, index: number): HTMLElement {
        const div = DomHelper.createDiv({
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
        div.appendChild(this.renderUnit(this.getMainUnit(action)));

        // Action name.
        div.appendChild(DomHelper.createText(
            this.getActionTypeText(action.type),
            {
                color: g.display_action_style.get(action.type) || "black",
                'font-weight': 'bold',
                padding: "10px"
            }
        ));

        // Action target.
        const target_unit = this.getTargetUnit(action);
        if (target_unit != null) {
            div.appendChild(this.renderUnit(target_unit));
        }

        // Space between supply and action name/target.
        div.appendChild(DomHelper.createDiv({
            flexGrow: "1",
        }));

        // cost.
        div.appendChild(DomHelper.createText(
            "🍞" + action.action.cost(this.game.context.buff()).toString(),
            {'font-weight': 'bold'}
        ));

        // Cross & callback.
        const cross = div.appendChild(DomHelper.createText("✘", {
            fontSize: "20px",
            padding: "20px", 
            margin: "-10px"
        }));
        cross.addEventListener("mouseenter", () => {
            DomHelper.applyStyle(cross, {
                color: "red",
            });
        });
        cross.addEventListener("mouseleave", () => {
            DomHelper.applyStyle(cross, {
                color: "black",
            });
        });
        cross.addEventListener("mousedown", (e: MouseEvent) => {
            this.game.context.move(action.player).extract((m): m is Move => m.equals(action.action.move));
            e.cancelBubble = true;
        });

        // Drag support.
        div.addEventListener("mousedown", (e: MouseEvent) => {
            this.dragging = {
                action,
                offsetX: e.clientX - div.getBoundingClientRect().left + ActionPanel.margin,
                offsetY: e.clientY - div.getBoundingClientRect().top + ActionPanel.margin,
                clientY: e.clientY,
                pos_offset: 0,
                placeholder: this.dom_element.insertBefore(
                    DomHelper.createDiv({
                        height: ActionPanel.item_height.toString() + "px",
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

        const get_dragging_order = (): number => {
            if (this.dragging == null) {
                throw new Error("not dragging");
            }
            return (
                (index + this.dragging.pos_offset) * 2
                + Math.sign(this.dragging.pos_offset)
            );
        }

        const mouseup = () => {
            if (this.dragging == null) {
                return;
            }
            
            const dragging_move = this.dragging.action.action.move;

            let player = this.dragging.action.player;
            const ordered_moves = this.game.context.move(player).moves
                .map((move, index) => {
                    const order = move.equals(dragging_move) ? get_dragging_order() : index * 2;
                    return {move, order};
                })
                .sort((a, b) => a.order - b.order)
                .map(({move}) => move);
        
            this.game.context.prepare_moves(player, ordered_moves);

            this.dragging.placeholder.remove();
            this.dragging = null;
            DomHelper.applyStyle(div, {
                position: "static",
                width: "auto",
                zIndex: 0,
            });
        }

        div.addEventListener("mouseup", mouseup);

        div.addEventListener("mousemove", (e: MouseEvent) => {
            if (this.dragging == null) {
                return;
            }

            // Update state and display. Not yet passed to game model.
            this.dragging.pos_offset = Math.round(
                (e.clientY - this.dragging.clientY) / ActionPanel.item_height
            );
            this.dragging.placeholder.style.order = get_dragging_order().toString();

            DomHelper.applyStyle(div, {
                position: "fixed",
                top: (e.clientY - this.dragging.offsetY).toString() + "px",
                left: (e.clientX - this.dragging.offsetX).toString() + "px",
            });
        });

        // Hover effect.
        div.addEventListener("mouseenter", () => {
            DomHelper.applyStyle(div, {
                backgroundColor: "#b0b0b0",
            });
            this.game.highlight(action.action.move.from);
        });

        div.addEventListener("mouseleave", () => {
            DomHelper.applyStyle(div, {
                backgroundColor: g.const.STYLE_GREY,
            });
            mouseup();
            this.game.refresh();
        });

        return div;
    }

    getMainUnit(action: DisplayAction): Unit 
    {
        if (action.type === DisplayActionType.Recruit)
        {
            return new action.action.unit_type(action.player);
        }
        else if (action.type === DisplayActionType.Recall)
        {
            return this.game.context.present.board.at(action.action.move.to)!;
        }
        else
        {
            return this.game.context.present.board.at(action.action.move.from)!;
        }
    }

    getTargetUnit(action: DisplayAction): Unit | null {
        if (action.type === DisplayActionType.Attack || action.type === DisplayActionType.Defend)
        {
            return this.game.context.present.board.at(action.action.move.to);
        }
        return null;
    }

    renderUnit(unit: Unit): HTMLElement {
        const canvas = DomHelper.createCanvas({
            zoom: "0.7",
        });
        canvas.width = g.settings.grid_size + 10;
        canvas.height = g.settings.grid_size + 10;
        const context = canvas.getContext("2d");
        if (context == null) {
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

    getActionTypeText(type: DisplayActionType): string {
        switch (type) {
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
