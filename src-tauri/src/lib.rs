use std::fs;
use std::path::Path;
use std::process::Command;
use tauri::command;
use tauri_plugin_opener::OpenerExt;

// PowerShell 执行器相关的错误类型
#[derive(Debug)]
pub enum PowerShellError {
    FileNotFound(String),
    InvalidFileType(String),
    ExecutionFailed(String),
    IoError(std::io::Error),
}

impl std::fmt::Display for PowerShellError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            PowerShellError::FileNotFound(path) => write!(f, "PowerShell 脚本文件未找到: {}", path),
            PowerShellError::InvalidFileType(path) => write!(f, "文件不是 PowerShell 脚本 (.ps1): {}", path),
            PowerShellError::ExecutionFailed(msg) => write!(f, "PowerShell 脚本执行失败: {}", msg),
            PowerShellError::IoError(err) => write!(f, "IO 错误: {}", err),
        }
    }
}

impl From<std::io::Error> for PowerShellError {
    fn from(error: std::io::Error) -> Self {
        PowerShellError::IoError(error)
    }
}

// PowerShell 执行器结构体
pub struct PowerShellExecutor;

impl PowerShellExecutor {
    /// 执行指定路径的 PowerShell 脚本
    pub fn execute_script(script_path: &str) -> Result<String, PowerShellError> {
        // 验证文件是否存在
        if !Path::new(script_path).exists() {
            return Err(PowerShellError::FileNotFound(script_path.to_string()));
        }

        // 验证文件扩展名
        if !script_path.to_lowercase().ends_with(".ps1") {
            return Err(PowerShellError::InvalidFileType(script_path.to_string()));
        }

        // 执行 PowerShell 脚本
        let output = Command::new("powershell")
            .args(["-ExecutionPolicy", "Bypass", "-File", script_path])
            .output()?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let error_msg = String::from_utf8_lossy(&output.stderr).to_string();
            Err(PowerShellError::ExecutionFailed(error_msg))
        }
    }

    /// 执行 PowerShell 脚本并获取详细输出信息
    pub fn execute_script_with_details(script_path: &str) -> Result<(String, String, i32), PowerShellError> {
        // 验证文件是否存在
        if !Path::new(script_path).exists() {
            return Err(PowerShellError::FileNotFound(script_path.to_string()));
        }

        // 验证文件扩展名
        if !script_path.to_lowercase().ends_with(".ps1") {
            return Err(PowerShellError::InvalidFileType(script_path.to_string()));
        }

        // 执行 PowerShell 脚本
        let output = Command::new("powershell")
            .args(["-ExecutionPolicy", "Bypass", "-File", script_path])
            .output()?;

        let stdout = String::from_utf8_lossy(&output.stdout).to_string();
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        let exit_code = output.status.code().unwrap_or(-1);

        Ok((stdout, stderr, exit_code))
    }
}

#[command]
fn write_json_file(file_path: &str, json_data: &str) -> Result<String, String> {
    let path: &Path = Path::new(file_path);

    // 确保目录存在
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }

    // 将 JSON 数据写入文件
    fs::write(path, json_data).map_err(|e| format!("写入文件失败: {}", e))?;

    Ok("JSON 文件写入成功!".to_string())
}

#[tauri::command]
fn check_path_is_file(path: String) -> Result<bool, String> {
    let path = Path::new(&path);

    if path.exists() {
        if path.is_file() {
            Ok(true) // 文件
        } else if path.is_dir() {
            Ok(false) // 目录
        } else {
            Err(format!("路径 {} 既不是文件也不是目录", path.display())) // 非文件或目录
        }
    } else {
        Err(format!("路径 {} 不存在", path.display())) // 路径不存在
    }
}

#[tauri::command]
async fn open_folder(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.opener()
        .open_path(&path, None::<String>)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn execute_powershell_script(script_path: String) -> Result<String, String> {
    PowerShellExecutor::execute_script(&script_path)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn execute_powershell_script_with_details(script_path: String) -> Result<(String, String, i32), String> {
    PowerShellExecutor::execute_script_with_details(&script_path)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            write_json_file, 
            check_path_is_file, 
            open_folder,
            execute_powershell_script,
            execute_powershell_script_with_details
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
