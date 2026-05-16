import * as PIXI from 'pixi.js';
import type { Spine } from 'pixi-spine';
import { basename, extname } from '@tauri-apps/api/path';
import { BaseDirectory, copyFile, exists, mkdir, readFile } from '@tauri-apps/plugin-fs';
import type { SlotTextureOverride } from '../types/app';

const CUSTOM_SPINE_SKIN_DIR = 'custom/spine-skins';

const textureCache = new Map<string, PIXI.Texture>();
const textureLoaders = new Map<string, Promise<PIXI.Texture>>();
const assetUrlCache = new Map<string, string>();

const getImageMimeType = (assetPath: string) => {
    const extension = assetPath.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'jpg':
        case 'jpeg':
            return 'image/jpeg';
        case 'webp':
            return 'image/webp';
        case 'gif':
            return 'image/gif';
        case 'bmp':
            return 'image/bmp';
        default:
            return 'image/png';
    }
};

export interface SpineAtlasPageInfo {
    key: string;
    name: string;
    index: number;
    baseTexture: PIXI.BaseTexture;
    page: any;
}

const ensureCustomSpineSkinDir = async () => {
    const dirExists = await exists(CUSTOM_SPINE_SKIN_DIR, { baseDir: BaseDirectory.AppLocalData });
    if (!dirExists) {
        await mkdir(CUSTOM_SPINE_SKIN_DIR, {
            baseDir: BaseDirectory.AppLocalData,
            recursive: true,
        });
    }
};

const resolveCustomSkinUrl = async (assetPath: string) => {
    const cached = assetUrlCache.get(assetPath);
    if (cached) {
        return cached;
    }

    const fileBuffer = await readFile(assetPath, { baseDir: BaseDirectory.AppLocalData });
    const blob = new Blob([fileBuffer], { type: getImageMimeType(assetPath) });
    const url = URL.createObjectURL(blob);
    assetUrlCache.set(assetPath, url);
    return url;
};

export async function importCustomSkinImage(sourcePath: string): Promise<SlotTextureOverride> {
    await ensureCustomSpineSkinDir();

    const sourceFileName = await basename(sourcePath);
    const extension = (await extname(sourcePath)) || 'png';
    const normalizedExtension = extension.replace(/^\./, '') || 'png';
    const targetFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${normalizedExtension}`;
    const assetPath = `${CUSTOM_SPINE_SKIN_DIR}/${targetFileName}`;

    await copyFile(sourcePath, assetPath, {
        toPathBaseDir: BaseDirectory.AppLocalData,
    });

    return {
        assetPath,
        fileName: sourceFileName,
    };
}

export function getSpineAtlasPageKey(page: any, fallbackIndex: number, skinName?: string | null) {
    const pageName = typeof page?.name === 'string' ? page.name.trim() : '';
    const normalizedSkinName = skinName?.trim() || 'default';
    return `${normalizedSkinName}::${pageName || `__page_${fallbackIndex}`}`;
}

const collectSkinAttachmentPages = (skin: any, appendPage: (attachment: any) => void) => {
    if (typeof skin?.getAttachments !== 'function') {
        return;
    }

    const attachments = skin.getAttachments();
    attachments.forEach((entry: any) => {
        appendPage(entry?.attachment);
    });
};

export function collectSpineAtlasPages(spine?: Spine | null, skinName?: string | null): SpineAtlasPageInfo[] {
    if (!spine) {
        return [];
    }

    const pages: SpineAtlasPageInfo[] = [];
    const pageIndexMap = new Map<any, number>();
    const seenPages = new Set<any>();

    const appendPage = (attachment: any) => {
        const region = attachment?.region;
        const page = region?.page;
        const baseTexture = page?.baseTexture || region?.texture?.baseTexture;
        if (!baseTexture) {
            return;
        }

        const identity = page || baseTexture;
        if (seenPages.has(identity)) {
            return;
        }

        const pageIndex = pageIndexMap.size;
        pageIndexMap.set(identity, pageIndex);
        seenPages.add(identity);
        pages.push({
            key: getSpineAtlasPageKey(page, pageIndex, currentSkinName),
            name: typeof page?.name === 'string' ? page.name : '',
            index: pageIndex,
            baseTexture,
            page,
        });
    };

    const skins = ((spine as any)?.spineData?.skins || spine.skeleton?.data?.skins || []) as any[];
    const currentSkinName = skinName?.trim() || spine.skeleton?.skin?.name || '';
    const currentSkin = currentSkinName
        ? skins.find((skin) => skin?.name === currentSkinName)
        : null;

    if (currentSkin) {
        collectSkinAttachmentPages(currentSkin, appendPage);
    }

    if (pages.length === 0) {
        (spine.skeleton?.slots || []).forEach((slot: any) => {
            appendPage(slot?.getAttachment?.() || slot?.attachment || slot?.originalAttachment);
        });
    }

    if (pages.length === 0) {
        skins.forEach((skin) => collectSkinAttachmentPages(skin, appendPage));
    }

    return pages;
}

export function getCachedCustomSkinTexture(assetPath?: string | null) {
    if (!assetPath) {
        return null;
    }

    return textureCache.get(assetPath) || null;
}

export async function ensureCustomSkinTexture(assetPath: string) {
    const cached = textureCache.get(assetPath);
    if (cached) {
        return cached;
    }

    const existingLoader = textureLoaders.get(assetPath);
    if (existingLoader) {
        return existingLoader;
    }

    const loader = (async () => {
        const url = await resolveCustomSkinUrl(assetPath);
        const texture = await PIXI.Texture.fromURL(url);
        textureCache.set(assetPath, texture);
        return texture;
    })();

    textureLoaders.set(assetPath, loader);

    try {
        return await loader;
    } finally {
        textureLoaders.delete(assetPath);
    }
}
