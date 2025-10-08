import { defineStore } from 'pinia'
import { ref } from 'vue'
import CanvasManager from '../script/render/canvas-manager'

export interface ViewportState {
  x: number
  y: number
  zoom: number
}

export const useViewportStore = defineStore('viewport', () => {
  // 获取viewport实例
  const canvasManager = CanvasManager.getInstance()
  const viewport = canvasManager.viewport

  // 存储viewport的属性作为常量
  const viewportState = ref<ViewportState>({
    x: viewport.center.x,
    y: viewport.center.y,
    zoom: viewport.scale.x
  })

  // 获取viewport状态
  const getViewportState = () => viewportState.value

  // 更新viewport状态（如果需要的话）
  const updateViewportState = (newState: Partial<ViewportState>) => {
    if (newState.x !== undefined) viewportState.value.x = newState.x
    if (newState.y !== undefined) viewportState.value.y = newState.y
    if (newState.zoom !== undefined) viewportState.value.zoom = newState.zoom
  }

  return {
    viewportState,
    getViewportState,
    updateViewportState
  }
})