import type { UnitConfig } from '../types';

export const INITIAL_UNITS: Omit<UnitConfig, 'isActive' | 'isPredefined' | 'order'>[] = [
    { 
        id: 'swordsman', 
        name: 'Swordsman', 
        description: 'Basic melee infantry.', 
        cost: { food: 60, gold: 20 }, 
        trainTime: 22,
        hp: 45,
        attack: 4,
        iconId: 'swordsman',
        requiredBuilding: 'barracks'
    },
    { 
        id: 'archer', 
        name: 'Archer', 
        description: 'Ranged unit effective against infantry.', 
        cost: { food: 30, wood: 40 }, 
        trainTime: 25,
        hp: 30,
        attack: 5,
        iconId: 'archer',
        requiredBuilding: 'archeryRange'
    },
    { 
        id: 'knight', 
        name: 'Knight', 
        description: 'Fast and powerful cavalry.', 
        cost: { food: 60, gold: 75 }, 
        trainTime: 30,
        hp: 100,
        attack: 10,
        iconId: 'knight',
        requiredBuilding: 'stable'
    },
    { 
        id: 'catapult', 
        name: 'Catapult', 
        description: 'Siege engine devastating to buildings.', 
        cost: { wood: 150, gold: 150 }, 
        trainTime: 45,
        hp: 50,
        attack: 75,
        iconId: 'catapult',
        requiredBuilding: 'siegeWorkshop'
    },
];
