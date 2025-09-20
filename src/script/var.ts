export const LOCAL_OPEN_KEY = "__PROJECT__OPNE__STATE__";

export const DEFAULT_WIDTH = 300;
export const MIN_WIDTH = 200;
export const MAX_WIDTH = 400;

export const ASSET_CHARACTER = "resources/character/";
export const ASSET_IMAGE = "resources/image/";
export const ASSET_AUDIO = "resources/audio/";
export const ASSET_VIDEO = "resources/video/";
export const ASSET_PACKAGE = "resources/package/";

export const CHARACTER_CONFIG = "spine-character.json";

export enum ResType {
    Image = 'image',
    Audio = 'audio',
    Video = 'video',
    Package = 'package',
    Spine = 'spine',
    Document = 'document'
}

export const DEFAULT_SPINE_SCALE = 1 * window.devicePixelRatio;
export const DEFAULT_RESOLUTION = 2 * window.devicePixelRatio; // 默认分辨率为2倍