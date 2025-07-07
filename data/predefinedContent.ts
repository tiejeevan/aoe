
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
                text: "Buy 200 stone for 50 gold (50% scam)", 
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
                text: "Use the surplus for a feast (Gain 'Golden Harvest')",
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
                text: "Hire for a consultation (Cost: 150 gold)",
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
                text: "It's a sign! (Gain 'Heart of the Mountain')",
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
                text: "Embrace their vision (Gain a villager)",
                successEffects: { rewards: [{ type: 'unit', unitType: 'villager', amount: 1 }], log: "Inspired by their words, a new family joins your settlement to seek their fortune." },
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
    },
    {
        message: "A local tinkerer has a strange contraption they claim can 'find' resources.",
        choices: [
            {
                text: "Fund their work (Cost: 80 gold)",
                cost: { gold: 80 },
                successChance: 0.4,
                successEffects: { rewards: [{ type: 'item', itemId: 'geologists_map', amount: 1 }], log: "It works! The device points to a new mineral deposit. The tinkerer gives you the map." },
                failureEffects: { rewards: [], log: "The contraption sputters, sparks, and falls apart. Your gold is wasted." }
            },
            {
                text: "Dismiss them as a charlatan",
                successEffects: { rewards: [], log: "You have no time for such nonsense and send the tinkerer away." }
            }
        ]
    },
    {
        message: "A mild, unseasonable winter threatens your food supply.",
        choices: [
            {
                text: "Share food from your stores",
                cost: { food: 150 },
                successEffects: { rewards: [], log: "Your people survive the lean period thanks to your foresight, but the stores are lower." }
            },
            {
                text: "Organize hunting parties (70% success)",
                successChance: 0.7,
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 100 }], log: "The hunts are successful, supplementing your food stores." },
                failureEffects: { cost: { food: 100 }, rewards: [], log: "The hunts fail, and the hunters consumed valuable rations for nothing." }
            }
        ]
    },
    {
        message: "A skilled lumberjack offers to teach your woodcutters advanced techniques.",
        choices: [
            {
                text: "Pay for the training (Cost: 100 wood)",
                cost: { wood: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'foresters_axe', amount: 1 }], log: "The training is a success! Your lumberjacks are more efficient." }
            },
            {
                text: "Our techniques are fine",
                successEffects: { rewards: [], log: "You decline the offer, confident in your own methods." }
            }
        ]
    },
    {
        message: "A wild beast has been cornered by your scouts. It looks magnificent and rare.",
        choices: [
            {
                text: "Capture it for study (Cost: 80 food)",
                cost: { food: 80 },
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'essence_of_the_earth', amount: 1 }], log: "The beast is a creature of the earth itself! Its presence revitalizes the land." },
                failureEffects: { rewards: [], log: "The beast escapes, leaving your scouts tired and hungry." }
            },
            {
                text: "Hunt it for food",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 120 }], log: "The beast provides a substantial amount of food for your people." }
            }
        ]
    },
    {
        message: "A dispute over land has broken out between two families.",
        choices: [
            {
                text: "Rule in favor of the older claim (Gain 50 stone)",
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 50 }], log: "You rule with tradition. The grateful family offers you a gift of stone." }
            },
            {
                text: "Split the land evenly (Gain 50 food)",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 50 }], log: "Your fair ruling pleases both families, and they offer a gift of food." }
            }
        ]
    },
    {
        message: "A comet is sighted in the sky. Some see it as a good omen, others as a harbinger of doom.",
        choices: [
            {
                text: "It is a blessing! (Gain 'Scroll of Haste')",
                successEffects: { rewards: [{ type: 'item', itemId: 'scroll_of_haste', amount: 1 }], log: "Inspired by the omen, your builders work with newfound speed." }
            },
            {
                text: "It is a warning! (Gain 50 wood)",
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: 50 }], log: "Heeding the warning, your people reinforce their homes, stockpiling wood." }
            }
        ]
    },
    {
        message: "A child has discovered a cave system filled with unusual, glowing mushrooms.",
        choices: [
            {
                text: "Harvest them for food (50% chance of illness)",
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 250 }], log: "The mushrooms are a delicacy! A feast is had." },
                failureEffects: { cost: { food: 100 }, rewards: [], log: "The mushrooms cause a mild sickness, costing food to care for the ill." }
            },
            {
                text: "Study the cave (Cost: 50 gold)",
                cost: { gold: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'pact_of_plenty', amount: 1 }], log: "The mushrooms have potent magical properties your mystics can harness." }
            }
        ]
    },
    {
        message: "A famous mercenary captain and their company are passing through.",
        choices: [
            {
                text: "Hire them for training (Cost: 200 gold)",
                cost: { gold: 200 },
                successEffects: { rewards: [{ type: 'item', itemId: 'drillmasters_whistle', amount: 1 }], log: "The mercenaries drill your soldiers, teaching them valuable techniques." }
            },
            {
                text: "Pay them to leave",
                cost: { gold: 50 },
                successEffects: { rewards: [], log: "You pay the mercenaries to move on, avoiding any potential trouble." }
            }
        ]
    },
    {
        message: "An abandoned library is discovered, its contents remarkably preserved.",
        choices: [
            {
                text: "Study the economic texts (Cost: 75 gold)",
                cost: { gold: 75 },
                successEffects: { rewards: [{ type: 'item', itemId: 'golden_harvest', amount: 1 }], log: "You discover ancient farming techniques that promise a bountiful harvest." }
            },
            {
                text: "Study the military histories (Cost: 75 gold)",
                cost: { gold: 75 },
                successEffects: { rewards: [{ type: 'item', itemId: 'tome_of_insight', amount: 1 }], log: "The histories provide insights that will help you advance your society." }
            }
        ]
    },
    {
        message: "A long-forgotten festival is rediscovered in an old text.",
        choices: [
            {
                text: "Revive the festival! (Cost: 100 food, 50 gold)",
                cost: { food: 100, gold: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'hearty_meal', amount: 2 }], log: "The festival is a massive success, boosting morale and creating surplus food." }
            },
            {
                text: "We have no time for old ways",
                successEffects: { rewards: [], log: "You decide to focus on more practical matters." }
            }
        ]
    },
    {
        message: "A stone quarry has signs of a imminent collapse.",
        choices: [
            {
                text: "One last haul (40% success)",
                successChance: 0.4,
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: [400, 600] }], log: "Incredible! Your workers extract a huge lode of stone just in time." },
                failureEffects: { cost: { wood: 100 }, rewards: [], log: "The quarry collapses early! It costs wood to reinforce the surrounding area." }
            },
            {
                text: "Abandon it immediately",
                successEffects: { rewards: [], log: "You prioritize safety and abandon the unstable quarry." }
            }
        ]
    },
    {
        message: "A diplomatic envoy from a powerful, distant empire has arrived.",
        choices: [
            {
                text: "Host a grand feast (Cost: 200 food)",
                cost: { food: 200 },
                successChance: 0.2,
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "Impressed, the envoy gifts you a military banner as a sign of friendship." },
                failureEffects: { rewards: [], log: "The envoy is pleased but offers only their thanks before departing." }
            },
            {
                text: "Offer a simple greeting",
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 30 }], log: "The envoy offers a token gift of gold and continues on their journey." }
            }
        ]
    },
    {
        message: "A master artisan wishes to settle in your civilization.",
        choices: [
            {
                text: "Grant them a workshop (Cost: 150 wood)",
                cost: { wood: 150 },
                successEffects: { rewards: [{ type: 'item', itemId: 'blueprint_of_the_master', amount: 1 }], log: "The artisan is grateful and designs an ingenious blueprint for your builders." }
            },
            {
                text: "We can't afford it",
                successEffects: { rewards: [], log: "The artisan, disappointed, seeks patronage elsewhere." }
            }
        ]
    },
    {
        message: "An ancient battlefield is discovered, littered with old skeletons and rusted weapons.",
        choices: [
            {
                text: "Scavenge for metal (75% success)",
                successChance: 0.75,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [50, 100] }], log: "Your people melt down the old weapons, gaining a surprising amount of gold." },
                failureEffects: { rewards: [], log: "The metal is too rusted and worthless. The effort is wasted." }
            },
            {
                text: "Consecrate the ground",
                successChance: 0.05,
                successEffects: { rewards: [{ type: 'item', itemId: 'horn_of_urgency', amount: 1 }], log: "The spirits of the fallen soldiers, pleased, bestow a powerful blessing upon you." },
                failureEffects: { rewards: [], log: "You pay respects to the fallen. The land feels more peaceful." }
            }
        ]
    },
    {
        message: "A great philosopher has begun to question the nature of your rule.",
        choices: [
            {
                text: "Embrace their wisdom (Cost: 100 gold)",
                cost: { gold: 100 },
                successChance: 0.01,
                successEffects: { rewards: [{ type: 'item', itemId: 'whisper_of_the_creator', amount: 1 }], log: "Through meditation and philosophy, you achieve a state of enlightenment that transcends mortal work." },
                failureEffects: { rewards: [], log: "The philosophical debates are invigorating but yield no tangible reward." }
            },
            {
                text: "Imprison them for treason!",
                cost: { food: 50 },
                successEffects: { rewards: [], log: "The philosopher is imprisoned, quelling dissent but costing food to maintain the jail." }
            }
        ]
    },
    {
        message: "Unseasonably strong winds have damaged the roofs of several houses.",
        choices: [
            {
                text: "Repair the damage",
                cost: { wood: 80 },
                successEffects: { rewards: [], log: "The houses are repaired, but it costs a significant amount of wood." }
            },
            {
                text: "They'll have to manage",
                successEffects: { rewards: [], log: "You leave the families to fend for themselves, saving resources but fostering resentment." }
            }
        ]
    },
    {
        message: "A child finds a beautifully crafted, ancient horn buried in the mud.",
        choices: [
            {
                text: "Clean it and see what happens",
                successChance: 0.2,
                successEffects: { rewards: [{ type: 'item', itemId: 'horn_of_urgency', amount: 1 }], log: "As you blow the horn, a powerful magic completes all your training projects instantly!" },
                failureEffects: { rewards: [], log: "The horn makes a pleasant sound, but nothing magical occurs." }
            },
            {
                text: "It's just an old trinket",
                successEffects: { rewards: [], log: "You toss the horn aside." }
            }
        ]
    },
    {
        message: "A veteran soldier, tired of war, offers to train your troops for a price.",
        choices: [
            {
                text: "Accept his offer (Cost: 150 gold)",
                cost: { gold: 150 },
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "His training methods are brutal but effective, inspiring your troops." }
            },
            {
                text: "We have our own trainers",
                successEffects: { rewards: [], log: "You decline, confident in your own drillmasters." }
            }
        ]
    },
    {
        message: "A meteor shower illuminates the night sky, and a small, warm stone falls nearby.",
        choices: [
            {
                text: "Retrieve the star-stone",
                cost: { food: 20 },
                successEffects: { rewards: [{ type: 'item', itemId: 'shard_of_the_ancients', amount: 1 }], log: "The stone contains immense power, instantly finishing your most difficult construction." }
            },
            {
                text: "Too dangerous",
                successEffects: { rewards: [], log: "You watch the beautiful celestial event from a safe distance." }
            }
        ]
    },
    {
        message: "A wandering mystic has a vision of a bountiful future.",
        choices: [
            {
                text: "Offer them food for their vision (Cost: 50 food)",
                cost: { food: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'pact_of_plenty', amount: 1 }], log: "The mystic is grateful and shares a ritual to ensure their vision comes true." }
            },
            {
                text: "Visions are just dreams",
                successEffects: { rewards: [], log: "You dismiss the mystic's words and send them on their way." }
            }
        ]
    },
    {
        message: "A plague of rats is threatening your granaries.",
        choices: [
            {
                text: "Use poison (70% success)",
                successChance: 0.7,
                successEffects: { rewards: [], log: "The poison works, and the granaries are safe." },
                failureEffects: { cost: { food: 150 }, rewards: [], log: "The rats are resistant! A significant portion of your food is spoiled." }
            },
            {
                text: "Introduce cats to the settlement",
                cost: { food: 50 },
                successEffects: { rewards: [], log: "The cats prove to be excellent hunters, solving the rat problem permanently." }
            }
        ]
    },
    {
        message: "A cartographer offers to sell you maps of the surrounding lands.",
        choices: [
            {
                text: "Buy the maps (Cost: 75 gold)",
                cost: { gold: 75 },
                successEffects: { rewards: [{ type: 'item', itemId: 'geologists_map', amount: 1 }], log: "The maps are incredibly detailed, revealing hidden resource deposits." }
            },
            {
                text: "Our scouts will suffice",
                successEffects: { rewards: [], log: "You decline the offer, trusting your own explorers." }
            }
        ]
    },
    {
        message: "Your loggers have discovered a petrified forest.",
        choices: [
            {
                text: "Harvest the strange wood (Gain 100 stone)",
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 100 }, { type: 'resource', resource: 'wood', amount: -50 }], log: "The 'wood' is hard as rock. You gain stone, but the effort dulls your axes." }
            },
            {
                text: "Preserve it as a natural wonder",
                successEffects: { rewards: [], log: "You decide to leave the beautiful and strange forest untouched." }
            }
        ]
    },
    {
        message: "A local holiday is approaching. The people ask for a celebration.",
        choices: [
            {
                text: "Grant a feast (Cost: 150 food)",
                cost: { food: 150 },
                successEffects: { rewards: [{ type: 'item', itemId: 'hearty_meal', amount: 1 }], log: "The feast raises everyone's spirits, and some even donate food back to the stores!" }
            },
            {
                text: "There is work to be done",
                successEffects: { rewards: [], log: "You decree that work is more important than celebration right now." }
            }
        ]
    },
    {
        message: "A heatwave is making construction work difficult and slow.",
        choices: [
            {
                text: "Provide extra water (Cost: 50 food)",
                cost: { food: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'scroll_of_haste', amount: 1 }], log: "Refreshed, your workers manage a burst of speed despite the heat." }
            },
            {
                text: "They must endure",
                successEffects: { rewards: [], log: "You tell the workers to push through the heat. Morale suffers, but resources are saved." }
            }
        ]
    },
    {
        message: "A trader caravan gets stuck in the mud nearby.",
        choices: [
            {
                text: "Help them (Cost: 30 wood)",
                cost: { wood: 30 },
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [80, 120] }], log: "The grateful traders pay you handsomely for your assistance." }
            },
            {
                text: "Demand payment first (50% success)",
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [150, 200] }], log: "The traders reluctantly agree to your high price." },
                failureEffects: { rewards: [], log: "Offended, the traders manage to free themselves and leave, spreading ill will." }
            }
        ]
    },
    {
        message: "A scholar has deciphered an ancient text that speaks of divine farming methods.",
        choices: [
            {
                text: "Try the new methods (Cost: 100 wood)",
                cost: { wood: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'golden_harvest', amount: 1 }], log: "The ancient methods work! Your next harvest will be legendary." }
            },
            {
                text: "Stick to what we know",
                successEffects: { rewards: [], log: "You decide the risk is not worth the potential reward." }
            }
        ]
    },
    {
        message: "Your blacksmith claims to have forged an unbreakable sword.",
        choices: [
            {
                text: "Reward their craftsmanship (Cost: 100 gold)",
                cost: { gold: 100 },
                successChance: 0.15,
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "The sword inspires the creation of a powerful banner for your army." },
                failureEffects: { rewards: [], log: "The sword is excellent, but not magical. Your blacksmith is encouraged by the reward." }
            },
            {
                text: "Prove it",
                successEffects: { rewards: [], log: "You test the sword against a shield. It breaks. The blacksmith returns to their forge, humbled." }
            }
        ]
    },
    {
        message: "A strange, silent pilgrim walks through your town, leaving behind a single, perfect seed.",
        choices: [
            {
                text: "Plant the seed",
                cost: { food: 10 },
                successChance: 0.05,
                successEffects: { rewards: [{ type: 'item', itemId: 'essence_of_the_earth', amount: 1 }], log: "A great tree grows overnight, its roots replenishing all the land around it." },
                failureEffects: { rewards: [], log: "A simple, beautiful flower grows from the seed." }
            },
            {
                text: "Discard it",
                successEffects: { rewards: [], log: "You throw the strange seed away, unwilling to take the risk." }
            }
        ]
    },
    {
        message: "A group of skilled masons are seeking work.",
        choices: [
            {
                text: "Hire them for a project (Cost: 120 gold)",
                cost: { gold: 120 },
                successEffects: { rewards: [{ type: 'item', itemId: 'blueprint_of_the_master', amount: 1 }], log: "Their work is so efficient they leave you with a master blueprint." }
            },
            {
                text: "We have enough workers",
                successEffects: { rewards: [], log: "You turn the masons away." }
            }
        ]
    },
    {
        message: "An earthquake has revealed a chasm that glitters with gold.",
        choices: [
            {
                text: "Send the miners in! (50% chance of collapse)",
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [500, 800] }], log: "A massive gold deposit is secured before the chasm becomes unstable." },
                failureEffects: { cost: { stone: 150 }, rewards: [], log: "A collapse traps mining equipment, which costs a large amount of stone to replace." }
            },
            {
                text: "It's too unstable",
                successEffects: { rewards: [], log: "You rope off the dangerous chasm, prioritizing safety over greed." }
            }
        ]
    },
    {
        message: "A legendary beast is said to dwell in the nearby mountains.",
        choices: [
            {
                text: "Form a grand hunting party (Cost: 250 food, 100 gold)",
                cost: { food: 250, gold: 100 },
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'heart_of_the_mountain', amount: 1 }], log: "You find not a beast, but the Heart of the Mountain itself!" },
                failureEffects: { rewards: [], log: "The beast is only a myth. The expedition returns empty-handed." }
            },
            {
                text: "Let legends lie",
                successEffects: { rewards: [], log: "You decide the cost of the expedition is too high for a mere story." }
            }
        ]
    },
    {
        message: "A solar eclipse casts a strange twilight over the land.",
        choices: [
            {
                text: "Perform a ritual of appeasement (Cost: 100 gold)",
                cost: { gold: 100 },
                successChance: 0.01,
                successEffects: { rewards: [{ type: 'item', itemId: 'whisper_of_the_creator', amount: 1 }], log: "Your ritual attunes you to the cosmos, granting a moment of divine productivity." },
                failureEffects: { rewards: [], log: "The sun returns as expected. Your gold is spent, but your people feel secure." }
            },
            {
                text: "It is a natural phenomenon",
                successEffects: { rewards: [], log: "You reassure your people that it is simply the moon passing before the sun." }
            }
        ]
    },
    {
        message: "Your village elder has fallen ill.",
        choices: [
            {
                text: "Use precious herbs to heal them (Cost: 40 gold)",
                cost: { gold: 40 },
                successEffects: { rewards: [{ type: 'item', itemId: 'tome_of_insight', amount: 1 }], log: "Grateful, the elder shares wisdom that will help your civilization advance." }
            },
            {
                text: "Let nature take its course",
                successEffects: { rewards: [], log: "You hope for the best. The elder recovers on their own after a few days." }
            }
        ]
    },
    {
        message: "Scouts report a wolf pack has become unusually aggressive, threatening woodcutters.",
        choices: [
            {
                text: "Hunt the pack leaders (Cost: 50 food)",
                cost: { food: 50 },
                successEffects: { rewards: [], log: "The hunt is successful. The pack scatters, and the forest is safe again." }
            },
            {
                text: "Recall woodcutters temporarily",
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: -75 }], log: "Woodcutting halts until the wolves move on, resulting in a loss of production." }
            }
        ]
    },
    {
        message: "A traveling storyteller captivates your people with tales of heroic deeds.",
        choices: [
            {
                text: "Let them stay (Cost: 25 food)",
                cost: { food: 25 },
                successEffects: { rewards: [{ type: 'item', itemId: 'drillmasters_whistle', amount: 1 }], log: "Inspired, your people work harder, and the storyteller leaves a gift." }
            },
            {
                text: "Send them away",
                successEffects: { rewards: [], log: "You have no time for stories and send the traveler away." }
            }
        ]
    },
    {
        message: "A gold rush has started in a nearby territory!",
        choices: [
            {
                text: "Send a large expedition (Cost: 150 food)",
                cost: { food: 150 },
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [300, 500] }], log: "Your prospectors strike a rich vein of gold!" },
                failureEffects: { rewards: [], log: "You arrive too late. The rush is over, and your food is wasted." }
            },
            {
                text: "It's a fool's errand",
                successEffects: { rewards: [], log: "You decide to focus on your own territory's resources." }
            }
        ]
    },
    {
        message: "Innovations in toolmaking have been proposed.",
        choices: [
            {
                text: "Invest in new tools (Cost: 80 wood, 40 gold)",
                cost: { wood: 80, gold: 40 },
                successEffects: { rewards: [{ type: 'item', itemId: 'foresters_axe', amount: 1 }], log: "The new tools are a breakthrough, especially for forestry." }
            },
            {
                text: "The old ways are better",
                successEffects: { rewards: [], log: "You reject the new designs, preferring traditional methods." }
            }
        ]
    },
    {
        message: "A local tournament is being organized.",
        choices: [
            {
                text: "Sponsor the event (Cost: 100 gold)",
                cost: { gold: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "The tournament is a grand success and a powerful banner is awarded to you as the patron." }
            },
            {
                text: "It's a frivolous expense",
                successEffects: { rewards: [], log: "You forbid the tournament, ordering the people back to work." }
            }
        ]
    },
    {
        message: "A sacred grove is discovered. The trees seem to whisper.",
        choices: [
            {
                text: "Listen to the trees (Cost: 50 food)",
                cost: { food: 50 },
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'essence_of_the_earth', amount: 1 }], log: "The whispers of the trees teach you secrets of the land itself." },
                failureEffects: { rewards: [], log: "You spend a peaceful day in the grove but learn nothing." }
            },
            {
                text: "Harvest the timber",
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: 300 }], log: "The sacred wood is of exceptional quality." }
            }
        ]
    },
    {
        message: "A vein of iron pyrite ('Fool's Gold') is discovered.",
        choices: [
            {
                text: "Mine it anyway (60% chance of use)",
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 50 }], log: "Your smiths manage to extract a small amount of real gold from the ore." },
                failureEffects: { rewards: [], log: "The ore is completely worthless. The effort is wasted." }
            },
            {
                text: "Mark it and move on",
                successEffects: { rewards: [], log: "You wisely avoid wasting time on the deceptive minerals." }
            }
        ]
    },
    {
        message: "Heavy rains are making the roads impassable.",
        choices: [
            {
                text: "Repair them with stone",
                cost: { stone: 100 },
                successEffects: { rewards: [], log: "The roads are now paved and more durable than before." }
            },
            {
                text: "Wait for the mud to dry",
                successEffects: { rewards: [], log: "You wait for the weather to improve, slowing down all movement for a time." }
            }
        ]
    },
    {
        message: "A visiting scholar offers to translate an ancient tome for a price.",
        choices: [
            {
                text: "Pay the fee (Cost: 180 gold)",
                cost: { gold: 180 },
                successEffects: { rewards: [{ type: 'item', itemId: 'tome_of_insight', amount: 1 }], log: "The tome contains profound insights that will accelerate your society's progress." }
            },
            {
                text: "We have no need for dead languages",
                successEffects: { rewards: [], log: "You send the scholar away, uninterested in their dusty books." }
            }
        ]
    },
    {
        message: "A child finds a strange, pulsating geode.",
        choices: [
            {
                text: "Crack it open",
                successChance: 0.15,
                successEffects: { rewards: [{ type: 'item', itemId: 'heart_of_the_mountain', amount: 1 }], log: "The geode contains the legendary Heart of the Mountain!" },
                failureEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 50 }], log: "The geode contains beautiful, but ordinary, crystals. You gain some stone." }
            },
            {
                text: "Sell it to a merchant",
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 100 }], log: "A traveling merchant pays a good price for the strange rock." }
            }
        ]
    },
    {
        message: "Tool handles have been breaking frequently.",
        choices: [
            {
                text: "Use better wood for new tools",
                cost: { wood: 120 },
                successEffects: { rewards: [{ type: 'item', itemId: 'foresters_axe', amount: 1 }], log: "The new tools are far more durable, and the innovation leads to better axe designs." }
            },
            {
                text: "Tell the workers to be more careful",
                successEffects: { rewards: [], log: "You blame the workers for the breakages. Morale drops." }
            }
        ]
    },
    {
        message: "A legendary warrior is buried nearby. It's said their ghost guards a great prize.",
        choices: [
            {
                text: "Brave the tomb (Cost: 100 food)",
                cost: { food: 100 },
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'horn_of_urgency', amount: 1 }], log: "You appease the spirit and are rewarded with the legendary Horn of Urgency." },
                failureEffects: { rewards: [], log: "The ghost scares your explorers away. The food for the expedition is lost." }
            },
            {
                text: "Respect the dead",
                successEffects: { rewards: [], log: "You decide it's best not to disturb the warrior's rest." }
            }
        ]
    },
    {
        message: "A traveling troupe of actors wishes to perform for your people.",
        choices: [
            {
                text: "Allow the performance (Cost: 30 gold)",
                cost: { gold: 30 },
                successEffects: { rewards: [], log: "The performance is a welcome diversion, raising spirits." }
            },
            {
                text: "We have no time for plays",
                successEffects: { rewards: [], log: "You send the actors away. The people are disappointed." }
            }
        ]
    },
    {
        message: "Your oldest villager claims to know a shortcut through the woods.",
        choices: [
            {
                text: "Trust their memory (40% success)",
                successChance: 0.4,
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 150 }], log: "The shortcut leads to a hidden grove of berry bushes!" },
                failureEffects: { cost: { food: 50 }, rewards: [], log: "The villager gets lost, and the search party consumes extra rations." }
            },
            {
                text: "Stick to the known paths",
                successEffects: { rewards: [], log: "You thank the elder for their suggestion but decide to play it safe." }
            }
        ]
    },
    {
        message: "A rare herb known for its energizing properties is found.",
        choices: [
            {
                text: "Give it to the builders",
                successEffects: { rewards: [{ type: 'item', itemId: 'scroll_of_haste', amount: 1 }], log: "The herb gives the builders a burst of energy, speeding their work." }
            },
            {
                text: "Give it to the farmers",
                successEffects: { rewards: [{ type: 'item', itemId: 'hearty_meal', amount: 1 }], log: "The herb helps the farmers work longer, bringing in a surplus of food." }
            }
        ]
    },
    {
        message: "A skilled orator is stirring up trouble, demanding more food for the people.",
        choices: [
            {
                text: "Give in to their demands",
                cost: { food: 100 },
                successEffects: { rewards: [], log: "You distribute extra food, and the crowd disperses peacefully." }
            },
            {
                text: "Arrest them",
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: -20 }], log: "You arrest the orator, but it costs gold to pay the guards and quell the unrest." }
            }
        ]
    },
    {
        message: "An abandoned mine shaft is discovered. It seems to have been hastily deserted.",
        choices: [
            {
                text: "Explore its depths (Cost: 70 food)",
                cost: { food: 70 },
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [100, 250] }, { type: 'resource', resource: 'stone', amount: [50, 150] }], log: "The miners left behind a decent amount of gold and stone!" },
                failureEffects: { rewards: [], log: "The mine is barren. The expedition was a waste of food." }
            },
            {
                text: "Seal the entrance",
                successEffects: { rewards: [], log: "You seal the dangerous-looking shaft to prevent any accidents." }
            }
        ]
    },
    {
        message: "A child has drawn a remarkably accurate map of the stars.",
        choices: [
            {
                text: "This is a sign! (Cost: 50 gold)",
                cost: { gold: 50 },
                successChance: 0.2,
                successEffects: { rewards: [{ type: 'item', itemId: 'tome_of_insight', amount: 1 }], log: "The map contains astronomical data that helps your scholars make a breakthrough." },
                failureEffects: { rewards: [], log: "It's a very nice drawing, but nothing more." }
            },
            {
                text: "Praise their artistic talent",
                successEffects: { rewards: [], log: "You praise the child's drawing, encouraging their talent." }
            }
        ]
    },
    {
        message: "A swarm of bees has built a huge hive in the town square.",
        choices: [
            {
                text: "Relocate the hive",
                cost: { wood: 40 },
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 100 }], log: "The hive is safely relocated, and you gain a steady supply of honey." }
            },
            {
                text: "Destroy it",
                successEffects: { rewards: [], log: "The hive is destroyed. The bees are gone, but so is the potential for honey." }
            }
        ]
    },
    {
        message: "A foreign dignitary is impressed by your military.",
        choices: [
            {
                text: "Accept their gift (Gain 'Drillmaster's Whistle')",
                successEffects: { rewards: [{ type: 'item', itemId: 'drillmasters_whistle', amount: 1 }], log: "The dignitary gifts you an item to help with your training regimen." }
            },
            {
                text: "Show them true strength (Cost: 50 gold)",
                cost: { gold: 50 },
                successEffects: { rewards: [], log: "You hold a military parade. The dignitary is impressed, but the display is costly." }
            }
        ]
    },
    {
        message: "A recent storm has washed up a strange, glowing piece of driftwood.",
        choices: [
            {
                text: "Burn it in a ritual fire",
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'pact_of_plenty', amount: 1 }], log: "The smoke from the fire blesses your lands with abundance." },
                failureEffects: { rewards: [], log: "The wood burns with a pretty blue flame. Nothing else happens." }
            },
            {
                text: "Carve it into a totem",
                cost: { wood: 20 },
                successEffects: { rewards: [], log: "You carve a beautiful totem that becomes a local landmark." }
            }
        ]
    },
    {
        message: "An old woman offers to sell you a 'lucky' charm.",
        choices: [
            {
                text: "Buy the charm (Cost: 30 gold)",
                cost: { gold: 30 },
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'item', itemId: 'builders_charm', amount: 1 }], log: "The charm seems to actually work, inspiring your builders!" },
                failureEffects: { rewards: [], log: "You bought a worthless trinket. The old woman is long gone." }
            },
            {
                text: "We make our own luck",
                successEffects: { rewards: [], log: "You politely decline the offer." }
            }
        ]
    },
    {
        message: "Your stonemasons are arguing over the best way to cut granite.",
        choices: [
            {
                text: "Fund an experimental new method",
                cost: { stone: 50 },
                successChance: 0.5,
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 150 }], log: "The new method is a breakthrough, yielding more stone from each block!" },
                failureEffects: { rewards: [], log: "The experiment fails, and the stone is wasted." }
            },
            {
                text: "Tell them to work it out",
                successEffects: { rewards: [], log: "You order them to stop bickering and get back to work." }
            }
        ]
    },
    {
        message: "A particularly large and ancient tree in the forest has fallen in a storm.",
        choices: [
            {
                text: "Harvest its wood",
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: 250 }], log: "The ancient tree provides a massive amount of high-quality lumber." }
            },
            {
                text: "Carve a monument from its stump",
                cost: { food: 50 },
                successEffects: { rewards: [], log: "Your people spend the day carving a beautiful monument, boosting morale." }
            }
        ]
    },
    {
        message: "Your people are growing restless and bored.",
        choices: [
            {
                text: "Declare a holiday",
                cost: { food: 100 },
                successEffects: { rewards: [], log: "A day of feasting and games raises spirits, but at a cost." }
            },
            {
                text: "Organize a building competition",
                cost: { wood: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'scroll_of_haste', amount: 1 }], log: "The competition is fierce, and new, faster building techniques are discovered." }
            }
        ]
    },
    {
        message: "A prospector claims to have found a rich mineral vein, but it's in dangerous territory.",
        choices: [
            {
                text: "Fund his risky expedition (Cost: 100 gold)",
                cost: { gold: 100 },
                successChance: 0.4,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [400, 700] }], log: "The risk pays off! The vein is richer than you imagined." },
                failureEffects: { rewards: [], log: "The prospector returns empty-handed, having lost your investment." }
            },
            {
                text: "It's not worth the danger",
                successEffects: { rewards: [], log: "You decide against the risky venture." }
            }
        ]
    },
    {
        message: "A new type of crop is discovered that could be more resilient to drought.",
        choices: [
            {
                text: "Replace some old fields (Cost: 100 wood)",
                cost: { wood: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'golden_harvest', amount: 1 }], log: "The new crop is a miracle, promising a golden harvest." }
            },
            {
                text: "Stick with the traditional crops",
                successEffects: { rewards: [], log: "You decide not to risk your food supply on an unknown crop." }
            }
        ]
    },
    {
        message: "A master blacksmith has passed away, leaving his legendary forge to you.",
        choices: [
            {
                text: "Study his notes (Cost: 50 gold)",
                cost: { gold: 50 },
                successChance: 0.2,
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "His notes contain secrets of forging that inspire your military." }
            },
            {
                text: "Give him a state funeral",
                cost: { food: 50 },
                successEffects: { rewards: [], log: "You honor the blacksmith with a grand funeral. His legacy lives on." }
            }
        ]
    },
    {
        message: "A fissure in the earth has opened up, releasing a strange, shimmering gas.",
        choices: [
            {
                text: "Bottle the gas for study",
                cost: { gold: 100 },
                successChance: 0.05,
                successEffects: { rewards: [{ type: 'item', itemId: 'whisper_of_the_creator', amount: 1 }], log: "The gas has reality-bending properties, allowing you to complete all tasks instantly." },
                failureEffects: { rewards: [], log: "The gas is inert and harmless. The expensive containers you built are wasted." }
            },
            {
                text: "Evacuate the area",
                successEffects: { rewards: [], log: "You evacuate the area until the strange gas dissipates." }
            }
        ]
    },
    {
        message: "A group of refugees arrives, fleeing a war-torn land. They are skilled builders.",
        choices: [
            {
                text: "Welcome them (Gain 2 villagers)",
                successEffects: { rewards: [{ type: 'unit', unitType: 'villager', amount: 2 }], log: "You welcome the refugees. Their skills will be a great asset." }
            },
            {
                text: "Turn them away",
                successEffects: { rewards: [], log: "You cannot support more people and must turn the refugees away." }
            }
        ]
    },
    {
        message: "A cart full of stone breaks an axle in your town center.",
        choices: [
            {
                text: "Help repair the cart",
                cost: { wood: 20 },
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 100 }], log: "The grateful mason leaves you with a portion of his stone as thanks." }
            },
            {
                text: "Fine him for blocking the road",
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 30 }], log: "You fine the mason. He pays, but leaves in a huff." }
            }
        ]
    },
    {
        message: "A child dreams of a place where the rocks 'sing'.",
        choices: [
            {
                text: "Send a party to the place in the dream",
                cost: { food: 50 },
                successChance: 0.15,
                successEffects: { rewards: [{ type: 'item', itemId: 'heart_of_the_mountain', amount: 1 }], log: "The dream was a vision! You've found the Heart of the Mountain." },
                failureEffects: { rewards: [], log: "The place from the dream is just a normal pile of rocks." }
            },
            {
                text: "It was just a dream",
                successEffects: { rewards: [], log: "You dismiss the child's dream as fantasy." }
            }
        ]
    },
    {
        message: "A powerful storm is on the horizon.",
        choices: [
            {
                text: "Reinforce buildings (Cost: 100 wood, 50 stone)",
                cost: { wood: 100, stone: 50 },
                successEffects: { rewards: [], log: "Your buildings withstand the storm without issue thanks to your preparations." }
            },
            {
                text: "Hope for the best",
                successChance: 0.6,
                successEffects: { rewards: [], log: "The storm passes with only minor damage." },
                failureEffects: { cost: { wood: 150 }, rewards: [], log: "The storm is devastating, causing widespread damage that costs a lot of wood to repair." }
            }
        ]
    },
    {
        message: "A wandering monk offers to teach your people the art of meditation.",
        choices: [
            {
                text: "Accept his teachings (Cost: 50 food)",
                cost: { food: 50 },
                successEffects: { rewards: [{ type: 'item', itemId: 'pact_of_plenty', amount: 1 }], log: "Meditation brings focus and efficiency, leading to a pact of plenty." }
            },
            {
                text: "We prefer action to inaction",
                successEffects: { rewards: [], log: "You decline the monk's offer." }
            }
        ]
    },
    {
        message: "Scouts have found a pristine, untouched ancient forest.",
        choices: [
            {
                text: "Establish a logging camp (Cost: 50 wood)",
                cost: { wood: 50 },
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: 400 }], log: "The ancient forest provides an enormous bounty of wood." }
            },
            {
                text: "Declare it a protected reserve",
                successChance: 0.1,
                successEffects: { rewards: [{ type: 'item', itemId: 'foresters_axe', amount: 1 }], log: "The spirit of the forest rewards your respect with a blessed axe." },
                failureEffects: { rewards: [], log: "You preserve the forest. Your people appreciate its beauty." }
            }
        ]
    },
    {
        message: "A con artist is selling 'invincibility potions' to your soldiers.",
        choices: [
            {
                text: "Arrest the con artist",
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 40 }], log: "You arrest the fraud and confiscate their earnings." }
            },
            {
                text: "Buy a potion for testing (Cost: 10 gold)",
                cost: { gold: 10 },
                successEffects: { rewards: [], log: "It's just colored water. You expose the fraud publicly." }
            }
        ]
    },
    {
        message: "An alchemist offers a potion that can 'transmute' resources.",
        choices: [
            {
                text: "Turn 100 wood into gold (60% success)",
                cost: { wood: 100 },
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 80 }], log: "The transmutation works! It's not a perfect conversion, but it's profitable." },
                failureEffects: { rewards: [], log: "The potion fizzes and turns the wood into a pile of useless sludge." }
            },
            {
                text: "This is witchcraft!",
                successEffects: { rewards: [], log: "You accuse the alchemist of witchcraft and drive them out of town." }
            }
        ]
    },
    {
        message: "A recent victory has your soldiers celebrating loudly.",
        choices: [
            {
                text: "Let them celebrate",
                cost: { food: 75 },
                successEffects: { rewards: [], log: "The celebration is good for morale, but consumes a good amount of food and drink." }
            },
            {
                text: "Discipline is key",
                successEffects: { rewards: [], log: "You order the soldiers back to their posts. They grumble, but obey." }
            }
        ]
    },
    {
        message: "A trader from a far-off desert land offers exotic spices.",
        choices: [
            {
                text: "Trade food for spices (Cost: 100 food)",
                cost: { food: 100 },
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: 120 }], log: "The spices are a luxury item you easily trade for a large amount of gold." }
            },
            {
                text: "We have no need for spices",
                successEffects: { rewards: [], log: "You decline the trader's offer." }
            }
        ]
    },
    {
        message: "A pack of territorial boars have made a nearby berry patch their home.",
        choices: [
            {
                text: "Hunt the boars",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 150 }], log: "You clear out the boars, gaining access to the berries and providing meat for your people." }
            },
            {
                text: "Find another patch",
                successEffects: { rewards: [], log: "You decide it's not worth the effort and send your gatherers elsewhere." }
            }
        ]
    },
    {
        message: "A strange fog has rolled in, making it hard to work.",
        choices: [
            {
                text: "Light guidance fires (Cost: 40 wood)",
                cost: { wood: 40 },
                successEffects: { rewards: [], log: "The fires help your workers navigate the fog, and work continues as normal." }
            },
            {
                text: "Halt outdoor work",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: -50 }, { type: 'resource', resource: 'wood', amount: -50 }], log: "All outdoor gathering stops until the fog lifts, causing a loss in production." }
            }
        ]
    },
    {
        message: "A skilled hunter offers to track game for your settlement.",
        choices: [
            {
                text: "Hire them (Cost: 50 gold)",
                cost: { gold: 50 },
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 200 }], log: "The hunter is true to their word and brings in a massive haul of game." }
            },
            {
                text: "We can hunt for ourselves",
                successEffects: { rewards: [], log: "You politely decline the hunter's services." }
            }
        ]
    },
    {
        message: "Your farmers have developed a new, more effective fertilizer.",
        choices: [
            {
                text: "Implement it immediately (Cost: 80 wood)",
                cost: { wood: 80 },
                successEffects: { rewards: [{ type: 'item', itemId: 'golden_harvest', amount: 1 }], log: "The fertilizer works wonders, ensuring a massive, golden harvest." }
            },
            {
                text: "What if it poisons the soil?",
                successEffects: { rewards: [], log: "You are too cautious and stick to the old ways." }
            }
        ]
    },
    {
        message: "A retired general offers to write a treatise on warfare for your library.",
        choices: [
            {
                text: "Commission the work (Cost: 100 gold)",
                cost: { gold: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'banner_of_command', amount: 1 }], log: "The treatise is a masterpiece of strategy and inspires your commanders." }
            },
            {
                text: "We learn from doing, not reading",
                successEffects: { rewards: [], log: "You believe experience is the only true teacher and decline the offer." }
            }
        ]
    },
    {
        message: "A prophecy foretells a great doom, but also a great reward for the faithful.",
        choices: [
            {
                text: "Make a great sacrifice (Cost: 200 of each resource)",
                cost: { food: 200, wood: 200, gold: 200, stone: 200 },
                successChance: 0.02,
                successEffects: { rewards: [{ type: 'item', itemId: 'whisper_of_the_creator', amount: 1 }], log: "Your faith is rewarded! A divine power washes over your lands." },
                failureEffects: { rewards: [], log: "The doom does not come to pass. Your sacrifice seems to have been for nothing." }
            },
            {
                text: "Prophecies are nonsense",
                successEffects: { rewards: [], log: "You ignore the prophecy and focus on the present." }
            }
        ]
    },
    {
        message: "The local river has flooded its banks, depositing rich, fertile silt on your farms.",
        choices: [
            {
                text: "Capitalize on the opportunity!",
                successEffects: { rewards: [{ type: 'resource', resource: 'food', amount: 250 }], log: "Your farmers work the new soil, bringing in a record-breaking haul of food." }
            },
            {
                text: "It will take time to clear",
                successEffects: { rewards: [], log: "You decide to wait for the fields to dry normally." }
            }
        ]
    },
    {
        message: "A cache of old, but usable, building materials has been found.",
        choices: [
            {
                text: "Add them to the stockpile",
                successEffects: { rewards: [{ type: 'resource', resource: 'wood', amount: 75 }, { type: 'resource', resource: 'stone', amount: 75 }], log: "The materials are a welcome addition to your reserves." }
            }
        ]
    },
    {
        message: "A famous poet wishes to become your civilization's artist-in-residence.",
        choices: [
            {
                text: "Grant them a stipend (Cost: 40 gold)",
                cost: { gold: 40 },
                successEffects: { rewards: [], log: "The poet's work brings culture and joy to your people." }
            },
            {
                text: "Poetry doesn't fill bellies",
                successEffects: { rewards: [], log: "You send the poet away, focusing on practical needs." }
            }
        ]
    },
    {
        message: "A vein of beautiful marble has been discovered.",
        choices: [
            {
                text: "Quarry it for building (Gain 150 stone)",
                successEffects: { rewards: [{ type: 'resource', resource: 'stone', amount: 150 }], log: "The marble is excellent building material." }
            },
            {
                text: "Use it for statues (Cost: 50 gold)",
                cost: { gold: 50 },
                successEffects: { rewards: [], log: "You commission beautiful statues, which become a symbol of your civilization's prosperity." }
            }
        ]
    },
    {
        message: "Your scouts have found a pass through the mountains, but it is treacherous.",
        choices: [
            {
                text: "Establish a trade route (Cost: 100 wood)",
                cost: { wood: 100 },
                successChance: 0.6,
                successEffects: { rewards: [{ type: 'resource', resource: 'gold', amount: [200, 350] }], log: "The trade route is profitable, bringing in a steady stream of gold." },
                failureEffects: { rewards: [], log: "A rockslide closes the pass. The wood used for supports is lost." }
            },
            {
                text: "It is too dangerous to use",
                successEffects: { rewards: [], log: "You decide the risk of using the pass is too great." }
            }
        ]
    },
    {
        message: "An inventor has created a new type of plow.",
        choices: [
            {
                text: "Equip your farmers (Cost: 100 gold)",
                cost: { gold: 100 },
                successEffects: { rewards: [{ type: 'item', itemId: 'pact_of_plenty', amount: 1 }], log: "The new plows dramatically increase farm yields, leading to an era of plenty." }
            },
            {
                text: "It looks flimsy",
                successEffects: { rewards: [], log: "You are skeptical of the invention and refuse to fund it." }
            }
        ]
    },
    {
        message: "The anniversary of your civilization's founding is approaching.",
        choices: [
            {
                text: "Declare a week of games (Cost: 200 food)",
                cost: { food: 200 },
                successChance: 0.2,
                successEffects: { rewards: [{ type: 'item', itemId: 'horn_of_urgency', amount: 1 }], log: "The games are legendary! The victor wins a mythical Horn." },
                failureEffects: { rewards: [], log: "The games are a great success and morale is at an all-time high." }
            },
            {
                text: "A simple day of rest will do",
                cost: { food: 50 },
                successEffects: { rewards: [], log: "The people appreciate the day off to spend with their families." }
            }
        ]
    },
    {
        message: "A local hero has passed away in their sleep.",
        choices: [
            {
                text: "Build a monument in their honor",
                cost: { stone: 150 },
                successEffects: { rewards: [], log: "The monument inspires your people for generations to come." }
            },
            {
                text: "Give them a quiet funeral",
                successEffects: { rewards: [], log: "You give the hero a respectful, but simple, burial." }
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
