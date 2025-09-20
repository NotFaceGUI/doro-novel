import { createApp } from "vue";
import '@pixi/unsafe-eval';
import App from "./App.vue";
import './main.css';
import { createPinia } from "pinia";
import { i18n } from "./locales/i18n";

const app = createApp(App);

app.use(i18n)
app.use(createPinia())
app.mount("#app");


// document.onkeydown = function (event: any) {
//     var winEvent: any = window.event
//     if (winEvent && winEvent.keyCode == 123) {
//         event.keyCode = 0
//         event.returnValue = false
//     }
//     if (winEvent && winEvent.keyCode == 13) {
//         winEvent.keyCode = 505
//     }
// }



// document.oncontextmenu = function (event: any) {
//     if (window.event) {
//         event = window.event
//     }
//     try {
//         var the = event.srcElement
//         if (
//             !(
//                 (the.tagName == 'INPUT' && the.type.toLowerCase() == 'text') ||
//                 the.tagName == 'TEXTAREA'
//             )
//         ) {
//             return false
//         }
//         return true
//     } catch (e) {
//         return false
//     }
// }
