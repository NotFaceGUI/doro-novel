<template>
  <div v-if="showDialog" class="about-dialog-overlay" @click.self="closeDialog">
    <div class="about-dialog">
      <div class="dialog-header">
        <h3>关于我们</h3>
        <button class="close-btn" @click="closeDialog">×</button>
      </div>
      
      <div class="dialog-content">
        <!-- 项目信息 -->
        <div class="project-info">
          <div class="project-icon">
            <img src="../assets/Icon.png" alt="Doro Novel" width="64" height="64">
          </div>
          <div class="project-details">
            <h2>Doro Novel</h2>
            <p class="project-description">
              🎨 一个基于 Tauri 的可视化小说编辑器，专为创建 Nikke 风格的交互式视觉小说而设计，
              支持可视化编辑、剧情分支、多语言本地化和实时预览。
            </p>
            <div class="version-info">
              <span class="version-badge">ver {{ APP_VERSION }}</span>
            </div>
          </div>
        </div>
        
        <!-- 作者信息 -->
        <div class="author-info">
          <div class="author-avatar">
            <!-- <img src="../assets/ghost.jpg" alt="" srcset="" style="width: 48px; height: 48px; border-radius: 50%;"> -->
             👻
          </div>
          <div class="author-details">
            <h3>Ghost</h3>
            <p class="author-role">项目作者 & 开发者</p>
            <p class="author-description">
              致力于创建优秀的开源工具，让创作变得更加简单和有趣。
            </p>
              邮箱：<strong>parsegamecn@gmail.com</strong>
            <p></p>
          </div>
        </div>
        
        <!-- 链接区域 -->
        <div class="links-section">
          <h4>相关链接</h4>
          <div class="links-grid">
            <a href="https://github.com/NotFaceGUI/doro-novel" target="_blank" class="link-item github">
              <div class="link-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </div>
              <div class="link-content">
                <span class="link-title">GitHub 仓库</span>
                <span class="link-description">查看源代码和贡献</span>
              </div>
            </a>
            
            <a href="https://space.bilibili.com/215262853?spm_id_from=333.1007.0.0" target="_blank" class="link-item bilibili">
              <div class="link-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.071.134.142.187.213h4.267a.836.836 0 0 1 .16-.213l2.853-2.747c.267-.249.573-.373.92-.373.347 0 .662.151.929.4.267.249.391.551.391.907 0 .356-.124.657-.373.906l-1.174 1.12zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.789 1.894v7.52c.02.764.283 1.395.789 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.789-1.893v-7.52c-.02-.765-.283-1.396-.789-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
                </svg>
              </div>
              <div class="link-content">
                <span class="link-title">Bilibili 空间</span>
                <span class="link-description">关注最新动态</span>
              </div>
            </a>
            
            <a href="https://www.blablalink.com/user?openid=MjkwODAtOTYwMDgzOTQ3MzA1OTk4OTYzNA==" target="_blank" class="link-item blablalink">
              <div class="link-icon">
                <img src="../assets/apple-touch-icon.webp" alt="Blablalink" width="40" height="40">
              </div>
              <div class="link-content">
                <span class="link-title">Blablalink</span>
                <span class="link-description">个人主页</span>
              </div>
            </a>
            
            <a href="https://qm.qq.com/q/9MSI0aQ7Z0" target="_blank" class="link-item qq-group">
              <div class="link-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.5c-4.142 0-7.5 3.358-7.5 7.5 0 1.445.41 2.794 1.122 3.943-.024.147-.037.297-.037.45 0 1.657 1.343 3 3 3h6.83c1.657 0 3-1.343 3-3 0-.153-.013-.303-.037-.45.712-1.149 1.122-2.498 1.122-3.943 0-4.142-3.358-7.5-7.5-7.5zm-3.5 8c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm7 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm-3.5 3c-1.105 0-2-.895-2-2h4c0 1.105-.895 2-2 2z"/>
                </svg>
              </div>
              <div class="link-content">
                <span class="link-title">QQ 交流群</span>
                <span class="link-description">加入社区讨论</span>
              </div>
            </a>
          </div>
        </div>
        
        <!-- 技术栈 -->
        <div class="tech-stack">
          <h4>技术栈</h4>
          <div class="tech-tags">
            <span class="tech-tag">Tauri</span>
            <span class="tech-tag">Vue.js</span>
            <span class="tech-tag">TypeScript</span>
            <span class="tech-tag">PixiJS</span>
            <span class="tech-tag">Spine</span>
          </div>
        </div>
        
        <!-- 致谢 -->
        <div class="acknowledgments">
          <h4>特别致谢</h4>
          <p>感谢 <a href="https://github.com/Nikke-db/Nikke-db.github.io" target="_blank" class="acknowledgment-link"><strong>Nikke-db</strong></a> 团队维护的开源资源仓库，为社区提供了完整的角色资源数据。</p>
          <p>感谢 <a href="https://space.bilibili.com/30536903?spm_id_from=333.337.0.0" target="_blank" class="acknowledgment-link"><strong>哈德林</strong></a> 对项目的支持与贡献。</p>
        </div>
      </div>
      
      <div class="dialog-actions">
        <button class="btn btn-primary" @click="closeDialog">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { APP_VERSION } from '../script/var';

// Props
interface Props {
  showDialog: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  close: [];
}>();

// Methods
const closeDialog = () => {
  emit('close');
};
</script>

<style scoped>
.about-dialog-overlay {
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

.about-dialog {
  background: var(--secondary-bg);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  border: 1px solid var(--high-hover-bg);
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--high-hover-bg);
  background: var(--secondary-bg);
  flex-shrink: 0;
  position: relative;
  z-index: 1;
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

.close-btn:hover {
  background: var(--high-hover-bg);
  opacity: 1;
}

.dialog-content {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

/* 项目信息样式 */
.project-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--high-hover-bg);
}

.project-icon {
  flex-shrink: 0;
}


.project-details h2 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 24px;
  font-weight: 700;
}

.project-description {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.9;
}

.version-badge {
  background: linear-gradient(135deg, var(--button-bg), var(--button-hover-bg));
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 作者信息样式 */
.author-info {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--high-hover-bg);
}

.author-avatar {
  flex-shrink: 0;
  font-size: 48px;
}

.author-details h3 {
  margin: 0 0 4px 0;
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
}

.author-role {
  margin: 0 0 8px 0;
  color: var(--button-bg);
  font-size: 13px;
  font-weight: 500;
}

.author-description {
  margin: 0;
  color: var(--text-color);
  font-size: 14px;
  opacity: 0.8;
}

/* 链接区域样式 */
.links-section {
  margin-bottom: 24px;
}

.links-section h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.links-grid {
  display: grid;
  gap: 12px;
}

.link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--primary-bg);
  border: 1px solid var(--high-hover-bg);
  border-radius: 8px;
  text-decoration: none;
  color: var(--text-color);
  transition: all 0.2s;
}

.link-item:hover {
  background: var(--high-hover-bg);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.link-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.github .link-icon {
  background: linear-gradient(135deg, #333, #24292e);
}

.bilibili .link-icon {
  background: linear-gradient(135deg, #00a1d6, #0084c7);
}

.blablalink .link-icon {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.qq-group .link-icon {
  background: linear-gradient(135deg, #12b7f5, #0099e0);
}

.link-content {
  flex: 1;
}

.link-title {
  display: block;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 2px;
}

.link-description {
  display: block;
  font-size: 12px;
  opacity: 0.7;
}

/* 技术栈样式 */
.tech-stack {
  margin-bottom: 24px;
}

.tech-stack h4 {
  margin: 0 0 12px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tech-tag {
  background: var(--high-bg);
  color: var(--text-color);
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--high-hover-bg);
}

/* 致谢样式 */
.acknowledgments {
  margin-bottom: 16px;
}

.acknowledgments h4 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 16px;
  font-weight: 600;
}

.acknowledgments p {
  margin: 0;
  color: var(--text-color);
  font-size: 14px;
  line-height: 1.5;
  opacity: 0.9;
}

.acknowledgments strong {
  color: var(--button-bg);
  font-weight: 600;
}

.acknowledgment-link {
  color: var(--button-bg);
  text-decoration: none;
  transition: all 0.2s;
}

.acknowledgment-link:hover {
  color: var(--button-hover-bg);
  text-decoration: underline;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px;
  border-top: 1px solid var(--high-hover-bg);
  background: var(--secondary-bg);
  flex-shrink: 0;
}

.btn {
  padding: 8px 24px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--button-bg);
  color: var(--text-color);
}

.btn-primary:hover {
  background: var(--button-hover-bg);
}

/* 滚动条样式 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: var(--primary-bg);
}

.dialog-content::-webkit-scrollbar-thumb {
  background: var(--high-bg);
  border-radius: 3px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: var(--high-hover-bg);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .about-dialog {
    width: 95%;
    max-height: 90vh;
    margin: 20px;
  }
  
  .dialog-header {
    padding: 12px 16px;
  }
  
  .dialog-content {
    padding: 16px;
  }
  
  .project-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 12px;
  }
  
  .project-details h2 {
    font-size: 20px;
  }
  
  .links-section {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .dialog-actions {
    padding: 12px 16px;
  }
}

@media (max-width: 480px) {
  .about-dialog {
    width: 98%;
    max-height: 95vh;
    margin: 10px;
  }
  
  .dialog-header {
    padding: 10px 12px;
  }
  
  .dialog-header h3 {
    font-size: 14px;
  }
  
  .close-btn {
    width: 20px;
    height: 20px;
    font-size: 16px;
  }
  
  .dialog-content {
    padding: 12px;
  }
  
  .project-details h2 {
    font-size: 18px;
  }
  
  .project-description {
    font-size: 13px;
  }
  
  .dialog-actions {
    padding: 10px 12px;
  }
}
</style>