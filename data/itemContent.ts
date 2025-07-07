import type { GameItem } from '../types';

export const GAME_ITEMS: { [itemId: string]: Omit<GameItem, 'id'> } = {
    // Common
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
    'geologists_map': {
        name: 'Geologist\'s Map',
        rarity: 'Common',
        description: 'Reveals a small, new stone or gold deposit nearby. (Effect TBD)',
    },
     'foresters_axe': {
        name: 'Forester\'s Axe',
        rarity: 'Common',
        description: 'The next 200 wood gathered is collected 50% faster. (Effect TBD)',
    },
    // Epic
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
     'pact_of_plenty': {
        name: 'Pact of Plenty',
        rarity: 'Epic',
        description: 'For the next minute, all resource gathering is increased by 25%.',
    },
    'tome_of_insight': {
        name: 'Tome of Insight',
        rarity: 'Epic',
        description: 'Reduces the resource cost of your next Age advancement by 15%.',
    },
    // Legendary
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
    'horn_of_urgency': {
        name: 'Horn of Urgency',
        rarity: 'Legendary',
        description: 'All active training queues (villagers and military) are instantly completed.',
    },
    // Spiritual
    'whisper_of_the_creator': {
        name: 'Whisper of the Creator',
        rarity: 'Spiritual',
        description: 'Instantly completes every single active task (building, training, and age advancement).',
    },
     'essence_of_the_earth': {
        name: 'Essence of the Earth',
        rarity: 'Spiritual',
        description: 'All depleted resource nodes on the map are partially replenished. (Effect TBD)',
    },
};
