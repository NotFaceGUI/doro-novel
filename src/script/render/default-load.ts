import { Sound } from '@pixi/sound';
import textwriterUrl from '../../assets/audio/nv_textwriter.wav';

export const textWriterSound = async (): Promise<Sound> => {
    return new Promise<Sound>((resolve, _reject) => {
        const soundInstance = Sound.from({
            url: textwriterUrl,
            preload: true,
            loaded: () => resolve(soundInstance),
        });
    });
};