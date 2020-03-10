function ui_solitude()
{
    clear_intervals();
    g.initialize();
    let context = new GameContext(
        {
            [Player.P1]: 'player1',
            [Player.P2]: 'player2'
        },
        Game.new_game());

    let stub = class stub implements IComponent { render() { } };
    let components = {
        action_panel: new stub,
        status_bar: new stub,
        button_bar: new class _ extends stub implements IButtonBar { view_last_round: boolean = true; }
    };

    let ctrl = new RenderController(context, components);

    components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), ctrl, context);
    components.status_bar = new SolitudeStatusBar(<HTMLDivElement> document.getElementById('status-bar'), context);
    components.button_bar = new SolitudeButtonBar(<HTMLDivElement> document.getElementById('button-bar'), ctrl, context);

    ctrl.refresh_all();

    g.render_control = ctrl;
}

function ui_online()
{
    clear_intervals();
    g.initialize();
    g.online_control = new OnlineController();
    g.render_control = (<OnlineController> g.online_control).render_ctrl;
}

function clear_intervals()
{
    let interval_id = setInterval(() => { }, 10000);
    for (let i = 1; i <= interval_id; i++)
    {
        clearInterval(i);
    }
}

interface IComponent
{
    render(): void;
}