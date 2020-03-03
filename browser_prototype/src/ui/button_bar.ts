class ButtonBar 
{
    dom_element: HTMLDivElement;
    game: IRenderableGame & IOnlineGame;
    submit: HTMLButtonElement | null = null;
    last_round: HTMLButtonElement | null = null;
    heat: HTMLButtonElement | null = null;
    private _view_last_round: boolean = false;
    private _show_heat: boolean = false;
    private view_last_round_handle: number | null = null;

    constructor(dom_element: HTMLDivElement, game: IRenderableGame & IOnlineGame) {
        this.dom_element = dom_element;
        this.game = game;
    }

    set view_last_round(value: boolean)
    {
        this._view_last_round = value;
        if (value)
        {
            this.game.show_present();
        }
        else
        {
            this.game.show_last();
        }
        
        this.update_last_round_name();
    }
    
    get view_last_round()
    {
        return this._view_last_round;
    }

    set show_heat(value: boolean)
    {
        this._show_heat = value;
        if (value)
        {
            this.game.show_last();
        }
        else
        {
            this.game.hide_heat();
        }
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
        let cost = this.game.get_action_cost();
        
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
            
            if (this.game.is_in_queue())
            {
                new_game.innerText = "Finding opponent..."
                new_game.disabled = true;
            }
            else
            {
                new_game.innerText = "Find Game";
            }

            let player_name = DomHelper.createTextArea();
            player_name.textContent = this.game.get_context().get_player_name(this.game.get_context().player)!;
            player_name.onfocus = () => { player_name.select() };
            player_name.onkeyup = () => {
                if (player_name.value) { 
                    this.game.set_name(player_name.value); 
                }
            };
            player_name.style.width = "80px";
            player_name.style.resize = "none";
            
            if (this.game.is_in_queue())
            {
                player_name.readOnly = true;
            }

            this.dom_element.appendChild(new_game);
            this.dom_element.appendChild(player_name);
        }

        if (this.game.is_playing())
        {
            let submit_button = DomHelper.createButton();
        
            if (this.game.status() == GameStatus.WaitForPlayer)
            {
                let supply = this.game.get_context().present.get_supply(this.game.get_context().player);
                if (supply == undefined)
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
            else if (this.game.status() == GameStatus.WaitForOpponent)
            {
                submit_button.disabled = true;
                submit_button.innerText = "Waiting for opponent...";
            }
            else
            {
                submit_button.disabled = true;
                submit_button.innerText = "Loading next round...";
            }
    
            this.dom_element.appendChild(submit_button);
            this.submit = submit_button;
        }

        if (this.game.is_finished())
        {
            let text: string;

            if (this.game.status() == GameStatus.Tied)
            {
                text = 'Game is tied.';
            }
            else if ((this.game.status() == GameStatus.WonByPlayer1 && this.game.get_context().player == Player.P1) ||
                    (this.game.status() == GameStatus.WonByPlayer2 && this.game.get_context().player == Player.P2))
            {
                text = 'You are victorious!';
            }
            else
            {
                text = 'You are defeated.';
            }

            let status = DomHelper.createText(text, {
                fontWeight: "bold",
                marginLeft: "20px"
            });
            this.dom_element.appendChild(status);
        }

        this.dom_element.appendChild(DomHelper.createDiv({
            flexGrow: 1
        }));
        
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
                        this.game.show_last();
                    }, 200);
                }
            };
            this.last_round.onmouseleave = () => {
                if (!this.view_last_round)
                {
                    this.game.show_present();
                }
                if (this.view_last_round_handle)
                {
                    clearTimeout(this.view_last_round_handle);
                    this.view_last_round_handle = null;
                }
            };

            if (this.game.get_context().history.length == 0)
            {
                this.last_round.disabled = true;
            }
            this.dom_element.appendChild(this.last_round);

            this.heat = DomHelper.createButton();
                
            this.heat.onmouseenter = () => { 
                this.game.show_heat();
            };
            this.heat.onmouseleave = () => { 
                this.game.hide_heat();
            };

            this.heat.onclick = () => { 
                this.show_heat = !this.show_heat;
            };
            
            this.dom_element.appendChild(this.heat);
        }

        this.update_button_names();
    }
}