import zhCN from './zh-CN.json'
import enUS from './en-US.json'
import koKR from './ko-KR.json'
import jaJP from './ja-JP.json'
import { createI18n } from 'vue-i18n'


export const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'en-US',
  globalInjection: true,
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ko-KR': koKR,
    'ja-JP': jaJP
  }
})


