import { createI18n } from 'vue-i18n'
import { loadAllLocaleMessages, type SupportedLocale } from '../utils/i18n-loader'

/**
 * 获取系统语言并映射到支持的语言
 */
function getSystemLocale(): SupportedLocale {
  // 获取浏览器语言
  const browserLang = navigator.language || navigator.languages?.[0] || 'zh-CN'
  
  // 映射系统语言到支持的语言
  const langMap: Record<string, SupportedLocale> = {
    'zh': 'zh-CN',
    'zh-CN': 'zh-CN',
    'zh-TW': 'zh-CN',
    'zh-HK': 'zh-CN',
    'en': 'en-US',
    'en-US': 'en-US',
    'en-GB': 'en-US',
    'ja': 'ja-JP',
    'ja-JP': 'ja-JP',
    'ko': 'ko-KR',
    'ko-KR': 'ko-KR'
  }
  
  // 首先尝试完整匹配
  if (langMap[browserLang]) {
    return langMap[browserLang]
  }
  
  // 然后尝试语言代码匹配（去掉地区代码）
  const langCode = browserLang.split('-')[0]
  if (langMap[langCode]) {
    return langMap[langCode]
  }
  
  // 默认返回中文
  return 'zh-CN'
}

// 创建 i18n 实例，初始时使用空的 messages
export const i18n = createI18n({
  legacy: false,
  locale: getSystemLocale(),
  fallbackLocale: 'en-US',
  globalInjection: true,
  messages: {}
})

/**
 * 初始化国际化系统
 * 从外部资源文件加载所有语言数据
 */
export async function initializeI18n(): Promise<void> {
  try {
    console.log('Loading locale messages from external resources...')
    
    // 加载所有语言文件
    const messages = await loadAllLocaleMessages()
    
    // 将加载的消息设置到 i18n 实例中
    Object.entries(messages).forEach(([locale, localeMessages]) => {
      i18n.global.setLocaleMessage(locale as SupportedLocale, localeMessages)
    })
    
    console.log('Locale messages loaded successfully:', Object.keys(messages))
  } catch (error) {
    console.error('Failed to initialize i18n:', error)
    
    // 如果加载失败，使用默认的空消息
    console.warn('Using fallback empty messages')
  }
}

/**
 * 切换语言
 * @param locale 目标语言
 */
export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
  
  // 保存到本地存储
  localStorage.setItem('app-locale', locale)
}

/**
 * 获取当前语言
 */
export function getCurrentLocale(): SupportedLocale {
  return i18n.global.locale.value as SupportedLocale
}

/**
 * 从本地存储恢复语言设置
 */
export function restoreLocaleFromStorage(): void {
  const savedLocale = localStorage.getItem('app-locale') as SupportedLocale
  if (savedLocale && ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'].includes(savedLocale)) {
    i18n.global.locale.value = savedLocale
  }
}


