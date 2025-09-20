import { Assets, Texture } from "pixi.js";
import { Spine } from "pixi-spine";  // 用于加载 spine 资源
import { ResType } from "./var";
import { Sound } from "@pixi/sound";


class ResourceManager {
    private static textures: Record<string, Texture> = {}; // 存储加载的纹理
    private static sounds: Record<string, Sound> = {}; // 存储加载的音频
    private static spineData: Record<string, Spine> = {}; // 存储加载的 spine 数据

    public static allResUrl: Record<string, string> = {}; // 存储加载的URL

    /**
     * 加载资源到内存
     * @param key 资源的唯一标识
     * @param url 资源路径
     * @param type 资源类型
     */
    static async loadResource(key: string, url: string, type: ResType): Promise<boolean> {
        if (this.isResourceLoaded(key, type)) {
            console.warn(`资源已加载: ${key}`);
            return false;
        }

        try {
            switch (type) {
                case ResType.Image:
                    const texture = await Assets.load(url);
                    this.textures[key] = texture as Texture;
                    console.log(`图像资源加载成功: ${key}`);
                    break;
                case ResType.Audio:
                    const sound = await Sound.from(url);
                    this.sounds[key] = sound;
                    console.log(`音频资源加载成功: ${key}`);
                    break;
                case ResType.Spine:
                    const spine = await Assets.load(url);
                    this.spineData[key] = new Spine(spine.spineData);
                    console.log(`Spine资源加载成功: ${key}`);
                    break;
                // 可以根据需求处理其他资源类型（如 Video，Package 等）
                default:
                    console.error(`未处理的资源类型: ${type}`);
                    return false;
            }

            this.allResUrl[key] = url;
            return true;
        } catch (error) {
            console.error(`资源加载失败: ${key}`, error);
            return false;
        }
    }

    /**
     * 检查资源是否已加载
     * @param key 资源的唯一标识
     * @param type 资源类型
     * @returns 是否已加载
     */
    private static isResourceLoaded(key: string, type: ResType): boolean {
        switch (type) {
            case ResType.Image:
                return !!this.textures[key];
            case ResType.Audio:
                return !!this.sounds[key];
            case ResType.Spine:
                return !!this.spineData[key];
            default:
                return false;
        }
    }

    /**
     * 获取已加载的资源
     * @param key 资源的唯一标识
     * @param type 资源类型
     * @returns 对应资源或 undefined
     */
    static getResource<T extends Texture | Sound | Spine>(key: string, type: ResType): T | undefined {
        switch (type) {
            case ResType.Image:
                return this.textures[key] as T;
            case ResType.Audio:
                return this.sounds[key] as T;
            case ResType.Spine:
                return this.spineData[key] as T;
            default:
                return undefined;
        }
    }

    /**
     * 释放资源
     * @param key 资源的唯一标识
     * @param type 资源类型
     */
    static removeResource(key: string, type: ResType) {
        switch (type) {
            case ResType.Image:
                if (this.textures[key]) {
                    this.textures[key].destroy(true);
                    delete this.textures[key];
                    console.log(`图像资源已移除: ${key}`);
                }
                break;
            case ResType.Audio:
                if (this.sounds[key]) {
                    this.sounds[key].destroy();
                    delete this.sounds[key];
                    console.log(`音频资源已移除: ${key}`);
                }
                break;
            case ResType.Spine:
                if (this.spineData[key]) {
                    this.spineData[key].destroy();
                    delete this.spineData[key];
                    console.log(`Spine资源已移除: ${key}`);
                }
                break;
            default:
                break;
        }
    }
}

export default ResourceManager;
