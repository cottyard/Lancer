class StatusBar {
    dom_element: HTMLDivElement;
    game: Game;
 
    constructor(dom_element: HTMLDivElement, game: Game) {
        this.dom_element = dom_element;
        this.game = game;
    }

    render() {
        let cost = this.game.player_action[0].cost();
        this.dom_element.innerHTML = "";

        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            height: "40px"
        });

        if (this.game.is_playing())
        {
            [Player.P1, Player.P2].forEach(player => {
                this.dom_element.appendChild(this.player_status(
                    player,
                    this.game.get_player_name(player) || "",
                    this.game.get_player_supply(player) || 0,
                    this.game.get_player_supply_income(player),
                    cost,
                    player === this.game.player
                ));
                if (player == Player.P1)
                {
                    this.dom_element.appendChild(DomHelper.createDiv({
                        flexGrow: 1
                    }));
                }
            });
        }
    }

    player_status(
        player: Player,
        name: string,
        supply: number,
        income: number,
        cost: number,
        is_me: boolean
    ): HTMLElement {
        const div = DomHelper.createDiv({
            display: "flex",
            flexDirection: "row",
            marginLeft: "10px",
            marginRight: "10px",
            alignItems: "center",
            fontWeight: is_me ? "bold" : "normal",
        });
        div.appendChild(DomHelper.createText(name, {
            color: g.settings.player_color_map.get(player)!
        }));
        div.appendChild(DomHelper.createText("🍞", {
        }));

        let remaining = is_me ? supply - cost : supply;
        div.appendChild(DomHelper.createText(remaining.toString(), {
            color: remaining < 0 ? "red" : "black",
            marginRight: "5px"
        }));

        div.appendChild(DomHelper.createText(`(+${income})`));

        if (!is_me)
        {
            let moved = this.game.player_moved.get(player);
            let text = null;
            if (moved)
            {
                text = '🟢';
            }
            else
            {
                text = '🟡';
            }
            if (text)
            {
                div.appendChild(DomHelper.createText(text, {
                    margin: "10px"
                }));
            }
        }

        return div;
    }
}