import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import type { SlotCustomization, SpineCharacterCustomization } from '../types/app';
import { ensureCustomSkinTexture, getCachedCustomSkinTexture, getSpineAtlasPageKey } from './spine-skin-service';

const animatedFilters = new Set<PIXI.Filter>();
let animationTickerBound = false;
const DORO_SHADER_FILTER_KEY = '__doroShaderFilter';

const ensureAnimationTicker = () => {
    if (animationTickerBound) {
        return;
    }

    animationTickerBound = true;
    PIXI.Ticker.shared.add(() => {
        const time = performance.now() / 1000;
        animatedFilters.forEach((filter) => {
            if (filter.uniforms.iTime !== undefined) {
                filter.uniforms.iTime = time;
            }
            if (filter.uniforms.uTime !== undefined) {
                filter.uniforms.uTime = time;
            }
        });
    });
};

export function cloneCustomization(customization?: SpineCharacterCustomization | null): SpineCharacterCustomization {
    return {
        selectedAnimationName: customization?.selectedAnimationName,
        selectedSkinName: customization?.selectedSkinName,
        selectedSkinVariantId: customization?.selectedSkinVariantId,
        atlasOverrides: JSON.parse(JSON.stringify(customization?.atlasOverrides || {})),
        customSkinVariants: JSON.parse(JSON.stringify(customization?.customSkinVariants || [])),
        slots: JSON.parse(JSON.stringify(customization?.slots || {})),
    };
}

const DEFAULT_TINT = 0xffffff;

const ensureBaseSlotColor = (slot: any) => {
    if (!slot.__doroBaseColor) {
        slot.__doroBaseColor = {
            r: slot.color.r,
            g: slot.color.g,
            b: slot.color.b,
            a: slot.color.a,
        };
    }

    return slot.__doroBaseColor;
};

const getNonDoroFilters = (displayObject: any): PIXI.Filter[] => {
    return ((displayObject?.filters || []) as PIXI.Filter[]).filter((filter) => !(filter as any)?.[DORO_SHADER_FILTER_KEY]);
};

const clearDoroShaderFilters = (displayObject: any) => {
    if (!displayObject) {
        return;
    }

    ((displayObject.filters || []) as PIXI.Filter[]).forEach((filter) => {
        if ((filter as any)?.[DORO_SHADER_FILTER_KEY]) {
            animatedFilters.delete(filter);
        }
    });

    const nextFilters = getNonDoroFilters(displayObject);
    displayObject.filters = nextFilters.length > 0 ? nextFilters : [];
};

const getSlotFilterHost = (spine: Spine, slot: any, target: any) => {
    return (spine as any).slotContainers?.[slot.data.index] || target || null;
};

const cloneRectangle = (rect: PIXI.Rectangle | null | undefined) => {
    if (!rect) {
        return undefined;
    }

    return new PIXI.Rectangle(rect.x, rect.y, rect.width, rect.height);
};

const cloneTextureWithBaseTexture = (templateTexture: PIXI.Texture, baseTexture: PIXI.BaseTexture) => {
    const nextTexture = new PIXI.Texture(
        baseTexture,
        cloneRectangle(templateTexture.frame),
        cloneRectangle(templateTexture.orig),
        cloneRectangle(templateTexture.trim),
        templateTexture.rotate,
    );

    if (nextTexture.defaultAnchor?.copyFrom && templateTexture.defaultAnchor) {
        nextTexture.defaultAnchor.copyFrom(templateTexture.defaultAnchor);
    }

    nextTexture.updateUvs();
    return nextTexture;
};

const resolveCompatibleAtlasResolution = (
    originalBaseTexture: PIXI.BaseTexture,
    overrideBaseTexture: PIXI.BaseTexture,
) => {
    const originalLogicalWidth = originalBaseTexture.width || 0;
    const originalLogicalHeight = originalBaseTexture.height || 0;
    const overrideRealWidth = overrideBaseTexture.realWidth || 0;
    const overrideRealHeight = overrideBaseTexture.realHeight || 0;

    const widthResolution = originalLogicalWidth > 0 ? overrideRealWidth / originalLogicalWidth : 0;
    const heightResolution = originalLogicalHeight > 0 ? overrideRealHeight / originalLogicalHeight : 0;
    const hasWidthResolution = Number.isFinite(widthResolution) && widthResolution > 0;
    const hasHeightResolution = Number.isFinite(heightResolution) && heightResolution > 0;

    if (hasWidthResolution && hasHeightResolution) {
        if (Math.abs(widthResolution - heightResolution) > 0.01) {
            console.warn('自定义 Spine 图集尺寸与原图比例不一致，可能导致显示异常', {
                originalLogicalWidth,
                originalLogicalHeight,
                overrideRealWidth,
                overrideRealHeight,
                widthResolution,
                heightResolution,
            });
        }

        return (widthResolution + heightResolution) / 2;
    }

    if (hasWidthResolution) {
        return widthResolution;
    }

    if (hasHeightResolution) {
        return heightResolution;
    }

    return originalBaseTexture.resolution || 1;
};

const createAtlasCompatibleTexture = (templateTexture: PIXI.Texture, overrideTexture: PIXI.Texture) => {
    const originalBaseTexture = templateTexture.baseTexture;
    const overrideBaseTexture = overrideTexture.baseTexture;
    const overrideSource = (overrideBaseTexture.resource as any)?.source;
    const compatibleResolution = resolveCompatibleAtlasResolution(originalBaseTexture, overrideBaseTexture);

    if (!overrideSource) {
        return cloneTextureWithBaseTexture(templateTexture, overrideBaseTexture);
    }

    const compatibleBaseTexture = new PIXI.BaseTexture(overrideSource, {
        resolution: compatibleResolution,
        scaleMode: originalBaseTexture.scaleMode,
        alphaMode: overrideBaseTexture.alphaMode,
        mipmap: originalBaseTexture.mipmap,
        wrapMode: originalBaseTexture.wrapMode,
        anisotropicLevel: originalBaseTexture.anisotropicLevel,
        format: overrideBaseTexture.format,
        type: overrideBaseTexture.type,
    });

    if (overrideBaseTexture.valid) {
        compatibleBaseTexture.setRealSize(
            overrideBaseTexture.realWidth,
            overrideBaseTexture.realHeight,
            compatibleResolution,
        );
    }

    return cloneTextureWithBaseTexture(templateTexture, compatibleBaseTexture);
};

interface SpineAttachmentEntry {
    slotIndex: number;
    attachment: any;
    pageKey: string;
}

const nextFrame = async () => {
    await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
    });
};

const collectAtlasAttachmentEntries = (spine: Spine, skinName?: string | null) => {
    const entries: SpineAttachmentEntry[] = [];
    const skins = ((spine as any)?.spineData?.skins || spine.skeleton?.data?.skins || []) as any[];
    const pageIndexes = new Map<any, number>();
    const processedAttachments = new Set<any>();

    const appendAttachment = (slotIndex: number, attachment: any) => {
        if (!attachment || processedAttachments.has(attachment)) {
            return;
        }

        const region = attachment.region;
        const texture = region?.texture;
        const baseTexture = region?.page?.baseTexture || texture?.baseTexture;
        if (!region || !texture || !baseTexture) {
            return;
        }

        processedAttachments.add(attachment);

        const pageIdentity = region.page || baseTexture;
        if (!pageIndexes.has(pageIdentity)) {
            pageIndexes.set(pageIdentity, pageIndexes.size);
        }

        entries.push({
            slotIndex,
            attachment,
            pageKey: getSpineAtlasPageKey(region.page, pageIndexes.get(pageIdentity) || 0, currentSkinName),
        });
    };

    const currentSkinName = skinName?.trim() || spine.skeleton?.skin?.name || '';
    const currentSkin = currentSkinName
        ? skins.find((skin) => skin?.name === currentSkinName)
        : null;

    if (currentSkin && typeof currentSkin?.getAttachments === 'function') {
        currentSkin.getAttachments().forEach((entry: any) => {
            appendAttachment(entry?.slotIndex, entry?.attachment);
        });
    }

    if (entries.length === 0) {
        (spine.skeleton?.slots || []).forEach((slot: any, index: number) => {
            const attachment = slot?.getAttachment?.() || slot?.attachment || slot?.originalAttachment;
            appendAttachment(index, attachment);
        });
    }

    if (entries.length === 0) {
        skins.forEach((skin) => {
            if (typeof skin?.getAttachments !== 'function') {
                return;
            }

            skin.getAttachments().forEach((entry: any) => {
                appendAttachment(entry?.slotIndex, entry?.attachment);
            });
        });
    }

    return entries;
};

const restoreAtlasAttachmentTexture = (entry: SpineAttachmentEntry, spine: Spine) => {
    const region = entry.attachment?.region;
    const originalTexture = region?.__doroOriginalTexture;
    if (!region || !originalTexture || region.texture === originalTexture) {
        return;
    }

    region.texture = originalTexture;
    const slot = spine.skeleton?.slots?.[entry.slotIndex] as any;
    if (!slot || slot.getAttachment?.() !== entry.attachment) {
        return;
    }

    if (slot.currentSprite) {
        slot.currentSprite.region = null;
        slot.currentSprite.attachment = null;
        (spine as any).setSpriteRegion?.(entry.attachment, slot.currentSprite, region);
    } else if (slot.currentMesh) {
        slot.currentMesh.region = null;
        slot.currentMesh.attachment = null;
        (spine as any).setMeshRegion?.(entry.attachment, slot.currentMesh, region);
    }
};

const applyAtlasTextureToAttachment = (
    entry: SpineAttachmentEntry,
    spine: Spine,
    assetPath: string,
    overrideTexture: PIXI.Texture,
) => {
    const region = entry.attachment?.region;
    if (!region?.texture) {
        return;
    }

    if (!region.__doroOriginalTexture) {
        region.__doroOriginalTexture = region.texture;
    }

    if (!region.__doroAtlasTextureCache) {
        region.__doroAtlasTextureCache = new Map<string, PIXI.Texture>();
    }

    const originalResolution = region.__doroOriginalTexture.baseTexture.resolution;
    const textureCacheKey = `${assetPath}::${originalResolution}`;

    let nextTexture = region.__doroAtlasTextureCache.get(textureCacheKey);
    if (!nextTexture) {
        nextTexture = createAtlasCompatibleTexture(region.__doroOriginalTexture, overrideTexture);
        region.__doroAtlasTextureCache.set(textureCacheKey, nextTexture);
    }

    if (region.texture !== nextTexture) {
        region.texture = nextTexture;
    }

    const slot = spine.skeleton?.slots?.[entry.slotIndex] as any;
    if (!slot || slot.getAttachment?.() !== entry.attachment) {
        return;
    }

    if (slot.currentSprite) {
        slot.currentSprite.region = null;
        slot.currentSprite.attachment = null;
        (spine as any).setSpriteRegion?.(entry.attachment, slot.currentSprite, region);
    } else if (slot.currentMesh) {
        slot.currentMesh.region = null;
        slot.currentMesh.attachment = null;
        (spine as any).setMeshRegion?.(entry.attachment, slot.currentMesh, region);
    }
};

const buildAtlasOverrideSignature = (customization?: SpineCharacterCustomization | null) => {
    const normalizedEntries = Object.entries(customization?.atlasOverrides || {})
        .filter(([, override]) => !!override?.assetPath?.trim())
        .map(([pageKey, override]) => [pageKey, override.assetPath.trim()] as const)
        .sort(([left], [right]) => left.localeCompare(right));

    return JSON.stringify({
        skin: customization?.selectedSkinName?.trim() || '',
        skinVariantId: customization?.selectedSkinVariantId?.trim() || '',
        atlasOverrides: normalizedEntries,
    });
};

const applySkinAtlasOverrides = async (spine: Spine, customization?: SpineCharacterCustomization | null) => {
    const entries = collectAtlasAttachmentEntries(spine, customization?.selectedSkinName);
    if (entries.length === 0) {
        return;
    }

    const nextSignature = buildAtlasOverrideSignature(customization);
    const spineState = spine as any;
    const previousSignature = spineState.__doroAppliedAtlasOverrideSignature || '';
    if (previousSignature === nextSignature) {
        return;
    }

    const overrideRunId = (spineState.__doroAtlasOverrideRunId || 0) + 1;
    spineState.__doroAtlasOverrideRunId = overrideRunId;

    const entriesByPageKey = new Map<string, SpineAttachmentEntry[]>();
    entries.forEach((entry) => {
        const pageEntries = entriesByPageKey.get(entry.pageKey) || [];
        pageEntries.push(entry);
        entriesByPageKey.set(entry.pageKey, pageEntries);
    });

    const applyEntriesInBatches = async (
        pageEntries: SpineAttachmentEntry[],
        runner: (entry: SpineAttachmentEntry) => void,
    ) => {
        const batchSize = 18;
        for (let index = 0; index < pageEntries.length; index += batchSize) {
            if (spineState.destroyed || !spine.skeleton || spineState.__doroAtlasOverrideRunId !== overrideRunId) {
                return false;
            }

            pageEntries.slice(index, index + batchSize).forEach(runner);
            spine.update(0);

            if (index + batchSize < pageEntries.length) {
                await nextFrame();
            }
        }

        return true;
    };

    for (const [pageKey, pageEntries] of entriesByPageKey.entries()) {
        const assetPath = customization?.atlasOverrides?.[pageKey]?.assetPath?.trim();
        if (!assetPath) {
            const restored = await applyEntriesInBatches(pageEntries, (entry) => restoreAtlasAttachmentTexture(entry, spine));
            if (!restored) {
                return;
            }
            continue;
        }

        const applyOverride = (texture: PIXI.Texture) => {
            if (spineState.destroyed || !spine.skeleton || spineState.__doroAtlasOverrideRunId !== overrideRunId) {
                return false;
            }

            if (customization?.atlasOverrides?.[pageKey]?.assetPath?.trim() !== assetPath) {
                return false;
            }

            return applyEntriesInBatches(pageEntries, (entry) => applyAtlasTextureToAttachment(entry, spine, assetPath, texture));
        };

        const cachedTexture = getCachedCustomSkinTexture(assetPath);
        if (cachedTexture) {
            const applied = await applyOverride(cachedTexture);
            if (!applied) {
                return;
            }
            continue;
        }

        try {
            const texture = await ensureCustomSkinTexture(assetPath);
            const applied = await applyOverride(texture);
            if (!applied) {
                return;
            }
        } catch (error) {
            console.error(`加载自定义 Spine 图集失败: ${assetPath}`, error);
        }
    }

    if (!spineState.destroyed && spine.skeleton && spineState.__doroAtlasOverrideRunId === overrideRunId) {
        spineState.__doroAppliedAtlasOverrideSignature = nextSignature;
    }
};

export function applySlotRuntimeColor(slot: any, tint: number = DEFAULT_TINT, alpha?: number) {
    if (!slot?.color) {
        return;
    }

    const baseSlotColor = ensureBaseSlotColor(slot);
    const tintR = ((tint >> 16) & 0xff) / 255;
    const tintG = ((tint >> 8) & 0xff) / 255;
    const tintB = (tint & 0xff) / 255;

    slot.color.r = baseSlotColor.r * tintR;
    slot.color.g = baseSlotColor.g * tintG;
    slot.color.b = baseSlotColor.b * tintB;
    slot.color.a = alpha ?? baseSlotColor.a;
}

export function applySlotCustomization(
    spine: Spine,
    slotName: string,
    customization?: SlotCustomization | null,
    filterArea?: PIXI.Rectangle | null,
) {
    if (!customization || !spine.skeleton) {
        return;
    }

    const skeleton = spine.skeleton;
    const slot = skeleton.findSlot(slotName) as any;
    if (!slot) {
        return;
    }

    if (customization.visible !== undefined) {
        if (customization.visible) {
            const slotData = skeleton.data.findSlot(slotName);
            if (slotData?.attachmentName) {
                skeleton.setAttachment(slotName, slotData.attachmentName);
            } else if (slot.originalAttachment) {
                skeleton.setAttachment(slotName, slot.originalAttachment.name);
            }
        } else {
            const attachment = slot.getAttachment?.();
            if (attachment) {
                slot.originalAttachment = attachment;
            }
            (skeleton as any).setAttachment(slotName, null);
        }
    }

    const currentAttachment = slot.getAttachment?.();
    const textureOverridePath = customization.textureOverride?.assetPath?.trim();

    if (!textureOverridePath) {
        slot.__doroTextureOverridePath = '';
        if (currentAttachment && (slot.hackRegion || slot.hackAttachment)) {
            (spine as any).hackTextureBySlotName?.(slotName, null);
        }
    } else if (currentAttachment) {
        slot.__doroTextureOverridePath = textureOverridePath;

        const applyTextureOverride = (texture: PIXI.Texture) => {
            if ((spine as any).destroyed || !spine.skeleton) {
                return;
            }

            const activeSlot = spine.skeleton.findSlot(slotName) as any;
            if (!activeSlot || activeSlot.__doroTextureOverridePath !== textureOverridePath) {
                return;
            }

            (spine as any).hackTextureBySlotName?.(slotName, texture);
            spine.update(0);
        };

        const cachedTexture = getCachedCustomSkinTexture(textureOverridePath);
        if (cachedTexture) {
            applyTextureOverride(cachedTexture);
        } else {
            ensureCustomSkinTexture(textureOverridePath)
                .then(applyTextureOverride)
                .catch((error) => {
                    console.error(`加载自定义 Spine 贴图失败: ${textureOverridePath}`, error);
                });
        }
    }

    const target = slot.currentSprite || slot.currentMesh;
    const filterHost = getSlotFilterHost(spine, slot, target);

    applySlotRuntimeColor(slot, customization.tint ?? DEFAULT_TINT, customization.alpha);

    if (target && filterHost !== target) {
        clearDoroShaderFilters(target);
    }

    if (customization.shader?.fragmentShader && filterHost) {
        clearDoroShaderFilters(filterHost);
        filterHost.filterArea = filterArea ? filterArea.clone() : null;

        const filter = new PIXI.Filter(undefined, customization.shader.fragmentShader, customization.shader.uniforms || {});
        (filter as any)[DORO_SHADER_FILTER_KEY] = true;
        (filter as any).autoFit = false;
        filter.padding = 24;
        if (filter.uniforms.iTime !== undefined || filter.uniforms.uTime !== undefined) {
            ensureAnimationTicker();
            animatedFilters.add(filter);
        }

        const nextFilters = [...getNonDoroFilters(filterHost), filter];
        filterHost.filters = nextFilters;
    } else if (customization.shader === null) {
        clearDoroShaderFilters(filterHost);
        if (filterHost) {
            filterHost.filterArea = null;
        }
        if (target && filterHost !== target) {
            clearDoroShaderFilters(target);
            target.filterArea = null;
        }
    }
}

export interface ApplySpineCustomizationOptions {
    includeAnimation?: boolean;
    includeSkin?: boolean;
    includeAtlasOverrides?: boolean;
    slotNames?: string[];
    filterArea?: PIXI.Rectangle | null;
}

export async function applySpineCustomization(
    spine: Spine,
    customization?: SpineCharacterCustomization | null,
    options: ApplySpineCustomizationOptions = {},
) {
    if (!spine || !customization) {
        return;
    }

    const includeAnimation = options.includeAnimation ?? true;
    const includeSkin = options.includeSkin ?? true;
    const includeAtlasOverrides = options.includeAtlasOverrides ?? true;
    const slotNameSet = options.slotNames ? new Set(options.slotNames) : null;
    const currentAnimationName = (spine.state as any)?.getCurrent?.(0)?.animation?.name;
    const filterArea = options.filterArea ?? null;
    const spineState = spine as any;
    const nextSkinStateKey = buildAtlasOverrideSignature(customization);
    const previousSkinStateKey = spineState.__doroAppliedSkinStateKey || '';

    if (
        includeSkin &&
        customization.selectedSkinName &&
        spine.skeleton?.data?.findSkin(customization.selectedSkinName) &&
        (
            spine.skeleton.skin?.name !== customization.selectedSkinName
            || previousSkinStateKey !== nextSkinStateKey
        )
    ) {
        spine.skeleton.setSkinByName(customization.selectedSkinName);
        spine.skeleton.setSlotsToSetupPose();
    }

    if (includeAtlasOverrides) {
        await applySkinAtlasOverrides(spine, customization);
    }

    if (
        includeAnimation &&
        customization.selectedAnimationName &&
        spine.state?.hasAnimation(customization.selectedAnimationName) &&
        currentAnimationName !== customization.selectedAnimationName
    ) {
        spine.state.setAnimation(0, customization.selectedAnimationName, true);
    }

    Object.entries(customization.slots || {})
        .filter(([slotName]) => !slotNameSet || slotNameSet.has(slotName))
        .forEach(([slotName, slotCustomization]) => {
        applySlotCustomization(spine, slotName, slotCustomization, filterArea);
        });

    spine.update(0);
    spineState.__doroAppliedSkinStateKey = nextSkinStateKey;
}
