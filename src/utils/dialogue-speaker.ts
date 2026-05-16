import { i18n } from '../locales/i18n'
import { CharacterType, DialogueType } from '../types/app'
import { getCharacterDirectDisplayName, getCharacterDisplayName } from './character-name'

export const DIALOGUE_SPEAKER_PLACEHOLDER = '__dialogue_select_character__'
export const DIALOGUE_SPEAKER_VOICEOVER = '__dialogue_voiceover__'
export const DIALOGUE_SPEAKER_COMMANDER = '__dialogue_commander__'

const LEGACY_DIALOGUE_SPEAKER_PLACEHOLDER = '请选择角色'
const LEGACY_DIALOGUE_SPEAKER_VOICEOVER = '旁白'
const LEGACY_DIALOGUE_SPEAKER_COMMANDER = '指挥官'

export function isDialoguePlaceholderSpeaker(speaker: string): boolean {
  return speaker === DIALOGUE_SPEAKER_PLACEHOLDER || speaker === LEGACY_DIALOGUE_SPEAKER_PLACEHOLDER
}

export function isDialogueVoiceoverSpeaker(speaker: string): boolean {
  return speaker === DIALOGUE_SPEAKER_VOICEOVER || speaker === LEGACY_DIALOGUE_SPEAKER_VOICEOVER
}

export function isDialogueCommanderSpeaker(speaker: string): boolean {
  return speaker === DIALOGUE_SPEAKER_COMMANDER || speaker === LEGACY_DIALOGUE_SPEAKER_COMMANDER
}

export function createDialogueSpeaker(mode: DialogueType): string {
  switch (mode) {
    case DialogueType.VOICEOVER:
      return DIALOGUE_SPEAKER_VOICEOVER
    case DialogueType.COMMANDER:
      return DIALOGUE_SPEAKER_COMMANDER
    default:
      return DIALOGUE_SPEAKER_PLACEHOLDER
  }
}

export function normalizeDialogueSpeaker(speaker: string, mode: DialogueType): string {
  if (mode === DialogueType.VOICEOVER && isDialogueVoiceoverSpeaker(speaker)) {
    return DIALOGUE_SPEAKER_VOICEOVER
  }

  if (mode === DialogueType.COMMANDER && isDialogueCommanderSpeaker(speaker)) {
    return DIALOGUE_SPEAKER_COMMANDER
  }

  if (mode === DialogueType.NORMAL && isDialoguePlaceholderSpeaker(speaker)) {
    return DIALOGUE_SPEAKER_PLACEHOLDER
  }

  return speaker
}

export function getDialogueSpeakerDisplay(
  speaker: string,
  mode: DialogueType,
  options?: {
    character?: CharacterType | null
    characterName?: string
  }
): string {
  const t = i18n.global.t
  const normalizedSpeaker = typeof speaker === 'string' ? speaker.trim() : ''

  if (mode === DialogueType.NORMAL && isDialoguePlaceholderSpeaker(normalizedSpeaker)) {
    return t('actionDialogue.systemSpeakers.selectCharacter')
  }

  if (mode === DialogueType.VOICEOVER && isDialogueVoiceoverSpeaker(normalizedSpeaker)) {
    return t('actionDialogue.systemSpeakers.voiceover')
  }

  if (mode === DialogueType.COMMANDER && isDialogueCommanderSpeaker(normalizedSpeaker)) {
    return t('actionDialogue.systemSpeakers.commander')
  }

  const boundCharacterName = (options?.character?.characterName || options?.characterName || '').trim()

  // 对话里手动填写的名称优先级最高
  if (
    boundCharacterName &&
    normalizedSpeaker &&
    normalizedSpeaker !== boundCharacterName &&
    !isDialoguePlaceholderSpeaker(normalizedSpeaker)
  ) {
    return normalizedSpeaker
  }

  if (boundCharacterName) {
    return getCharacterDisplayName(options?.character ?? boundCharacterName)
  }

  if (normalizedSpeaker) {
    return getCharacterDirectDisplayName(normalizedSpeaker)
  }

  switch (mode) {
    case DialogueType.VOICEOVER:
      return t('actionDialogue.systemSpeakers.voiceover')
    case DialogueType.COMMANDER:
      return t('actionDialogue.systemSpeakers.commander')
    default:
      return t('actionDialogue.systemSpeakers.selectCharacter')
  }
}
