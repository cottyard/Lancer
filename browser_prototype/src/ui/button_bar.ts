import { IComponent } from '../ui/ui';
import { IOnlineController, OnlineGameStatus } from '../client/online_controller';
import { IRenderController } from '../ui/render_controller';
import { IGameContext } from '../client/game_context';
import { GameStatus } from '../core/game';
import { Player } from '../core/entity';
import { AI } from '../ai/benchmark';

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
    alarm_button: HTMLButtonElement | null = null;
    private _view_last_round_on_hover = true;
    private _view_last_round: boolean = false;
    private _show_heat: boolean = false;
    private view_last_round_handle: number | null = null;

    constructor(
        public dom_element: HTMLDivElement,
        public render_ctrl: IRenderController,
        public online_ctrl: IOnlineController)
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
        this.update_alarm_name();
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

    update_alarm_name()
    {
        if (this.alarm_button)
        {
            this.alarm_button.innerText = this.online_ctrl.enable_sound ? "Alarm:  On" : "Alarm: Off";
        }
    }

    update_submit_name()
    {
        if (!this.submit_button)
        {
            return;
        }

        if (this.online_ctrl.status == OnlineGameStatus.WaitForPlayer)
        {
            if (!this.online_ctrl.adequate_supply())
            {
                this.submit_button.disabled = true;
                this.submit_button.innerText = "Insufficient supply";
            }
            else
            {
                this.submit_button.innerText = "Submit Move";
            }

            this.submit_button.innerText += ` (${ this.online_ctrl.seconds_before_submit })`;
        }
        else if (this.online_ctrl.status == OnlineGameStatus.WaitForOpponent)
        {
            this.submit_button.disabled = true;
            this.submit_button.innerText = "Waiting for opponent...";
        }
        else if (this.online_ctrl.status == OnlineGameStatus.Submitting)
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

        if (!this.online_ctrl.is_playing())
        {
            let new_game = DomHelper.createButton();
            new_game.onclick = () => { this.online_ctrl.new_game(); };

            if (this.online_ctrl.is_in_queue())
            {
                new_game.innerText = "Finding opponent...";
                new_game.disabled = true;
            }
            else
            {
                new_game.innerText = "Find Game";
            }

            let player_name = DomHelper.createTextArea();
            player_name.textContent = this.online_ctrl.get_name();
            player_name.onfocus = () => { player_name.select(); };
            player_name.onkeyup = () =>
            {
                if (player_name.value)
                {
                    this.online_ctrl.set_name(player_name.value);
                }
            };
            player_name.style.width = "80px";
            player_name.style.resize = "none";

            if (this.online_ctrl.is_in_queue())
            {
                player_name.readOnly = true;
            }

            this.dom_element.appendChild(new_game);
            this.dom_element.appendChild(player_name);
        }

        if (this.online_ctrl.is_playing())
        {
            let submit_button = DomHelper.createButton();

            if (this.online_ctrl.status == OnlineGameStatus.WaitForPlayer)
            {
                if (this.online_ctrl.adequate_supply())
                {
                    submit_button.onclick = () => { this.online_ctrl.submit_move(); };
                }
            }

            this.dom_element.appendChild(submit_button);
            this.submit_button = submit_button;
        }

        if (this.online_ctrl.is_finished())
        {
            let text: string;

            if (this.online_ctrl.status == OnlineGameStatus.Defeated)
            {
                text = 'You are defeated.';
            }
            else if (this.online_ctrl.status == OnlineGameStatus.Victorious)
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

        if (!this.online_ctrl.is_not_started() && !this.online_ctrl.is_in_queue())
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
                    this.view_last_round_handle = window.setTimeout(() =>
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

            if (this.online_ctrl.is_first_round())
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

            this.alarm_button = DomHelper.createButton();

            this.alarm_button.onclick = () =>
            {
                this.online_ctrl.enable_sound = !this.online_ctrl.enable_sound;
                this.update_alarm_name();
            };

            this.dom_element.appendChild(this.alarm_button);
        }

        this.render_text();
    }
}

class SolitudeButtonBar implements IButtonBar
{
    next_round: HTMLButtonElement | null = null;
    last_round: HTMLButtonElement | null = null;
    random_move: HTMLButtonElement | null = null;
    heat: HTMLButtonElement | null = null;
    private _view_last_round: boolean = false;
    private _show_heat: boolean = false;
    private view_last_round_handle: number | null = null;

    constructor(public dom_element: HTMLDivElement, public render_ctrl: IRenderController, public context: IGameContext)
    {
        context.on_new_game(this.render.bind(this));
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

    render()
    {
        this.dom_element.innerHTML = "";

        DomHelper.applyStyle(this.dom_element, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            height: "40px"
        });

        let next_round_button = DomHelper.createButton();

        let insufficient = false;
        for (let player of Player.both())
        {
            let supply = this.context.present.supply(player);
            let cost = this.context.action_cost(player);
            if (cost > supply)
            {
                insufficient = true;
            }
        }

        if (insufficient)
        {
            next_round_button.disabled = true;
            next_round_button.innerText = "Insufficient supply";
        }
        else
        {
            next_round_button.innerText = "Next Round";
            next_round_button.onclick = () =>
            {
                for (let player of Player.both())
                {
                    this.context.make_move(player);
                }
                this.render_ctrl.show_present();
            };
        }

        this.dom_element.appendChild(next_round_button);
        this.next_round = next_round_button;

        let random_move_button = DomHelper.createButton();
        random_move_button.innerText = "Random Move";
        random_move_button.onclick = () =>
        {
            for (let player of Player.both())
            {
                let player_move = AI.pick_moves_for_player(this.context.present, player);
                this.context.prepare_moves(player, player_move.moves);
            }
            this.render_ctrl.refresh();
        };

        this.dom_element.appendChild(random_move_button);
        this.random_move = random_move_button;

        let game_status = this.context.status;
        if (game_status != GameStatus.Ongoing)
        {
            let text: string;
            if (game_status == GameStatus.Tied)
            {
                text = 'Game is tied.';
            }
            else if (game_status == GameStatus.WonByPlayer1)
            {
                text = 'Player 1 won.';
            }
            else
            {
                text = 'Player 2 won.';
            }

            let status = DomHelper.createText(text, {
                fontWeight: "bold",
                marginLeft: "20px"
            });
            this.dom_element.appendChild(status);

            this.dom_element.appendChild(DomHelper.createDiv({
                flexGrow: 1
            }));
        }

        this.dom_element.appendChild(DomHelper.createDiv({
            flexGrow: 1
        }));

        this.last_round = DomHelper.createButton();

        this.last_round.onclick = () =>
        {
            this.view_last_round = !this.view_last_round;
        };

        this.last_round.onmouseenter = () =>
        {
            if (this.view_last_round)
            {
                return;
            }
            this.view_last_round_handle = window.setTimeout(() =>
            {
                this.render_ctrl.show_last();
            }, 200);
        };
        this.last_round.onmouseleave = () =>
        {
            if (this.view_last_round_handle)
            {
                clearTimeout(this.view_last_round_handle);
                this.view_last_round_handle = null;
            }
            if (!this.view_last_round)
            {
                this.render_ctrl.show_present();
            }
        };

        if (!this.context.last)
        {
            this.last_round.disabled = true;
        }
        this.dom_element.appendChild(this.last_round);

        this.heat = DomHelper.createButton();

        this.heat.onmouseenter = () =>
        {
            if (!this.show_heat)
            {
                this.render_ctrl.show_heat();
            }
        };
        this.heat.onmouseleave = () =>
        {
            if (!this.show_heat)
            {
                this.render_ctrl.hide_heat();
            }
        };

        this.heat.onclick = () =>
        {
            this.show_heat = !this.show_heat;
        };

        this.dom_element.appendChild(this.heat);

        this.render_text();
    }
}

export { ButtonBar, SolitudeButtonBar, IButtonBar };