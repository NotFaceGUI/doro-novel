<template>
  <div class="shader-editor">
    <div class="editor-toolbar">
      <div class="toolbar-block">
        <div class="editor-section-label">{{ t('shaderEditor.selectPreset') }}</div>
        <div class="preset-toolbar">
          <div class="preset-dropdown">
            <Dropdown
              v-model="selectedPresetIndex"
              :options="shaderPresetOptions"
              :disabled="shaderPresetOptions.length === 0"
            />
          </div>
          <button type="button" @click="loadPreset" class="btn btn-secondary">
            {{ t('shaderEditor.loadPreset') }}
          </button>
        </div>
      </div>

      <div class="toolbar-actions">
        <button type="button" @click="applyShader" class="btn btn-primary">
          {{ t('shaderEditor.apply') }}
        </button>
        <button type="button" @click="resetShader" class="btn btn-secondary">
          {{ t('shaderEditor.reset') }}
        </button>
      </div>
    </div>

    <div class="editor-switches">
      <button
        type="button"
        class="switch-chip"
        :class="{ active: realTimePreview }"
        @click="realTimePreview = !realTimePreview"
      >
        {{ t('shaderEditor.realTimePreview') }}
      </button>
      <button
        type="button"
        class="switch-chip"
        :class="{ active: enableAnimation }"
        @click="enableAnimation = !enableAnimation"
      >
        {{ t('shaderEditor.enableAnimation') }}
      </button>
      <span class="animation-hint" v-if="enableAnimation && hasTimeUniform">
        {{ t('shaderEditor.timeAnimationEnabled') }}
      </span>
    </div>

    <div class="shader-editor-layout">
      <div class="editor-surface code-surface">
        <div class="surface-header">
          <div class="editor-section-label">{{ t('shaderEditor.fragmentShader') }}</div>
        </div>
        <textarea
          v-model="fragmentShader"
          class="shader-textarea"
          :placeholder="t('shaderEditor.fragmentShaderPlaceholder')"
          rows="15"
        ></textarea>
      </div>

      <div class="editor-surface uniforms-surface">
        <div class="surface-header">
          <div class="editor-section-label">{{ t('shaderEditor.uniforms') }}</div>
          <button type="button" @click="addUniform" class="btn btn-small">
            {{ t('shaderEditor.addUniform') }}
          </button>
        </div>
        
        <div v-if="uniforms.length > 0" class="uniforms-list">
          <div
            v-for="(uniform, index) in uniforms"
            :key="index"
            class="uniform-item"
          >
            <div class="uniform-header">
              <input
                v-model="uniform.name"
                :placeholder="t('shaderEditor.uniformNamePlaceholder')"
                class="field-input uniform-name-input"
              />
              <div class="uniform-type-dropdown">
                <Dropdown
                  :model-value="getUniformTypeIndex(uniform.type)"
                  :options="uniformTypeOptions"
                  :disabled="false"
                  @update:modelValue="(index) => handleUniformTypeDropdownChange(uniform, index)"
                />
              </div>
              <button
                type="button"
                @click="removeUniform(index)"
                class="btn btn-danger btn-small"
              >
                {{ t('common.delete') }}
              </button>
            </div>

            <div class="uniform-body">
              <template v-if="uniform.type === 'float'">
                <input
                  type="range"
                  v-model.number="uniform.value"
                  :min="uniform.min || 0"
                  :max="uniform.max || 1"
                  :step="0.01"
                  class="uniform-slider field-range"
                />
                <input
                  type="number"
                  v-model.number="uniform.value"
                  :step="0.01"
                  class="field-input uniform-number-input"
                />
              </template>
              
              <template v-else-if="uniform.type === 'vec2'">
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[0]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[1]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
              </template>
              
              <template v-else-if="uniform.type === 'vec3'">
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[0]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[1]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[2]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
              </template>
              
              <template v-else-if="uniform.type === 'vec4'">
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[0]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[1]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[2]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[3]"
                  :step="0.1"
                  class="field-input uniform-vec-input"
                />
              </template>
            </div>
          </div>
        </div>
        <div v-else class="uniform-empty">
          {{ t('shaderEditor.addUniform') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Dropdown from './Dropdown.vue'
import type { DropdownOption } from '../../types/app'

// 定义组件的props和emits
interface ShaderUniform {
  name: string
  type: 'float' | 'vec2' | 'vec3' | 'vec4'
  value: number | number[]
  min?: number
  max?: number
}

interface ShaderPreset {
  name: string
  fragmentShader: string
  uniforms: ShaderUniform[]
}

const emit = defineEmits<{
  applyShader: [shaderData: { name: string; fragmentShader: string; uniforms: Record<string, any> }]
  resetShader: []
}>()

const { t } = useI18n()

// 响应式数据
const selectedPreset = ref<string>('')
const fragmentShader = ref<string>('')
const uniforms = ref<ShaderUniform[]>([])
const realTimePreview = ref<boolean>(false)
const enableAnimation = ref<boolean>(false)
const hasTimeUniform = computed(() => {
  return uniforms.value.some((uniform) => uniform.name === 'iTime' || uniform.name === 'uTime')
})

const uniformTypeOptions: DropdownOption[] = [
  { label: 'float', value: 'float' },
  { label: 'vec2', value: 'vec2' },
  { label: 'vec3', value: 'vec3' },
  { label: 'vec4', value: 'vec4' },
]

// Shader预设
const shaderPresets = ref<ShaderPreset[]>([
  {
    name: 'colorReplace',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec3 uSourceColor;
uniform vec3 uTargetColor;
uniform float uThreshold;
uniform float uSoftness;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);

    float edge0 = max(0.0, uThreshold - uSoftness);
    float edge1 = uThreshold + uSoftness;
    float colorDistance = distance(texColor.rgb, uSourceColor);
    float replaceMask = 1.0 - smoothstep(edge0, edge1, colorDistance);

    vec3 replacedColor = mix(texColor.rgb, uTargetColor, replaceMask);
    gl_FragColor = vec4(replacedColor, texColor.a);
}`,
    uniforms: [
      { name: 'uSourceColor', type: 'vec3', value: [1.0, 1.0, 1.0] },
      { name: 'uTargetColor', type: 'vec3', value: [1.0, 0.35, 0.35] },
      { name: 'uThreshold', type: 'float', value: 0.22, min: 0.0, max: 1.0 },
      { name: 'uSoftness', type: 'float', value: 0.08, min: 0.0, max: 0.5 }
    ]
  },
  {
    name: 'trueTint',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec3 uTintColor;
uniform float uTintStrength;
uniform float uPreserveLight;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);

    float light = dot(texColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 multiplyTint = texColor.rgb * uTintColor;
    vec3 lightTint = uTintColor * light;
    vec3 tinted = mix(multiplyTint, lightTint, clamp(uPreserveLight, 0.0, 1.0));
    vec3 finalColor = mix(texColor.rgb, tinted, clamp(uTintStrength, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, texColor.a);
}`,
    uniforms: [
      { name: 'uTintColor', type: 'vec3', value: [0.2, 0.75, 1.0] },
      { name: 'uTintStrength', type: 'float', value: 0.85, min: 0.0, max: 1.0 },
      { name: 'uPreserveLight', type: 'float', value: 0.65, min: 0.0, max: 1.0 }
    ]
  },
  {
    name: 'gradientTint',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBlendStrength;
uniform float uAngle;
uniform float uScale;
uniform float uOffset;
uniform float uFlowSpeed;
uniform float iTime;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);

    vec2 direction = vec2(cos(uAngle), sin(uAngle));
    float gradientPos = dot((vTextureCoord - 0.5) * max(uScale, 0.001), direction);
    gradientPos = gradientPos + 0.5 + uOffset + iTime * uFlowSpeed;
    gradientPos = clamp(gradientPos, 0.0, 1.0);

    vec3 gradientColor = mix(uColorA, uColorB, gradientPos);
    vec3 tinted = texColor.rgb * gradientColor;
    vec3 finalColor = mix(texColor.rgb, tinted, clamp(uBlendStrength, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, texColor.a);
}`,
    uniforms: [
      { name: 'uColorA', type: 'vec3', value: [1.0, 0.5, 0.2] },
      { name: 'uColorB', type: 'vec3', value: [0.3, 0.6, 1.0] },
      { name: 'uBlendStrength', type: 'float', value: 0.85, min: 0.0, max: 1.0 },
      { name: 'uAngle', type: 'float', value: 1.57, min: 0.0, max: 6.28 },
      { name: 'uScale', type: 'float', value: 1.0, min: 0.1, max: 4.0 },
      { name: 'uOffset', type: 'float', value: 0.0, min: -1.0, max: 1.0 },
      { name: 'uFlowSpeed', type: 'float', value: 0.0, min: -1.0, max: 1.0 },
      { name: 'iTime', type: 'float', value: 0.0, min: 0.0, max: 10.0 }
    ]
  },
  {
    name: 'softBlur',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uBlurStep;
uniform float uBlurStrength;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    vec2 stepOffset = max(uBlurStep * uBlurStrength, vec2(0.0));

    vec4 blurColor = texColor * 4.0;
    blurColor += texture2D(uSampler, vTextureCoord + vec2(stepOffset.x, 0.0)) * 2.0;
    blurColor += texture2D(uSampler, vTextureCoord - vec2(stepOffset.x, 0.0)) * 2.0;
    blurColor += texture2D(uSampler, vTextureCoord + vec2(0.0, stepOffset.y)) * 2.0;
    blurColor += texture2D(uSampler, vTextureCoord - vec2(0.0, stepOffset.y)) * 2.0;
    blurColor += texture2D(uSampler, vTextureCoord + stepOffset);
    blurColor += texture2D(uSampler, vTextureCoord - stepOffset);
    blurColor += texture2D(uSampler, vTextureCoord + vec2(stepOffset.x, -stepOffset.y));
    blurColor += texture2D(uSampler, vTextureCoord + vec2(-stepOffset.x, stepOffset.y));

    gl_FragColor = blurColor / 16.0;
}`,
    uniforms: [
      { name: 'uBlurStep', type: 'vec2', value: [0.003, 0.003] },
      { name: 'uBlurStrength', type: 'float', value: 1.0, min: 0.0, max: 4.0 }
    ]
  },
  {
    name: 'mosaic',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform vec2 uBlockSize;
uniform float uBlendStrength;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    vec2 block = max(uBlockSize, vec2(0.001));
    vec2 mosaicCoord = floor(vTextureCoord / block) * block + block * 0.5;
    mosaicCoord = clamp(mosaicCoord, 0.0, 1.0);

    vec4 mosaicColor = texture2D(uSampler, mosaicCoord);
    gl_FragColor = mix(texColor, mosaicColor, clamp(uBlendStrength, 0.0, 1.0));
}`,
    uniforms: [
      { name: 'uBlockSize', type: 'vec2', value: [0.03, 0.03] },
      { name: 'uBlendStrength', type: 'float', value: 1.0, min: 0.0, max: 1.0 }
    ]
  },
  {
    name: 'posterize',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uLevels;
uniform float uBlendStrength;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    float levels = max(uLevels, 2.0);
    vec3 posterColor = floor(texColor.rgb * (levels - 1.0) + 0.5) / (levels - 1.0);
    vec3 finalColor = mix(texColor.rgb, posterColor, clamp(uBlendStrength, 0.0, 1.0));

    gl_FragColor = vec4(finalColor, texColor.a);
}`,
    uniforms: [
      { name: 'uLevels', type: 'float', value: 5.0, min: 2.0, max: 12.0 },
      { name: 'uBlendStrength', type: 'float', value: 1.0, min: 0.0, max: 1.0 }
    ]
  }
])

// 方法
const addUniform = () => {
  uniforms.value.push({
    name: `uCustom${uniforms.value.length}`,
    type: 'float',
    value: 0.0,
    min: 0,
    max: 1
  })
}

const getVectorValue = (value: number | number[] | undefined, size: number) => {
  const source = Array.isArray(value) ? value : typeof value === 'number' ? [value] : []
  return Array.from({ length: size }, (_, index) => {
    return typeof source[index] === 'number' ? source[index] : 0
  })
}

const handleUniformTypeChange = (uniform: ShaderUniform) => {
  if (uniform.type === 'float') {
    uniform.value = Array.isArray(uniform.value) ? uniform.value[0] ?? 0 : uniform.value ?? 0
    uniform.min ??= 0
    uniform.max ??= 1
    return
  }

  if (uniform.type === 'vec2') {
    uniform.value = getVectorValue(uniform.value, 2)
    return
  }

  if (uniform.type === 'vec3') {
    uniform.value = getVectorValue(uniform.value, 3)
    return
  }

  uniform.value = getVectorValue(uniform.value, 4)
}

const getPresetLabel = (presetName: string) => {
  return t(`shaderEditor.presets.${presetName}`)
}

const shaderPresetOptions = computed<DropdownOption[]>(() => {
  return [
    { label: t('shaderEditor.selectPreset'), value: -1 },
    ...shaderPresets.value.map((preset, index) => ({
      label: getPresetLabel(preset.name),
      value: index,
    })),
  ]
})

const selectedPresetIndex = computed({
  get() {
    const presetIndex = shaderPresets.value.findIndex((preset) => preset.name === selectedPreset.value)
    return presetIndex >= 0 ? presetIndex + 1 : 0
  },
  set(index: number) {
    if (index <= 0) {
      selectedPreset.value = ''
      return
    }

    selectedPreset.value = shaderPresets.value[index - 1]?.name || ''
    onPresetChange()
  },
})

const getUniformTypeIndex = (type: ShaderUniform['type']) => {
  return uniformTypeOptions.findIndex((option) => option.value === type)
}

const handleUniformTypeDropdownChange = (uniform: ShaderUniform, index: number) => {
  const nextType = uniformTypeOptions[index]?.value as ShaderUniform['type'] | undefined
  if (!nextType) {
    return
  }

  uniform.type = nextType
  handleUniformTypeChange(uniform)
}

const removeUniform = (index: number) => {
  uniforms.value.splice(index, 1)
}

const onPresetChange = () => {
  const preset = shaderPresets.value.find(p => p.name === selectedPreset.value)
  if (preset) {
    fragmentShader.value = preset.fragmentShader
    uniforms.value = JSON.parse(JSON.stringify(preset.uniforms))
  }
}

const loadPreset = () => {
  if (selectedPreset.value) {
    onPresetChange()
  }
}

const applyShader = () => {
  if (!fragmentShader.value.trim()) {
    return
  }

  // 构建uniform对象
  const uniformsObj: Record<string, any> = {}
  uniforms.value.forEach(uniform => {
    uniformsObj[uniform.name] = uniform.value
  })

  // 发送符合ProjectView期望格式的数据
  const shaderData = {
    name: selectedPreset.value || 'Custom Shader',
    fragmentShader: fragmentShader.value,
    uniforms: uniformsObj
  }

  emit('applyShader', shaderData)
}

const resetShader = () => {
  fragmentShader.value = ''
  uniforms.value = []
  selectedPreset.value = ''
  emit('resetShader')
}

// 状态恢复方法
const restoreState = (state: { selectedPreset: string; fragmentShader: string; uniforms: any[] }) => {
  selectedPreset.value = state.selectedPreset
  fragmentShader.value = state.fragmentShader
  uniforms.value = state.uniforms
}

// 暴露方法给父组件
defineExpose({
  selectedPreset,
  fragmentShader,
  uniforms,
  restoreState
})

// 实时预览
watch([fragmentShader, uniforms], () => {
  if (realTimePreview.value) {
    applyShader()
  }
}, { deep: true })

// 改进的动画时间更新
let animationId: number | null = null
let startTime: number = Date.now()

const updateAnimationTime = () => {
  if (enableAnimation.value) {
    const currentTime = Date.now()
    const elapsedTime = (currentTime - startTime) / 1000
    
    // 查找时间相关的 uniform
    const timeUniform = uniforms.value.find(u => u.name === 'iTime' || u.name === 'uTime')
    if (timeUniform && typeof timeUniform.value === 'number') {
      timeUniform.value = elapsedTime % 10 // 0-10秒循环
    }
    
    // 实时更新预览
    if (realTimePreview.value) {
      applyShader()
    }
    
    animationId = requestAnimationFrame(updateAnimationTime)
  }
}

watch(enableAnimation, (enabled) => {
  if (enabled) {
    startTime = Date.now() // 重置开始时间
    updateAnimationTime()
  } else if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

// 监听预设变化，重置动画时间
watch(selectedPreset, () => {
  if (enableAnimation.value) {
    startTime = Date.now()
  }
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
})

onMounted(() => {
  // 默认加载第一个预设
  if (shaderPresets.value.length > 0) {
    selectedPreset.value = shaderPresets.value[0].name
    onPresetChange()
  }
})
</script>

<style scoped>
.shader-editor {
  height: 100%;
  padding: 12px;
  color: var(--floating-panel-text);
  overflow-y: auto;
  overflow-x: hidden;
}

.editor-toolbar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  margin-bottom: 10px;
}

.toolbar-block {
  flex: 1;
}

.toolbar-actions,
.preset-toolbar,
.editor-switches,
.surface-header,
.uniform-header,
.uniform-body {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-actions {
  justify-content: flex-end;
}

.btn {
  appearance: none;
  padding: 8px 12px;
  border: 1px solid var(--floating-panel-border);
  border-radius: 7px;
  background: var(--floating-panel-subtle-bg);
  color: var(--floating-panel-text);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.btn:hover {
  background: var(--floating-panel-subtle-hover-bg);
  border-color: var(--floating-panel-input-border-focus);
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--floating-panel-accent-bg);
  color: var(--floating-panel-text);
  border-color: var(--floating-panel-accent-border);
}

.btn-primary:hover {
  background: var(--floating-panel-subtle-hover-bg);
  border-color: var(--accent-color);
}

.btn-secondary {
  background: var(--floating-panel-input-bg);
}

.btn-danger {
  background: var(--floating-panel-danger-bg);
  border-color: var(--floating-panel-danger-border);
  color: var(--floating-panel-danger-text);
}

.btn-small {
  padding: 6px 10px;
  font-size: 11px;
}

.editor-section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--floating-panel-soft-text);
  margin-bottom: 6px;
}

.editor-switches {
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.switch-chip {
  appearance: none;
  padding: 7px 12px;
  border: 1px solid var(--floating-panel-border);
  border-radius: 999px;
  background: var(--floating-panel-input-bg);
  color: var(--floating-panel-text);
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.switch-chip:hover {
  background: var(--floating-panel-subtle-hover-bg);
  border-color: var(--floating-panel-input-border-focus);
}

.switch-chip.active {
  background: var(--floating-panel-accent-bg);
  border-color: var(--floating-panel-accent-border);
  color: var(--floating-panel-text);
}

.animation-hint {
  color: var(--floating-panel-muted-text);
  font-size: 12px;
}

.shader-editor-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.editor-surface {
  background: var(--floating-panel-subtle-bg);
  border: 1px solid var(--floating-panel-divider);
  border-radius: 10px;
  padding: 12px;
  min-height: 0;
}

.surface-header {
  justify-content: space-between;
  margin-bottom: 12px;
}

.field-input {
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--floating-panel-input-border);
  border-radius: 7px;
  background: var(--floating-panel-input-bg);
  color: var(--floating-panel-text);
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.field-input:focus {
  border-color: var(--floating-panel-input-border-focus);
  background: var(--floating-panel-input-bg-focus);
}

.field-input::placeholder {
  color: var(--floating-panel-muted-text);
}

.preset-toolbar {
  flex-wrap: wrap;
  gap: 10px;
}

.preset-dropdown {
  flex: 1 1 220px;
  min-width: 0;
}

.preset-dropdown :deep(.dropdown-container),
.uniform-type-dropdown :deep(.dropdown-container) {
  width: 100%;
}

.preset-dropdown :deep(.dropdown),
.uniform-type-dropdown :deep(.dropdown) {
  min-height: 36px;
}

.shader-textarea {
  width: 100%;
  min-height: 220px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid var(--floating-panel-input-border);
  border-radius: 7px;
  padding: 12px;
  resize: vertical;
  background: var(--floating-panel-input-bg);
  color: var(--floating-panel-text);
  line-height: 1.55;
  overflow: auto;
}

.shader-textarea:focus {
  outline: none;
  border-color: var(--floating-panel-input-border-focus);
  background: var(--floating-panel-input-bg-focus);
}

.shader-textarea::placeholder {
  color: var(--floating-panel-muted-text);
}

.uniforms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 360px;
  overflow-y: auto;
  padding-right: 4px;
}

.uniform-item {
  padding: 8px;
  border: 1px solid var(--floating-panel-divider);
  border-radius: 8px;
  background: var(--floating-panel-subtle-bg);
}

.uniform-header {
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.uniform-name-input {
  flex: 1 1 150px;
}

.uniform-type-dropdown {
  flex: 0 1 110px;
  min-width: 110px;
}

.uniform-slider {
  flex: 1;
  accent-color: var(--accent-color);
}

.uniform-number-input {
  width: 80px;
}

.uniform-vec-input {
  min-width: 0;
  flex: 1 1 72px;
}

.uniform-body {
  flex-wrap: wrap;
  align-items: stretch;
}

.field-range {
  min-width: 120px;
}

.uniform-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  border: 1px dashed var(--floating-panel-divider);
  border-radius: 10px;
  background: var(--floating-panel-subtle-bg);
  color: var(--floating-panel-muted-text);
  font-size: 12px;
}

.shader-editor::-webkit-scrollbar,
.shader-textarea::-webkit-scrollbar,
.uniforms-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.shader-editor::-webkit-scrollbar-track,
.shader-textarea::-webkit-scrollbar-track,
.uniforms-list::-webkit-scrollbar-track {
  background: transparent;
}

.shader-editor::-webkit-scrollbar-thumb,
.shader-textarea::-webkit-scrollbar-thumb,
.uniforms-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: var(--floating-panel-scrollbar);
}

.shader-editor::-webkit-scrollbar-thumb:hover,
.shader-textarea::-webkit-scrollbar-thumb:hover,
.uniforms-list::-webkit-scrollbar-thumb:hover {
  background: var(--floating-panel-scrollbar-hover);
}

@media (min-width: 760px) {
  .shader-editor-layout {
    grid-template-columns: minmax(0, 1.05fr) minmax(240px, 0.95fr);
  }
}
</style>
