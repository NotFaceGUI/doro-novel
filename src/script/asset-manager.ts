import { BaseDirectory, join, resolveResource } from "@tauri-apps/api/path";
import { ASSET_AUDIO, ASSET_CHARACTER, ASSET_IMAGE, ASSET_PACKAGE, ASSET_VIDEO, CHARACTER_CONFIG } from './var';
import { AssetPath, dirs, CharacterType } from '../types/app';
import { DirEntry, exists, mkdir, readDir, readTextFile } from "@tauri-apps/plugin-fs";


class AssetManager {
    private static instance: AssetManager;
    private assetPath: { character: string; image: string; video: string; audio: string; package: string; } | undefined;

    public characters!: CharacterType[];

    private constructor() {
        console.log("资源管理器初始化！");
        this.initialize().then((value: AssetPath) => {
            console.log("初始的路径：", value);
        })
    }

    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    public getAssetPath(): AssetPath {
        if (this.assetPath) {
            return this.assetPath;
        }
        return { character: "", image: "", video: "", audio: "", package: "" };
    }

    /**
     * 初始化资源路径，并确保所有资源目录存在。
     * @returns {Promise<AssetPath>} 包含所有资源路径的对象。
     */
    public async initialize(): Promise<AssetPath> {
        this.assetPath = {
            character: "",
            image: "",
            video: "",
            audio: "",
            package: ""
        };

        this.assetPath.character = await resolveResource(ASSET_CHARACTER);
        this.assetPath.image = await resolveResource(ASSET_IMAGE);
        this.assetPath.video = await resolveResource(ASSET_VIDEO);
        this.assetPath.audio = await resolveResource(ASSET_AUDIO);
        this.assetPath.package = await resolveResource(ASSET_PACKAGE);

        console.log(this.assetPath.character);

        const paths = [this.assetPath.character, this.assetPath.image, this.assetPath.video, this.assetPath.audio, this.assetPath.package];

        for (const path of paths) {
            const isExists = await exists(path);
            if (!isExists) {
                console.log(path);
                await mkdir(path);
            }
        }

        // this.getAllFiles(ASSET_AUDIO, this.assetPath.audio);
        // this.getCurrenPathAllFiles(this.assetPath.audio).then(res => {
        //     console.log("object", res);
        // })



        return this.assetPath;
    }

    public async getResConfig() {
        if (this.characters) {
            return this.characters;
        }
        const p = await resolveResource('resources');
        const configs = await this.getCurrenPathAllForTyep(p);
        for(const config of configs){
            if (config.data.name == CHARACTER_CONFIG) {
                const contents = await readTextFile(config.path);
                this.characters = JSON.parse(contents);
                console.log(this.characters);
            }
        }

        return this.characters;
    }

    public async getAudioFiles(): Promise<dirs[]> {
        return await this.getAllFiles(ASSET_AUDIO, this.assetPath?.audio || "");
    }

    public async getCharacterFiles(): Promise<dirs[]> {
        return await this.getAllFiles(ASSET_CHARACTER, this.assetPath?.character || "");
    }

    public async getImageFiles(): Promise<dirs[]> {
        return await this.getAllFiles(ASSET_IMAGE, this.assetPath?.image || "");
    }

    public async getVideoFiles(): Promise<dirs[]> {
        return await this.getAllFiles(ASSET_VIDEO, this.assetPath?.video || "");
    }

    public async getPackageFiles(): Promise<dirs[]> {
        return await this.getAllFiles(ASSET_PACKAGE, this.assetPath?.package || "");
    }

    public async getCurrenPathAllFilesWrapped(p: string = ''): Promise<dirs[]> {
        if (p != '') {
            return await this.getCurrenPathAllFiles(p || "");
        }
        return await this.getCurrenPathAllFiles(this.assetPath?.audio || "");
    }


    public async getCurrenPathAllFiles(dirPath: string): Promise<dirs[]> {
        const files: dirs[] = [];
        const entries = await readDir(dirPath);
        for (const entry of entries) {
            files.push({
                path: dirPath + "\\" + entry.name,
                data: entry,
                time: Date.now()
            })
        }
        console.log("查询", files);
        return files;
    }

    public async getCurrenPathAllForTyep(dirPath: string, fileType: string = ".json"): Promise<dirs[]> {
        const files: dirs[] = [];
        const entries = await readDir(dirPath);
        for (const entry of entries) {
            if (entry.isFile) {
                if (entry.name.endsWith(fileType)) {
                    files.push({
                        path: dirPath + "\\" + entry.name,
                        data: entry,
                        time: Date.now()
                    });
                }
            }

        }
        console.log("查询", files);
        return files;
    }

    /**
     * 获取指定路径下的所有文件，包括子文件夹下的文件。
     * @param dirPath 要搜索的目录路径。
     * @returns {Promise<string[]>} 包含所有文件路径的数组。
     */
    public async getAllFiles(p: string, dirPath: string): Promise<dirs[]> {
        const files: dirs[] = [];
        const entries = await readDir(dirPath);
        const ds = await this.processEntriesRecursively(p, entries, files)
        console.log("paths:", ds);
        return ds;
    }


    private async processEntriesRecursively(parent: string, entries: DirEntry[], files: dirs[]): Promise<dirs[]> {
        for (const entry of entries) {
            const currentPath = await join(parent, entry.name);
            const currentDir: dirs = {
                path: currentPath,
                data: entry,
                time: Date.now(),
                childrenDirs: []
            };

            files.push(currentDir);
            // console.log(`名称: ${entry.name}, 类型: ${entry.isDirectory ? '文件夹' : '文件'}`);

            if (entry.isDirectory) {
                // 如果是目录，递归调用处理子目录
                const subEntries = await readDir(currentPath, { baseDir: BaseDirectory.Resource });
                currentDir.childrenDirs = await this.processEntriesRecursively(currentPath, subEntries, []);
            }
        }

        return files;
    }
}

export default AssetManager;