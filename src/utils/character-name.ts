import { i18n } from '../locales/i18n'
import { useCharacterConfigStore } from '../stores/character-config-store'
import type { CharacterType } from '../types/app'

type CharacterNameSource = string | CharacterType | null | undefined
const CHARACTER_CONFIG_STORAGE_KEY = 'character-config'
let cachedCharacterConfigRaw: string | null | undefined
let cachedAliasMap = new Map<string, string>()

const getCharacterCode = (character?: CharacterNameSource): string => {
  if (!character) {
    return ''
  }

  if (typeof character === 'string') {
    return character
  }

  return character.characterName || ''
}

export function getCharacterAlias(character?: CharacterNameSource): string {
  const characterName = getCharacterCode(character)
  if (!characterName) {
    return ''
  }

  try {
    const aliasFromStore = useCharacterConfigStore().getCharacterConfig(characterName)?.alias?.trim()
    if (aliasFromStore) {
      return aliasFromStore
    }
  } catch (_) {}

  try {
    const raw = localStorage.getItem(CHARACTER_CONFIG_STORAGE_KEY)
    if (!raw) {
      cachedCharacterConfigRaw = raw
      cachedAliasMap.clear()
      return ''
    }

    if (raw !== cachedCharacterConfigRaw) {
      cachedCharacterConfigRaw = raw
      cachedAliasMap = new Map()

      const parsed = JSON.parse(raw)
      const entries = Array.isArray(parsed?.characterConfigs) ? parsed.characterConfigs : []

      entries.forEach((entry: unknown) => {
        if (!Array.isArray(entry) || entry.length < 2 || typeof entry[0] !== 'string') {
          return
        }

        const alias = (entry[1] as { alias?: string } | undefined)?.alias?.trim()
        if (alias) {
          cachedAliasMap.set(entry[0], alias)
        }
      })
    }

    return cachedAliasMap.get(characterName) || ''
  } catch (_) {}

  return ''
}

export function getCharacterDirectDisplayName(character?: CharacterNameSource): string {
  const characterName = getCharacterCode(character)
  if (!characterName) {
    return ''
  }

  if (character && typeof character !== 'string' && character.displayName?.trim()) {
    return character.displayName.trim()
  }

  const translatedName = getCharacterTranslatedName(characterName)
  return characterName.startsWith('c') ? translatedName.split(/[:：]/)[0] : translatedName
}

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

export function getCharacterDisplayName(
  character?: CharacterNameSource,
  options?: {
    overrideName?: string
  }
): string {
  const overrideName = options?.overrideName?.trim()
  if (overrideName) {
    return overrideName
  }

  const characterName = getCharacterCode(character)
  if (!characterName) {
    return ''
  }

  const alias = getCharacterAlias(characterName)
  if (alias) {
    return alias
  }

  return getCharacterDirectDisplayName(character)
}
