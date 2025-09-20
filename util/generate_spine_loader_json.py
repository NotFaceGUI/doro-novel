import os
import json

base_dir = r"E:\SelfProject\Nikke-db.github.io\l2d"

output = []

for folder_name in os.listdir(base_dir):
    folder_path = os.path.join(base_dir, folder_name)
    if not os.path.isdir(folder_path):
        continue

    skel_file = f"{folder_name}_00.skel"
    skel_path = os.path.join(folder_path, skel_file)
    if not os.path.isfile(skel_path):
        continue 

    path_obj = {
        "name": folder_name,
        "skel": skel_file
    }

    # 检查 aim 和 cover 子文件夹
    aim_dir = os.path.join(folder_path, "aim")
    if os.path.isdir(aim_dir):
        aim_skel = f"{folder_name}_aim_00.skel"
        if os.path.isfile(os.path.join(aim_dir, aim_skel)):
            path_obj["aimSkel"] = aim_skel

    cover_dir = os.path.join(folder_path, "cover")
    if os.path.isdir(cover_dir):
        cover_skel = f"{folder_name}_cover_00.skel"
        if os.path.isfile(os.path.join(cover_dir, cover_skel)):
            path_obj["coverSkel"] = cover_skel

    # 组装最终条目
    character_data = {
        "dirName": folder_name,
        "characterName": folder_name,
        "quality": "sr",
        "company": "ELYSION",
        "path": path_obj
    }

    output.append(character_data)

# 输出为 JSON 文件
output_path = os.path.join(base_dir, "spine-character.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=4, ensure_ascii=False)

print(f"✅ 转换完成，数据已保存到: {output_path}")
