import { cg } from '../client/client_global';
import { g } from '../core/global';
import { OnlineController } from '../client/online_controller';
import { RenderController } from '../ui/render_controller';
import { GameContext } from '../client/game_context';
import { Player } from '../core/entity';
import { Game } from '../core/game';
import { IButtonBar, SolitudeButtonBar } from '../ui/button_bar';
import { SolitudeStatusBar } from '../ui/status_bar';
import { ActionPanel } from '../ui/action_panel';

function ui_solitude()
{
    clear_intervals();
    g.initialize();
    cg.initialize();
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
        button_bar: new class _ extends stub implements IButtonBar { view_last_round: boolean = true; render_text = () => { }; }
    };

    let ctrl = new RenderController(context, components);

    components.action_panel = new ActionPanel(<HTMLDivElement> document.getElementById('action-panel'), ctrl, context);
    components.status_bar = new SolitudeStatusBar(<HTMLDivElement> document.getElementById('status-bar'), context);
    components.button_bar = new SolitudeButtonBar(<HTMLDivElement> document.getElementById('button-bar'), ctrl, context);

    ctrl.refresh_all();

    cg.render_control = ctrl;
}

function ui_online()
{
    clear_intervals();
    g.initialize();
    cg.initialize();
    cg.online_control = new OnlineController();
    cg.render_control = (<OnlineController> cg.online_control).render_ctrl;
}

function clear_intervals()
{
    let interval_id = window.setInterval(() => { }, 10000);
    for (let i = 1; i <= interval_id; i++)
    {
        clearInterval(i);
    }
}

interface IComponent
{
    render(): void;
}

export { ui_solitude, ui_online, clear_intervals, IComponent };