
import { PREDEFINED_CIVILIZATIONS, PREDEFINED_BANNER_URLS, PREDEFINED_EVENTS } from '../data/predefinedContent';
import type { Civilization, GameEvent } from '../types';

let civIndex = 0;

/**
 * Gets a predefined civilization from a rotating list.
 * This ensures a new game starts with a different civilization.
 * @returns A complete Civilization object.
 */
export function getPredefinedCivilization(): Civilization {
    const civData = PREDEFINED_CIVILIZATIONS[civIndex % PREDEFINED_CIVILIZATIONS.length];
    const bannerUrl = PREDEFINED_BANNER_URLS[civIndex % PREDEFINED_BANNER_URLS.length];
    
    civIndex++; // Increment for the next new game

    return { ...civData, bannerUrl };
}

/**
 * Gets a random predefined game event.
 * @returns A GameEvent object.
 */
export function getPredefinedGameEvent(): GameEvent {
    const randomIndex = Math.floor(Math.random() * PREDEFINED_EVENTS.length);
    return PREDEFINED_EVENTS[randomIndex];
}
