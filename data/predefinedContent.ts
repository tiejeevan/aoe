
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
        message: "A traveling merchant has arrived, offering a bulk discount on wood.",
        choices: [
            { 
                text: "Buy 100 Wood", 
                cost: { gold: 40 },
                successEffects: { resource: 'wood', amount: 100, log: "The deal is made. The wood is added to your stockpile." } 
            },
            { 
                text: "Politely decline", 
                successEffects: { resource: 'none', amount: 0, log: "You send the merchant on their way." } 
            }
        ]
    },
    {
        message: "Your scouts have found an ancient, treasure-filled ruin. It seems risky to explore.",
        choices: [
            { 
                text: "Send an expedition (70% success)",
                cost: { food: 50 },
                successChance: 0.7,
                successEffects: { resource: 'gold', amount: [150, 250], log: "Success! Your explorers return with a hoard of ancient gold." },
                failureEffects: { resource: 'food', amount: 0, log: "The expedition fails, and some supplies are lost, but everyone returns safely." }
            },
            { 
                text: "Leave it be",
                successEffects: { resource: 'none', amount: 0, log: "You decide the potential treasure is not worth the risk." }
            }
        ]
    },
    {
        message: "Unusually rich soil has been discovered nearby. A perfect place for a temporary farm.",
        choices: [
            { 
                text: "Exploit the fertile ground", 
                successEffects: { resource: 'food', amount: [200, 300], log: "Your workers quickly establish a farm and bring in a massive surplus of food." } 
            }
        ]
    },
    {
        message: "A fire breaks out in one of your storage huts!",
        choices: [
            { 
                text: "Organize a bucket brigade (80% success)",
                successChance: 0.8,
                successEffects: { resource: 'wood', amount: -25, log: "The fire is quickly put out, with only minor losses." },
                failureEffects: { resource: 'wood', amount: [-100, -150], log: "The fire rages out of control before being contained, destroying a large amount of wood." }
            },
            {
                text: "Prioritize saving villagers",
                successEffects: { resource: 'wood', amount: [-80, -120], log: "Everyone is safe, but the storage hut and its contents are mostly lost." }
            }
        ]
    },
    {
        message: "A neighboring clan sends an envoy with a gift to foster good relations.",
        choices: [
            {
                text: "Accept the gift of stone",
                successEffects: { resource: 'stone', amount: 75, log: "You accept the gift, strengthening ties with your neighbors." }
            },
             {
                text: "Accept the gift of food",
                successEffects: { resource: 'food', amount: 100, log: "You accept the gift, a welcome addition to your stores." }
            }
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
