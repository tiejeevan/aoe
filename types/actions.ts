
import type { BuildingInstance, BuildingType, BuildingUpgradePath, Resources, Buildings, GameTask, Population, BuildingConfig, UnitConfig, ActiveBuffs, ResearchConfig, Villager, MilitaryUnit, GameEventChoice, GameItem } from './types';

// ==================================
// ======== BUILDING ACTIONS ========
// ==================================

type DemolishPayload = {
  buildingId: string;
  buildingType: BuildingType | string;
};

type TrainUnitPayload = {
  unitType: string;
  count: number;
};

type TrainVillagerPayload = {
    count: number;
};

type UpgradeBuildingPayload = {
  building: BuildingInstance;
  upgradePath: BuildingUpgradePath;
};

type AdvanceAgePayload = {};

export type BuildingAction =
  | { type: 'DEMOLISH'; payload: DemolishPayload }
  | { type: 'TRAIN_UNIT'; payload: TrainUnitPayload }
  | { type: 'TRAIN_VILLAGER'; payload: TrainVillagerPayload }
  | { type: 'UPGRADE_BUILDING'; payload: UpgradeBuildingPayload }
  | { type: 'ADVANCE_AGE'; payload: AdvanceAgePayload };

export interface BuildingServiceContext {
    action: BuildingAction;
    resources: Resources;
    buildings: Buildings;
    activeTasks: GameTask[];
    population: Population;
    buildingList: BuildingConfig[];
    unitList: UnitConfig[];
    completedResearch: string[];
    unlimitedResources: boolean;
    activeBuffs: ActiveBuffs;
    masterResearchList?: ResearchConfig[];
}


// ==================================
// ========== UNIT ACTIONS ==========
// ==================================

type MovePayload = {
    unitIds: string[];
    targetPosition: { x: number, y: number };
};

type GatherPayload = {
    villagerIds: string[];
    resourceNodeId: string;
};

type BuildPayload = {
    villagerId: string;
    buildingType: BuildingType | string;
};

type AttackPayload = {
    attackerIds: string[];
    targetId: string; // Could be a unit or building ID
};

export type UnitAction = 
    | { type: 'MOVE', payload: MovePayload }
    | { type: 'GATHER', payload: GatherPayload }
    | { type: 'BUILD', payload: BuildPayload }
    | { type: 'ATTACK', payload: AttackPayload };

export interface UnitServiceContext {
    action: UnitAction;
    units: { villagers: Villager[]; military: MilitaryUnit[] };
    buildings: Buildings;
    resourceNodes: ResourceNode[];
    buildingList: BuildingConfig[];
    unlimitedResources: boolean;
}


// ==================================
// ======== RESEARCH ACTIONS ========
// ==================================

type StartResearchPayload = {
    researchId: string;
};

export type ResearchAction = 
    | { type: 'START_RESEARCH', payload: StartResearchPayload };

export interface ResearchServiceContext {
    action: ResearchAction;
    resources: Resources;
    activeTasks: GameTask[];
    masterResearchList: ResearchConfig[];
    unlimitedResources: boolean;
}

// ==================================
// ========= EVENT ACTIONS ==========
// ==================================

type ProcessChoicePayload = {
    choice: GameEventChoice;
};

export type EventAction = 
    | { type: 'PROCESS_CHOICE', payload: ProcessChoicePayload };

export interface GameEventServiceContext {
    action: EventAction;
    choice: GameEventChoice; // For internal use in the service
    resources: Resources;
    inventory: GameItem[];
}
