<template>
  <div v-if="showDialog" class="update-dialog-overlay" @click.self="closeDialog">
    <div class="update-dialog">
      <div class="dialog-header">
        <h3>{{ $t('update.title') }}</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-content">
        <div class="update-info">
          <p class="version-info">
            <strong>{{ $t('update.newVersion') }}:</strong> {{ updateInfo?.version }}
          </p>
          <p class="date-info">
            <strong>{{ $t('update.releaseDate') }}:</strong> {{ formatDate(updateInfo?.date) }}
          </p>
        </div>
        
        <div class="update-notes">
          <h4>{{ $t('update.releaseNotes') }}</h4>
          <div class="notes-content" v-html="formatReleaseNotes(updateInfo?.body)"></div>
        </div>
        
        <div v-if="isDownloading" class="download-progress">
          <div class="progress-info">
            <span>{{ $t('update.downloading') }}...</span>
            <span>{{ downloadProgress }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: downloadProgress + '%' }"></div>
          </div>
          <div class="download-details">
            {{ formatBytes(downloadedBytes) }} / {{ formatBytes(totalBytes) }}
          </div>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button 
          v-if="!isDownloading && !isCompleted" 
          class="btn btn-secondary" 
          @click="closeDialog"
        >
          {{ $t('update.later') }}
        </button>
        <button 
          v-if="!isDownloading && !isCompleted" 
          class="btn btn-primary" 
          @click="startUpdate"
        >
          {{ $t('update.updateNow') }}
        </button>
        <button 
          v-if="isCompleted" 
          class="btn btn-primary" 
          @click="restartApp"
        >
          {{ $t('update.restartNow') }}
        </button>
        <button 
          v-if="isCompleted" 
          class="btn btn-secondary" 
          @click="closeDialog"
        >
          {{ $t('update.restartLater') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { manualUpdate, type UpdateInfo, type UpdateCallbacks } from '../script/updater';

const { t } = useI18n();

// Props
interface Props {
  updateInfo: UpdateInfo | null;
  show: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
  updateStarted: [];
  updateCompleted: [];
  updateError: [error: string];
}>();

// State
const showDialog = computed(() => props.show && props.updateInfo?.available);
const isDownloading = ref(false);
const isCompleted = ref(false);
const downloadProgress = ref(0);
const downloadedBytes = ref(0);
const totalBytes = ref(0);

// Methods
const closeDialog = () => {
  if (!isDownloading.value) {
    emit('close');
  }
};

const startUpdate = async () => {
  if (!props.updateInfo) return;
  
  isDownloading.value = true;
  emit('updateStarted');
  
  const callbacks: UpdateCallbacks = {
    onDownloadProgress: (progress) => {
      switch (progress.event) {
        case 'Started':
          totalBytes.value = progress.data?.contentLength || 0;
          downloadedBytes.value = 0;
          downloadProgress.value = 0;
          break;
        case 'Progress':
          downloadedBytes.value += progress.data?.chunkLength || 0;
          if (totalBytes.value > 0) {
            downloadProgress.value = Math.round((downloadedBytes.value / totalBytes.value) * 100);
          }
          break;
        case 'Finished':
          downloadProgress.value = 100;
          break;
      }
    },
    onUpdateComplete: () => {
      isDownloading.value = false;
      isCompleted.value = true;
      emit('updateCompleted');
    },
    onError: (error) => {
      isDownloading.value = false;
      emit('updateError', error);
    }
  };
  
  try {
    await manualUpdate(callbacks);
  } catch (error) {
    isDownloading.value = false;
    emit('updateError', error instanceof Error ? error.message : '更新失败');
  }
};

const restartApp = async () => {
  try {
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch (error) {
    console.error('重启应用失败:', error);
    emit('updateError', '重启应用失败');
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.update-dialog {
  background: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid #333;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #333;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
}

.dialog-header h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #333;
  color: #fff;
}

.dialog-content {
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.update-info {
  margin-bottom: 20px;
}

.version-info,
.date-info {
  margin: 8px 0;
  color: #ccc;
  font-size: 14px;
}

.version-info strong,
.date-info strong {
  color: #fff;
}

.update-notes {
  margin-bottom: 20px;
}

.update-notes h4 {
  margin: 0 0 12px 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.notes-content {
  background: #0f0f0f;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 16px;
  color: #ccc;
  font-size: 14px;
  line-height: 1.6;
  max-height: 200px;
  overflow-y: auto;
}

.notes-content :deep(h2),
.notes-content :deep(h3),
.notes-content :deep(h4) {
  color: #fff;
  margin: 12px 0 8px 0;
}

.notes-content :deep(ul) {
  margin: 8px 0;
  padding-left: 20px;
}

.notes-content :deep(li) {
  margin: 4px 0;
}

.notes-content :deep(strong) {
  color: #fff;
}

.download-progress {
  margin-top: 20px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: #ccc;
  font-size: 14px;
}

.progress-bar {
  background: #333;
  border-radius: 10px;
  height: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  background: linear-gradient(90deg, #4CAF50, #45a049);
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 10px;
}

.download-details {
  text-align: center;
  color: #999;
  font-size: 12px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #333;
  background: #1a1a1a;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-1px);
}

.btn-secondary {
  background: #333;
  color: #ccc;
  border: 1px solid #555;
}

.btn-secondary:hover {
  background: #444;
  color: #fff;
  border-color: #666;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar,
.notes-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track,
.notes-content::-webkit-scrollbar-track {
  background: #1a1a1a;
}

.dialog-content::-webkit-scrollbar-thumb,
.notes-content::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover,
.notes-content::-webkit-scrollbar-thumb:hover {
  background: #666;
}
</style>