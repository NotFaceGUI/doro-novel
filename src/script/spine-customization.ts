import * as PIXI from 'pixi.js';
import { Spine } from 'pixi-spine';
import type { SlotCustomization, SpineCharacterCustomization } from '../types/app';

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
    slotNames?: string[];
    filterArea?: PIXI.Rectangle | null;
}

export function applySpineCustomization(
    spine: Spine,
    customization?: SpineCharacterCustomization | null,
    options: ApplySpineCustomizationOptions = {},
) {
    if (!spine || !customization) {
        return;
    }

    const includeAnimation = options.includeAnimation ?? true;
    const includeSkin = options.includeSkin ?? true;
    const slotNameSet = options.slotNames ? new Set(options.slotNames) : null;
    const currentAnimationName = (spine.state as any)?.getCurrent?.(0)?.animation?.name;
    const filterArea = options.filterArea ?? null;

    if (
        includeSkin &&
        customization.selectedSkinName &&
        spine.skeleton?.data?.findSkin(customization.selectedSkinName) &&
        spine.skeleton.skin?.name !== customization.selectedSkinName
    ) {
        spine.skeleton.setSkinByName(customization.selectedSkinName);
        spine.skeleton.setSlotsToSetupPose();
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
}
