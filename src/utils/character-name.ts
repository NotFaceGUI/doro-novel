import { i18n } from '../locales/i18n'

export function getCharacterTranslatedName(characterName?: string): string {
  if (!characterName) {
    return ''
  }

  const hasTranslation = typeof i18n.global.te === 'function'
    ? i18n.global.te(characterName)
    : false

  if (!hasTranslation) {
    return characterName
  }

  const translated = i18n.global.t(characterName)
  return typeof translated === 'string' ? translated : characterName
}

export function getCharacterDisplayName(characterName?: string): string {
  if (!characterName) {
    return ''
  }

  const translatedName = getCharacterTranslatedName(characterName)
  return characterName.startsWith('c') ? translatedName.split(/[:：]/)[0] : translatedName
}
