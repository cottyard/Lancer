/// <reference path="global.ts"/>

class Canvas {
    background: HTMLCanvasElement;
    bg_ctx: CanvasRenderingContext2D;
    //static: HTMLElement;
    //animate: HTMLElement;

    timerToken: number;

    constructor(background: HTMLCanvasElement, static_: HTMLCanvasElement, animate: HTMLCanvasElement) {
        this.background = background;
        this.bg_ctx = background.getContext('2d');

        background.style.border = "solid #000 3px";
        background.style.position = "absolute";
        background.style['z-index'] = "1";

        this.set_canvas_attr(background, 1, m.settings.cvs_size)
        this.set_canvas_attr(static_, 2, m.settings.cvs_size)
        this.set_canvas_attr(animate, 3, m.settings.cvs_size)

        background.width = background.height = 100;
        
        this.bg_ctx.beginPath();
        this.bg_ctx.moveTo(1, 1);
        this.bg_ctx.lineTo(80, 20);
        this.bg_ctx.lineTo(50, 90);
        this.bg_ctx.fill();
        //this.element.innerHTML += "The time is: ";
        //this.span = document.createElement('span');
        //this.element.appendChild(this.span);
        //this.span.innerText = new Date().toUTCString();
    }

    set_canvas_attr(cvs: HTMLCanvasElement, z_index: number, size: number) {
        cvs.style.border = "solid #000 #{settings.cvs_border_width}px";
        cvs.style.position = "absolute";
        cvs.style['z-index'] = "#{z_index}";
        cvs.width = cvs.height = size;
    }
    
    start() {
        //this.timerToken = setInterval(() => this.span.innerHTML = new Date().toUTCString(), 500);
    }

    stop() {
        //clearTimeout(this.timerToken);
    }
}

window.onload = () => {
    var c1 = <HTMLCanvasElement>document.getElementById('background');
    var c2 = <HTMLCanvasElement>document.getElementById('static');
    var c3 = <HTMLCanvasElement>document.getElementById('animate');
    var greeter = new Canvas(c1, c2, c3);
    greeter.start();
};