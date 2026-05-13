import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DialogueType } from '../types/app';

export interface DialogueNormalUiSettings {
  nameFontOffset: number;
  contentFontOffset: number;
  nameContentGapOffset: number;
  groupYOffset: number;
  nameXOffset: number;
  contentXOffset: number;
  colorBarHeightOffset: number;
  colorBarWidthOffset: number;
  colorBarXOffset: number;
  colorBarYOffset: number;
}

export interface DialogueVoiceoverUiSettings {
  fontOffset: number;
}

export interface DialogueCommanderUiSettings {
  fontOffset: number;
}

export interface DialogueNormalUiMetrics {
  scaleFactor: number;
  nameFontSize: number;
  nameLineHeight: number;
  contentFontSize: number;
  contentLineHeight: number;
  nameX: number;
  nameY: number;
  contentX: number;
  contentY: number;
  colorBarX: number;
  colorBarY: number;
  colorBarWidth: number;
  colorBarHeight: number;
  contentWrapWidth: number;
}

export interface DialogueVoiceoverUiMetrics {
  fontSize: number;
  lineHeight: number;
  contentWrapWidth: number;
}

export interface DialogueCommanderUiMetrics {
  scaleFactor: number;
  fontSize: number;
  lineHeight: number;
}

const LOCAL_DIALOGUE_UI_KEY = 'doro_dialogue_ui_settings';
const LOCAL_DIALOGUE_UI_VERSION_KEY = 'doro_dialogue_ui_settings_version';
const DIALOGUE_UI_VERSION = '2026-05-13-dialogue-ui-v2';

export const DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS: DialogueNormalUiSettings = {
  nameFontOffset: 0,
  contentFontOffset: 0,
  nameContentGapOffset: 0,
  groupYOffset: 0,
  nameXOffset: 0,
  contentXOffset: 0,
  colorBarHeightOffset: 0,
  colorBarWidthOffset: 0,
  colorBarXOffset: 0,
  colorBarYOffset: 0,
};

export const DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS: DialogueVoiceoverUiSettings = {
  fontOffset: 0,
};

export const DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS: DialogueCommanderUiSettings = {
  fontOffset: 0,
};

const clampFontSize = (value: number) => Math.max(12, value);

export const resolveDialogueNormalUiMetrics = (
  screenWidth: number,
  screenHeight: number,
  settings: DialogueNormalUiSettings = DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS,
): DialogueNormalUiMetrics => {
  const scaleFactor = screenWidth / 1920;

  const nameFontSize = clampFontSize(40 * scaleFactor + settings.nameFontOffset);
  const contentFontSize = clampFontSize(40 * scaleFactor + settings.contentFontOffset);
  const nameLineHeight = Math.max(nameFontSize + 4, 45 * scaleFactor + settings.nameFontOffset);
  const contentLineHeight = Math.max(contentFontSize + 8, 60 * scaleFactor + settings.contentFontOffset);

  const nameX = 80 * scaleFactor + settings.nameXOffset;
  const nameY = screenHeight - (500 * scaleFactor) + settings.groupYOffset;
  const nameContentGap = Math.max(0, 25 * scaleFactor + settings.nameContentGapOffset);

  const contentX = 80 * scaleFactor + settings.contentXOffset;
  const contentY = nameY + nameLineHeight + nameContentGap;

  const colorBarWidth = Math.max(2, 10 + settings.colorBarWidthOffset);
  const colorBarHeight = Math.max(8, 40 * scaleFactor + settings.colorBarHeightOffset);
  const colorBarX = 45 * scaleFactor + settings.colorBarXOffset;
  const colorBarY = nameY + 5 + settings.colorBarYOffset;

  return {
    scaleFactor,
    nameFontSize,
    nameLineHeight,
    contentFontSize,
    contentLineHeight,
    nameX,
    nameY,
    contentX,
    contentY,
    colorBarX,
    colorBarY,
    colorBarWidth,
    colorBarHeight,
    contentWrapWidth: screenWidth - (140 * (scaleFactor <= 1 ? 1.4 : scaleFactor)),
  };
};

export const resolveDialogueVoiceoverUiMetrics = (
  screenWidth: number,
  settings: DialogueVoiceoverUiSettings = DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS,
): DialogueVoiceoverUiMetrics => {
  const scaleFactor = screenWidth / 1920;
  const fontSize = clampFontSize(45 * scaleFactor + settings.fontOffset);

  return {
    fontSize,
    lineHeight: Math.max(fontSize + 8, 60 * scaleFactor + settings.fontOffset),
    contentWrapWidth: screenWidth - 650,
  };
};

export const resolveDialogueCommanderUiMetrics = (
  screenWidth: number,
  settings: DialogueCommanderUiSettings = DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS,
): DialogueCommanderUiMetrics => {
  const rawScaleFactor = screenWidth / 1920;
  const scaleFactor = rawScaleFactor <= 1.4 ? 1.3 : rawScaleFactor;
  const fontSize = clampFontSize(24 * scaleFactor + settings.fontOffset);

  return {
    scaleFactor,
    fontSize,
    lineHeight: Math.max(fontSize + 6, 35 * scaleFactor + settings.fontOffset),
  };
};

export const useDialogueUiStore = defineStore('dialogue-ui', () => {
  const normalSettings = ref<DialogueNormalUiSettings>({ ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS });
  const voiceoverSettings = ref<DialogueVoiceoverUiSettings>({ ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS });
  const commanderSettings = ref<DialogueCommanderUiSettings>({ ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS });
  const activeSceneMode = ref<DialogueType | null>(null);

  const persist = () => {
    try {
      localStorage.setItem(
        LOCAL_DIALOGUE_UI_KEY,
        JSON.stringify({
          normalSettings: normalSettings.value,
          voiceoverSettings: voiceoverSettings.value,
          commanderSettings: commanderSettings.value,
        }),
      );
      localStorage.setItem(LOCAL_DIALOGUE_UI_VERSION_KEY, DIALOGUE_UI_VERSION);
    } catch (_) {}
  };

  const initialize = () => {
    try {
      const version = localStorage.getItem(LOCAL_DIALOGUE_UI_VERSION_KEY);
      if (version !== DIALOGUE_UI_VERSION) {
        normalSettings.value = { ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS };
        voiceoverSettings.value = { ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS };
        commanderSettings.value = { ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS };
        persist();
        return;
      }

      const raw = localStorage.getItem(LOCAL_DIALOGUE_UI_KEY);
      if (!raw) {
        normalSettings.value = { ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS };
        voiceoverSettings.value = { ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS };
        commanderSettings.value = { ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS };
        persist();
        return;
      }

      const data = JSON.parse(raw);
      normalSettings.value = {
        ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS,
        ...(data.normalSettings || {}),
      };
      voiceoverSettings.value = {
        ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS,
        ...(data.voiceoverSettings || {}),
      };
      commanderSettings.value = {
        ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS,
        ...(data.commanderSettings || {}),
      };
    } catch (_) {
      normalSettings.value = { ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS };
      voiceoverSettings.value = { ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS };
      commanderSettings.value = { ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS };
      persist();
    }
  };

  const updateNormalSettings = (next: Partial<DialogueNormalUiSettings>) => {
    normalSettings.value = {
      ...normalSettings.value,
      ...next,
    };
    persist();
  };

  const updateVoiceoverSettings = (next: Partial<DialogueVoiceoverUiSettings>) => {
    voiceoverSettings.value = {
      ...voiceoverSettings.value,
      ...next,
    };
    persist();
  };

  const updateCommanderSettings = (next: Partial<DialogueCommanderUiSettings>) => {
    commanderSettings.value = {
      ...commanderSettings.value,
      ...next,
    };
    persist();
  };

  const resetNormalSettings = () => {
    normalSettings.value = { ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS };
    persist();
  };

  const resetVoiceoverSettings = () => {
    voiceoverSettings.value = { ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS };
    persist();
  };

  const resetCommanderSettings = () => {
    commanderSettings.value = { ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS };
    persist();
  };

  const resetByMode = (mode: DialogueType | null) => {
    switch (mode) {
      case DialogueType.NORMAL:
        resetNormalSettings();
        break;
      case DialogueType.VOICEOVER:
        resetVoiceoverSettings();
        break;
      case DialogueType.COMMANDER:
        resetCommanderSettings();
        break;
      default:
        reset();
        break;
    }
  };

  const setActiveSceneMode = (mode: DialogueType | null) => {
    activeSceneMode.value = mode;
  };

  const reset = () => {
    normalSettings.value = { ...DEFAULT_DIALOGUE_NORMAL_UI_SETTINGS };
    voiceoverSettings.value = { ...DEFAULT_DIALOGUE_VOICEOVER_UI_SETTINGS };
    commanderSettings.value = { ...DEFAULT_DIALOGUE_COMMANDER_UI_SETTINGS };
    persist();
  };

  return {
    normalSettings,
    voiceoverSettings,
    commanderSettings,
    activeSceneMode,
    initialize,
    updateNormalSettings,
    updateVoiceoverSettings,
    updateCommanderSettings,
    resetNormalSettings,
    resetVoiceoverSettings,
    resetCommanderSettings,
    resetByMode,
    setActiveSceneMode,
    reset,
  };
});
