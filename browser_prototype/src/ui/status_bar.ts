import { Player, Players } from "../entity";
import { IGameUiFacade } from "../game";
import { IBoardDisplay } from "./board_display";
import { IComponent, DomHelper } from "./dom_helper";

export class StatusBar implements IComponent
{
    constructor(
        public dom_element: HTMLDivElement,
        public board_display: IBoardDisplay,
        public game: IGameUiFacade)
    {
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

        for (let player of Players.both())
        {
            this.dom_element.appendChild(this.player_status(
                player,
                this.game.context.players_name[player] || "",
                this.game.context.present.supply(player) || 0,
                this.game.context.present.supply_income(player),
                this.game.cost,
                player == this.game.context.player
            ));

            if (player == Player.P1)
            {
                let round_number = this.game.context.present.round_count;
                if (this.board_display.show_last_round)
                {
                    round_number--;
                }

                this.dom_element.appendChild(DomHelper.create_text(
                    `Round ${ round_number }`,
                    {
                        'text-align': 'center',
                        fontWeight: "bold",
                        flexGrow: 1,
                    }));
            }
        }
    }

    timestamp(consumed: number)
    {
        function display(v: number): string
        {
            let display = v.toString();
            return display.length < 2 ? '0' + display : display;
        }
        let _seconds = Math.floor(consumed / 1000);
        let seconds = _seconds % 60;
        let _minutes = (_seconds - seconds) / 60;
        let minutes = _minutes % 60;
        let _hours = (_minutes - minutes) / 60;
        return `${ display(_hours) }:${ display(minutes) }:${ display(seconds) }`;
    }

    player_status(
        player: Player,
        name: string,
        supply: number,
        income: number,
        cost: number,
        is_me: boolean
    ): HTMLElement
    {
        const div = DomHelper.create_div({
            display: "flex",
            flexDirection: "row",
            marginLeft: "10px",
            marginRight: "10px",
            alignItems: "center",
            fontWeight: is_me ? "bold" : "normal",
        });
        div.appendChild(DomHelper.create_text(name, {
            color: Players.color[player]
        }));
        //🍞
        div.appendChild(DomHelper.create_text("🍞", {
        }));

        let remaining = is_me ? supply - cost : supply;
        div.appendChild(DomHelper.create_text(remaining.toString(), {
            color: remaining < 0 ? "red" : "black",
            marginRight: "5px"
        }));

        div.appendChild(DomHelper.create_text(`(+${ income })`));

        let text = null;
        if (this.game.context.players_moved[player])
        {
            text = '🟢';
        }
        else
        {
            text = '🟡';
        }
        if (text)
        {
            div.appendChild(DomHelper.create_text(text, {
                marginLeft: "10px"
            }));
        }

        let consumed = this.game.context.consumed_msecs[player];
        if (consumed != undefined)
        {
            div.appendChild(DomHelper.create_text(
                this.timestamp(consumed),
                {
                    marginLeft: "3px"
                }
            ));
        }

        return div;
    }
}
