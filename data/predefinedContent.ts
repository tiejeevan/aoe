
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
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: 100 }], log: "The deal is made. The wood is added to your stockpile." } 
            },
            { 
                text: "Politely decline", 
                successEffects: { rewards: [], log: "You send the merchant on their way." } 
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
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [150, 250] }], log: "Success! Your explorers return with a hoard of ancient gold." },
                failureEffects: { rewards: [], log: "The expedition fails, and some supplies are lost, but everyone returns safely." }
            },
            { 
                text: "Leave it be",
                successEffects: { rewards: [], log: "You decide the potential treasure is not worth the risk." }
            }
        ]
    },
    {
        message: "A grateful farmer, whose family you protected, offers you a gift.",
        choices: [
            {
                text: "Accept their Hearty Meal",
                successEffects: {
                    rewards: [{ type: 'item', itemId: 'hearty_meal', amount: 1 }],
                    log: "You accept the meal. The food is a great boon to your people."
                }
            }
        ]
    },
    {
        message: "A fire breaks out in one of your storage huts!",
        choices: [
            { 
                text: "Organize a bucket brigade (80% success)",
                successChance: 0.8,
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: -25 }], log: "The fire is quickly put out, with only minor losses." },
                failureEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: [-100, -150] }], log: "The fire rages out of control before being contained, destroying a large amount of wood." }
            },
            {
                text: "Prioritize saving villagers",
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: [-80, -120] }], log: "Everyone is safe, but the storage hut and its contents are mostly lost." }
            }
        ]
    },
    {
        message: "A neighboring clan sends an envoy with a gift to foster good relations.",
        choices: [
            {
                text: "Accept the gift of stone",
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 75 }], log: "You accept the gift, strengthening ties with your neighbors." }
            },
             {
                text: "Accept the gift of food",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 100 }], log: "You accept the gift, a welcome addition to your stores." }
            }
        ]
    },
    {
        message: "A wandering mystic reads the stars and offers you a cryptic blessing.",
        choices: [
            {
                text: "Heed their words",
                successEffects: {
                    rewards: [{ type: 'item', itemId: 'builders_charm', amount: 1 }],
                    log: "The mystic nods and hands you a strange-looking compass. 'May it guide your hand,' they say."
                }
            }
        ]
    },
    {
        message: "A shady merchant offers a 'too good to be true' deal on rare stone.",
        choices: [
            { 
                text: "Buy 200 stone for 50 gold (50% chance of scam)", 
                cost: { gold: 50 },
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 200 }], log: "The stone is genuine! An incredible deal." },
                failureEffects: { rewards: [], log: "Scam! The merchant and your gold are gone, leaving you with a pile of painted rocks." }
            },
            { 
                text: "Arrest the merchant", 
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 25 }], log: "You arrest the shifty merchant and confiscate their ill-gotten gains." }
            }
        ]
    },
    {
        message: "A strange sickness is spreading. Your healers are requesting funds for medicine.",
        choices: [
            {
                text: "Fund the research (Cost: 100 gold)",
                cost: { gold: 100 },
                successChance: 0.75,
                successEffects: { rewards: [], log: "The medicine works! The plague is halted before it can cause serious harm." },
                failureEffects: { rewards: [{ type: 'resource', resource: 'food', amount: -150 }], log: "The medicine fails. The sickness takes a toll on your food supply." }
            },
            {
                text: "Quarantine the affected (Cost: 100 food)",
                cost: { food: 100 },
                successEffects: { rewards: [], log: "The quarantine is effective. The sickness dies out, but at the cost of valuable food." }
            }
        ]
    },
    {
        message: "Your scouts have found an ancient, weathered map.",
        choices: [
            {
                text: "Fund a small expedition (Cost: 50 food)",
                cost: { food: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'geologists_map', amount: 1 }], log: "The expedition was a success! They return with a detailed Geologist's Map." }
            },
            {
                text: "It's probably nothing",
                successEffects: { rewards: [], log: "You dismiss the map as a worthless old parchment." }
            }
        ]
    },
    {
        message: "The harvest has been unusually bountiful this season!",
        choices: [
            {
                text: "Store the excess food (Gain 200 Food)",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 200 }], log: "Your granaries are overflowing." }
            },
            {
                text: "Use the surplus for a feast (Gain 'Golden Harvest' item)",
                successEffects: { rewards: [{ type: 'item', itemId: 'golden_harvest', amount: 1 }], log: "A grand feast is held! The morale of your people soars." }
            }
        ]
    },
    {
        message: "Miners report an old gold mine is becoming unstable.",
        choices: [
            {
                text: "Risk one last delve (60% success)",
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [200, 300] }], log: "A massive gold vein is extracted just before a minor collapse!" },
                failureEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: -75 }], log: "A major collapse! The mine is lost, and it will cost stone to clear the rubble." }
            },
            {
                text: "Abandon it safely",
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 50 }], log: "You safely extract a small amount of gold before sealing the mine forever." }
            }
        ]
    },
    {
        message: "A wandering bard offers to compose an epic for your civilization.",
        choices: [
            {
                text: "Pay the bard (Cost: 40 gold)",
                cost: { gold: 40 },
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "The bard's song is a masterpiece, inspiring your warriors to new heights!" },
                failureEffects: { rewards: [], log: "The bard sings a pleasant, but ultimately forgettable, tune." }
            },
            {
                text: "Decline the offer",
                successEffects: { rewards: [], log: "You have no time for songs and stories." }
            }
        ]
    },
    {
        message: "A master architect, renowned for their genius, is passing through your lands.",
        choices: [
            {
                text: "Hire them for a consultation (Cost: 150 gold)",
                cost: { gold: 150 },
                successEffects: { rewards: [{ type: 'item', itemId: 'blueprint_of_the_master', amount: 1 }], log: "The architect studies your plans and provides an ingenious blueprint." }
            },
            {
                text: "Let them pass",
                successEffects: { rewards: [], log: "You let the opportunity pass, confident in your own builders." }
            }
        ]
    },
    {
        message: "A celestial alignment occurs. Your mystics claim it is a time of great power.",
        choices: [
            {
                text: "Make a grand offering (Cost: 250 food, 250 gold)",
                cost: { food: 250, gold: 250 },
                successChance: 0.05,
                successEffects: { rewards: [{ type: 'item', itemId: 'whisper_of_the_creator', amount: 1 }], log: "The heavens accept your offering! A divine whisper echoes through your land." },
                failureEffects: { rewards: [], log: "The stars remain silent. The offering is consumed." }
            },
            {
                text: "Observe the alignment",
                successEffects: { rewards: [], log: "You watch the beautiful celestial display." }
            }
        ]
    },
    {
        message: "Aggressive wildlife is menacing your villagers near the forests.",
        choices: [
            {
                text: "Hire hunters to thin the pack (Cost: 75 food)",
                cost: { food: 75 },
                successEffects: { rewards: [], log: "The hunters deal with the threat effectively. The forests are safe again." }
            },
            {
                text: "Let the villagers handle it",
                successChance: 0.7,
                successEffects: { rewards: [], log: "Your brave villagers manage to drive the beasts away without incident." },
                failureEffects: { rewards: [{ type: 'resource', resource: 'food', amount: -50 }], log: "The villagers are forced to retreat, losing some of their gathered food in the chaos." }
            }
        ]
    },
    {
        message: "A noble from a distant land, fleeing their enemies, begs for sanctuary.",
        choices: [
            {
                text: "Grant sanctuary (Cost: 100 gold)",
                cost: { gold: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'drillmasters_whistle', amount: 1 }], log: "Grateful, the noble gifts you a Drillmaster's Whistle before disappearing." }
            },
            {
                text: "Turn them away",
                successEffects: { rewards: [], log: "You refuse to get involved in foreign conflicts." }
            }
        ]
    },
    {
        message: "Favorable winds and clear skies present a perfect opportunity for trade.",
        choices: [
            {
                text: "Fund a large expedition (Cost: 100 gold, 50 wood)",
                cost: { gold: 100, wood: 50 },
                successChance: 0.8,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [250, 400] }, { type: 'resource', resource: 'food', amount: [100, 200] }], log: "The trade expedition returns with massive profits!" },
                failureEffects: { rewards: [], log: "A sudden storm! The expedition returns with nothing to show for the effort." }
            },
            {
                text: "Too risky",
                successEffects: { rewards: [], log: "You decide to keep your resources at home." }
            }
        ]
    },
    {
        message: "Your scholars claim they are on the verge of a breakthrough.",
        choices: [
            {
                text: "Fund their research (Cost: 125 gold)",
                cost: { gold: 125 },
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'item', itemId: 'tome_of_insight', amount: 1 }], log: "They did it! Their findings are recorded in a Tome of Insight." },
                failureEffects: { rewards: [], log: "The research leads to a dead end, and your gold is spent." }
            },
            {
                text: "They are always 'on the verge'",
                successEffects: { rewards: [], log: "You tell the scholars to focus on more practical matters." }
            }
        ]
    },
    {
        message: "The woods have gone unnervingly quiet. Something feels different.",
        choices: [
            {
                text: "Send scouts to investigate (Cost: 30 food)",
                cost: { food: 30 },
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'item', itemId: 'foresters_axe', amount: 1 }], log: "The scouts find a grove tended by a hermit, who gifts them a masterfully crafted axe." },
                failureEffects: { rewards: [], log: "The scouts are spooked by strange noises and return empty-handed, having wasted some rations." }
            },
            {
                text: "It is not our concern",
                successEffects: { rewards: [], log: "You decide that a quiet forest is a good thing." }
            }
        ]
    },
    {
        message: "A shaman sees a vision in the campfire's flames and offers guidance.",
        choices: [
            {
                text: "Heed their words (Cost: 50 food)",
                cost: { food: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'pact_of_plenty', amount: 1 }], log: "You follow the shaman's strange ritual and are rewarded with a Pact of Plenty." }
            },
            {
                text: "Dismiss it as madness",
                successEffects: { rewards: [], log: "You ignore the shaman's ramblings." }
            }
        ]
    },
    {
        message: "A tremor has partially collapsed a nearby cave, revealing glittering walls.",
        choices: [
            {
                text: "It's a sign! (Gain 'Heart of the Mountain' item)",
                successEffects: { rewards: [{ type: 'item', itemId: 'heart_of_the_mountain', amount: 1 }], log: "The cave contains a massive, pulsing geode! You have found the Heart of the Mountain." }
            },
            {
                text: "It's too dangerous.",
                successEffects: { rewards: [], log: "You steer clear of the unstable cave." }
            }
        ]
    },
    {
        message: "An old legend leads your explorers to a hidden tomb.",
        choices: [
            {
                text: "Enter the tomb (Cost: 100 food, 100 wood)",
                cost: { food: 100, wood: 100 },
                successChance: 0.25,
                successEffects: { rewards: [{ type: 'item', itemId: 'horn_of_urgency', amount: 1 }, { type: 'resource', resource: 'gold', amount: 500 }], log: "Incredible! You've found the Horn of Urgency and the lost king's treasure." },
                failureEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: -100 }], log: "The tomb is trapped! Your explorers escape, but you lose gold paying for their injuries." }
            },
            {
                text: "Some legends should remain legends",
                successEffects: { rewards: [], log: "You seal the tomb, leaving its secrets buried." }
            }
        ]
    },
    {
        message: "A strange resonance is felt from the earth, calming the land.",
        choices: [
            {
                text: "Meditate on the feeling",
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'essence_of_the_earth', amount: 1 }], log: "Your connection with the land deepens, revealing its hidden Essence." },
                failureEffects: { rewards: [], log: "The feeling fades, leaving you with a sense of peace, but nothing more." }
            }
        ]
    },
    {
        message: "A sudden downpour has created a flash flood!",
        choices: [
            {
                text: "Save the farmlands!",
                successEffects: {
                    rewards: [{ type: 'resource', resource: 'wood', amount: [-50, -80] }],
                    log: "You save the farms from being washed away, but lose a significant amount of wood to the floodwaters."
                }
            },
            {
                text: "Protect the mines!",
                successEffects: {
                    rewards: [{ type: 'resource', resource: 'food', amount: [-70, -100] }],
                    log: "The mines are secured, but the flood ruins a portion of your food stores."
                }
            }
        ]
    },
    {
        message: "A charismatic leader emerges among your people, advocating for rapid expansion.",
        choices: [
            {
                text: "Embrace their vision (Instantly gain a villager)",
                successEffects: { rewards: [{ type: 'resource', resource: 'villager', amount: 1 }], log: "Inspired by their words, a new family joins your settlement to seek their fortune." },
            },
            {
                text: "Urge caution (Gain 100 stone)",
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 100 }], log: "You temper their ambition with pragmatism, reinforcing your foundations instead." },
            }
        ]
    },
    {
        message: "A mysterious shipwreck has washed ashore.",
        choices: [
            {
                text: "Salvage the wreckage (Cost: 40 food)",
                cost: { food: 40 },
                successChance: 0.8,
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: [100, 150] }, { type: 'resource', resource: 'gold', amount: [20, 50] }], log: "The wreckage yields valuable wood and a small chest of coins." },
                failureEffects: { rewards: [], log: "The wreckage is too damaged and rotten to be of any use." }
            },
            {
                text: "Burn it for a signal fire",
                successEffects: { rewards: [], log: "You burn the ship, hoping to signal other survivors. None appear." }
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
