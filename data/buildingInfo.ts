import type { BuildingInfo } from '../types';

export const INITIAL_BUILDINGS: Omit<BuildingInfo, 'id'> & { id: 'houses' | 'barracks' | 'archeryRange' | 'stable' | 'siegeWorkshop' | 'blacksmith' | 'watchTower' | 'townCenter' }[] = [
    { id: 'houses', name: 'House', description: 'Increases population capacity by 5.', cost: { wood: 50 }, isUnique: false, buildTime: 15, hp: 550, canTrainUnits: false, upgradesTo: [] },
    { id: 'barracks', name: 'Barracks', description: 'Allows training of Swordsmen.', cost: { wood: 150, stone: 50 }, isUnique: true, buildTime: 60, hp: 1200, canTrainUnits: true, upgradesTo: [] },
    { id: 'archeryRange', name: 'Archery Range', description: 'Allows training of Archers.', cost: { wood: 175 }, isUnique: true, buildTime: 60, hp: 1200, canTrainUnits: true, upgradesTo: [] },
    { id: 'stable', name: 'Stables', description: 'Allows training of Knights.', cost: { wood: 175, gold: 75 }, isUnique: true, buildTime: 75, hp: 1200, canTrainUnits: true, upgradesTo: [] },
    { id: 'siegeWorkshop', name: 'Siege Workshop', description: 'Constructs powerful Catapults.', cost: { wood: 200, gold: 150 }, isUnique: true, buildTime: 90, hp: 2100, canTrainUnits: true, upgradesTo: [] },
    { id: 'blacksmith', name: 'Blacksmith', description: 'Researches infantry and cavalry upgrades.', cost: { wood: 100, gold: 100 }, isUnique: true, buildTime: 45, hp: 2100, canTrainUnits: false, upgradesTo: [] },
    { id: 'watchTower', name: 'Watch Tower', description: 'Provides defense against raids.', cost: { stone: 125 }, isUnique: true, buildTime: 45, hp: 1500, canTrainUnits: false, upgradesTo: [] },
    { id: 'townCenter', name: 'Town Center', description: 'The heart of your settlement.', cost: {}, isUnique: true, buildTime: 0, hp: 2400, canTrainUnits: false, upgradesTo: [] }
];
