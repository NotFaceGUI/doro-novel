// 测试震动标签的key和顺序解析功能

// 解析标签属性的辅助函数
function parseTagAttributes(attributes) {
    const result = new Map();
    
    if (!attributes.trim()) {
        return result;
    }
    
    const pairs = attributes.split(',');
    
    for (const pair of pairs) {
        const colonIndex = pair.indexOf(':');
        
        if (colonIndex === -1) {
            result.set('', pair.trim());
        } else {
            const key = pair.substring(0, colonIndex).trim();
            const value = pair.substring(colonIndex + 1).trim();
            result.set(key, value);
        }
    }
    
    return result;
}

// 模拟震动标签处理器
const ShakeTagHandler = {
    name: 'shake',
    execute(attributes, context) {
        const params = parseTagAttributes(attributes);
        
        // 支持按key指定或按顺序指定震动的3个数值
        let intensity;
        let duration;
        let frequency;
        
        // 如果有key，优先使用key方式
        if (params.has('intensity') || params.has('强度') || 
            params.has('duration') || params.has('持续时间') || 
            params.has('frequency') || params.has('频率')) {
            intensity = params.get('intensity') || params.get('强度') || '轻微';
            duration = params.get('duration') || params.get('持续时间') || '1s';
            frequency = params.get('frequency') || params.get('频率') || '中等';
        } else {
            // 按顺序解析：强度,持续时间,频率
            const values = attributes.split(',').map(v => v.trim()).filter(v => v);
            intensity = values[0] || '轻微';
            duration = values[1] || '1s';
            frequency = values[2] || '中等';
        }
        
        console.log(`🔥 执行震动效果: 强度=${intensity}, 持续时间=${duration}, 频率=${frequency}`);
        return { intensity, duration, frequency };
    }
};

// 测试用例
const testCases = [
    // 按key指定
    { attributes: "intensity:强烈,duration:2s,frequency:高", description: "按key指定所有参数" },
    { attributes: "强度:中等,持续时间:1.5s,频率:低", description: "按中文key指定所有参数" },
    { attributes: "intensity:轻微,持续时间:3s", description: "混合key指定部分参数" },
    
    // 按顺序指定
    { attributes: "强烈,2s,高", description: "按顺序指定所有参数" },
    { attributes: "中等,1.5s", description: "按顺序指定部分参数" },
    { attributes: "轻微", description: "按顺序指定单个参数" },
    
    // 边界情况
    { attributes: "", description: "空属性" },
    { attributes: "强烈", description: "单个值（无逗号）" },
    { attributes: "强烈,", description: "末尾有逗号" },
    { attributes: ",2s,高", description: "开头为空值" },
    { attributes: "强烈,,高", description: "中间有空值" }
];

console.log("🚀 开始测试震动标签处理器...\n");

testCases.forEach((testCase, index) => {
    console.log(`📝 测试 ${index + 1}: ${testCase.description}`);
    console.log(`   属性: "${testCase.attributes}"`);
    
    const context = { textElement: null };
    const result = ShakeTagHandler.execute(testCase.attributes, context);
    
    console.log(`   结果: 强度=${result.intensity}, 持续时间=${result.duration}, 频率=${result.frequency}`);
    console.log("─".repeat(60));
});

console.log("\n✅ 震动标签处理器测试完成！");

// 测试属性解析函数
console.log("\n🔧 测试属性解析函数:");
const attributeTests = [
    "intensity:强烈,duration:2s,frequency:高",
    "强度:中等,持续时间:1.5s",
    "强烈,2s,高",
    "轻微",
    ""
];

attributeTests.forEach(attr => {
    const parsed = parseTagAttributes(attr);
    console.log(`"${attr}" -> `, Object.fromEntries(parsed));
});