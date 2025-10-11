import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export interface WatermarkSettings {
  enabled: boolean;
  text: string;
  fontSize: number; // px
  color: string; // hex or rgba
  opacity: number; // 0-1
  angle: number; // degrees
  spacingX: number; // px
  spacingY: number; // px
  offsetX: number; // px
  offsetY: number; // px
  placement: 'tiled' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

const LOCAL_WATERMARK_KEY = 'doro_watermark_settings';

export const useWatermarkStore = defineStore('watermark', () => {
  const settings = ref<WatermarkSettings>({
    enabled: true,
    text: '由 @author 使用 Doro Novel 创作',
    fontSize: 18,
    color: '#DDDDDD55', // 灰色带透明度的水印颜色
    opacity: 1,
    angle: 0,
    spacingX: 220,
    spacingY: 180,
    offsetX: 10,
    offsetY: 5,
    placement: 'bottom-right',
  });

  const initialize = () => {
    try {
      const raw = localStorage.getItem(LOCAL_WATERMARK_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        settings.value = { ...settings.value, ...data };
        // 迁移旧数据：如果没有 placement 字段，默认设置为 'tiled'
        if (!('placement' in settings.value)) {
          (settings.value as WatermarkSettings).placement = 'tiled';
        }
      }
    } catch (_) {
      // ignore
    }
  };

  const update = (next: Partial<WatermarkSettings>) => {
    settings.value = { ...settings.value, ...next };
    try {
      localStorage.setItem(LOCAL_WATERMARK_KEY, JSON.stringify(settings.value));
    } catch (_) {
      // ignore
    }
  };

  const svgDataUrl = computed(() => {
    const s = settings.value;
    const fontSize = s.fontSize;
    const fill = s.color;
    const opacity = s.opacity;
    const angle = s.angle;
    const spacingX = Math.max(40, s.spacingX);
    const spacingY = Math.max(40, s.spacingY);
    const offsetX = s.offsetX;
    const offsetY = s.offsetY;

    // Build an SVG that tiles the watermark text at the given angle
    const svg = `
      <svg xmlns='http://www.w3.org/2000/svg' width='${spacingX}' height='${spacingY}'>
        <defs>
          <style>
            .wm { font-family: Arial, Helvetica, sans-serif; font-size: ${fontSize}px; fill: ${fill}; opacity: ${opacity}; }
          </style>
        </defs>
        <g transform='translate(${offsetX},${offsetY}) rotate(${angle} ${spacingX/2} ${spacingY/2})'>
          <text x='${spacingX/2}' y='${spacingY/2}' text-anchor='middle' dominant-baseline='central' class='wm'>${s.text}</text>
        </g>
      </svg>
    `;

    const encoded = encodeURIComponent(svg)
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
    return `url("data:image/svg+xml;charset=UTF-8,${encoded}")`;
  });

  return {
    settings,
    initialize,
    update,
    svgDataUrl,
  };
});