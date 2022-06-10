function ui_solitude()
{
    clear_intervals();
    g.initialize();
    let context = <GameContext>notify_changes_for_object(
        'GameContext changed',
        new GameContext(
            "local game",
            Player.P1,
            {
                [Player.P1]: 'player 1',
                [Player.P2]: 'player 2'
            }));
    
    g.event_box.subscribe('GameContext changed', (context: GameContext) => {
        console.log("context changed");
        console.log(context.rounds.length);
    });
    // context.game_id = "123";
    
    context.new_round(GameRound.new_game());
}

    // let stub = class stub implements IComponent { render() { } };
    // let components = {
    //     action_panel: new stub,
    //     status_bar: new stub,
    //     button_bar: new class _ extends stub implements IButtonBar { view_last_round: boolean = true; render_text = () => { }; }
    // };

    // let ctrl = new RenderController(context, components);

    // components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), ctrl, context);
    // components.status_bar = new StatusBar(<HTMLDivElement> document.getElementById('status-bar'), context);
    // components.button_bar = new ButtonBar(<HTMLDivElement> document.getElementById('button-bar'), ctrl, context);

    // ctrl.refresh_all();

    // g.render_control = ctrl;
