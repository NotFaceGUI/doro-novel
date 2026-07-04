import os
import json

# 源目录，用于获取所有需要的keys
base_dir = r'E:\SelfProject\Nikke-db.github.io\l2d' 
# 目标目录，存放多语言文件的位置
locales_dir = r'E:\SelfProject\doro-novel\src-tauri\resources\locales'

languages = {
    "zh-CN": "zh-CN.json",
    "en-US": "en-US.json",
    "ja-JP": "ja-JP.json",
    "ko-KR": "ko-KR.json"
}

# 获取所有需要的keys
keys = [name for name in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, name))]

# 确保目标目录存在
os.makedirs(locales_dir, exist_ok=True)

# 增量更新语言文件
for lang, filename in languages.items():
    # 目标文件路径
    target_file_path = os.path.join(locales_dir, filename)
    
    # 读取现有的语言文件（如果存在）
    existing_data = {}
    if os.path.exists(target_file_path):
        try:
            with open(target_file_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
            print(f"读取现有文件: {filename}")
        except Exception as e:
            print(f"读取文件 {filename} 时出错: {e}")
    
    # 纯增量更新：只追加缺失的 key，保留已有内容（含嵌套 UI 翻译）与原格式不变
    if not existing_data and os.path.exists(target_file_path):
        continue

    missing = [k for k in keys if k not in existing_data]
    if not missing:
        print(f"✅ 文件: {filename} (无新增 key)")
        continue

    # 文本级末尾追加，避免重新序列化破坏原格式
    try:
        with open(target_file_path, 'r', encoding='utf-8') as f:
            text = f.read()
        end_idx = text.rstrip().rfind('}')
        prefix = text[:end_idx].rstrip()
        insert_lines = ',\n' + ',\n'.join(f'  "{k}": "{k}"' for k in missing)
        new_text = prefix + insert_lines + '\n}\n'
        with open(target_file_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print(f"✅ 更新文件: {filename} (新增 {len(missing)} 个 key)")
    except Exception as e:
        print(f"写入文件 {filename} 时出错: {e}")

print("\n✅ 多语言文件增量更新完成")
print(f"目标目录: {locales_dir}")
for filename in languages.values():
    print(f"- {filename}")
