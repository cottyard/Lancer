import { ActionType, Player } from '../core/entity';
import { IOnlineController } from '../client/online_controller';
import { IRenderController, DisplayActionType } from '../ui/render_controller';

class ClientGlobal
{
    online_control: IOnlineController | null = null;
    render_control: IRenderController | null = null;
    audio_context = new AudioContext();

    readonly cvs_size: number = 720;

    display_action_style = new Map<DisplayActionType, string>();
    action_style = new Map<ActionType, string>();

    readonly const = {
        'STYLE_GREY': "rgb(228, 228, 228)",
        'STYLE_BLACK': "#000",
        'STYLE_WHITE': "#FFF",
        'STYLE_CYAN': '#01cdfe',
        'STYLE_RED_LIGHT': '#ff8080',
        'STYLE_RED': '#ff0000',
        'STYLE_GOLD': '#ffd700',
        'STYLE_BLUE_LIGHT': '#80ccff',
        'STYLE_GREEN_LIGHT': '#80e080',
        'STYLE_GREEN': '#079400',
        'STYLE_TEAL': '#0292B7',
        'STYLE_TERQUOISE': '#1AC8DB'
    };

    settings = {
        'cvs_size': this.cvs_size,
        'cvs_border_width': 3,
        'grid_size': this.cvs_size / 9,
        'piece_font': "40px Courier New",
        'server_url': window.location.href,
        'player_color_map': {
            [Player.P1]: this.const.STYLE_RED_LIGHT,
            [Player.P2]: this.const.STYLE_BLUE_LIGHT
        },
        halo_size_small: 30,
        halo_size_large: 45,
        halo_radius_small: 0,
        halo_radius_medium: 0,
        halo_radius_large: 0
    };

    initialize()
    {
        this.display_action_style = new Map<DisplayActionType, string>([
            [DisplayActionType.Attack, cg.const.STYLE_RED_LIGHT],
            [DisplayActionType.Defend, cg.const.STYLE_GREEN_LIGHT],
            [DisplayActionType.Move, cg.const.STYLE_BLACK],
            [DisplayActionType.Upgrade, cg.const.STYLE_CYAN],
            [DisplayActionType.Recruit, cg.const.STYLE_CYAN],
            [DisplayActionType.Recall, cg.const.STYLE_GOLD],
            [DisplayActionType.AttackAssist, cg.const.STYLE_RED_LIGHT],
            [DisplayActionType.MoveAssist, cg.const.STYLE_BLACK]
        ]);

        this.action_style = new Map<ActionType, string>([
            [ActionType.Attack, cg.const.STYLE_RED_LIGHT],
            [ActionType.Defend, cg.const.STYLE_GREEN_LIGHT],
            [ActionType.Move, cg.const.STYLE_BLACK],
            [ActionType.Upgrade, cg.const.STYLE_CYAN],
            [ActionType.Recruit, cg.const.STYLE_CYAN],
            [ActionType.Recall, cg.const.STYLE_GOLD]
        ]);

        this.settings.halo_radius_small = this.settings.grid_size / 2 - 5;
        this.settings.halo_radius_small = cg.settings.grid_size / 2 - 2;
        this.settings.halo_radius_large = cg.settings.grid_size / 2 + 1;
    }
}

let cg: ClientGlobal = new ClientGlobal();

export { cg };