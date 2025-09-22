import { DirEntry } from "@tauri-apps/plugin-fs";
import { ResType } from "../script/var";
import { Modification, PropertyPath } from "../script/common/snapshot";
import { Spine } from "pixi-spine";
import { Raw} from 'vue';

export interface DoroApp {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
}

export interface Project {
    projectName: string;
    savePath: string;
    createdAt: Date;
    updatedAt?: Date;
    tags?: string[];
}

export interface AssetPath {
    character: string | URL,
    image: string | URL,
    video: string | URL,
    audio: string | URL,
    package: string | URL
}

export interface dirs {
    path: string,
    data: DirEntry,
    time: number
    childrenDirs?: dirs[] | []
}

enum Company {
    ELYSION = "ELYSION",
    POLGAIM = "POLGAIM",
    TETRA = "TETRA",
    MISSILIS = "MISSILIS"
}

export interface CharacterType {
    characterName: string;
    quality: "ssr" | "sr" | "r";
    company: Company;
    path?: {
        name: string;
        skel: string;
        aimSkel?: string;
        coverSkel?: string;
    };
}

export enum DragType {
    ACTION = "Action",
    ACTION_ITEM = "ActionItem",
    ASSEST = "Asset",
}

export enum ActionItemtype {
    LOAD = "load",
    NORMAL = "normal"
}

/**
 * 用于指定这个Action Item的用途
 */
export enum ASIType {
    BACKGROUND = "Background",
    BGM = "Bgm",
    DIALOGUE = "Dialogue",
    CHECKDIALOGUE = "CheckDialogue",
    EFFECT = "Effect",
    SCENE = "Scene",
    OPERATINGCAMERA = "OperatingCamera", // 操作摄像机
    AUDIO = "Audio", // 音频播放
    TRANSITION = "Transition", // 过渡效果
    WAIT = "Wait" // 等待
}

export interface LoadRes {
    name: string;
    path: string;
    type: ResType;
    resource?: any;
}

/**
 * 用于存储一个场景的快照
 */
export interface Snapshot {
    camera: {
        x: number;
        y: number;
        zoom: number;
    };
    characters: Map<string, { x: number; y: number; scale: number }>;
    background: {
        image: string;
        parallax: number;
    };
    sound: {
        bgm: string;
        sfx: string[];
    };
}

export enum GameMode {
    PREVIEW = "Preview",
    SCENE = "Scene",
    PLAY = "Play",
}

export type ActionCallback = () => Promise<void> | void;

export interface ActionItems {
    type: ASIType,
    snapshot?: Snapshot, // 存储快照
    modification?: Map<PropertyPath, Modification>, // 当前ActionItem对快照的修改
    wait?: boolean
    action?: ActionCallback,
}

/**
 * Action集合 由标题和多个ActionItem组成
 * */
export interface Actions {
    title: string
    as: ActionItems[]
}

export interface DialogTextData {
    speakerColor: number,
    speaker: string,
    texts: {
        text: string; // 话语内容
        isCameraProxy?: boolean; // 是否是摄像机代理
        cameraParms?: {
            targetX: number; // 摄像机的目标X轴坐标
            targetY: number; // 摄像机的目标Y轴坐标
            targetZoom: number; // 摄像机的目标缩放
            time: number; // 摄像机移动的时间
            ease: string; // 摄像机移动的缓动函数
            isMove: boolean; // 摄像机是否移动
            delay: number; // 摄像机移动的延迟
            callback: Function; // 摄像机移动结束后的回调
        };
        customAction?: Function; // 自定义行为或函数
    }[];
    mode: DialogueType,
    isBind?: boolean; // 是否绑定角色
    parms?: {
        CharacterName: string; // 绑定的角色名
        yOffSet: number; // 摄像机的Y轴偏移
        xOffSet: number; // 摄像机的X轴偏移
        isMove: boolean; // 摄像机是否移动
        spine?: Raw<Spine>; // 绑定的Spine动画数据
        cameraStandTypeIndex?: number; // 机位类型索引
        easeIndex?: number; // 缓动函数索引
        cameraStandType?: 'large' | 'medium' | 'small'; // 机位类型
        ease?: string; // 缓动函数
        duration?: number; // 动画时长
        animation?: string;
        amintionOption?: DropdownOption[];
        animationIndex?: number; // 动画索引
        isLoop: boolean; // 是否循环播放动画
    };
    advancedMode?: boolean;
}

// 对话类型
export enum DialogueType {
    NORMAL = "Normal",
    VOICEOVER = "Voiceover", // 旁白
    COMMANDER = "Commander", // 指挥官的回答->并非分支
}

export interface InputOption {
    label: string,
    value: any,
    type: string,
    disabled: boolean
}

export interface DropdownOption {
    label: string;
    value: string | number ;
}

export interface sceneCharacter {
    character: CharacterType,
    x: number,
    y: number,
    scale: number,
    selectAnimation: number,
    animationOption: DropdownOption[], 
    spine: Raw<Spine> // 使用原始数据 不加入响应式 Spine对象数据非常复杂
}

export interface ControlPoint {
    x: number;
    y: number;

}