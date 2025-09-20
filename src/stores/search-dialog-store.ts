import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ResType } from '../script/var'

export const useSearchDialogStore = defineStore('searchDialog', () => {
    const visible = ref(false)
    const mode = ref<"res" | "character" | "Image" | "sceneCharacter">('res')
    const type = ref<ResType>(ResType.Image)
    const fileName = ref('')
    
    let resolveCallback: ((value: any) => void) | null = null
    let rejectCallback: (() => void) | null = null

    const showDialog = <T>(dialogMode: "res" | "character" | "Image" | "sceneCharacter", props: Record<string, any>): Promise<T> => {
        return new Promise((resolve, reject) => {
            mode.value = dialogMode
            type.value = props.type || ResType.Image
            fileName.value = props.fileName || ''
            visible.value = true
            
            resolveCallback = resolve
            rejectCallback = reject
        })
    }

    const handleSelect = (value: any) => {
        visible.value = false
        if (resolveCallback) {
            resolveCallback(value)
            resolveCallback = null
            rejectCallback = null
        }
    }

    const handleClose = () => {
        visible.value = false
        if (rejectCallback) {
            rejectCallback()
            resolveCallback = null
            rejectCallback = null
        }
    }

    return {
        visible,
        mode,
        type,
        fileName,
        showDialog,
        handleSelect,
        handleClose
    }
})