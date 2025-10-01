<template>
  <div class="shader-editor">
    <div class="shader-editor-header">
      <h3>Shader 特效编辑器【测试版本做着玩的】</h3>
      <div class="shader-controls">
        <button @click="applyShader" class="btn btn-primary">
          应用效果
        </button>
        <button @click="resetShader" class="btn btn-secondary">
          重置
        </button>
        <button @click="loadPreset" class="btn btn-secondary">
          加载预设
        </button>
      </div>
    </div>

    <div class="shader-editor-content">
      <!-- 预设选择 -->
      <div class="preset-section">
        <select v-model="selectedPreset" @change="onPresetChange" class="preset-select">
          <option value="">选择预设效果</option>
          <option
            v-for="preset in shaderPresets"
            :key="preset.name"
            :value="preset.name"
          >
            {{ preset.label }}
          </option>
        </select>
      </div>

      <!-- Shader代码编辑器 -->
      <div class="code-editor">
        <div class="editor-label">Fragment Shader:</div>
        <textarea
          v-model="fragmentShader"
          class="shader-textarea"
          placeholder="输入片段着色器代码..."
          rows="15"
        ></textarea>
      </div>

      <!-- Uniform参数控制 -->
      <div class="uniforms-section">
        <div class="uniforms-header">
          <span>Uniform 参数</span>
          <button @click="addUniform" class="btn btn-small">
            + 添加参数
          </button>
        </div>
        
        <div class="uniforms-list">
          <div
            v-for="(uniform, index) in uniforms"
            :key="index"
            class="uniform-item"
          >
            <div class="uniform-controls">
              <input
                v-model="uniform.name"
                placeholder="参数名"
                class="uniform-name-input"
              />
              <select
                v-model="uniform.type"
                class="uniform-type-select"
              >
                <option value="float">float</option>
                <option value="vec2">vec2</option>
                <option value="vec3">vec3</option>
                <option value="vec4">vec4</option>
              </select>
              
              <!-- 根据类型显示不同的输入控件 -->
              <template v-if="uniform.type === 'float'">
                <input
                  type="range"
                  v-model.number="uniform.value"
                  :min="uniform.min || 0"
                  :max="uniform.max || 1"
                  :step="0.01"
                  class="uniform-slider"
                />
                <input
                  type="number"
                  v-model.number="uniform.value"
                  :step="0.01"
                  class="uniform-number-input"
                />
              </template>
              
              <template v-else-if="uniform.type === 'vec2'">
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[0]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[1]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
              </template>
              
              <template v-else-if="uniform.type === 'vec3'">
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[0]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[1]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[2]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
              </template>
              
              <template v-else-if="uniform.type === 'vec4'">
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[0]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[1]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[2]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
                <input
                  type="number"
                  v-model.number="(uniform.value as number[])[3]"
                  :step="0.1"
                  class="uniform-vec-input"
                />
              </template>
              
              <button
                @click="removeUniform(index)"
                class="btn btn-danger btn-small"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 实时预览控制 -->
      <div class="preview-controls">
        <label class="checkbox-label">
          <input type="checkbox" v-model="realTimePreview" />
          实时预览
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="enableAnimation" />
          启用动画
          <span class="animation-hint" v-if="enableAnimation">
            {{ selectedPreset === 'dissolve' ? '溶解动画已启用' : '时间动画已启用' }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

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
  label: string
  fragmentShader: string
  uniforms: ShaderUniform[]
}

const emit = defineEmits<{
  applyShader: [shaderData: { name: string; fragmentShader: string; uniforms: Record<string, any> }]
  resetShader: []
}>()

// 响应式数据
const selectedPreset = ref<string>('')
const fragmentShader = ref<string>('')
const uniforms = ref<ShaderUniform[]>([])
const realTimePreview = ref<boolean>(false)
const enableAnimation = ref<boolean>(false)

// Shader预设
const shaderPresets = ref<ShaderPreset[]>([
  {
    name: 'glow',
    label: '发光效果',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uGlowIntensity;
uniform vec3 uGlowColor;
uniform float iTime;

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    
    // 创建发光效果
    float glow = sin(iTime * 2.0) * 0.5 + 0.5;
    vec3 glowEffect = uGlowColor * uGlowIntensity * glow;
    
    // 混合原色和发光效果
    vec3 finalColor = texColor.rgb + glowEffect * texColor.a;
    
    gl_FragColor = vec4(finalColor, texColor.a);
}`,
    uniforms: [
      { name: 'uGlowIntensity', type: 'float', value: 0.5, min: 0, max: 2 },
      { name: 'uGlowColor', type: 'vec3', value: [1.0, 0.5, 0.0] },
      { name: 'iTime', type: 'float', value: 0, min: 0, max: 10 }
    ]
  },
  {
    name: 'wave',
    label: '波浪扭曲',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uWaveAmplitude;
uniform float uWaveFrequency;
uniform float iTime;

void main() {
    vec2 coord = vTextureCoord;
    
    // 创建波浪扭曲效果
    coord.x += sin(coord.y * uWaveFrequency + iTime) * uWaveAmplitude;
    coord.y += cos(coord.x * uWaveFrequency + iTime) * uWaveAmplitude * 0.5;
    
    vec4 texColor = texture2D(uSampler, coord);
    gl_FragColor = texColor;
}`,
    uniforms: [
      { name: 'uWaveAmplitude', type: 'float', value: 0.02, min: 0, max: 0.1 },
      { name: 'uWaveFrequency', type: 'float', value: 10.0, min: 1, max: 50 },
      { name: 'iTime', type: 'float', value: 0, min: 0, max: 10 }
    ]
  },
  {
    name: 'colorShift',
    label: '颜色偏移',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uHueShift;
uniform float uSaturation;
uniform float uBrightness;

vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    
    vec3 hsv = rgb2hsv(texColor.rgb);
    hsv.x += uHueShift;
    hsv.y *= uSaturation;
    hsv.z *= uBrightness;
    
    vec3 rgb = hsv2rgb(hsv);
    gl_FragColor = vec4(rgb, texColor.a);
}`,
    uniforms: [
      { name: 'uHueShift', type: 'float', value: 0.0, min: -1, max: 1 },
      { name: 'uSaturation', type: 'float', value: 1.0, min: 0, max: 2 },
      { name: 'uBrightness', type: 'float', value: 1.0, min: 0, max: 2 }
    ]
  },
  {
    name: 'dissolve',
    label: '溶解效果',
    fragmentShader: `precision mediump float;
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform float uDissolveAmount;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;
uniform float uNoiseScale;

// 改进的噪声函数，创建更自然的溶解模式
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// 分形噪声，创建更复杂的溶解模式
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    vec4 texColor = texture2D(uSampler, vTextureCoord);
    
    // 使用分形噪声创建更自然的溶解模式
    vec2 noiseCoord = vTextureCoord * uNoiseScale;
    float dissolveNoise = fbm(noiseCoord);
    
    // 创建溶解遮罩
    float dissolveMask = step(uDissolveAmount, dissolveNoise);
    
    // 创建边缘效果
    float edgeMask = smoothstep(uDissolveAmount - uEdgeWidth, uDissolveAmount, dissolveNoise);
    float edge = edgeMask * (1.0 - dissolveMask);
    
    // 混合颜色
    vec3 finalColor = mix(mix(texColor.rgb, uEdgeColor, edge), texColor.rgb, dissolveMask);
    float finalAlpha = texColor.a * (dissolveMask + edge);
    
    gl_FragColor = vec4(finalColor, finalAlpha);
}`,
    uniforms: [
      { name: 'uDissolveAmount', type: 'float', value: 0.0, min: 0, max: 1 },
      { name: 'uEdgeWidth', type: 'float', value: 0.05, min: 0, max: 0.2 },
      { name: 'uEdgeColor', type: 'vec3', value: [1.0, 0.3, 0.0] },
      { name: 'uNoiseScale', type: 'float', value: 8.0, min: 1, max: 20 }
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
    
    // 为溶解效果添加自动动画
    if (selectedPreset.value === 'dissolve') {
      const dissolveUniform = uniforms.value.find(u => u.name === 'uDissolveAmount')
      if (dissolveUniform && typeof dissolveUniform.value === 'number') {
        dissolveUniform.value = (Math.sin(elapsedTime * 0.5) + 1) * 0.5 // 0-1之间的正弦波动
      }
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
  background: var(--primary-bg);
  border-radius: var(--border-radius);
  padding: 16px;
  color: var(--text-color);
}

.shader-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.shader-editor-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.shader-controls {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--secondary-bg);
  color: var(--text-color);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn:hover {
  background: var(--high-hover-bg);
}

.btn-primary {
  background: var(--button-bg);
  color: var(--text-color);
  border-color: var(--button-bg);
}

.btn-primary:hover {
  background: var(--button-hover-bg);
}

.btn-secondary {
  background: var(--high-bg);
  color: var(--text-color);
  border-color: var(--main-border-color);
}

.btn-secondary:hover {
  background: var(--high-hover-bg);
}

.btn-danger {
  background: var(--error-color);
  color: var(--text-color);
  border-color: var(--error-color);
}

.btn-danger:hover {
  background: #b84a3e;
}

.btn-small {
  padding: 4px 8px;
  font-size: 11px;
}

.shader-editor-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preset-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preset-select {
  padding: 6px 12px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  color: var(--text-color);
  min-width: 200px;
}

.preset-select:focus {
  outline: none;
  border-color: var(--button-bg);
}

.code-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.editor-label {
  font-weight: bold;
  color: var(--sec-text-color);
  font-size: 14px;
}

.shader-textarea {
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  padding: 8px;
  resize: vertical;
  background: var(--input-bg);
  color: var(--text-color);
  min-height: 200px;
}

.shader-textarea:focus {
  outline: none;
  border-color: var(--button-bg);
}

.shader-textarea::placeholder {
  color: var(--placeholder-color);
}

.uniforms-section {
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  padding: 12px;
  background: var(--secondary-bg);
}

.uniforms-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: bold;
  color: var(--sec-text-color);
}

.uniforms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.uniform-item {
  padding: 8px;
  border: 1px solid var(--deep-border-color);
  border-radius: var(--border-radius);
  background: var(--high-bg);
}

.uniform-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.uniform-name-input {
  width: 120px;
  padding: 4px 8px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  color: var(--text-color);
}

.uniform-name-input:focus {
  outline: none;
  border-color: var(--button-bg);
}

.uniform-type-select {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  color: var(--text-color);
}

.uniform-type-select:focus {
  outline: none;
  border-color: var(--button-bg);
}

.uniform-slider {
  width: 150px;
  accent-color: var(--button-bg);
}

.uniform-number-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  color: var(--text-color);
}

.uniform-number-input:focus {
  outline: none;
  border-color: var(--button-bg);
}

.uniform-vec-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid var(--main-border-color);
  border-radius: var(--border-radius);
  background: var(--input-bg);
  color: var(--text-color);
}

.uniform-vec-input:focus {
  outline: none;
  border-color: var(--button-bg);
}

.preview-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-color);
}

.checkbox-label input[type="checkbox"] {
  margin: 0;
  accent-color: var(--button-bg);
}

.animation-hint {
  font-size: 12px;
  color: var(--accent-color);
  margin-left: 8px;
  font-style: italic;
}
</style>