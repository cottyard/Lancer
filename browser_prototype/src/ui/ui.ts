function ui_solitude()
{
    g.initialize();
    let context = new GameContext(
        {
            [Player.P1]: 'player1',
            [Player.P2]: 'player2'
        },
        Game.new_game());

    let stub = new class _ implements IComponent { render() { } };
    let components = {
        action_panel: stub,
        status_bar: stub,
        button_bar: stub
    };

    let ctrl = new RenderController(context, components);

    components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), ctrl, context);
    components.status_bar = new SolitudeStatusBar(<HTMLDivElement> document.getElementById('status-bar'), context);
    components.button_bar = new SolitudeButtonBar(<HTMLDivElement> document.getElementById('button-bar'), ctrl, context);

    ctrl.refresh_all();
}

function ui_online()
{
    g.initialize();
    g.game = new OnlineController();
}

interface IComponent
{
    render(): void;
}