
import { PREDEFINED_CIVILIZATIONS, PREDEFINED_BANNER_URLS, PREDEFINED_EVENTS } from '../data/predefinedContent';
import type { Civilization, GameEvent, GameEventChoice } from '../types';

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

const validateEvent = (event: GameEvent): GameEvent => {
    const validatedChoices = event.choices.map(choice => {
        const validatedSuccessEffects = {
            ...choice.successEffects,
            rewards: choice.successEffects.rewards || [],
            log: choice.successEffects.log || 'A successful outcome.',
        };
        const validatedFailureEffects = choice.failureEffects ? {
            ...choice.failureEffects,
            rewards: choice.failureEffects.rewards || [],
            log: choice.failureEffects.log || 'A failed outcome.',
        } : undefined;

        return {
            ...choice,
            successEffects: validatedSuccessEffects,
            failureEffects: validatedFailureEffects,
        };
    });
    return { ...event, choices: validatedChoices };
};


/**
 * Gets a random predefined game event.
 * @returns A GameEvent object.
 */
export function getPredefinedGameEvent(): GameEvent {
    const randomIndex = Math.floor(Math.random() * PREDEFINED_EVENTS.length);
    const event = PREDEFINED_EVENTS[randomIndex];
    return validateEvent(event);
}
