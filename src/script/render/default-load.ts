import { Sound } from '@pixi/sound';
import { Texture } from 'pixi.js';
import textwriterUrl from '../../assets/audio/nv_textwriter.wav';
import buttonEntryUrl from '../../assets/audio/nv_buttonentry.wav';
import buttonHoverUrl from '../../assets/audio/nv_needselect.wav';
import buttonSelectUrl from '../../assets/audio/nv_select.wav';
import checkWaitUrl from '/img/sprite/check_wait.png';
import nvButtonUrl from '/img/sprite/nv_9slice_button.png';
import leftDecorUrl from '/img/sprite/left.png';
import leftButtonUrl from '/img/sprite/left_button.png';
import daArrowUrl from '/img/sprite/da_arrow.png';

export const textWriterSound = async (): Promise<Sound> => {
    return new Promise<Sound>((resolve, _reject) => {
        const soundInstance = Sound.from({
            url: textwriterUrl,
            preload: true,
            loaded: () => resolve(soundInstance),
        });
    });
};

export const buttonEntrySound = async (): Promise<Sound> => {
    return new Promise<Sound>((resolve, _reject) => {
        const soundInstance = Sound.from({
            url: buttonEntryUrl,
            preload: true,
            loaded: () => resolve(soundInstance),
        });
    });
};

export const buttonHoverSound = async (): Promise<Sound> => {
    return new Promise<Sound>((resolve, _reject) => {
        const soundInstance = Sound.from({
            url: buttonHoverUrl,
            preload: true,
            loaded: () => resolve(soundInstance),
        });
    });
};

export const buttonSelectSound = async (): Promise<Sound> => {
    return new Promise<Sound>((resolve, _reject) => {
        const soundInstance = Sound.from({
            url: buttonSelectUrl,
            preload: true,
            loaded: () => resolve(soundInstance),
        });
    });
};



export const checkWaitTexture = async (): Promise<Texture> => {
    return new Promise<Texture>((resolve, reject) => {
        Texture.fromURL(checkWaitUrl)
            .then(texture => resolve(texture))
            .catch(error => reject(error));
    });
};

export const nvButtonTexture = async (): Promise<Texture> => {
    return new Promise<Texture>((resolve, reject) => {
        Texture.fromURL(nvButtonUrl)
            .then(texture => resolve(texture))
            .catch(error => reject(error));
    });
};

export const leftDecorTexture = async (): Promise<Texture> => {
    return new Promise<Texture>((resolve, reject) => {
        Texture.fromURL(leftDecorUrl)
            .then(texture => resolve(texture))
            .catch(error => reject(error));
    });
};

export const leftButtonTexture = async (): Promise<Texture> => {
    return new Promise<Texture>((resolve, reject) => {
        Texture.fromURL(leftButtonUrl)
            .then(texture => resolve(texture))
            .catch(error => reject(error));
    });
};

export const daArrowTexture = async (): Promise<Texture> => {
    return new Promise<Texture>((resolve, reject) => {
        Texture.fromURL(daArrowUrl)
            .then(texture => resolve(texture))
            .catch(error => reject(error));
    });
};