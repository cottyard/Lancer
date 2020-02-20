class StatusBar {

    dom_element: HTMLDivElement;
    game: Game;

    constructor(dom_element: HTMLDivElement, game: Game) {
        this.dom_element = dom_element;
        this.game = game;
    }

    render() {
        this.dom_element.innerHTML = "";
        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
        });
        this.dom_element.appendChild(DomHelper.createButton());
        this.dom_element.appendChild(DomHelper.createTextArea());
        [Player.P1, Player.P2].forEach(player => {
            this.dom_element.appendChild(this.render_player(
                player,
                this.game.get_player_name(player),
                this.game.get_player_supply(player),
                this.game.get_player_supply_income(player),
                player === this.game.player
                    ? this.game.player_action.cost()
                    : null
            ));
        });
        
    }

    render_player(
        player: Player,
        name: string,
        supply: number,
        income: number,
        cost: number | null,
    ): HTMLElement {
        const div = DomHelper.createDiv({
            display: "flex",
            flexDirection: "row",
            marginLeft: "40px",
            alignItems: "center",
            fontWeight: cost != null ? "bold" : "normal",
        });
        div.appendChild(DomHelper.createText(name, {
            color: player === Player.P1
                ? g.const.STYLE_RED_LIGHT
                : g.const.STYLE_BLUE_LIGHT 
        }));
        div.appendChild(DomHelper.createText("🍞", {
            marginLeft: "20px",
        }));
        if (cost != null) {
            div.appendChild(DomHelper.createText(cost.toString(), {
                color: cost > supply ? "red" : "black"
            }));
            div.appendChild(DomHelper.createText("/"));
        }
        div.appendChild(DomHelper.createText(`${supply} (+${income})`));
        return div;
    }

}