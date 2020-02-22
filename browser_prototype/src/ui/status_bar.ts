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
        
        this.dom_element.innerHTML = "";

        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
        });

        if (!this.game.is_playing())
        {
            let new_game = DomHelper.createButton();
            new_game.onclick = () => { g.game?.new_game(); };
            
            this.dom_element.appendChild(new_game);

            if (this.game.is_in_queue())
            {
                new_game.innerText = "Finding opponent..."
                new_game.disabled = true;
            }
            else
            {
                new_game.innerText = "Find Game";
            }
        }

        if (this.game.is_playing())
        {
            let submit_button = DomHelper.createButton();
        
            if (this.game.status == GameStatus.WaitingForPlayer)
            {
                let supply = this.game.get_player_supply(this.game.player);
                if (!supply)
                {
                    throw new Error("cannot get game supply");
                }

                if (cost > supply)
                {
                    submit_button.disabled = true;
                    submit_button.innerText = "Not enough supply";
                }
                else
                {
                    submit_button.innerText = "Submit Move";
                    submit_button.onclick = () => { g.game?.submit_move(); };
                }
            }
            else
            {
                submit_button.disabled = true;
                submit_button.innerText = "Waiting for opponent...";
            }
    
            this.dom_element.appendChild(submit_button);
            this.submit_button = submit_button;
        }
        
        if (this.game.is_not_started() || this.game.is_in_queue())
        {
            let player_name = DomHelper.createTextArea();
            player_name.textContent = this.game.player_name;
            player_name.style.width = "80px";
            player_name.style.resize = "none";
            this.dom_element.appendChild(player_name);
            if (this.game.is_in_queue())
            {
                player_name.readOnly = true;
            }
        }

        if (this.game.is_finished())
        {
            let text: string;

            if (this.game.status == GameStatus.Tied)
            {
                text = 'Game is tied.';
            }
            else if (this.game.status == GameStatus.WonByPlayer1 && this.game.player == Player.P1)
            {
                text = 'You are victorious!';
            }
            else
            {
                text = 'You are defeated.';
            }

            let status = DomHelper.createText(text, {
                marginLeft: "10px",
                fontWeight: "bold"
            });
            this.dom_element.appendChild(status);
        }

        if (!this.game.is_not_started() && !this.game.is_in_queue())
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
            });
        }

        if (this.game.is_playing())
        {
            let last_round = DomHelper.createButton();
            last_round.innerText = "What Happend"
            this.dom_element.appendChild(last_round);
            last_round.onmouseenter = () => { this.game.view_last_round(); };
            last_round.onmouseleave = () => { 
                this.game.render_board();
                this.game.render_indicators();
            };
    
            let heap_map = DomHelper.createButton();
            heap_map.innerText = "Heat"
            heap_map.onmouseenter = () => { this.game.render_heat(); };
            heap_map.onmouseleave = () => { this.game.render_indicators(); };
            heap_map.onclick = () => { this.game.always_show_heat = !this.game.always_show_heat; };
            this.dom_element.appendChild(heap_map);
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
        return div;
    }

}