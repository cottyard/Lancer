interface IComponent
{
    render(): void;
}

function ui_solitude()
{
    g.initialize();
    let context = new GameContext(
        {
            [Player.P1]: 'player1', 
            [Player.P2]: 'player2'
        }, 
        Game.new_game());
    
    let components = {
        action_panel: new class _ implements IActionPanel { render() {} },
        status_bar: new class _ implements IStatusBar { render() {} },
        button_bar: new class _ implements IButtonBar { render() {} }
    }

    g.game = new RenderableGame(context, components);

    components.action_panel = new ActionPanel(<HTMLDivElement>document.getElementById('action-panel'), g.game, context);
    components.status_bar = new SolitudeStatusBar(<HTMLDivElement>document.getElementById('status-bar'), g.game, context);
    components.button_bar = new SolitudeButtonBar(<HTMLDivElement>document.getElementById('button-bar'), g.game, context);

    g.game.run();
}

function ui_online()
{
}
