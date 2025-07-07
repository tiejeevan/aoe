import type { ResearchConfig } from '../types';

export const INITIAL_RESEARCH: Omit<ResearchConfig, 'id' | 'isActive' | 'isPredefined' | 'order'>[] = [
    {
        name: "Forged Tools",
        description: "Improved tools allow villagers to gather all resources 10% faster.",
        iconId: 'wrench',
        cost: { food: 75, wood: 50 },
        researchTime: 30,
        requiredBuildingId: 'blacksmith',
        ageRequirement: 'Nomadic Age',
        effects: [] // Effects are complex and better defined by the player for now
    },
    {
        name: "Leather Armor",
        description: "+1 melee armor for Swordsmen.",
        iconId: 'shield',
        cost: { food: 100 },
        researchTime: 40,
        requiredBuildingId: 'blacksmith',
        ageRequirement: 'Feudal Age',
        effects: []
    },
    {
        name: "Fletching",
        description: "+1 attack and +1 range for Archers.",
        iconId: 'target',
        cost: { food: 100, gold: 50 },
        researchTime: 50,
        requiredBuildingId: 'blacksmith',
        ageRequirement: 'Feudal Age',
        effects: []
    }
];
