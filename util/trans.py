import csv
import json

# 中文列名对应的英文变量名映射
column_map = {
    "NIKKE": "name",
    "爆裂": "burst",
    "类型": "role",
    "属性": "element",
    "企业": "company",
    "武器": "weapon",
    "武器伤害": "weapon_damage",
    "装弹": "ammo",
    "换弹": "reload_time",
    "蓄力": "charge",
    "最大充能": "max_charge",
    "充能系数": "charge_multiplier",
    "2RL": "rl_2",
    "弹数": "bullet_count",  # 会重复出现，根据前一列前缀加以区分
    "2.5RL": "rl_2_5",
    "3RL": "rl_3",
    "3.5RL": "rl_3_5",
    "4RL": "rl_4",
    "5RL": "rl_5",
    "6RL": "rl_6",
    "攻击": "attack",
    "防守": "defense",
    "倍率": "multiplier",
    "蓄速检测": "charge_speed_check",
    "总数": "total"
}

# 读取 csv 文件并转换为 JSON
def csv_to_json(file_path):
    with open(file_path, encoding='utf-8') as f:
        reader = csv.reader(f)
        rows = list(reader)

    # 原始表头和数据
    original_headers = rows[0]
    data_rows = rows[1:]

    # 处理重复字段（弹数）
    bullet_index = 0
    headers = []
    for i, h in enumerate(original_headers):
        if h == "弹数":
            prev = original_headers[i - 1]
            key = column_map.get(prev, prev) + "_bullet_count"
            headers.append(key)
        else:
            headers.append(column_map.get(h, h))  # fallback to original if not mapped

    # 构建 JSON 数据
    json_data = []
    for row in data_rows:
        item = {headers[i]: row[i] for i in range(len(headers))}
        json_data.append(item)

    return json_data

# 使用函数并保存 JSON
data = csv_to_json(r"C:\Users\25091\Desktop\NIKKE PVP 充能计算器 v2.1.6（离线版）.csv")
with open("output.json", "w", encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
