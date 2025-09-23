import { createApp } from "vue";
import '@pixi/unsafe-eval';
import App from "./App.vue";
import './main.css';
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { i18n, initializeI18n, restoreLocaleFromStorage } from "./locales/i18n";

// 创建应用实例
const app = createApp(App);

// 创建pinia实例并添加持久化插件
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 配置应用
app.use(i18n)
app.use(pinia)

// 异步初始化国际化系统
async function initializeApp() {
  try {
    // 初始化国际化系统
    await initializeI18n()
    
    // 恢复用户的语言设置
    restoreLocaleFromStorage()
    
    // 挂载应用
    app.mount("#app");
    
    console.log('Application initialized successfully')
  } catch (error) {
    console.error('Failed to initialize application:', error)
    
    // 即使初始化失败，也要挂载应用
    app.mount("#app");
  }
}

// 启动应用
initializeApp()


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
