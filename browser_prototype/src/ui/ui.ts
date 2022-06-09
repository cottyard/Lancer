

function ui_online()
{
    // clear_intervals();
    // g.initialize();
    // g.online_control = new OnlineController();
    // g.render_control = (<OnlineController> g.online_control).render_ctrl;
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