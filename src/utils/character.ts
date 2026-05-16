import type { CharacterType } from '../types/app';
import { ASSET_CHARACTER } from '../script/var';
import { getCharacterDisplayName } from './character-name';

export const CUSTOM_CHARACTER_PREFIX = 'custom:';

export function getCharacterId(character?: CharacterType | null): string {
    if (!character) {
        return '';
    }

    if (character.id) {
        return character.id;
    }

    if (character.path?.name) {
        return character.path.name;
    }

    return character.characterName;
}

export function getCharacterDisplayLabel(character?: CharacterType | null): string {
    if (!character) {
        return '';
    }

    return getCharacterDisplayName(character);
}

export function getCharacterResourceKey(
    character?: CharacterType | null,
    variant: 'default' | 'aim' | 'cover' = 'default'
): string {
    if (!character) {
        return '';
    }

    if (variant === 'default' && character.resourceKey) {
        return character.resourceKey;
    }

    if (!character.path?.name) {
        return character.resourceKey || '';
    }

    if (variant === 'aim' && character.path.aimSkel) {
        return `${ASSET_CHARACTER}${character.path.name}/aim/${character.path.aimSkel}`;
    }

    if (variant === 'cover' && character.path.coverSkel) {
        return `${ASSET_CHARACTER}${character.path.name}/cover/${character.path.coverSkel}`;
    }

    return `${ASSET_CHARACTER}${character.path.name}/${character.path.skel}`;
}

export function normalizeCharacter(character: CharacterType): CharacterType {
    const id = getCharacterId(character);
    return {
        ...character,
        id,
        resourceKey: character.resourceKey || getCharacterResourceKey(character),
    };
}

export function isCustomCharacter(character?: CharacterType | null): boolean {
    return !!character?.isCustom || getCharacterId(character).startsWith(CUSTOM_CHARACTER_PREFIX);
}
