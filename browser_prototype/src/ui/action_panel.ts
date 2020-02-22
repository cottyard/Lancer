class ActionPanel {

    dom_element: HTMLDivElement;
    game: Game;
    dragging: null | {
        action: Action,
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

    constructor(dom_element: HTMLDivElement, game: Game) {
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
        
        this.game.player_action[0].actions.forEach((action, index) => {
            this.dom_element.appendChild(this.renderAction(action, index));
        });
    }

    renderAction(action: Action, index: number): HTMLElement {
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
                color: g.action_style.get(action.type) || "black",
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
            "🍞" + action.cost().toString(),
            {'font-weight': 'bold'}
        ));

        // Cross & callback.
        const cross = div.appendChild(DomHelper.createText("✘", {
            fontSize: "24px",
            borderRadius: "15px",
            padding: "5px",
            margin: "5px",
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
            this.game.player_move.moves.splice(
                this.game.player_move.moves.findIndex(move => move.equals(action.move)),
                1);
            this.game.update_player_action();
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

        // Get order of dragging unit.
        const get_dragging_order = (): number => {
            if (this.dragging == null) {
                throw new Error("not dragging");
            }
            return (
                (index + this.dragging.pos_offset) * 2
                + Math.sign(this.dragging.pos_offset)
            );
        }

        // Callback when mouse leaves.
        const mouseup = () => {
            if (this.dragging == null) {
                return;
            }
            
            // Update orders.
            const dragging_move = this.dragging.action.move;
            const ordered_moves = this.game.player_move.moves
                .map((move, index) => {
                    const order = move.equals(dragging_move) ? get_dragging_order() : index * 2;
                    return {move, order};
                })
                .sort((a, b) => a.order - b.order)
                .map(({move}) => move);
            this.game.player_move.moves = ordered_moves;
            this.game.update_player_action();

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
            this.game.canvas.paint_grid_indicator(action.move.from);
        });

        div.addEventListener("mouseleave", () => {
            DomHelper.applyStyle(div, {
                backgroundColor: g.const.STYLE_GREY,
            });
            mouseup();
            this.game.render_indicators();
        });

        return div;
    }

    getMainUnit(action: Action): Unit {
        const unit = action.type === ActionType.Recruit
            ? new action.unit_type(this.game.player)
            : this.game.board!.at(action.move.from);
        if (unit == null) {
            throw new Error("Action on non-existing unit.");
        }
        return unit;
    }

    getTargetUnit(action: Action): Unit | null {
        if (action.type === ActionType.Attack || action.type === ActionType.Defend)
        {
            return this.game.board!.at(action.move.to);
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

    getActionTypeText(type: ActionType): string {
        switch (type) {
            case ActionType.Upgrade:
                return "upgrading";
            case ActionType.Defend:
                return "defends";
            case ActionType.Move:
                return "moving";
            case ActionType.Attack:
                return "attacks";
            case ActionType.Recruit:
                return "recruited";
        }
    }
}
