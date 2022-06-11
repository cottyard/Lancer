interface IButtonBar extends IComponent
{
    view_last_round: boolean;
    update_text(): void;
}

class ButtonBar implements IButtonBar
{
    submit_button: HTMLButtonElement | null = null;
    last_round_button: HTMLButtonElement | null = null;
    heat_button: HTMLButtonElement | null = null;
    private _view_last_round_on_hover = true;
    private _view_last_round: boolean = false;
    private _show_heat: boolean = false;
    private view_last_round_handle: number | null = null;

    constructor(
        public dom_element: HTMLDivElement,
        public board_display: IBoardDisplay,
        public game: IGameUiFacade)
    {
    }

    set view_last_round(value: boolean)
    {
        this._view_last_round = value;
        if (value)
        {
            this.board_display.show_last();
        }
        else
        {
            this.board_display.show_present();
        }
        this.render();
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
            this.board_display.show_heat();
        }
        else
        {
            this.board_display.hide_heat();
        }
        this.render();
    }

    get show_heat()
    {
        return this._show_heat;
    }

    update_text()
    {
        this.update_last_round_name();
        this.update_heat_name();
        this.update_submit_name();
    }

    update_last_round_name()
    {
        if (this.last_round_button)
        {
            this.last_round_button.innerText = this.view_last_round ? "Proceed To Now" : "Show Last Round";
        }
    }

    update_heat_name()
    {
        if (this.heat_button)
        {
            this.heat_button.innerText = this.show_heat ? "Heat:  On" : "Heat: Off";
        }
    }

    update_submit_name()
    {
        if (!this.submit_button)
        {
            return;
        }

        if (this.game.context.status == GameContextStatus.WaitForPlayer)
        {
            if (!this.game.sufficient_fund())
            {
                this.submit_button.disabled = true;
                this.submit_button.innerText = "Insufficient supply";
            }
            else
            {
                this.submit_button.innerText = "Submit Move";
            }

            // this.submit_button.innerText += 
            //     ` (${ this.game.seconds_before_submit })`;
        }
        else if (this.game.context.status == GameContextStatus.WaitForOpponent)
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Waiting for opponent...";
        }
        else if (this.game.context.status == GameContextStatus.Submitting)
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Submitting...";
        }
        else
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Loading next round...";
        }
    }

    render()
    {
        this.dom_element.innerHTML = "";

        DomHelper.apply_style(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            height: "40px"
        });

        if (!this.game.is_playing())
        {
            let new_game = DomHelper.create_button();
            new_game.onclick = () => { this.game.new_game(); };

            if (this.game.is_in_queue())
            {
                new_game.innerText = "Finding opponent...";
                new_game.disabled = true;
            }
            else
            {
                new_game.innerText = "Find Game";
            }

            let player_name = DomHelper.create_textarea();
            player_name.textContent = this.game.player_name;
            player_name.onfocus = () => { player_name.select(); };
            player_name.onkeyup = () =>
            {
                if (player_name.value)
                {
                    this.game.player_name = player_name.value;
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
            let submit_button = DomHelper.create_button();

            if (this.game.context.status == GameContextStatus.WaitForPlayer)
            {
                if (this.game.sufficient_fund())
                {
                    submit_button.onclick = () => { this.game.submit_move(); };
                }
            }

            this.dom_element.appendChild(submit_button);
            this.submit_button = submit_button;
        }

        if (this.game.is_finished())
        {
            let text: string;

            if (this.game.context.status == GameContextStatus.Defeated)
            {
                text = 'You are defeated.';
            }
            else if (this.game.context.status == GameContextStatus.Victorious)
            {
                text = 'You are victorious!';
            }
            else
            {
                text = 'Game is tied.';
            }

            let status = DomHelper.create_text(text, {
                fontWeight: "bold",
                marginLeft: "20px"
            });
            this.dom_element.appendChild(status);
        }

        this.dom_element.appendChild(DomHelper.create_div({
            flexGrow: 1
        }));

        if (!this.game.is_not_started() && !this.game.is_in_queue())
        {
            this.last_round_button = DomHelper.create_button();

            this.last_round_button.onclick = () =>
            {
                this._view_last_round_on_hover = false;
                this.view_last_round = !this.view_last_round;
            };

            this.last_round_button.onmouseenter = () =>
            {
                if (!this.view_last_round && this._view_last_round_on_hover)
                {
                    this.view_last_round_handle = setTimeout(() =>
                    {
                        this.board_display.show_last();
                    }, 200);
                }
            };
            this.last_round_button.onmouseleave = () =>
            {
                this._view_last_round_on_hover = true;
                if (!this.view_last_round)
                {
                    this.board_display.show_present();
                }
                if (this.view_last_round_handle)
                {
                    clearTimeout(this.view_last_round_handle);
                    this.view_last_round_handle = null;
                }
            };

            if (this.game.is_first_round())
            {
                this.last_round_button.disabled = true;
            }

            this.dom_element.appendChild(this.last_round_button);

            this.heat_button = DomHelper.create_button();

            this.heat_button.onmouseenter = () =>
            {
                if (!this.show_heat)
                {
                    this.board_display.show_heat();
                }
            };
            this.heat_button.onmouseleave = () =>
            {
                if (!this.show_heat)
                {
                    this.board_display.hide_heat();
                }
            };
            this.heat_button.onclick = () =>
            {
                this.show_heat = !this.show_heat;
            };

            this.dom_element.appendChild(this.heat_button);
        }

        this.update_text();
    }
}
