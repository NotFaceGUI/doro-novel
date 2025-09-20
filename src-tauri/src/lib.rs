use std::fs;
use std::path::Path;
use tauri::command;

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
            Ok(true)  // 文件
        } else if path.is_dir() {
            Ok(false)  // 目录
        } else {
            Err(format!("路径 {} 既不是文件也不是目录", path.display()))  // 非文件或目录
        }
    } else {
        Err(format!("路径 {} 不存在", path.display()))  // 路径不存在
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![write_json_file])
        .invoke_handler(tauri::generate_handler![check_path_is_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
