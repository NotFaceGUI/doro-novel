import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useBranchStore = defineStore('branch', () => {
  // 用户拥有的标签集合
  const userTags = ref<Set<string>>(new Set())
  
  // 所有可用的分支标签历史记录
  const branchHistory = ref<string[]>([])
  
  // 添加标签到用户标签集合
  const addTag = (tag: string) => {
    userTags.value.add(tag)
    if (!branchHistory.value.includes(tag)) {
      branchHistory.value.push(tag)
    }
  }
  
  // 移除用户标签
  const removeTag = (tag: string) => {
    userTags.value.delete(tag)
  }
  
  // 检查用户是否拥有某个标签
  const hasTag = (tag: string): boolean => {
    return userTags.value.has(tag)
  }
  
  // 检查用户是否拥有多个标签中的任意一个（OR逻辑）
  const hasAnyTag = (tags: string[]): boolean => {
    return tags.some(tag => userTags.value.has(tag))
  }
  
  // 检查用户是否拥有所有指定标签（AND逻辑）
  const hasAllTags = (tags: string[]): boolean => {
    return tags.every(tag => userTags.value.has(tag))
  }
  
  // 设置分支标签（兼容旧接口）
  const setBranchTag = (tag: string) => {
    addTag(tag)
  }
  
  // 清除所有用户标签
  const clearAllTags = () => {
    userTags.value.clear()
  }
  
  // 重置所有分支状态
  const resetBranchState = () => {
    userTags.value.clear()
    branchHistory.value = []
  }
  
  // 解析分支条件字符串，支持多种格式：
  // "A" - 单个标签
  // "A,B,C" - 多个标签（OR逻辑，拥有任意一个即可）
  // "A&B&C" - 多个标签（AND逻辑，必须拥有所有标签）
  // "A,B&C" - 混合逻辑（A 或者 B且C）
  // "(A,B)&C" - 括号优先级（(A或B) 且 C）
  const parseBranchCondition = (condition: string): boolean => {
    const trimmed = condition.trim()
    
    // 处理括号优先级
    if (trimmed.includes('(') && trimmed.includes(')')) {
      return evaluateWithParentheses(trimmed)
    }
    
    // 处理混合逻辑：先按逗号分割（OR优先级较低）
    if (trimmed.includes(',')) {
      const orParts = trimmed.split(',').map(part => part.trim())
      // 对每个OR部分进行AND检查
      return orParts.some(part => {
        if (part.includes('&')) {
          // 这是一个AND组合
          const andTags = part.split('&').map(tag => tag.trim())
          return andTags.every(tag => userTags.value.has(tag))
        } else {
          // 单个标签
          return userTags.value.has(part)
        }
      })
    }
    
    // 处理纯AND逻辑
    if (trimmed.includes('&')) {
      const andTags = trimmed.split('&').map(tag => tag.trim())
      return andTags.every(tag => userTags.value.has(tag))
    }
    
    // 单个标签
    return userTags.value.has(trimmed)
  }
  
  // 处理带括号的复杂表达式
  const evaluateWithParentheses = (expression: string): boolean => {
    let expr = expression.trim()
    
    // 递归处理最内层括号
    while (expr.includes('(')) {
      const start = expr.lastIndexOf('(')
      const end = expr.indexOf(')', start)
      if (end === -1) break // 括号不匹配，跳出
      
      const innerExpr = expr.substring(start + 1, end)
      const result = parseBranchCondition(innerExpr)
      
      // 用结果替换括号表达式
      expr = expr.substring(0, start) + (result ? 'TRUE' : 'FALSE') + expr.substring(end + 1)
    }
    
    // 处理剩余的逻辑运算
    return parseBranchCondition(expr.replace(/TRUE/g, 'T').replace(/FALSE/g, 'F'))
  }
  
  // 检查是否可以显示某个对话（基于分支条件）
  const canShowDialogue = (requiredBranchTag?: string): boolean => {
    // 如果没有分支要求，总是显示
    if (!requiredBranchTag) {
      return true
    }
    
    // 直接使用新的parseBranchCondition函数进行评估
    return parseBranchCondition(requiredBranchTag)
  }
  
  // 获取用户当前拥有的所有标签
  const getUserTags = (): string[] => {
    return Array.from(userTags.value)
  }
  
  return {
    userTags,
    branchHistory,
    addTag,
    removeTag,
    hasTag,
    hasAnyTag,
    hasAllTags,
    setBranchTag, // 兼容旧接口
    clearAllTags,
    resetBranchState,
    canShowDialogue,
    getUserTags,
    parseBranchCondition
  }
})