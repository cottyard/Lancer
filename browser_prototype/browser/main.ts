import { OnlineAgent } from "./agent";
import { Player } from "../common/entity";
import { GameContext, GameUiFacade } from "./game";
import { BoardDisplay } from "./ui/board_display";
import { ButtonBar } from "./ui/button_bar";
import { StatusBar } from "./ui/status_bar";
import { clear_intervals, event_box, ui_components } from "./ui/ui";

export function main()
{
    clear_intervals();

    let context = new GameContext(
        Player.P1,
        {
            [Player.P1]: 'player 1',
            [Player.P2]: 'player 2'
        });
    let facade = new GameUiFacade(
        context, 
        new OnlineAgent(context));

    let board_display = new BoardDisplay(facade);

    // let action_panel = new ActionPanel(
    //     <HTMLDivElement> document.getElementById('action-panel'), board_display, facade);
    let status_bar = new StatusBar(
        <HTMLDivElement> document.getElementById('status-bar'), board_display, facade);
    let button_bar = new ButtonBar(
        <HTMLDivElement> document.getElementById('button-bar'), board_display, facade);

    ui_components.push(board_display);
    // ui_components.push(action_panel);
    ui_components.push(status_bar);
    ui_components.push(button_bar);

    event_box.subscribe('refresh ui', _ => {
        for (let c of ui_components)
        {
            c.render();
        }
    });

    event_box.subscribe('refresh board', _ => {
        board_display.show_present();
    });

    event_box.subscribe("show last round", _ => {
        board_display.show_last();
        button_bar.view_last_round = true;
    });

    event_box.subscribe("refresh counter", secs => {
        button_bar.update_counter(secs);
    });

    event_box.emit("refresh ui", null);
}

window.onload = main;