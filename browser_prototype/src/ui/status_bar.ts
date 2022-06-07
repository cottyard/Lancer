// class StatusBar implements IComponent
// {
//     constructor(
//         public dom_element: HTMLDivElement,
//         public render_ctrl: IRenderController,
//         public context: IOnlineGameContext)
//     {
//     }

//     render()
//     {
//         let cost = this.context.action_cost(this.context.player);
//         this.dom_element.innerHTML = "";

//         DomHelper.applyStyle(this.dom_element, {
//             display: "flex",
//             flexDirection: "row",
//             justifyContent: "flex-end",
//             height: "40px"
//         });

//         for (let player of Player.both())
//         {
//             this.dom_element.appendChild(this.player_status(
//                 player,
//                 this.context.player_name(player) || "",
//                 this.context.present.supply(player) || 0,
//                 this.context.present.supply_income(player),
//                 cost,
//                 player === this.context.player
//             ));

//             if (player == Player.P1)
//             {
//                 let round_number = this.context.present.round_count;
//                 if (this.render_ctrl.show_last_round)
//                 {
//                     round_number--;
//                 }

//                 this.dom_element.appendChild(DomHelper.createText(
//                     `Round ${ round_number }`,
//                     {
//                         'text-align': 'center',
//                         fontWeight: "bold",
//                         flexGrow: 1,
//                     }));
//             }
//         }
//     }

//     timestamp(consumed: number)
//     {
//         function display(v: number): string
//         {
//             let display = v.toString();
//             return display.length < 2 ? '0' + display : display;
//         }
//         let _seconds = Math.floor(consumed / 1000);
//         let seconds = _seconds % 60;
//         let _minutes = (_seconds - seconds) / 60;
//         let minutes = _minutes % 60;
//         let _hours = (_minutes - minutes) / 60;
//         return `${ display(_hours) }:${ display(minutes) }:${ display(seconds) }`;
//     }

//     player_status(
//         player: Player,
//         name: string,
//         supply: number,
//         income: number,
//         cost: number,
//         is_me: boolean
//     ): HTMLElement
//     {
//         const div = DomHelper.createDiv({
//             display: "flex",
//             flexDirection: "row",
//             marginLeft: "10px",
//             marginRight: "10px",
//             alignItems: "center",
//             fontWeight: is_me ? "bold" : "normal",
//         });
//         div.appendChild(DomHelper.createText(name, {
//             color: g.settings.player_color_map[player]
//         }));
//         div.appendChild(DomHelper.createText("🍞", {
//         }));

//         let remaining = is_me ? supply - cost : supply;
//         div.appendChild(DomHelper.createText(remaining.toString(), {
//             color: remaining < 0 ? "red" : "black",
//             marginRight: "5px"
//         }));

//         div.appendChild(DomHelper.createText(`(+${ income })`));

//         let moved = this.context.moved(player);
//         let text = null;
//         if (moved)
//         {
//             text = '🟢';
//         }
//         else
//         {
//             text = '🟡';
//         }
//         if (text)
//         {
//             div.appendChild(DomHelper.createText(text, {
//                 marginLeft: "10px"
//             }));
//         }

//         let consumed = this.context.consumed_milliseconds(player);
//         if (consumed != undefined)
//         {
//             div.appendChild(DomHelper.createText(
//                 this.timestamp(consumed),
//                 {
//                     marginLeft: "3px"
//                 }
//             ));
//         }

//         return div;
//     }
// }

class SolitudeStatusBar implements IComponent
{
    constructor(
        public dom_element: HTMLDivElement,
        public context: IGameContext)
    {
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

        for (let player of Player.both())
        {
            this.dom_element.appendChild(this.player_status(
                player,
                this.context.player_name(player) || "",
                this.context.present.supply(player) || 0,
                this.context.present.supply_income(player),
                this.context.action_cost(player)
            ));

            if (player == Player.P1)
            {
                this.dom_element.appendChild(DomHelper.createText(
                    `Round ${ this.context.present.round_count }`,
                    {
                        'text-align': 'center',
                        fontWeight: "bold",
                        flexGrow: 1,
                    }));
            }
        }
    }

    player_status(
        player: Player,
        name: string,
        supply: number,
        income: number,
        cost: number
    ): HTMLElement
    {
        const div = DomHelper.createDiv({
            display: "flex",
            flexDirection: "row",
            marginLeft: "10px",
            marginRight: "10px",
            alignItems: "center",
            fontWeight: "normal",
        });
        div.appendChild(DomHelper.createText(name, {
            color: g.settings.player_color_map[player]
        }));
        div.appendChild(DomHelper.createText("🍞", {
        }));

        let remaining = supply - cost;
        div.appendChild(DomHelper.createText(remaining.toString(), {
            color: remaining < 0 ? "red" : "black",
            marginRight: "5px"
        }));

        div.appendChild(DomHelper.createText(`(+${ income })`));
        return div;
    }
}