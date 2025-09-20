import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { 
  checkForUpdates, 
  manualUpdate,
  type UpdateInfo,
  type UpdateCallbacks 
} from '../script/updater';

export function useUpdater() {
  const { t } = useI18n();
  
  // 状态管理
  const isChecking = ref(false);
  const updateInfo = ref<UpdateInfo | null>(null);
  const showUpdateDialog = ref(false);
  const lastCheckTime = ref<Date | null>(null);
  const autoCheckEnabled = ref(true);
  const checkInterval = ref<number | null>(null);

  // 检查更新
  const checkUpdate = async (silent = false) => {
    if (isChecking.value) return;
    
    isChecking.value = true;
    
    try {
      const result = await checkForUpdates();
      
      console.log('检查更新结果:', result);
      updateInfo.value = result;
      lastCheckTime.value = new Date();
      
      if (result.available && !silent) {
        showUpdateDialog.value = true;
      }
      
      return result;
    } catch (error) {
      console.error('检查更新失败:', error);
      if (!silent) {
        // 可以在这里显示错误提示
        throw error;
      }
    } finally {
      isChecking.value = false;
    }
  };

  // 手动检查更新
  const manualCheck = () => checkUpdate(false);

  // 静默检查更新
  const silentCheck = () => checkUpdate(true);

  // 开始自动检查
  const startAutoCheck = (intervalMinutes = 60) => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value);
    }
    
    checkInterval.value = window.setInterval(() => {
      if (autoCheckEnabled.value) {
        silentCheck();
      }
    }, intervalMinutes * 60 * 1000);
  };

  // 停止自动检查
  const stopAutoCheck = () => {
    if (checkInterval.value) {
      clearInterval(checkInterval.value);
      checkInterval.value = null;
    }
  };

  // 启用/禁用自动检查
  const toggleAutoCheck = (enabled: boolean) => {
    autoCheckEnabled.value = enabled;
    if (enabled && !checkInterval.value) {
      startAutoCheck();
    } else if (!enabled) {
      stopAutoCheck();
    }
  };

  // 显示更新对话框
  const showUpdate = () => {
    if (updateInfo.value?.available) {
      showUpdateDialog.value = true;
    }
  };

  // 隐藏更新对话框
  const hideUpdate = () => {
    showUpdateDialog.value = false;
  };

  // 执行更新
  const performUpdate = async (callbacks?: UpdateCallbacks) => {
    if (!updateInfo.value?.available) {
      throw new Error('没有可用的更新');
    }

    try {
      await manualUpdate(callbacks);
    } catch (error) {
      console.error('更新失败:', error);
      throw error;
    }
  };

  // 获取更新状态文本
  const getUpdateStatusText = () => {
    if (isChecking.value) {
      return t('update.checkingUpdate');
    }
    
    if (updateInfo.value?.available) {
      return t('update.updateAvailable', { version: updateInfo.value.version });
    }
    
    if (lastCheckTime.value) {
      return t('update.noUpdate');
    }
    
    return '';
  };

  // 格式化最后检查时间
  const getLastCheckTimeText = () => {
    if (!lastCheckTime.value) return '';
    
    const now = new Date();
    const diff = now.getTime() - lastCheckTime.value.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) {
      return '刚刚检查';
    } else if (minutes < 60) {
      return `${minutes} 分钟前检查`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours} 小时前检查`;
    }
  };

  // 组件挂载时的初始化
  onMounted(() => {
    // 启动时进行一次静默检查
    setTimeout(() => {
      silentCheck();
    }, 5000); // 延迟5秒，避免影响应用启动

    // 开始自动检查（每小时一次）
    startAutoCheck(60);
  });

  // 清理函数
  const cleanup = () => {
    stopAutoCheck();
  };

  return {
    // 状态
    isChecking,
    updateInfo,
    showUpdateDialog,
    lastCheckTime,
    autoCheckEnabled,
    
    // 方法
    checkUpdate,
    manualCheck,
    silentCheck,
    startAutoCheck,
    stopAutoCheck,
    toggleAutoCheck,
    showUpdate,
    hideUpdate,
    performUpdate,
    
    // 计算属性
    getUpdateStatusText,
    getLastCheckTimeText,
    
    // 清理
    cleanup
  };
}

// 全局更新管理器
let globalUpdater: ReturnType<typeof useUpdater> | null = null;

export function getGlobalUpdater() {
  if (!globalUpdater) {
    globalUpdater = useUpdater();
  }
  return globalUpdater;
}

export function initGlobalUpdater() {
  return getGlobalUpdater();
}