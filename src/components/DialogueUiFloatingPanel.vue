<template>
  <div
    v-if="show"
    ref="panelRef"
    class="dialogue-ui-panel"
    :style="panelStyle"
    @mousedown.stop
    @click.stop
  >
    <div class="panel-header" @mousedown="startDrag">
      <div class="panel-title-group">
        <div class="panel-title">⚙️ 对话排版设置</div>
        <div class="panel-subtitle">{{ headerSubtitle }}</div>
      </div>
      <button class="panel-close" @click="emit('close')">×</button>
    </div>

    <div class="panel-toolbar">
      <div class="toolbar-row">
        <div class="toolbar-segment">
          <button
            class="mode-chip"
            :class="{ active: !isForceMode }"
            @click="disableForceMode"
          >
            跟随场景
          </button>
          <button
            class="mode-chip"
            :class="{ active: isForceMode }"
            @click="enableForceMode()"
          >
            强制设置
          </button>
        </div>
      </div>

      <div v-if="isForceMode" class="toolbar-row toolbar-row-secondary">
        <div class="toolbar-chip-list">
          <button
            v-for="mode in modeOptions"
            :key="mode"
            class="mode-chip mode-chip-compact"
            :class="{ active: forcedMode === mode }"
            @click="enableForceMode(mode)"
          >
            {{ modeMeta[mode].icon }} {{ modeMeta[mode].label }}
          </button>
        </div>
      </div>
    </div>

    <div class="panel-content">
      <div v-if="shouldShowStatusCard" class="status-card" :class="statusCardClass">
        <div class="status-head">
          <div class="status-copy">
            <div class="status-kicker">
              {{ resolvedMode ? modeMeta[resolvedMode].icon + ' ' + modeMeta[resolvedMode].label : '未检测到对话' }}
            </div>
            <div class="status-title">{{ statusTitle }}</div>
          </div>

          <button
            v-if="!resolvedMode && !isForceMode"
            class="inline-btn"
            @click="enableForceMode()"
          >
            强制设置
          </button>
        </div>
        <div class="status-desc">{{ statusDescription }}</div>
      </div>

      <div v-for="section in visibleSections" :key="section.key" class="panel-section">
        <div class="section-title">{{ section.title }}</div>

        <div v-for="item in section.controls" :key="item.key" class="control-row">
          <div class="control-copy">
            <div class="control-label">{{ item.label }}</div>
            <div class="control-desc">{{ item.description }}</div>
          </div>

          <div class="control-inputs">
            <input
              class="range-input"
              type="range"
              :min="item.min"
              :max="item.max"
              :step="item.step"
              :value="getSettingValue(item.group, item.key)"
              @input="updateSetting(item.group, item.key, $event)"
            />
            <input
              class="number-input"
              type="number"
              :min="item.min"
              :max="item.max"
              :step="item.step"
              :value="getSettingValue(item.group, item.key)"
              @input="updateSetting(item.group, item.key, $event)"
            />
          </div>
        </div>
      </div>

      <div v-if="metricItems.length > 0" class="metrics-bar">
        <span v-for="item in metricItems" :key="item">{{ item }}</span>
      </div>
    </div>

    <div class="panel-footer">
      <button
        class="panel-btn panel-btn-secondary"
        :disabled="!resolvedMode"
        @click="resetCurrentSettings"
      >
        恢复当前
      </button>
      <button class="panel-btn panel-btn-primary" @click="emit('close')">完成</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import CanvasManager from '../script/render/canvas-manager';
import {
  resolveDialogueCommanderUiMetrics,
  resolveDialogueNormalUiMetrics,
  resolveDialogueVoiceoverUiMetrics,
  useDialogueUiStore,
  type DialogueCommanderUiSettings,
  type DialogueNormalUiSettings,
  type DialogueVoiceoverUiSettings,
} from '../stores/dialogue-ui-store';
import { DialogueType } from '../types/app';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

type SettingGroup = 'normal' | 'voiceover' | 'commander';
type SettingKey =
  | keyof DialogueNormalUiSettings
  | keyof DialogueVoiceoverUiSettings
  | keyof DialogueCommanderUiSettings;

type ControlItem = {
  group: SettingGroup;
  key: SettingKey;
  label: string;
  description: string;
  min: number;
  max: number;
  step: number;
};

type ControlSection = {
  key: string;
  title: string;
  controls: ControlItem[];
};

const PANEL_POSITION_STORAGE_KEY = 'doro_dialogue_ui_panel_position_v1';

const panelRef = ref<HTMLDivElement | null>(null);
const panelX = ref(16);
const panelY = ref(16);
const hasPlacedPanel = ref(false);
const isForceMode = ref(false);
const forcedMode = ref<DialogueType>(DialogueType.NORMAL);
const dialogueUi = useDialogueUiStore();

const modeOptions: DialogueType[] = [
  DialogueType.NORMAL,
  DialogueType.VOICEOVER,
  DialogueType.COMMANDER,
];

const modeMeta: Record<DialogueType, { label: string; icon: string }> = {
  [DialogueType.NORMAL]: { label: '角色对话', icon: '💬' },
  [DialogueType.VOICEOVER]: { label: '旁白', icon: '📢' },
  [DialogueType.COMMANDER]: { label: '回答', icon: '🗨️' },
};

const normalFontControls: ControlItem[] = [
  { group: 'normal', key: 'nameFontOffset', label: '角色名字号', description: '角色名字体大小偏移', min: -24, max: 40, step: 1 },
  { group: 'normal', key: 'contentFontOffset', label: '对话正文字号', description: '角色对话正文大小偏移', min: -24, max: 40, step: 1 },
];

const voiceoverControls: ControlItem[] = [
  { group: 'voiceover', key: 'fontOffset', label: '旁白字号', description: '旁白文本大小偏移', min: -24, max: 40, step: 1 },
];

const commanderControls: ControlItem[] = [
  { group: 'commander', key: 'fontOffset', label: '回答字号', description: '回答按钮文本大小偏移', min: -24, max: 40, step: 1 },
];

const layoutControls: ControlItem[] = [
  { group: 'normal', key: 'nameContentGapOffset', label: '名字与正文间距', description: '角色名字和正文之间的垂直间距', min: -20, max: 80, step: 1 },
  { group: 'normal', key: 'groupYOffset', label: '整体垂直偏移', description: '整组角色名字和正文上下移动', min: -120, max: 120, step: 1 },
  { group: 'normal', key: 'nameXOffset', label: '名字水平偏移', description: '单独调整角色名字位置', min: -120, max: 120, step: 1 },
  { group: 'normal', key: 'contentXOffset', label: '正文水平偏移', description: '单独调整角色对话正文位置', min: -120, max: 120, step: 1 },
];

const colorBarControls: ControlItem[] = [
  { group: 'normal', key: 'colorBarHeightOffset', label: '色条高度', description: '角色色条高度补偿', min: -40, max: 120, step: 1 },
  { group: 'normal', key: 'colorBarWidthOffset', label: '色条宽度', description: '角色色条宽度补偿', min: -8, max: 24, step: 1 },
  { group: 'normal', key: 'colorBarXOffset', label: '色条水平偏移', description: '角色色条左右移动', min: -80, max: 80, step: 1 },
  { group: 'normal', key: 'colorBarYOffset', label: '色条垂直偏移', description: '角色色条上下移动', min: -80, max: 80, step: 1 },
];

const panelStyle = computed(() => ({
  left: `${panelX.value}px`,
  top: `${panelY.value}px`,
}));

const activeSceneMode = computed(() => dialogueUi.activeSceneMode);

const resolvedMode = computed<DialogueType | null>(() => {
  if (isForceMode.value) {
    return forcedMode.value;
  }

  return activeSceneMode.value;
});

const hasMatchingSceneElement = computed(() => {
  return !!resolvedMode.value && activeSceneMode.value === resolvedMode.value;
});

const headerSubtitle = computed(() => {
  if (isForceMode.value) {
    return `强制设置 ${modeMeta[forcedMode.value].label}，未出现时也会先保存配置`;
  }

  if (!activeSceneMode.value) {
    return '当前场景没有可识别的对话元素，可切到强制设置';
  }

  return `当前场景：${modeMeta[activeSceneMode.value].label}，修改会实时作用到画面`;
});

const statusTitle = computed(() => {
  if (!resolvedMode.value) {
    return '场景没有对应元素';
  }

  if (!hasMatchingSceneElement.value) {
    return `当前场景没有${modeMeta[resolvedMode.value].label}元素`;
  }

  return `正在调整${modeMeta[resolvedMode.value].label}`;
});

const statusDescription = computed(() => {
  if (!resolvedMode.value) {
    return '先让场景里出现角色对话、旁白或回答，或者点强制设置直接改并保存。';
  }

  if (!hasMatchingSceneElement.value) {
    return '当前画面不会立刻显示这类元素，但配置会立即保存，等它下次出现时直接生效。';
  }

  return '当前显示的就是对应类型，拖动滑块后会实时刷新这块文本排版。';
});

const statusCardClass = computed(() => ({
  'is-empty': !resolvedMode.value,
  'is-warning': !!resolvedMode.value && !hasMatchingSceneElement.value,
  'is-active': hasMatchingSceneElement.value,
}));

const shouldShowStatusCard = computed(() => {
  return !resolvedMode.value || !hasMatchingSceneElement.value;
});

const visibleSections = computed<ControlSection[]>(() => {
  switch (resolvedMode.value) {
    case DialogueType.NORMAL:
      return [
        { key: 'normal-fonts', title: '💬 角色对话', controls: normalFontControls },
        { key: 'normal-layout', title: '📐 名字与正文', controls: layoutControls },
        { key: 'normal-color-bar', title: '🎨 角色色条', controls: colorBarControls },
      ];
    case DialogueType.VOICEOVER:
      return [
        { key: 'voiceover-font', title: '📢 旁白', controls: voiceoverControls },
      ];
    case DialogueType.COMMANDER:
      return [
        { key: 'commander-font', title: '🗨️ 回答', controls: commanderControls },
      ];
    default:
      return [];
  }
});

const metrics = computed(() => {
  const app = CanvasManager.getInstance().getApp();
  return resolveDialogueNormalUiMetrics(
    app.screen.width,
    app.screen.height,
    dialogueUi.normalSettings,
  );
});

const voiceoverMetrics = computed(() => {
  const app = CanvasManager.getInstance().getApp();
  return resolveDialogueVoiceoverUiMetrics(app.screen.width, dialogueUi.voiceoverSettings);
});

const commanderMetrics = computed(() => {
  const app = CanvasManager.getInstance().getApp();
  return resolveDialogueCommanderUiMetrics(app.screen.width, dialogueUi.commanderSettings);
});

const metricItems = computed(() => {
  switch (resolvedMode.value) {
    case DialogueType.NORMAL:
      return [
        `名字 ${metrics.value.nameFontSize.toFixed(0)}px`,
        `正文 ${metrics.value.contentFontSize.toFixed(0)}px`,
        `间距 ${Math.max(0, metrics.value.contentY - metrics.value.nameY - metrics.value.nameLineHeight).toFixed(0)}px`,
        `色条高 ${metrics.value.colorBarHeight.toFixed(0)}px`,
      ];
    case DialogueType.VOICEOVER:
      return [
        `旁白 ${voiceoverMetrics.value.fontSize.toFixed(0)}px`,
        `行高 ${voiceoverMetrics.value.lineHeight.toFixed(0)}px`,
      ];
    case DialogueType.COMMANDER:
      return [
        `回答 ${commanderMetrics.value.fontSize.toFixed(0)}px`,
        `行高 ${commanderMetrics.value.lineHeight.toFixed(0)}px`,
      ];
    default:
      return [];
  }
});

const getSettingValue = (group: SettingGroup, key: SettingKey) => {
  if (group === 'voiceover') {
    return dialogueUi.voiceoverSettings[key as keyof DialogueVoiceoverUiSettings];
  }

  if (group === 'commander') {
    return dialogueUi.commanderSettings[key as keyof DialogueCommanderUiSettings];
  }

  return dialogueUi.normalSettings[key as keyof DialogueNormalUiSettings];
};

const updateSetting = (group: SettingGroup, key: SettingKey, event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = Number(target.value);

  if (Number.isNaN(value)) {
    return;
  }

  if (group === 'voiceover') {
    dialogueUi.updateVoiceoverSettings({
      [key]: value,
    } as Partial<DialogueVoiceoverUiSettings>);
    return;
  }

  if (group === 'commander') {
    dialogueUi.updateCommanderSettings({
      [key]: value,
    } as Partial<DialogueCommanderUiSettings>);
    return;
  }

  dialogueUi.updateNormalSettings({
    [key]: value,
  } as Partial<DialogueNormalUiSettings>);
};

const resetCurrentSettings = () => {
  dialogueUi.resetByMode(resolvedMode.value);
};

const enableForceMode = (mode?: DialogueType) => {
  forcedMode.value = mode ?? activeSceneMode.value ?? forcedMode.value ?? DialogueType.NORMAL;
  isForceMode.value = true;
};

const disableForceMode = () => {
  isForceMode.value = false;
};

const clampPanelPosition = () => {
  const panel = panelRef.value;
  const parent = panel?.offsetParent as HTMLElement | null;

  if (!panel || !parent) {
    return;
  }

  const maxX = Math.max(16, parent.clientWidth - panel.offsetWidth - 16);
  const maxY = Math.max(16, parent.clientHeight - panel.offsetHeight - 16);

  panelX.value = Math.min(Math.max(16, panelX.value), maxX);
  panelY.value = Math.min(Math.max(16, panelY.value), maxY);
};

const persistPanelPosition = () => {
  try {
    localStorage.setItem(
      PANEL_POSITION_STORAGE_KEY,
      JSON.stringify({
        x: panelX.value,
        y: panelY.value,
      }),
    );
  } catch (_) {}
};

const restorePanelPosition = () => {
  try {
    const raw = localStorage.getItem(PANEL_POSITION_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    const data = JSON.parse(raw);
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      return false;
    }

    panelX.value = data.x;
    panelY.value = data.y;
    hasPlacedPanel.value = true;
    return true;
  } catch (_) {
    return false;
  }
};

const placePanelNearFullscreenButton = async () => {
  await nextTick();

  const panel = panelRef.value;
  const parent = panel?.offsetParent as HTMLElement | null;
  if (!panel || !parent) {
    return;
  }

  panelX.value = 16;
  panelY.value = Math.max(16, parent.clientHeight - panel.offsetHeight - 88);
  clampPanelPosition();
  persistPanelPosition();
  hasPlacedPanel.value = true;
};

let dragStartPointerX = 0;
let dragStartPointerY = 0;
let dragStartPanelX = 0;
let dragStartPanelY = 0;
let dragging = false;

const handleDragMove = (event: MouseEvent) => {
  if (!dragging) {
    return;
  }

  panelX.value = dragStartPanelX + (event.clientX - dragStartPointerX);
  panelY.value = dragStartPanelY + (event.clientY - dragStartPointerY);
  clampPanelPosition();
};

const stopDrag = () => {
  if (dragging) {
    persistPanelPosition();
  }

  dragging = false;
  window.removeEventListener('mousemove', handleDragMove);
  window.removeEventListener('mouseup', stopDrag);
};

const startDrag = (event: MouseEvent) => {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  if (event.target.closest('button')) {
    return;
  }

  dragging = true;
  dragStartPointerX = event.clientX;
  dragStartPointerY = event.clientY;
  dragStartPanelX = panelX.value;
  dragStartPanelY = panelY.value;

  window.addEventListener('mousemove', handleDragMove);
  window.addEventListener('mouseup', stopDrag);
};

watch(
  () => props.show,
  async (show) => {
    if (!show) {
      stopDrag();
      return;
    }

    dialogueUi.initialize();
    disableForceMode();

    await nextTick();

    if (!hasPlacedPanel.value) {
      if (!restorePanelPosition()) {
        await placePanelNearFullscreenButton();
        return;
      }
    }

    clampPanelPosition();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopDrag();
});
</script>

<style scoped>
.dialogue-ui-panel {
  position: absolute;
  z-index: 130;
  width: 392px;
  max-width: min(392px, calc(100% - 32px));
  background: var(--primary-bg);
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 14px 12px;
  background: var(--secondary-bg);
  border-bottom: 1px solid var(--main-border-color);
  cursor: move;
}

.panel-title-group {
  min-width: 0;
}

.panel-title {
  color: var(--text-color);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
}

.panel-subtitle {
  margin-top: 5px;
  color: var(--sec-text-color);
  font-size: 11px;
  line-height: 1.45;
}

.panel-close {
  flex: 0 0 auto;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-color);
  font-size: 18px;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
}

.panel-close:hover {
  background: var(--high-hover-bg);
}

.panel-toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px 0;
}

.toolbar-row {
  display: flex;
  justify-content: center;
}

.toolbar-row-secondary {
  justify-content: center;
}

.toolbar-segment {
  display: inline-flex;
  width: 100%;
  padding: 3px;
  border: 1px solid var(--main-border-color);
  border-radius: 10px;
  background: var(--secondary-bg);
}

.toolbar-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  width: 100%;
}

.mode-chip,
.inline-btn {
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-color);
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out;
}

.mode-chip {
  flex: 1;
  height: 28px;
  padding: 0 12px;
}

.mode-chip-compact {
  flex: 0 0 auto;
  border-color: var(--main-border-color);
  background: var(--secondary-bg);
  padding-inline: 10px;
}

.mode-chip:hover,
.inline-btn:hover {
  background: var(--high-bg);
}

.mode-chip.active {
  background: var(--button-bg);
  border-color: rgba(255, 255, 255, 0.06);
  color: var(--text-color);
}

.panel-content {
  max-height: min(62vh, 640px);
  padding: 12px 14px 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-card {
  position: relative;
  padding: 10px 12px 10px 14px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--secondary-bg);
  overflow: hidden;
}

.status-card::before {
  content: '';
  position: absolute;
  top: 10px;
  bottom: 10px;
  left: 0;
  width: 3px;
  border-radius: 0 999px 999px 0;
  background: var(--main-border-color);
}

.status-card.is-active {
  border-color: var(--button-bg);
  background: var(--high-bg);
}

.status-card.is-warning {
  border-color: var(--button-bg);
}

.status-card.is-empty {
  border-style: dashed;
}

.status-card.is-active::before,
.status-card.is-warning::before {
  background: var(--button-bg);
}

.status-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.status-copy {
  min-width: 0;
}

.status-kicker {
  color: var(--sec-text-color);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.status-title {
  margin-top: 3px;
  color: var(--text-color);
  font-size: 12px;
  font-weight: 700;
}

.status-desc {
  margin-top: 5px;
  color: var(--sec-text-color);
  font-size: 11px;
  line-height: 1.5;
}

.inline-btn {
  flex: 0 0 auto;
  height: 26px;
  padding: 0 10px;
  border-color: var(--main-border-color);
  background: var(--high-bg);
  color: var(--text-color);
  font-size: 11px;
}

.panel-section {
  padding: 11px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--secondary-bg);
}

.section-title {
  margin-bottom: 10px;
  color: var(--text-color);
  font-size: 12px;
  font-weight: 700;
}

.control-row + .control-row {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--main-border-color);
}

.control-copy {
  margin-bottom: 8px;
}

.control-label {
  color: var(--text-color);
  font-size: 12px;
  font-weight: 600;
}

.control-desc {
  margin-top: 3px;
  color: var(--sec-text-color);
  font-size: 11px;
  line-height: 1.35;
}

.control-inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px;
  gap: 10px;
  align-items: center;
}

.range-input {
  width: 100%;
  height: 18px;
  margin: 0;
  appearance: none;
  background: transparent;
  cursor: pointer;
}

.range-input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 999px;
  background: var(--high-hover-bg);
}

.range-input::-webkit-slider-thumb {
  width: 14px;
  height: 14px;
  margin-top: -5px;
  border: none;
  border-radius: 50%;
  appearance: none;
  background: var(--button-bg);
}

.range-input::-moz-range-track {
  height: 4px;
  border-radius: 999px;
  background: var(--high-hover-bg);
}

.range-input::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: none;
  border-radius: 50%;
  background: var(--button-bg);
}

.number-input {
  width: 100%;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--main-border-color);
  border-radius: 8px;
  background: var(--high-bg);
  color: var(--text-color);
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  outline: none;
}

.number-input:focus {
  border-color: var(--button-bg);
}

.metrics-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--high-bg);
}

.metrics-bar span {
  color: var(--sec-text-color);
  font-size: 11px;
  font-weight: 600;
}

.metrics-bar span::before {
  content: '•';
  margin-right: 5px;
  color: var(--button-bg);
}

.panel-footer {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  background: var(--secondary-bg);
  border-top: 1px solid var(--main-border-color);
}

.panel-btn {
  flex: 1;
  height: 34px;
  border: 1px solid var(--main-border-color);
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, opacity 0.2s ease-in-out;
}

.panel-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.panel-btn-secondary {
  background: var(--high-bg);
  color: var(--text-color);
}

.panel-btn-secondary:not(:disabled):hover {
  background: var(--high-hover-bg);
}

.panel-btn-primary {
  background: var(--button-bg);
  color: var(--text-color);
  border-color: var(--button-bg);
}

.panel-btn-primary:hover {
  background: var(--button-hover-bg);
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: transparent;
}

.panel-content::-webkit-scrollbar-thumb {
  background: var(--high-hover-bg);
  border-radius: 999px;
}

@media (max-width: 720px) {
  .dialogue-ui-panel {
    width: calc(100% - 32px);
  }
}
</style>
