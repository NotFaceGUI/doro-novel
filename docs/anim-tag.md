# `<anim>` 动画标签

在对话文本中控制场景内任意角色的 Spine 动画。标签在文字逐字显示到对应位置时触发，与 `<shake/>`、`<wait/>` 等现有标签使用方式一致。

## 语法

```
<anim:角色名,动画名,循环,延迟ms/>
<anim:char:角色名,animation:动画名,loop:false,delay:500,queue:true,prev:idle/>
```

两种写法可混用，位置参数与键值参数都支持。

## 参数

| 参数 | 位置 | 键值 | 默认 | 说明 |
|---|---|---|---|---|
| 角色名 | 1 | `char` | 必填 | 场景中的角色，见下方"角色匹配" |
| 动画名 | 2 | `animation` | 必填 | Spine 动画名称（如 `idle`、`attack`） |
| 循环 | 3 | `loop` | `true` | 非 `false` 均视为循环播放 |
| 延迟(ms) | 4 | `delay` | `0` | 触发后延迟若干毫秒再播放 |
| 承接 | — | `queue` | `false` | `true` 时等上一个**同角色非循环** anim 动画播完后再播放 |
| 恢复动画 | — | `prev` | 当前动画 | 非循环动画播完后恢复到的动画名，覆盖默认的"标签触发前当前动画"；无则恢复 `idle` |

## 示例

### 循环播放
角色持续播放该动画，直到下一次切换。
```
<anim:c030,delight/>
<anim:char:c030,animation:delight/>
```

### 播放一次后恢复（默认）
非循环动画播放一次后，自动恢复为该角色在标签触发前的动画（无则恢复 `idle`）。
```
<anim:c030,delight,false/>
<anim:char:c030,animation:delight,loop:false/>
```
以 `c030` 播放 `delight` 为例：播完一次 `delight` 后自动恢复到 `delight` 触发前 `c030` 正在播放的动画。

### 指定恢复动画（prev）
用 `prev` 显式指定非循环动画播完后回到哪个动画，覆盖默认的"当前动画"。
```
<anim:char:c030,animation:delight,loop:false,prev:idle/>
```
`c030` 播完一次 `delight` 后，无论触发前在放什么，都恢复到 `idle`。

若 `prev` 指定的动画在该角色骨骼中不存在，会输出警告并回退到"当前动画 → idle"的默认行为。

### 延迟播放
触发后延迟 500ms 再播放。
```
<anim:c030,delight,false,500/>
<anim:c030,delight,false,delay:500/>
```

### 承接上一个动画
等上一个**同角色非循环** anim 动画播完后，再播放当前动画。常用于连招 / 组合动作。
```
第一句对话: 你看这招！<anim:c030,delight,false/>
第二句对话: 还有这招！<anim:c030,smile,false,queue:true/>
```
`smile` 会等 `delight` 播放完毕后再开始，形成连贯动作。

### 延迟 + 承接组合
上一个动画播完后，再延迟 200ms 播放。
```
<anim:c030,smile,false,queue:true,delay:200/>
```

### 全参数组合
承接上一个动画 + 延迟 + 指定恢复动画。
```
<anim:char:c030,animation:delight,loop:false,queue:true,delay:300,prev:idle/>
```
等上一个 `c030` 非循环动画播完 → 延迟 300ms → 播放一次 `delight` → 恢复到 `idle`。

## 角色匹配

依次按以下顺序匹配场景角色（`maxCharacter`），命中即停止：

1. **显示名** —— 含别名、i18n 翻译名（`getCharacterDisplayName`）
2. **characterName** —— 角色原始名
3. **characterId** —— 角色唯一 ID

匹配失败会在控制台输出 `[anim标签] 未在场景中找到角色: xxx`，不中断对话。

## 触发时机与跳过

- 标签在文字逐字显示到标签所在位置时触发（参考 `ui-render.ts` 标签执行流程）
- **跳过对话**：点击跳过后，文字循环 `break`，**当前位置之后的标签不再触发**；已触发的标签中：
  - 循环动画已生效，保持播放
  - 非循环动画的"恢复"由 Spine 内部 `addAnimation` 排队完成。若跳过后对话系统在轨道 0 设置了新动画，排队会被自动清除，**不会污染后续角色状态**

## 动画切换平滑度

- 首次操作某角色时，自动为该角色**所有动画对**预设 0.2s 混合时长（`setMix`），与对话系统 `animation-config.ts` 默认值一致
- 切换方式与对话系统 `ui-render.ts:932-957` 完全对齐：同轨道（轨道 0）、同 `setAnimation` 调用、同防重复逻辑

## 注意事项

- 标签 `wait:false`，**不阻塞对话文字显示**，动画在后台自行运转
- `queue` 仅对上一个**非循环**动画有效；上一个若是循环动画，`queue` 不会等待（循环动画无"播放完毕"概念）
- 动画名必须真实存在于该角色的 Spine 骨骼数据中，否则输出警告并跳过
- 角色必须已在场景中（`ActionInitScene` 已添加），否则匹配失败
