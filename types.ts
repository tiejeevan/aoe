















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

export type Resources = Record<string, number>;
export type ResourceDeltas = Record<string, number>;

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

export type Buildings = Record<string, BuildingInstance[]>;

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

export type BuildingCosts = Record<string, number>;

export type ItemRarity = 'Common' | 'Epic' | 'Legendary' | 'Spiritual';

export interface GameItem {
    id: string;
    name: string;
    description: string;
    rarity: ItemRarity;
}

export type Reward = 
    { type: 'resource', resource: string, amount: number | [number, number] } |
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

export type LogIconType = string;

export interface GameLogEntry {
    id: string;
    message: string;
    icon: LogIconType;
}

export type UnitClassification = 'infantry' | 'cavalry' | 'archer' | 'siege' | 'ship' | 'support' | 'mythical';
export type ArmorClassification = 'melee' | 'pierce' | 'siege' | 'magic' | 'elemental';

export interface ArmorValue {
    type: ArmorClassification;
    value: number;
}

export interface AttackBonus {
    targetType: UnitClassification;
    bonus: number;
}

export interface DamageType {
    type: string; // e.g., 'slash', 'pierce', 'fire', 'magic'
    value: number;
}
export interface TerrainModifier {
    terrainType: string; // e.g., 'forest', 'desert', 'plains'
    speedBonus: number; // percentage, can be negative
}

export interface UnitUpgradePath {
    targetUnitId: string;
    cost: BuildingCosts;
    time: number;
    researchRequired?: string;
}

export interface UnitConfig {
    id: MilitaryUnitType;
    name: string;
    description: string;
    cost: BuildingCosts;
    trainTime: number; // in seconds
    hp: number;
    iconId: string;
    requiredBuilding: string;
    isActive: boolean;
    isPredefined: boolean;
    order: number;

    // --- Core Combat ---
    attack?: number; // Main attack value, can be overridden by damageTypes
    attackRate?: number; // attacks per second
    attackRange?: number; // in grid cells
    damageTypes?: DamageType[];
    armorValues?: ArmorValue[];
    armorPenetration?: number; // percentage
    criticalChance?: number; // percentage
    
    // --- Mobility ---
    movementSpeed?: number; // in grid cells per second
    terrainModifiers?: TerrainModifier[];
    stamina?: number;
    
    // --- Unit Classification & Counters ---
    unitType?: UnitClassification;
    attackBonuses?: AttackBonus[];
    
    // --- Economy & Meta ---
    populationCost?: number;
    maintenanceCost?: BuildingCosts;
    seasonalAvailability?: string[]; // e.g., ['Summer', 'Winter'] or event names
    modTags?: string[];

    // --- Upgrades & Tech Tree ---
    treeId?: string;
    upgradesTo?: UnitUpgradePath[];
    isUpgradeOnly?: boolean;
    requiredBuildingIds?: string[]; // Additional buildings that must exist to enable training
    requiredResearchIds?: string[];
}


export interface UINotification {
    id: string;
    message: string;
}

export interface ResourceNode {
  id: string;
  type: string; // Now a string to be dynamic
  position: { x: number; y: number; };
  amount: number;
  richness?: number; // e.g., 1 for normal, 2 for rich
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
        resource: string;
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
    treeId?: string; // Unique ID for an upgrade family of buildings.
    
    // Comprehensive Attributes
    populationCapacity?: number;
    garrisonCapacity?: number;
    generatesResource?: string | 'none';
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

export type ResourceRarity = 'Abundant' | 'Common' | 'Uncommon' | 'Rare' | 'Strategic';

export interface ResourceConfig {
    id: string;
    name: string;
    description: string;
    iconId: string;
    isActive: boolean;
    isPredefined: boolean;
    order: number;

    // --- Economy & Spawning ---
    rarity: ResourceRarity;
    initialAmount: number;
    baseGatherRate: number;
    spawnInSafeZone: boolean;
    isTradable: boolean;

    // --- Advanced Mechanics (Future-Proofing) ---
    decaysOverTime?: boolean;
    decayRate?: number; // percentage per minute
    storageBuildingId?: string; // ID of building that increases capacity
}
