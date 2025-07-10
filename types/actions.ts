import type { BuildingInstance, BuildingType, BuildingUpgradePath, Resources, Buildings, GameTask, Population, BuildingConfig, UnitConfig, ActiveBuffs, ResearchConfig } from './types';

// Action Payloads
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

type StartResearchPayload = {
    researchId: string;
};

type AdvanceAgePayload = {};


// Discriminated Union for all building actions
export type BuildingAction =
  | { type: 'DEMOLISH'; payload: DemolishPayload }
  | { type: 'TRAIN_UNIT'; payload: TrainUnitPayload }
  | { type: 'TRAIN_VILLAGER'; payload: TrainVillagerPayload }
  | { type: 'UPGRADE_BUILDING'; payload: UpgradeBuildingPayload }
  | { type: 'START_RESEARCH'; payload: StartResearchPayload }
  | { type: 'ADVANCE_AGE'; payload: AdvanceAgePayload };


// Context for the Building Service
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
    masterResearchList?: ResearchConfig[]; // Optional, but useful for some actions
}