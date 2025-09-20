import { useSearchDialogStore } from '../../stores/search-dialog-store'
import { ResType } from '../var'
import { ASIType, CharacterType, LoadRes, sceneCharacter } from '../../types/app'

/**
 * 选择资源类型
 */
export function selectResType(type: ResType, fileName: string = ""): Promise<ASIType> {
    const searchStore = useSearchDialogStore()
    return searchStore.showDialog<ASIType>("res", { type, fileName })
}

/**
 * 选择角色
 */
export function selectCharacterType(): Promise<CharacterType> {
    const searchStore = useSearchDialogStore()
    return searchStore.showDialog<CharacterType>("character", { type: ResType.Spine, fileName: '' })
}

/**
 * 选择图片
 */
export function selectImageType(): Promise<LoadRes> {
    const searchStore = useSearchDialogStore()
    return searchStore.showDialog<LoadRes>("Image", { type: ResType.Image, fileName: '' })
}

/**
 * 从场景角色中选择
 */
export function selectSceneCharacterType(): Promise<sceneCharacter> {
    const searchStore = useSearchDialogStore()
    return searchStore.showDialog<sceneCharacter>("sceneCharacter", { type: ResType.Spine, fileName: '' })
}
