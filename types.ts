










export enum GameStatus {
    MENU,
    LOADING,
    PLAYING,
    GAME_OVER,
}

export interface Civilization {
    name: string;
    lore: string;
    bonus: string;
    uniqueUnit: {
        name:string;
        description: string;
    };
    bannerUrl: string;
}

export interface Resources {
    food: number;
    wood: number;
    gold: number;
    stone: number;
}

export type ResourceDeltas = Partial<Resources>;

export interface Villager {
    id: string;
    name: string;
    currentTask: string | null; // null if idle, otherwise the ID of the GameTask
}

export type MilitaryUnitType = 'swordsman' | 'archer' | 'knight' | 'catapult' | string;

export interface MilitaryUnit {
    id: string;
    name: string;
    title: string;
    unitType: MilitaryUnitType;
}

export interface Units {
    villagers: Villager[];
    military: MilitaryUnit[];
}

export type BuildingType = 'houses' | 'barracks' | 'archeryRange' | 'stable' | 'siegeWorkshop' | 'blacksmith' | 'watchTower' | 'townCenter';

export interface BuildingInstance {
    id: string;
    name: string;
    position: { x: number; y: number; };
    currentHp: number;
}

export interface Buildings {
    houses: BuildingInstance[];
    barracks: BuildingInstance[];
    archeryRange: BuildingInstance[];
    stable: BuildingInstance[];
    siegeWorkshop: BuildingInstance[];
    blacksmith: BuildingInstance[];
    watchTower: BuildingInstance[];
    [key: string]: BuildingInstance[]; // Allow for custom building types
}

export interface GameStatePayload {
    civ: Civilization;
    age: string;
    res: Resources;
    units: {
        villagers: number;
        swordsmen: number;
        archers: number;
        knights: number;
        catapults: number;
    };
    buildings: { [key in BuildingType]?: number };
}

export type BuildingCosts = { [key in keyof Resources]?: number };

export type ItemRarity = 'Common' | 'Epic' | 'Legendary' | 'Spiritual';

export interface GameItem {
    id: string;
    name: string;
    description: string;
    rarity: ItemRarity;
}

export type Reward = 
    { type: 'resource', resource: keyof Resources, amount: number | [number, number] } |
    { type: 'item', itemId: string, amount: number } |
    { type: 'unit', unitType: 'villager', amount: number } |
    { type: 'building', buildingId: string, amount: number };

export interface GameEventChoice {
    text: string;
    cost?: BuildingCosts;
    successChance?: number; // 0-1, undefined means 100%
    successEffects: { rewards: Reward[], log: string };
    failureEffects?: { rewards: Reward[], log: string };
}

export interface GameEvent {
    message: string;
    choices: GameEventChoice[];
}

export type LogIconType = keyof Resources | 'villager' | MilitaryUnitType | 'age' | 'event' | 'system' | BuildingType | string | 'item';

export interface GameLogEntry {
    id: string;
    message: string;
    icon: LogIconType;
}

export interface UnitConfig {
    id: MilitaryUnitType;
    name: string;
    description: string;
    cost: BuildingCosts;
    trainTime: number; // in seconds
    hp: number;
    attack: number;
    iconId: string;
    requiredBuilding: string;
    isActive: boolean;
    isPredefined: boolean;
    order: number;
}

export interface UINotification {
    id: string;
    message: string;
}

export type ResourceNodeType = 'food' | 'wood' | 'gold' | 'stone';

export interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  position: { x: number; y: number; };
  amount: number;
}

export type TaskType = 'gather' | 'build' | 'train_villager' | 'train_military' | 'advance_age' | 'upgrade_building';

export type PlayerActionState = {
    mode: 'build';
    buildingType: BuildingType | string;
    villagerId: string;
} | null;


export interface GameTask {
    id: string;
    type: TaskType;
    startTime: number;
    duration: number; // in milliseconds
    payload?: {
        // Shared
        buildingId?: string; // ID of the building performing the action (e.g. TC for training)
        villagerIds?: string[];
        count?: number;
        
        // Build task
        buildingType?: BuildingType | string;
        position?: { x: number; y: number };
        
        // Train military task
        unitType?: MilitaryUnitType;
        
        // Gather task
        resourceNodeId?: string;

        // Upgrade Task
        originalBuildingId?: string;
        originalBuildingType?: string;
        targetBuildingType?: string;
    };
}

export interface ActiveBuffs {
    buildTimeReduction?: { percentage: number; uses: number };
    trainTimeReduction?: { percentage: number; uses: number };
    resourceBoost?: {
        resource: keyof Resources;
        multiplier: number;
        endTime: number;
    }[];
    permanentTrainTimeReduction?: number; // percentage
}

export interface AgeConfig {
    id: string; // For custom ages, `custom-${timestamp}`. For predefined, just the name.
    name: string;
    description: string;
    isActive: boolean;
    isPredefined: boolean;
    order: number;
}

export interface BuildingUpgradePath {
    id: string; // The ID of the building this one upgrades to
    cost: BuildingCosts;
    time: number; // in seconds
    researchRequired?: string; // Future use
}

export interface BuildingConfig {
    id: BuildingType | string;
    name: string;
    description: string;
    cost: BuildingCosts;
    isUnique: boolean;
    buildLimit?: number;
    buildTime: number; // in seconds
    hp: number;
    unlockedInAge: string; // name of the age
    iconId: string; // key from buildingIconMap
    isActive: boolean;
    isPredefined: boolean;
    order: number;
    canTrainUnits: boolean;
    isUpgradeOnly?: boolean;
    upgradesTo?: BuildingUpgradePath[];
    
    // Comprehensive Attributes
    populationCapacity?: number;
    garrisonCapacity?: number;
    generatesResource?: keyof Resources | 'none';
    generationRate?: number; // per minute
    attack?: number;
    attackRate?: number; // attacks per second
    attackRange?: number;
    healRate?: number; // hp per second for garrisoned units
    visionRange?: number;
    requiredBuildingId?: string;
    
    // Future-Proofing Attributes
    researchCost?: BuildingCosts;
    researchTime?: number; // in seconds
    unlocksResearchIds?: string[];
    requiresResearch?: boolean;

    awardPoints?: number;
    awardTier?: 'Bronze' | 'Silver' | 'Gold';
    
    customModelId?: string;
    placementRadius?: number; // minimum distance from another building of the same type
    
    seasonalVariantIds?: string[];
    maintenanceCost?: BuildingCosts; // per minute
    decayRate?: number; // hp loss per minute
}


export interface FullGameState {
    civilization: Civilization;
    resources: Resources;
    units: Units;
    buildings: Buildings;
    currentAge: string;
    gameLog: GameLogEntry[];
    activeTasks: GameTask[];
    resourceNodes: ResourceNode[];
    inventory: GameItem[];
    activeBuffs: ActiveBuffs;
}
