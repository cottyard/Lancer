function ui_solitude()
{
    clear_intervals();
    g.initialize();

    let context = new GameContext(
        Player.P1,
        {
            [Player.P1]: 'player 1',
            [Player.P2]: 'player 2'
        });

    let facade = new GameUiFacade(
        context, 
        new PlayerMoveStagingArea(Player.P1),
        new LocalAgent(context));

    let board_display = new BoardDisplay(facade);

    let action_panel = new ActionPanel(
        <HTMLDivElement> document.getElementById('action-panel'), board_display, facade);
    let status_bar = new StatusBar(
        <HTMLDivElement> document.getElementById('status-bar'), board_display, facade);
    let button_bar = new ButtonBar(
        <HTMLDivElement> document.getElementById('button-bar'), board_display, facade);

    g.ui_components.push(board_display);
    g.ui_components.push(action_panel);
    g.ui_components.push(status_bar);
    g.ui_components.push(button_bar);

    g.event_box.subscribe('refresh ui', _ => {
        for (let c of g.ui_components)
        {
            c.render();
        }
    });

    g.event_box.subscribe('refresh board', _ => {
        board_display.show_present();
    });

    g.event_box.emit("refresh ui", null);
}
