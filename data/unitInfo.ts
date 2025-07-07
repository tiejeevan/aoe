import type { UnitConfig } from '../types';

export const INITIAL_UNITS: Omit<UnitConfig, 'isActive' | 'isPredefined' | 'order' | 'treeId' | 'id'>[] = [
    { 
        name: 'Swordsman', 
        description: 'Basic melee infantry. Sturdy and reliable.', 
        cost: { food: 60, gold: 20 }, 
        trainTime: 22,
        hp: 45,
        attack: 4,
        attackRate: 1,
        attackRange: 0,
        movementSpeed: 1,
        populationCost: 1,
        unitType: 'infantry',
        armorValues: [{ type: 'melee', value: 1 }],
        iconId: 'swordsman',
        requiredBuilding: 'barracks'
    },
    { 
        name: 'Archer', 
        description: 'Ranged unit effective against infantry.', 
        cost: { food: 30, wood: 40 }, 
        trainTime: 25,
        hp: 30,
        attack: 5,
        attackRate: 0.8,
        attackRange: 4,
        movementSpeed: 1.1,
        populationCost: 1,
        unitType: 'archer',
        attackBonuses: [{ targetType: 'infantry', bonus: 2 }],
        iconId: 'archer',
        requiredBuilding: 'archeryRange'
    },
    { 
        name: 'Knight', 
        description: 'Fast and powerful cavalry, excels at raiding.', 
        cost: { food: 60, gold: 75 }, 
        trainTime: 30,
        hp: 100,
        attack: 10,
        attackRate: 1.2,
        attackRange: 0,
        movementSpeed: 1.5,
        populationCost: 1,
        unitType: 'cavalry',
        armorValues: [{ type: 'melee', value: 2 }, { type: 'pierce', value: 1 }],
        iconId: 'knight',
        requiredBuilding: 'stable'
    },
    { 
        name: 'Catapult', 
        description: 'Siege engine devastating to buildings.', 
        cost: { wood: 150, gold: 150 }, 
        trainTime: 45,
        hp: 50,
        attack: 75,
        attackRate: 0.2, // very slow
        attackRange: 8,
        movementSpeed: 0.6,
        populationCost: 2,
        unitType: 'siege',
        attackBonuses: [{ targetType: 'siege', bonus: 25 }], // for counter-sieging buildings
        iconId: 'catapult',
        requiredBuilding: 'siegeWorkshop'
    },
];
