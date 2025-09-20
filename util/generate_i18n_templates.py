import os
import json

# 源目录，用于获取所有需要的keys
base_dir = r'E:\SelfProject\Nikke-db.github.io\l2d' 
# 目标目录，存放多语言文件的位置
locales_dir = r'E:\SelfProject\doro-novel\src\locales'

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
    
    # 创建新的数据字典，保留已有翻译
    new_data = {}
    for key in keys:
        if key in existing_data and existing_data[key]:
            # 保留已有的翻译
            new_data[key] = existing_data[key]
        else:
            # 对于中文语言文件，使用key作为默认值
            # 对于其他语言文件，如果值为空，则使用key作为默认值
            if lang == "zh-CN" or (lang != "zh-CN" and (key not in existing_data or not existing_data[key])):
                new_data[key] = key
            else:
                # 保留其他语言文件中的空值
                new_data[key] = existing_data.get(key, "")
    
    # 写入更新后的数据
    try:
        with open(target_file_path, 'w', encoding='utf-8') as f:
            json.dump(new_data, f, ensure_ascii=False, indent=2)
        print(f"✅ 更新文件: {filename}")
    except Exception as e:
        print(f"写入文件 {filename} 时出错: {e}")

print("\n✅ 多语言文件增量更新完成")
print(f"目标目录: {locales_dir}")
for filename in languages.values():
    print(f"- {filename}")
