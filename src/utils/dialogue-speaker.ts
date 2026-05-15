import { i18n } from '../locales/i18n'
import { DialogueType } from '../types/app'
import { getCharacterDisplayName } from './character-name'

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

export function getDialogueSpeakerDisplay(speaker: string, mode: DialogueType): string {
  const t = i18n.global.t

  if (mode === DialogueType.NORMAL && isDialoguePlaceholderSpeaker(speaker)) {
    return t('actionDialogue.systemSpeakers.selectCharacter')
  }

  if (mode === DialogueType.VOICEOVER && isDialogueVoiceoverSpeaker(speaker)) {
    return t('actionDialogue.systemSpeakers.voiceover')
  }

  if (mode === DialogueType.COMMANDER && isDialogueCommanderSpeaker(speaker)) {
    return t('actionDialogue.systemSpeakers.commander')
  }

  return getCharacterDisplayName(speaker)
}
