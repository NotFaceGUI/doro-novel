/**
 * 自动更新功能模块
 * 提供检查更新、下载更新、安装更新等功能
 */

import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

// 更新信息接口
export interface UpdateInfo {
  available: boolean;
  version?: string;
  date?: string;
  body?: string;
}

// 下载进度事件类型
export interface DownloadProgressEvent {
  event: 'Started' | 'Progress' | 'Finished';
  data?: {
    contentLength?: number;
    chunkLength?: number;
  };
}

// 更新回调接口
export interface UpdateCallbacks {
  onDownloadProgress?: (progress: DownloadProgressEvent) => void;
  onUpdateComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * 检查是否有可用更新
 * @returns Promise<UpdateInfo> 更新信息
 */
export async function checkForUpdates(): Promise<UpdateInfo> {
  try {
    const update = await check();
    
    if (update) {
      return {
        available: true,
        version: update.version,
        date: update.date,
        body: update.body
      };
    } else {
      return {
        available: false
      };
    }
  } catch (error) {
    console.error('检查更新失败:', error);
    throw new Error(`检查更新失败: ${error}`);
  }
}

/**
 * 手动触发更新
 * @param callbacks 更新过程中的回调函数
 */
export async function manualUpdate(callbacks?: UpdateCallbacks): Promise<void> {
  try {
    const update = await check();
    
    if (!update) {
      throw new Error('没有可用的更新');
    }

    // 开始下载
    callbacks?.onDownloadProgress?.({
      event: 'Started',
      data: { contentLength: 0 }
    });

    // 下载并安装更新
    await update.downloadAndInstall((event) => {
      callbacks?.onDownloadProgress?.(event);
    });

    // 更新完成
    callbacks?.onUpdateComplete?.();
    
  } catch (error) {
    console.error('更新失败:', error);
    const errorMessage = error instanceof Error ? error.message : '更新失败';
    callbacks?.onError?.(errorMessage);
    throw error;
  }
}

/**
 * 重启应用
 */
export async function restartApp(): Promise<void> {
  try {
    await relaunch();
  } catch (error) {
    console.error('重启应用失败:', error);
    throw new Error('重启应用失败');
  }
}