// stores/project-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { LOCAL_OPEN_KEY, LOCAL_OPEN_PROJECT_SAVEPATH_KEY } from '../script/var';
import { Project } from '../types/app';
import massage from '../script/common/massage';

export const useProjectStore = defineStore('project', () => {
  // 项目是否打开的状态
  const isOpenProject = ref<boolean>(false);
  
  // 当前项目名称
  const currentProjectName = ref<string>('');
  
  // 当前项目保存路径
  const currentProjectSavePath = ref<string>('');
  
  // 初始化项目状态
  const initializeProjectState = () => {
    const projectName = localStorage.getItem(LOCAL_OPEN_KEY);
    if (projectName) {
      isOpenProject.value = true;
      currentProjectName.value = projectName;
      currentProjectSavePath.value = localStorage.getItem(LOCAL_OPEN_PROJECT_SAVEPATH_KEY) || '';
    } else {
      isOpenProject.value = false;
      currentProjectName.value = '';
      currentProjectSavePath.value = '';
    }
  };

  // 打开项目
  const openProject = (project: Project) => {
    localStorage.setItem(LOCAL_OPEN_KEY, project.projectName);
    localStorage.setItem(LOCAL_OPEN_PROJECT_SAVEPATH_KEY, project.savePath);
    currentProjectName.value = project.projectName;
    isOpenProject.value = true;
    massage(`[${project.projectName}]项目已打开`, 'success', 2000);
  };

  // 关闭项目
  const closeProject = () => {
    localStorage.removeItem(LOCAL_OPEN_KEY);
    localStorage.removeItem(LOCAL_OPEN_PROJECT_SAVEPATH_KEY);
    currentProjectName.value = '';
    isOpenProject.value = false;
  };
 
  return {
    isOpenProject,
    currentProjectName,
    currentProjectSavePath,
    initializeProjectState,
    openProject,
    closeProject
  };
});