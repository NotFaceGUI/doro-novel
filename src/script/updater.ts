import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process'

export interface UpdateProgress {
  event: 'Started' | 'Progress' | 'Finished';
  data?: {
    contentLength?: number;
    chunkLength?: number;
  };
}

export interface UpdateInfo {
  version: string;
  date: string;
  body: string;
  available: boolean;
}

export interface UpdateCallbacks {
  onUpdateAvailable?: (info: UpdateInfo) => void;
  onDownloadProgress?: (progress: UpdateProgress) => void;
  onUpdateComplete?: () => void;
  onError?: (error: string) => void;
  onNoUpdate?: () => void;
}

/**
 * 检查并处理应用更新
 * @param callbacks 更新过程中的回调函数
 * @param autoInstall 是否自动安装更新，默认为 false
 */
export const checkForUpdates = async (
  callbacks?: UpdateCallbacks,
  autoInstall: boolean = false
): Promise<void> => {
  try {
    console.log('正在检查更新...');
    const update = await check();

    if (update) {
      const updateInfo: UpdateInfo = {
        version: update.version,
        date: update.date || new Date().toISOString(),
        body: update.body || '暂无更新说明',
        available: true
      };

      console.log(`发现更新 ${updateInfo.version}，发布时间：${updateInfo.date}`);
      console.log(`更新说明：${updateInfo.body}`);

      // 通知有更新可用
      callbacks?.onUpdateAvailable?.(updateInfo);

      if (autoInstall) {
        await downloadAndInstallUpdate(update, callbacks);
      }
    } else {
      console.log('当前已是最新版本');
      callbacks?.onNoUpdate?.();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '检查更新时发生未知错误';
    console.error('检查更新失败:', errorMessage);
    callbacks?.onError?.(errorMessage);
  }
};

/**
 * 下载并安装更新
 * @param update 更新对象
 * @param callbacks 回调函数
 */
const downloadAndInstallUpdate = async (
  update: any,
  callbacks?: UpdateCallbacks
): Promise<void> => {
  try {
    let downloaded = 0;
    let contentLength = 0;

    console.log('开始下载更新...');

    await update.downloadAndInstall((event: UpdateProgress) => {
      callbacks?.onDownloadProgress?.(event);

      switch (event.event) {
        case 'Started':
          contentLength = event.data?.contentLength || 0;
          console.log(`开始下载，总大小：${contentLength} 字节`);
          break;
        case 'Progress':
          downloaded += event.data?.chunkLength || 0;
          const progress = contentLength > 0 ? (downloaded / contentLength * 100).toFixed(1) : '0';
          console.log(`下载进度：${downloaded}/${contentLength} 字节 (${progress}%)`);
          break;
        case 'Finished':
          console.log('下载完成');
          break;
      }
    });

    console.log('更新安装完成');
    callbacks?.onUpdateComplete?.();

    // 询问用户是否重启应用
    const shouldRestart = confirm('更新已安装完成，是否立即重启应用以应用更新？');
    if (shouldRestart) {
      console.log('正在重启应用...');
      await relaunch();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '下载或安装更新时发生未知错误';
    console.error('更新失败:', errorMessage);
    callbacks?.onError?.(errorMessage);
  }
};

/**
 * 手动触发更新检查和安装
 * @param callbacks 回调函数
 */
export const manualUpdate = async (callbacks?: UpdateCallbacks): Promise<void> => {
  await checkForUpdates(callbacks, true);
};

/**
 * 仅检查更新，不自动安装
 * @param callbacks 回调函数
 */
export const checkUpdateOnly = async (callbacks?: UpdateCallbacks): Promise<UpdateInfo | null> => {
  try {
    const update = await check();
    
    if (update) {
      const updateInfo: UpdateInfo = {
        version: update.version,
        date: update.date || new Date().toISOString(),
        body: update.body || '暂无更新说明',
        available: true
      };
      
      callbacks?.onUpdateAvailable?.(updateInfo);
      return updateInfo;
    } else {
      callbacks?.onNoUpdate?.();
      return null;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '检查更新时发生未知错误';
    callbacks?.onError?.(errorMessage);
    throw error;
  }
};

/**
 * 应用启动时自动检查更新（静默检查）
 */
export const initAutoUpdateCheck = (): void => {
  // 延迟5秒后检查更新，避免影响应用启动速度
  setTimeout(() => {
    checkForUpdates({
      onUpdateAvailable: (info) => {
        console.log('发现新版本:', info.version);
        // 这里可以显示一个非侵入式的通知
        // 比如在应用的某个角落显示一个小提示
      },
      onError: (error) => {
        console.warn('自动检查更新失败:', error);
        // 静默处理错误，不打扰用户
      },
      onNoUpdate: () => {
        console.log('当前已是最新版本');
      }
    });
  }, 5000);
};