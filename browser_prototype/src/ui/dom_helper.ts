export interface IComponent
{
    render(): void;
}

type Style =  {[key: string]: string | number};

export class DomHelper
{
    static create_canvas(style: Style = {}): HTMLCanvasElement
    {
        const canvas = document.createElement("canvas");
        DomHelper.apply_style(canvas, style);
        return canvas;
    }

    static create_text(text: string, style: Style = {}): HTMLDivElement
    {
        const div = DomHelper.create_div(style);
        div.appendChild(document.createTextNode(text));
        return div;
    }

    static create_textarea(style: Style = {}): HTMLTextAreaElement
    {
        const textarea = document.createElement("textarea");
        textarea.id = 'player-name';
        DomHelper.apply_style(textarea, style);
        return textarea;
    }
  
    static create_div(style: Style = {}): HTMLDivElement
    {
        const div = document.createElement("div");
        DomHelper.apply_style(div, style);
        return div;
    }

    static create_button(style: Style = {}): HTMLButtonElement
    {
        const btn = document.createElement("button");
        DomHelper.apply_style(btn, style);
        return btn;
    }
  
    static apply_style(element: HTMLElement, style: Style): void
    {
        for (var key in style) {
            // To supress typescript error.
            const key_any: any = key;
            const element_style: any = element.style;
            element_style[key_any] = style[key];
        }
    }
}
