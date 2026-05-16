import { BaseDirectory, exists, mkdir, readTextFile, remove, writeTextFile } from '@tauri-apps/plugin-fs';
import type { CharacterType } from '../types/app';
import { CUSTOM_CHARACTER_PREFIX, normalizeCharacter } from '../utils/character';

const CUSTOM_CHARACTER_DIR = 'custom';
const CUSTOM_CHARACTER_FILE = `${CUSTOM_CHARACTER_DIR}/spine-custom-character.json`;

class CustomCharacterService {
    private static instance: CustomCharacterService | null = null;
    private cache: CharacterType[] | null = null;

    public static getInstance() {
        if (!CustomCharacterService.instance) {
            CustomCharacterService.instance = new CustomCharacterService();
        }

        return CustomCharacterService.instance;
    }

    private async ensureDir() {
        const dirExists = await exists(CUSTOM_CHARACTER_DIR, { baseDir: BaseDirectory.AppLocalData });
        if (!dirExists) {
            await mkdir(CUSTOM_CHARACTER_DIR, {
                baseDir: BaseDirectory.AppLocalData,
                recursive: true,
            });
        }
    }

    public async list(): Promise<CharacterType[]> {
        if (this.cache) {
            return this.cache;
        }

        await this.ensureDir();
        const fileExists = await exists(CUSTOM_CHARACTER_FILE, { baseDir: BaseDirectory.AppLocalData });
        if (!fileExists) {
            this.cache = [];
            return this.cache;
        }

        try {
            const content = await readTextFile(CUSTOM_CHARACTER_FILE, { baseDir: BaseDirectory.AppLocalData });
            const parsed = JSON.parse(content || '[]');
            this.cache = Array.isArray(parsed)
                ? parsed.map((item) => normalizeCharacter({
                    ...item,
                    id: item.id || `${CUSTOM_CHARACTER_PREFIX}${item.characterName}`,
                    isCustom: true,
                }))
                : [];
        } catch (error) {
            console.error('读取自定义角色失败:', error);
            this.cache = [];
        }

        return this.cache;
    }

    public async saveAll(characters: CharacterType[]) {
        await this.ensureDir();
        const normalized = characters.map((character) => normalizeCharacter({
            ...character,
            id: character.id || `${CUSTOM_CHARACTER_PREFIX}${character.characterName}`,
            isCustom: true,
        }));
        await writeTextFile(
            CUSTOM_CHARACTER_FILE,
            JSON.stringify(normalized, null, 2),
            { baseDir: BaseDirectory.AppLocalData }
        );
        this.cache = normalized;
        return normalized;
    }

    public async save(character: CharacterType) {
        const current = await this.list();
        const normalized = normalizeCharacter({
            ...character,
            id: character.id || `${CUSTOM_CHARACTER_PREFIX}${character.characterName}`,
            isCustom: true,
        });
        const next = [...current.filter((item) => item.id !== normalized.id), normalized];
        await this.saveAll(next);
        return normalized;
    }

    public async remove(characterId: string) {
        const current = await this.list();
        const next = current.filter((item) => item.id !== characterId);

        if (next.length === 0) {
            const fileExists = await exists(CUSTOM_CHARACTER_FILE, { baseDir: BaseDirectory.AppLocalData });
            if (fileExists) {
                await remove(CUSTOM_CHARACTER_FILE, { baseDir: BaseDirectory.AppLocalData });
            }
            this.cache = [];
            return;
        }

        await this.saveAll(next);
    }

    public async clearCache() {
        this.cache = null;
    }
}

export default CustomCharacterService;
