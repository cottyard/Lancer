class ButtonBar {
    dom_element: HTMLDivElement;
    game: Game;
    submit: HTMLButtonElement | null = null;
    last_round: HTMLButtonElement | null = null;
    heat: HTMLButtonElement | null = null;
    private _view_last_round: boolean = false;
    private _show_heat: boolean = false;
    private view_last_round_handle: number | null = null;

    constructor(dom_element: HTMLDivElement, game: Game) {
        this.dom_element = dom_element;
        this.game = game;
    }

    set view_last_round(value: boolean)
    {
        this._view_last_round = value;
        this.game.show_last_round = value;
        this.update_last_round_name();
    }
    
    get view_last_round()
    {
        return this._view_last_round;
    }

    set show_heat(value: boolean)
    {
        this._show_heat = value;
        this.game.show_heat = value;
        this.update_heat_name();
    }

    get show_heat()
    {
        return this._show_heat;
    }

    update_button_names()
    {
        this.update_last_round_name();
        this.update_heat_name();
    }

    update_last_round_name()
    {
        if (this.last_round)
        {
            this.last_round.innerText = this.view_last_round ? "Return To Now" : "Show Last Round";
        }
    }

    update_heat_name()
    {
        if (this.heat)
        {
            this.heat.innerText = this.show_heat ? "Heat:  On" : "Heat: Off";
        }
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

        if (!this.game.is_playing())
        {
            let new_game = DomHelper.createButton();
            new_game.onclick = () => { this.game.new_game(); };
            
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

        if (this.game.status == GameStatus.WaitForPlayer || this.game.status == GameStatus.WaitForOpponent)
        {
            let submit_button = DomHelper.createButton();
        
            if (this.game.status == GameStatus.WaitForPlayer)
            {
                let supply = this.game.get_player_supply(this.game.player);
                if (!supply)
                {
                    throw new Error("cannot get game supply");
                }

                if (cost > supply)
                {
                    submit_button.disabled = true;
                    submit_button.innerText = "Insufficient supply";
                }
                else
                {
                    submit_button.innerText = "Submit Move";
                    submit_button.onclick = () => { this.game.submit_move(); };
                }
            }
            else
            {
                submit_button.disabled = true;
                submit_button.innerText = "Waiting for opponent...";
            }
    
            this.dom_element.appendChild(submit_button);
            this.dom_element.appendChild(DomHelper.createDiv({
                flexGrow: 1
            }));
            this.submit = submit_button;
        }
        
        if (!this.game.is_playing())
        {
            let player_name = DomHelper.createTextArea();
            player_name.textContent = this.game.player_name;
            player_name.onfocus = () => { player_name.select() };
            player_name.onkeyup = () => {
                if (player_name.value) { 
                    this.game.player_name = player_name.value; 
                }
            };
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
            else if ((this.game.status == GameStatus.WonByPlayer1 && this.game.player == Player.P1) ||
                     (this.game.status == GameStatus.WonByPlayer2 && this.game.player == Player.P2))
            {
                text = 'You are victorious!';
            }
            else
            {
                text = 'You are defeated.';
            }

            let status = DomHelper.createText(text, {
                margin: "15px",
                fontWeight: "bold"
            });
            this.dom_element.appendChild(status);
        }

        if (!this.game.is_not_started() && !this.game.is_in_queue())
        {
            this.last_round = DomHelper.createButton();
            
            this.last_round.onclick = () => { 
                this.view_last_round = !this.view_last_round;
            };

            this.last_round.onmouseenter = () => { 
                if (!this.view_last_round)
                {
                    this.view_last_round_handle = setTimeout(() => {
                        this.game.show_last_round = true;
                    }, 200);
                }
            };
            this.last_round.onmouseleave = () => {
                if (!this.view_last_round)
                {
                    this.game.show_last_round = false;
                }
                if (this.view_last_round_handle)
                {
                    clearTimeout(this.view_last_round_handle);
                    this.view_last_round_handle = null;
                }
            };

            if (!this.game.last_round_board)
            {
                this.last_round.disabled = true;
            }
            this.dom_element.appendChild(this.last_round);


            this.heat = DomHelper.createButton();
                
            this.heat.onmouseenter = () => { 
                this.game.render_heat();
            };
            this.heat.onmouseleave = () => { 
                this.game.render_indicators();
            };

            this.heat.onclick = () => { 
                this.show_heat = !this.show_heat;
                this.game.render_indicators();
            };
            
            this.dom_element.appendChild(this.heat);
        }

        this.update_button_names();
    }
}