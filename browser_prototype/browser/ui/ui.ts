import { EventBox } from "./event";
import { IComponent } from "./dom_helper";

export let ui_components: IComponent[] = [];
// export let audio_context = new AudioContext();
export let event_box = new EventBox();

// export function init()
// {
//     ui_components = [];
//     event_box = new EventBox();
//     clear_intervals();
// }
// function notify_changes_for_object(event: string, object: any): any
// {
//     let handler = {
//         get: (target: any, key: any): any => {
//             if(typeof target[key] == "object" && target[key] != null) 
//             {
//                 return new Proxy(target[key], handler)
//             }
//             return target[key];
//         },
//         set: (target: any, prop: any, value: any) => {
//             target[prop] = value;
//             g.event_box.emit(event, object);
//             return true;
//         }
//       }
      
//       return new Proxy(object, handler);
// }

// export function beep(): void
// {
//     let v = audio_context.createOscillator();
//     let u = audio_context.createGain();
//     v.connect(u);
//     v.frequency.value = 880;
//     u.gain.value = 0.01;
//     v.type = "square";
//     u.connect(audio_context.destination);
//     v.start(audio_context.currentTime);
//     v.stop(audio_context.currentTime + 0.05);
// }

// function clear_intervals()
// {
//     let interval_id = setInterval(() => { }, 10000);
//     for (let i = 1; i <= <number><unknown>interval_id; i++)
//     {
//         clearInterval(i);
//     }
// }
