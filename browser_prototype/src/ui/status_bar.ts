class StatusBar {

    dom_element: HTMLDivElement;
    game: Game;
    submit_button: HTMLButtonElement | null = null;

    constructor(dom_element: HTMLDivElement, game: Game) {
        this.dom_element = dom_element;
        this.game = game;
    }

    render() {
        let cost = this.game.player_action.cost();
        let supply = this.game.get_player_supply(this.game.player);
        
        this.dom_element.innerHTML = "";

        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
        });

        let btn = DomHelper.createButton();
        let btn2 = DomHelper.createButton();
        
        if (supply)
        {
            if (cost > supply)
            {
                btn2.disabled = true;
                btn2.innerText = "not enough supply";
            }
            else
            {
                btn2.innerText = "submit move";
                btn2.onclick = () => { g.game?.submit_move(); };
            }
        }
        else
        {
            btn2.disabled = true;
            btn2.innerText = "no game";
        }

        this.dom_element.appendChild(btn2);
        this.submit_button = btn2;

        btn.onclick = () => { g.game?.new_game(); };
        btn.innerText = "new game";
        this.dom_element.appendChild(btn);
        let player_name = DomHelper.createTextArea();
        player_name.textContent = this.game.player_name;
        player_name.style.width = "100px";
        player_name.style.resize = "none";
        this.dom_element.appendChild(player_name);

        [Player.P1, Player.P2].forEach(player => {
            this.dom_element.appendChild(this.render_player(
                player,
                this.game.get_player_name(player) || "",
                supply || 0,
                this.game.get_player_supply_income(player),
                player === this.game.player ? cost : null
            ));
        });

        let btn3 = DomHelper.createButton();
        btn3.innerText = "last round"
        this.dom_element.appendChild(btn3);

        let btn4 = DomHelper.createButton();
        btn4.innerText = "heat map"
        btn4.onmouseenter = () => { this.game?.render_heat(); };
        btn4.onmouseleave = () => { this.game?.render_indicators(); };
        this.dom_element.appendChild(btn4);
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
            marginLeft: "10px",
            marginRight: "10px",
            alignItems: "center",
            fontWeight: cost != null ? "bold" : "normal",
        });
        div.appendChild(DomHelper.createText(name, {
            color: g.settings.player_color_map.get(player)!
        }));
        div.appendChild(DomHelper.createText("🍞", {
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