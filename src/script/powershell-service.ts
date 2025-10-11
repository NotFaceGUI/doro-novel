import { invoke } from '@tauri-apps/api/core';
import { resolveResource } from '@tauri-apps/api/path';

/**
 * PowerShell 脚本执行服务
 */
export class PowerShellService {
  /**
   * 执行 PowerShell 脚本
   * @param scriptPath 脚本文件路径
   * @returns Promise<string> 脚本执行输出
   */
  static async executeScript(scriptPath: string): Promise<string> {
    try {
      const result = await invoke<string>('execute_powershell_script', {
        scriptPath: scriptPath
      });
      return result;
    } catch (error) {
      console.error('PowerShell 脚本执行失败:', error);
      throw new Error(`PowerShell 脚本执行失败: ${error}`);
    }
  }

  /**
   * 执行 PowerShell 脚本并获取详细信息
   * @param scriptPath 脚本文件路径
   * @returns Promise<{stdout: string, stderr: string, exitCode: number}> 详细执行结果
   */
  static async executeScriptWithDetails(scriptPath: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    try {
      const [stdout, stderr, exitCode] = await invoke<[string, string, number]>(
        'execute_powershell_script_with_details',
        {
          scriptPath: scriptPath
        }
      );
      return { stdout, stderr, exitCode };
    } catch (error) {
      console.error('PowerShell 脚本执行失败:', error);
      throw new Error(`PowerShell 脚本执行失败: ${error}`);
    }
  }

  /**
   * 以分离(detached)方式执行 PowerShell 脚本（控制台不自动关闭）
   */
  static async executeScriptDetached(scriptPath: string, args: string[] = []): Promise<void> {
    try {
      await invoke<void>('execute_powershell_script_detached', {
        scriptPath: scriptPath,
        args: args
      });
    } catch (error) {
      console.error('PowerShell 脚本(detached)执行失败:', error);
      throw new Error(`PowerShell 脚本(detached)执行失败: ${error}`);
    }
  }

  /**
   * 执行 update_spine.ps1 脚本
   * @returns Promise<string> 脚本执行输出
   */
  static async executeUpdateSpine(): Promise<string> {
    // 使用 resolveResource 获取应用资源目录下的 update_spine.ps1 脚本路径
    const scriptPath = await resolveResource('update_spine.ps1');
    return await this.executeScript(scriptPath);
  }

  /**
   * 执行 update_spine.ps1 脚本并获取详细信息
   * @returns Promise<{stdout: string, stderr: string, exitCode: number}> 详细执行结果
   */
  static async executeUpdateSpineWithDetails(): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    // 使用 resolveResource 获取应用资源目录下的 update_spine.ps1 脚本路径
    const scriptPath = await resolveResource('update_spine.ps1');
    return await this.executeScriptWithDetails(scriptPath);
  }

  /**
   * 以分离(detached)方式执行 update_spine.ps1（控制台窗口保持，需手动关闭）
   */
  static async executeUpdateSpineDetached(): Promise<void> {
    const scriptPath = await resolveResource('update_spine.ps1');
    // 传入 -KeepOpen 让脚本末尾等待按键
    await this.executeScriptDetached(scriptPath, ['-KeepOpen']);
  }
}