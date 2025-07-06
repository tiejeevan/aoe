
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
        name: string;
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
}

export type MilitaryUnitType = 'swordsman' | 'archer' | 'knight' | 'catapult';

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
}

export interface Buildings {
    houses: BuildingInstance[];
    barracks: BuildingInstance[];
    archeryRange: BuildingInstance[];
    stable: BuildingInstance[];
    siegeWorkshop: BuildingInstance[];
    blacksmith: BuildingInstance[];
    watchTower: BuildingInstance[];
    townCenter: BuildingInstance[];
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

export interface GameEventChoice {
    text: string;
    effects: {
        resource: keyof Resources | 'none';
        amount: number;
        log: string;
    }
}

export interface GameEvent {
    message: string;
    choices: GameEventChoice[];
}

export type LogIconType = keyof Resources | 'villager' | MilitaryUnitType | 'age' | 'event' | 'system' | BuildingType;

export interface GameLogEntry {
    id: string;
    message: string;
    icon: LogIconType;
}

export type BuildingCosts = { [key in keyof Resources]?: number };

export interface BuildingInfo {
    id: BuildingType;
    name: string;
    description: string;
    cost: BuildingCosts;
    isUnique: boolean;
    buildTime: number; // in seconds
}

export interface UnitInfo {
    id: MilitaryUnitType;
    name: string;
    description: string;
    cost: BuildingCosts;
    requiredBuilding: BuildingType;
    trainTime: number; // in seconds per unit
}

export interface UINotification {
    id: string;
    message: string;
}

export interface ConstructingBuilding {
    id: string; // Corresponds to task ID
    type: BuildingType;
    position: { x: number; y: number; };
    villagerId: string;
}

export type ResourceNodeType = 'food' | 'wood' | 'gold' | 'stone';

export interface ResourceNode {
  id: string;
  type: ResourceNodeType;
  position: { x: number; y: number; };
  amount: number;
  assignedVillagers: string[];
}

export type TaskType = 'gather' | 'build' | 'train_villager' | 'train_military' | 'advance_age';

export type PlayerActionState = {
    mode: 'build';
    buildingType: BuildingType;
    villagerId: string;
} | null;


export interface GameTask {
    id: string;
    type: TaskType;
    startTime: number;
    duration: number; // in milliseconds
    payload?: {
        buildingId?: string;
        buildingType?: BuildingType;
        unitType?: MilitaryUnitType;
        count?: number;
        villagerId?: string;
        position?: { x: number; y: number };
        resourceNodeId?: string;
    };
}

export interface FullGameState {
    civilization: Civilization;
    resources: Resources;
    units: Units;
    buildings: Buildings;
    currentAge: string;
    gameLog: GameLogEntry[];
    constructingBuildings: ConstructingBuilding[];
    activeTasks: GameTask[];
    resourceNodes: ResourceNode[];
}
