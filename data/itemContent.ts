import type { GameItem } from '../types';

export const GAME_ITEMS: { [itemId: string]: Omit<GameItem, 'id'> } = {
    'scroll_of_haste': {
        name: 'Scroll of Haste',
        rarity: 'Common',
        description: 'Instantly finishes 15 seconds of work on any construction project.',
    },
    'hearty_meal': {
        name: 'Hearty Meal',
        rarity: 'Common',
        description: 'Instantly provides 75 Food.',
    },
    'builders_charm': {
        name: 'Builder\'s Charm',
        rarity: 'Common',
        description: 'The next building you construct will have its build time reduced by 10%.',
    },
    'blueprint_of_the_master': {
        name: 'Blueprint of the Master',
        rarity: 'Epic',
        description: 'Instantly finishes 1 minute of work on any construction project.',
    },
    'drillmasters_whistle': {
        name: 'Drillmaster\'s Whistle',
        rarity: 'Epic',
        description: 'The next 5 military units are trained 25% faster.',
    },
    'golden_harvest': {
        name: 'Golden Harvest',
        rarity: 'Epic',
        description: 'For the next 60 seconds, all Food gathering is boosted by 50%.',
    },
    'shard_of_the_ancients': {
        name: 'Shard of the Ancients',
        rarity: 'Legendary',
        description: 'Instantly completes the construction project with the most time remaining.',
    },
    'heart_of_the_mountain': {
        name: 'Heart of the Mountain',
        rarity: 'Legendary',
        description: 'Doubles all Gold and Stone gathering for the next 2 minutes.',
    },
    'banner_of_command': {
        name: 'Banner of Command',
        rarity: 'Legendary',
        description: 'Grants a permanent +5% damage bonus to all of your current and future military units.',
    },
    'whisper_of_the_creator': {
        name: 'Whisper of the Creator',
        rarity: 'Spiritual',
        description: 'Instantly completes every single active task (building, training, and age advancement).',
    }
};
