import { defineStore } from 'pinia'
import { ref } from 'vue'

// 角色配置接口
export interface CharacterConfig {
  characterName: string
  speakerColor: number
  yOffSet: number
  xOffSet: number
}

export const useCharacterConfigStore = defineStore('character-config', () => {
  // 存储所有角色的配置
  const characterConfigs = ref<Map<string, CharacterConfig>>(new Map())

  // 获取角色配置
  const getCharacterConfig = (characterName: string): CharacterConfig | undefined => {
    return characterConfigs.value.get(characterName)
  }

  // 保存角色配置
  const saveCharacterConfig = (config: CharacterConfig) => {
    characterConfigs.value.set(config.characterName, config)
  }

  // 更新角色配置的特定字段
  const updateCharacterConfig = (
    characterName: string, 
    updates: Partial<Pick<CharacterConfig, 'speakerColor' | 'yOffSet' | 'xOffSet'>>
  ) => {
    const existingConfig = characterConfigs.value.get(characterName)
    if (existingConfig) {
      const updatedConfig = { ...existingConfig, ...updates }
      characterConfigs.value.set(characterName, updatedConfig)
    } else {
      // 如果角色不存在，创建新的配置
      const newConfig: CharacterConfig = {
        characterName,
        speakerColor: updates.speakerColor ?? 0xfaaaaa,
        yOffSet: updates.yOffSet ?? 0,
        xOffSet: updates.xOffSet ?? 0
      }
      characterConfigs.value.set(characterName, newConfig)
    }
  }

  // 删除角色配置
  const removeCharacterConfig = (characterName: string) => {
    characterConfigs.value.delete(characterName)
  }

  // 获取所有角色配置
  const getAllCharacterConfigs = (): CharacterConfig[] => {
    return Array.from(characterConfigs.value.values())
  }

  // 清空所有配置
  const clearAllConfigs = () => {
    characterConfigs.value.clear()
  }

  return {
    characterConfigs,
    getCharacterConfig,
    saveCharacterConfig,
    updateCharacterConfig,
    removeCharacterConfig,
    getAllCharacterConfigs,
    clearAllConfigs
  }
}, {
  persist: {
    key: 'character-config',
    storage: localStorage,
    // 自定义序列化和反序列化，因为Map不能直接JSON序列化
    serializer: {
      serialize: (state) => {
        return JSON.stringify({
          characterConfigs: Array.from(state.characterConfigs.entries())
        })
      },
      deserialize: (value) => {
        const parsed = JSON.parse(value)
        return {
          characterConfigs: new Map(parsed.characterConfigs || [])
        }
      }
    }
  }
})