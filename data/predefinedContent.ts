
import type { Civilization, GameEvent } from '../types';

// In a real project, these images would be located in an `/assets` folder.
// Using a placeholder service with specific seeds to simulate having unique, static images for each civilization.
export const PREDEFINED_CIVILIZATIONS: Omit<Civilization, 'bannerUrl'>[] = [
    {
        name: "The Sunstone Clan",
        lore: "Masters of stonework, their cities are carved directly into mountainsides.",
        bonus: "Stone gathering is 20% faster.",
        uniqueUnit: { name: "Granite Guard", description: "Heavily armored infantry that excels at defense." }
    },
    {
        name: "The River Nomads",
        lore: "A fluid society that follows the great rivers, their culture as rich as the fertile plains.",
        bonus: "Farms produce food 15% faster.",
        uniqueUnit: { name: "River-Watch Rider", description: "Fast cavalry adept at scouting and harassing enemy lines." }
    },
    {
        name: "The Ironwood Sentinels",
        lore: "Living in deep forests, they have mastered the art of woodwork and archery.",
        bonus: "Woodcutting is 25% faster.",
        uniqueUnit: { name: "Ironwood Archer", description: "A long-ranged archer with superior damage against other archers." }
    },
    {
        name: "The Gilded Syndicate",
        lore: "A civilization built on trade and wealth, their markets are the envy of the world.",
        bonus: "Gold mining generates 10% more resources.",
        uniqueUnit: { name: "Gilded Companion", description: "A mercenary unit that costs only gold and is quick to train." }
    },
];

// Banner URLs corresponding to the civilizations above.
export const PREDEFINED_BANNER_URLS: string[] = [
    "https://picsum.photos/seed/sunstone/512/512",
    "https://picsum.photos/seed/riverfolk/512/512",
    "https://picsum.photos/seed/ironwood/512/512",
    "https://picsum.photos/seed/gilded/512/512",
];

export const PREDEFINED_EVENTS: GameEvent[] = [
    {
        message: "A sudden downpour has made the forests damp and difficult to work in, but the fields are thriving.",
        choices: [
            { text: "Focus on the farms", effects: { resource: 'food', amount: 100, log: "Your focus on farming yields a small surplus." } },
            { text: "Press on with logging", effects: { resource: 'wood', amount: -50, log: "Wet wood and difficult conditions lead to a loss of resources." } }
        ]
    },
    {
        message: "Scouts have discovered a small, unguarded gold deposit in the nearby hills.",
        choices: [
            { text: "Mine it immediately", effects: { resource: 'gold', amount: 150, log: "You successfully secured the extra gold." } },
            { text: "Leave it for later", effects: { resource: 'none', amount: 0, log: "You decide not to risk sending workers so far away." } }
        ]
    },
    {
        message: "A traveling mystic offers to bless your villagers, promising increased hardiness for a small donation.",
        choices: [
            { text: "Pay the mystic (50 Gold)", effects: { resource: 'gold', amount: -50, log: "Your villagers feel invigorated, though your treasury is lighter." } },
            { text: "Decline the offer", effects: { resource: 'none', amount: 0, log: "You send the mystic on their way." } }
        ]
    },
    {
        message: "A vein of poor-quality stone has been discovered in your quarry, slowing down operations.",
        choices: [
            { text: "A necessary setback.", effects: { resource: 'stone', amount: -75, log: "You lose some stone while clearing the poor-quality vein." } }
        ]
    }
];

export const AGE_PROGRESSION: { [currentAge: string]: { nextAgeName: string; description: string } } = {
    'Nomadic Age': {
        nextAgeName: 'Feudal Age',
        description: 'Society organizes under lords and vassals, unlocking new military and economic structures.'
    },
    'Feudal Age': {
        nextAgeName: 'Castle Age',
        description: 'Powerful fortifications and advanced siege weaponry mark this new era of warfare and defense.'
    },
    'Castle Age': {
        nextAgeName: 'Imperial Age',
        description: 'Your civilization becomes a true empire, with unparalleled economic and military might.'
    },
    'Imperial Age': {
        nextAgeName: 'Post-Imperial Age',
        description: 'The pinnacle of technology and culture. All paths are now open to you.'
    },
    'default': {
        nextAgeName: 'Age of Legends',
        description: 'Your civilization transcends history and becomes a legend.'
    }
};
