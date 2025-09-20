import { convertFileSrc } from "@tauri-apps/api/core";
import { resolveResource } from "@tauri-apps/api/path";

/**
 * 加载 Shader 文件
 * @param path 资源路径
 * @returns 返回 shader 文件内容
 */
export async function loadShader(path: string): Promise<string> {
    try {
      const effectPath = await resolveResource(path);
      const fileUrl = convertFileSrc(effectPath);
      const response = await fetch(fileUrl);
  
      if (!response.ok) {
        throw new Error(`Failed to load shader: ${response.statusText}`);
      }
  
      return await response.text();
    } catch (error) {
      console.error("Error loading shader:", error);
      return "";
    }
  }
  