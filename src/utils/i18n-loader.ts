import { readTextFile } from '@tauri-apps/plugin-fs'
import { resolveResource } from '@tauri-apps/api/path'

/**
 * 支持的语言列表
 */
export const SUPPORTED_LOCALES = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'] as const
export type SupportedLocale = typeof SUPPORTED_LOCALES[number]

/**
 * 从外部资源文件加载国际化数据
 * @param locale 语言代码
 * @returns 国际化数据对象
 */
/**
 * 国际化文件路径常量
 */
const ASSET_LOCALES = "resources/locales/"

export async function loadLocaleMessages(locale: SupportedLocale): Promise<Record<string, any>> {
  try {
    // 解析资源文件路径 - 使用和 asset-manager 相同的方式
    const resourcePath = await resolveResource(`${ASSET_LOCALES}${locale}.json`)
    console.log(`Trying to load locale file from: ${resourcePath}`)
    
    // 读取文件内容
    const content = await readTextFile(resourcePath)
    
    // 解析 JSON
    return JSON.parse(content)
  } catch (error) {
    console.error(`Failed to load locale messages for ${locale}:`, error)
    console.error(`Attempted path: ${await resolveResource(`${ASSET_LOCALES}${locale}.json`)}`)
    
    // 如果加载失败，返回空对象作为后备
    return {}
  }
}

/**
 * 加载所有支持的语言文件
 * @returns 包含所有语言数据的对象
 */
export async function loadAllLocaleMessages(): Promise<Record<SupportedLocale, Record<string, any>>> {
  const messages: Record<string, Record<string, any>> = {}
  
  // 并行加载所有语言文件
  const loadPromises = SUPPORTED_LOCALES.map(async (locale) => {
    const localeMessages = await loadLocaleMessages(locale)
    messages[locale] = localeMessages
  })
  
  await Promise.all(loadPromises)
  
  return messages as Record<SupportedLocale, Record<string, any>>
}

/**
 * 检查语言文件是否存在
 * @param locale 语言代码
 * @returns 是否存在
 */
export async function checkLocaleExists(locale: SupportedLocale): Promise<boolean> {
  try {
    const resourcePath = await resolveResource(`locales/${locale}.json`)
    await readTextFile(resourcePath)
    return true
  } catch {
    return false
  }
}