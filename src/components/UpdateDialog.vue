<template>
  <div v-if="showDialog" class="update-dialog-overlay" @click.self="closeDialog">
    <div class="update-dialog">
      <div class="dialog-header">
        <h3>{{ getDialogTitle() }}</h3>
        <button class="close-btn" @click="closeDialog" :disabled="isDownloading">×</button>
      </div>
      
      <div class="dialog-content">
        <!-- 更新信息 -->
        <div v-if="!isDownloading && !downloadCompleted" class="update-info">
          <p class="version-info">
            <strong>{{ $t('update.newVersion') }}:</strong> {{ updateInfo?.version }}
          </p>
          <p class="date-info">
            <strong>{{ $t('update.releaseDate') }}:</strong> {{ formatDate(updateInfo?.date) }}
          </p>
        </div>
        
        <!-- 发布说明 -->
        <div v-if="!isDownloading && !downloadCompleted" class="update-notes">
          <h4>{{ $t('update.releaseNotes') }}</h4>
          <div class="notes-content" v-html="formatReleaseNotes(updateInfo?.body)"></div>
        </div>
        
        <!-- 下载进度 -->
        <div v-if="isDownloading" class="download-progress">
          <div class="progress-info">
            <p class="progress-text">{{ $t('update.downloading') }}...</p>
            <p class="progress-percentage">{{ Math.round(downloadProgress) }}%</p>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: downloadProgress + '%' }"></div>
          </div>
          <div class="progress-details">
            <span class="download-speed">{{ formatBytes(downloadSpeed) }}/s</span>
            <span class="file-size">{{ formatBytes(downloadedBytes) }} / {{ formatBytes(totalBytes) }}</span>
          </div>
        </div>
        
        <!-- 下载完成确认 -->
        <div v-if="downloadCompleted" class="download-completed">
          <div class="completion-icon">✓</div>
          <h4>{{ $t('update.downloadCompleted') }}</h4>
          <p class="completion-message">{{ $t('update.readyToInstall') }}</p>
          <div class="install-options">
            <p>{{ $t('update.installPrompt') }}</p>
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <!-- 初始状态按钮 -->
        <template v-if="!isDownloading && !downloadCompleted">
          <button class="btn btn-secondary" @click="closeDialog">
            {{ $t('update.later') }}
          </button>
          <button class="btn btn-primary" @click="startUpdate">
            {{ $t('update.updateNow') }}
          </button>
        </template>
        
        <!-- 下载中按钮 -->
        <template v-if="isDownloading">
          <button class="btn btn-secondary" @click="cancelDownload">
            {{ $t('update.cancel') }}
          </button>
        </template>
        
        <!-- 下载完成按钮 -->
        <template v-if="downloadCompleted">
          <button class="btn btn-secondary" @click="installLater">
            {{ $t('update.installLater') }}
          </button>
          <button class="btn btn-primary" @click="installAndRestart">
            {{ $t('update.installAndRestart') }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { manualUpdate, restartApp, type UpdateInfo, type UpdateCallbacks } from '../script/updater';

const { t } = useI18n();

// Props
interface Props {
  updateInfo: UpdateInfo | null;
  showDialog: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  updateStarted: [];
  updateCompleted: [];
  updateError: [error: string];
}>();

// 状态管理
const isDownloading = ref(false);
const downloadCompleted = ref(false);
const downloadProgress = ref(0);
const downloadSpeed = ref(0);
const downloadedBytes = ref(0);
const totalBytes = ref(0);

// 计算属性
const getDialogTitle = () => {
  if (isDownloading.value) {
    return t('update.downloading');
  } else if (downloadCompleted.value) {
    return t('update.downloadCompleted');
  } else {
    return t('update.title');
  }
};

// Methods
const closeDialog = () => {
  if (!isDownloading.value) {
    resetState();
    emit('close');
  }
};

const resetState = () => {
  isDownloading.value = false;
  downloadCompleted.value = false;
  downloadProgress.value = 0;
  downloadSpeed.value = 0;
  downloadedBytes.value = 0;
  totalBytes.value = 0;
};

const startUpdate = async () => {
  if (!props.updateInfo) return;
  
  isDownloading.value = true;
  emit('updateStarted');
  
  const callbacks: UpdateCallbacks = {
    onDownloadProgress: (progress) => {
      if (progress.event === 'Started') {
        downloadProgress.value = 0;
        totalBytes.value = progress.data?.contentLength || 0;
        downloadedBytes.value = 0;
      } else if (progress.event === 'Progress') {
        const chunkLength = progress.data?.chunkLength || 0;
        downloadedBytes.value += chunkLength;
        
        if (totalBytes.value > 0) {
          downloadProgress.value = (downloadedBytes.value / totalBytes.value) * 100;
        }
        
        // 简单的下载速度计算（这里可以优化为更精确的计算）
        downloadSpeed.value = chunkLength;
      } else if (progress.event === 'Finished') {
        downloadProgress.value = 100;
      }
    },
    onUpdateComplete: () => {
      isDownloading.value = false;
      downloadCompleted.value = true;
      emit('updateCompleted');
    },
    onError: (error) => {
      isDownloading.value = false;
      console.error('更新失败:', error);
    }
  };
  
  try {
    await manualUpdate(callbacks);
  } catch (error) {
    isDownloading.value = false;
    const errorMessage = error instanceof Error ? error.message : '更新失败';
    console.error('更新失败:', errorMessage);
    emit('updateError', errorMessage);
  }
};

const cancelDownload = () => {
  // TODO: 实现取消下载逻辑
  resetState();
  emit('close');
};

const installLater = () => {
  resetState();
  emit('close');
};

const installAndRestart = async () => {
  try {
    console.log('开始安装并重启应用');
    await restartApp();
    resetState();
    emit('close');
  } catch (error) {
    console.error('安装失败:', error);
    emit('updateError', error instanceof Error ? error.message : '安装失败');
  }
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const formatReleaseNotes = (notes?: string) => {
  if (!notes) return '';
  
  // 将 Markdown 格式的发布说明转换为 HTML
  return notes
    .replace(/### (.*)/g, '<h4>$1</h4>')
    .replace(/## (.*)/g, '<h3>$1</h3>')
    .replace(/# (.*)/g, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/- (.*)/g, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>

<style scoped>
.update-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.update-dialog {
  background: var(--secondary-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid var(--high-hover-bg);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--high-hover-bg);
  background: var(--secondary-bg);
}

.dialog-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-color);
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.7;
}

.close-btn:hover:not(:disabled) {
  background: var(--high-hover-bg);
  opacity: 1;
}

.close-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.dialog-content {
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.update-info {
  margin-bottom: 16px;
}

.version-info,
.date-info {
  margin: 6px 0;
  color: var(--text-color);
  font-size: 14px;
}

.version-info strong,
.date-info strong {
  color: var(--text-color);
}

.update-notes {
  margin-bottom: 16px;
}

.update-notes h4 {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 600;
}

.notes-content {
  background: var(--primary-bg);
  border: 1px solid var(--high-hover-bg);
  border-radius: 6px;
  padding: 12px;
  color: var(--text-color);
  font-size: 13px;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
}

.notes-content :deep(h2),
.notes-content :deep(h3),
.notes-content :deep(h4) {
  color: var(--text-color);
  margin: 10px 0 6px 0;
}

.notes-content :deep(ul) {
  margin: 6px 0;
  padding-left: 16px;
}

.notes-content :deep(li) {
  margin: 3px 0;
}

.notes-content :deep(strong) {
  color: var(--text-color);
}

/* 下载进度样式 */
.download-progress {
  text-align: center;
  padding: 20px 0;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-text {
  margin: 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
}

.progress-percentage {
  margin: 0;
  color: var(--button-bg);
  font-size: 16px;
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--primary-bg);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
  border: 1px solid var(--high-hover-bg);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--button-bg), var(--button-hover-bg));
  border-radius: 3px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-color);
  opacity: 0.8;
}

.download-speed {
  color: var(--button-bg);
  font-weight: 500;
}

/* 下载完成样式 */
.download-completed {
  text-align: center;
  padding: 30px 20px;
}

.completion-icon {
  width: 60px;
  height: 60px;
  background: var(--button-bg);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 30px;
  color: white;
  font-weight: bold;
  animation: checkmark 0.6s ease-in-out;
}

@keyframes checkmark {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.download-completed h4 {
  margin: 0 0 10px 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.completion-message {
  margin: 0 0 20px 0;
  color: var(--text-color);
  font-size: 14px;
  opacity: 0.8;
}

.install-options p {
  margin: 0;
  color: var(--text-color);
  font-size: 14px;
  font-weight: 500;
}

.dialog-actions {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid var(--high-hover-bg);
  background: var(--secondary-bg);
}

.btn {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--button-bg);
  color: var(--text-color);
}

.btn-primary:hover:not(:disabled) {
  background: var(--button-hover-bg);
}

.btn-secondary {
  background: var(--high-bg);
  color: var(--text-color);
  border: 1px solid var(--high-hover-bg);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--high-hover-bg);
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar,
.notes-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track,
.notes-content::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.dialog-content::-webkit-scrollbar-thumb,
.notes-content::-webkit-scrollbar-thumb {
  background: var(--high-hover-bg);
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover,
.notes-content::-webkit-scrollbar-thumb:hover {
  background: var(--high-bg);
}
</style>