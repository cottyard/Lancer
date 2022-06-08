interface IButtonBar extends IComponent
{
    view_last_round: boolean;
    render_text(): void;
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
        public render_ctrl: IRenderController,
        public game: IGameUiFacade)
    {
    }

    set view_last_round(value: boolean)
    {
        this._view_last_round = value;
        if (value)
        {
            this.render_ctrl.show_last();
        }
        else
        {
            this.render_ctrl.show_present();
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
            this.render_ctrl.show_heat();
        }
        else
        {
            this.render_ctrl.hide_heat();
        }
        this.update_heat_name();
    }

    get show_heat()
    {
        return this._show_heat;
    }

    render_text()
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
                new_game.innerText = "Finding opponent...";
                new_game.disabled = true;
            }
            else
            {
                new_game.innerText = "Find Game";
            }

            let player_name = DomHelper.createTextArea();
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
            let submit_button = DomHelper.createButton();

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
            this.last_round_button = DomHelper.createButton();

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
                        this.render_ctrl.show_last();
                    }, 200);
                }
            };
            this.last_round_button.onmouseleave = () =>
            {
                this._view_last_round_on_hover = true;
                if (!this.view_last_round)
                {
                    this.render_ctrl.show_present();
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

            this.heat_button = DomHelper.createButton();

            this.heat_button.onmouseenter = () =>
            {
                if (!this.show_heat)
                {
                    this.render_ctrl.show_heat();
                }
            };
            this.heat_button.onmouseleave = () =>
            {
                if (!this.show_heat)
                {
                    this.render_ctrl.hide_heat();
                }
            };
            this.heat_button.onclick = () =>
            {
                this.show_heat = !this.show_heat;
            };

            this.dom_element.appendChild(this.heat_button);
        }

        this.render_text();
    }
}


        // let random_move_button = DomHelper.createButton();
        // random_move_button.innerText = "Random Move";
        // random_move_button.onclick = () =>
        // {
        //     for (let player of Player.both())
        //     {
        //         let supply = this.context.present.supply(player);
        //         let cost = this.context.action_cost(player);

        //         while (cost < supply)
        //         {
        //             let all = Rule.valid_moves(this.context.present.board, player);
        //             if (!all)
        //             {
        //                 break;
        //             }
        //             let random_move = all[Math.floor(Math.random() * all.length)];
        //             let res = this.context.prepare_move(player, random_move);
        //             if (res == "invalid")
        //             {
        //                 // should be unit limit exceeded
        //                 break;
        //             }
        //             else if (res == "overridden")
        //             {
        //                 break;
        //             }
        //             cost = this.context.action_cost(player);
        //         }

        //         while (cost > supply)
        //         {
        //             this.context.pop_move(player);
        //             cost = this.context.action_cost(player);
        //         }
        //     }
        //     this.render_ctrl.refresh();
        // };

        // this.dom_element.appendChild(random_move_button);
        // this.random_move = random_move_button;

       