type Style =  {[key: string]: string | number};

class DomHelper
{
    static createCanvas(style: Style = {}): HTMLCanvasElement
    {
        const canvas = document.createElement("canvas");
        DomHelper.applyStyle(canvas, style);
        return canvas;
    }

    static createText(text: string, style: Style = {}): HTMLDivElement
    {
        const div = DomHelper.createDiv(style);
        div.appendChild(document.createTextNode(text));
        return div;
    }
  
    static createDiv(style: Style = {}): HTMLDivElement
    {
        const div = document.createElement("div");
        DomHelper.applyStyle(div, style);
        return div;
    }
  
    static applyStyle(element: HTMLElement, style: Style): void
    {
        for (var key in style) {
            // To supress typescript error.
            const key_any: any = key;
            const element_style: any = element.style;
            element_style[key_any] = style[key];
        }
    }
}
