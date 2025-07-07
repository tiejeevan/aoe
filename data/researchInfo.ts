
import type { ResearchConfig } from '../types';

export const INITIAL_RESEARCH: Omit<ResearchConfig, 'id' | 'isActive' | 'isPredefined' | 'order' | 'ageRequirement' | 'requiredBuildingId'>[] = [
    {
        name: "Loom",
        treeId: "core_economy",
        treeName: "Core Economy",
        description: "Villagers gain +15 HP and +1 armor, making them more resilient.",
        iconId: 'wrench',
        cost: { gold: 50 },
        researchTime: 25,
        prerequisites: [],
        effects: [],
        colorTheme: '#34D399',
    },
    {
        name: "Forged Tools",
        treeId: "core_economy",
        treeName: "Core Economy",
        description: "Improved tools allow villagers to gather all resources 15% faster.",
        iconId: 'wrench',
        cost: { food: 100 },
        researchTime: 40,
        prerequisites: ['loom'],
        effects: []
    },
    {
        name: "Scale Mail Armor",
        treeId: "core_military",
        treeName: "Core Military",
        description: "+1 melee and +1 pierce armor for infantry.",
        iconId: 'shield',
        cost: { food: 100 },
        researchTime: 40,
        prerequisites: [],
        effects: [],
        colorTheme: '#F87171',
    },
    {
        name: "Fletching",
        treeId: "core_military",
        treeName: "Core Military",
        description: "+1 attack and +1 range for Archers.",
        iconId: 'target',
        cost: { food: 100, gold: 50 },
        researchTime: 30,
        prerequisites: ['scale_mail_armor'],
        effects: []
    }
];
