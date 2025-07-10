
import type { BuildingAction, BuildingServiceContext } from '../types/actions';
import type { BuildingInstance, GameTask } from '../types';

type ServiceResult = {
    error?: string;
    newBuildings?: any; // Replace with specific type if possible
    resourceDeltas?: any;
    newTasks?: GameTask[];
    updatedActiveBuffs?: any;
    log?: { message: string, icon: string };
    activityStatus?: string;
};

// Internal handler for demolishing a building
const demolishBuilding = (context: BuildingServiceContext, payload: { buildingId: string; buildingType: string; }): ServiceResult => {
    const { buildings, activeTasks, buildingList, population } = context;
    const { buildingId, buildingType } = payload;
    
    if (buildingType === 'townCenter') {
        return { error: "The Town Center is the heart of your civilization and cannot be demolished." };
    }
    if (activeTasks.some(task => task.payload?.buildingId === buildingId || (task.type === 'upgrade_building' && task.payload?.originalBuildingId === buildingId))) {
        return { error: "Cannot demolish a building with an active task (e.g., training or upgrading)." };
    }

    const buildingInfo = buildingList.find(b => b.id === buildingType);
    const buildingInstance = buildings[buildingType]?.find(b => b.id === buildingId);

    if (!buildingInfo || !buildingInstance) {
        return { error: "Building not found." };
    }
    
    const capacityLost = buildingInfo.populationCapacity || 0;
    const currentCapacity = buildingList.reduce((acc, bInfo) => acc + (bInfo.populationCapacity || 0) * (buildings[bInfo.id]?.length || 0), 0);
    if (capacityLost > 0 && population.current > currentCapacity - capacityLost) {
        return { error: "Cannot demolish this building, your people would be homeless." };
    }

    const refund = Object.entries(buildingInfo.cost).reduce((acc, [res, cost]) => {
        const amount = Math.floor((cost || 0) * 0.5);
        if (amount > 0) acc[res] = amount;
        return acc;
    }, {} as Record<string, number>);

    const newBuildings = { ...buildings, [buildingType]: buildings[buildingType].filter(b => b.id !== buildingId) };
    
    return {
        newBuildings,
        resourceDeltas: refund,
        log: { message: `${buildingInstance.name} (${buildingInfo.name}) was demolished.`, icon: buildingInfo.iconId },
    };
};

// Internal handler for training units
const trainUnit = (context: BuildingServiceContext, payload: { unitType: string, count: number }): ServiceResult => {
    const { resources, population, activeTasks, unitList, buildingList, completedResearch, unlimitedResources, activeBuffs } = context;
    const { unitType, count } = payload;

    const unitInfo = unitList.find(u => u.id === unitType);
    if (!unitInfo || activeTasks.some(t => t.payload?.unitType === unitType) || count <= 0) {
        return { error: 'Invalid training request.' };
    }

    const totalPopulationCost = (unitInfo.populationCost || 1) * count;
    if (population.current + totalPopulationCost > population.capacity) {
        return { error: `Need space for ${totalPopulationCost} more population.` };
    }
    
    const trainingBuilding = context.buildings[unitInfo.requiredBuilding as string]?.[0];
    if (!trainingBuilding) {
        return { error: `No ${buildingList.find(b => b.id === unitInfo.requiredBuilding)?.name} to train units.` };
    }

    if (unitInfo.requiredBuildingIds?.length) {
        const missingBuildings = unitInfo.requiredBuildingIds.filter(reqId => !context.buildings[reqId]?.length);
        if (missingBuildings.length > 0) {
            const missingNames = missingBuildings.map(id => buildingList.find(b => b.id === id)?.name || id).join(', ');
            return { error: `Training this unit requires: ${missingNames}.` };
        }
    }

    if (unitInfo.requiredResearchIds?.length) {
        const missingResearch = unitInfo.requiredResearchIds.filter(reqId => !completedResearch.includes(reqId));
        if (missingResearch.length > 0) {
            const missingNames = missingResearch.map(id => context.masterResearchList!.find(r => r.id === id)?.name || id).join(', ');
            return { error: `Training this unit requires research: ${missingNames}.` };
        }
    }

    let resourceDeltas = {};
    if (!unlimitedResources) {
        const missing = (Object.keys(unitInfo.cost) as string[]).filter(res => (resources[res] || 0) < (unitInfo.cost[res] || 0) * count);
        if (missing.length > 0) {
            return { error: `Need more ${missing.join(' and ')}.` };
        }
        resourceDeltas = Object.entries(unitInfo.cost).reduce((acc, [k, v]) => ({ ...acc, [k]: -(v || 0) * count }), {});
    }

    let trainTime = unitInfo.trainTime * 1000 * count;
    let updatedActiveBuffs = { ...activeBuffs };

    const permanentReduction = activeBuffs.permanentTrainTimeReduction || 0;
    let tempReduction = 0;
    if (activeBuffs.trainTimeReduction && activeBuffs.trainTimeReduction.uses > 0) {
        tempReduction = activeBuffs.trainTimeReduction.percentage;
        updatedActiveBuffs.trainTimeReduction = {
            ...activeBuffs.trainTimeReduction,
            uses: activeBuffs.trainTimeReduction.uses - count,
        };
    }
    
    const totalReduction = 1 - (permanentReduction + tempReduction);
    trainTime *= totalReduction;


    const newTasks: GameTask[] = [{
        id: `${Date.now()}-train-${unitType}`,
        type: 'train_military',
        startTime: Date.now(),
        duration: trainTime,
        payload: { unitType, count, buildingId: trainingBuilding.id }
    }];

    return {
        resourceDeltas,
        newTasks,
        updatedActiveBuffs,
        log: { message: `Began training ${count} new ${unitInfo.name}(s).`, icon: unitType },
        activityStatus: `Training ${count} ${unitInfo.name}(s)...`
    };
};

const trainVillager = (context: BuildingServiceContext, payload: { count: number }): ServiceResult => {
    const { resources, population, activeTasks, unlimitedResources } = context;
    const { count } = payload;
    
    if (activeTasks.some(t => t.type === 'train_villager')) {
        return { error: 'Already training villagers.' };
    }
    if (population.current + count > population.capacity) {
        return { error: `Need space for ${count} more population.` };
    }

    let resourceDeltas = {};
    if (!unlimitedResources) {
        const cost = 50 * count;
        if ((resources.food || 0) < cost) {
            return { error: 'Not enough food.' };
        }
        resourceDeltas = { food: -cost };
    }

    const newTasks: GameTask[] = [{
        id: `${Date.now()}-train-villager`,
        type: 'train_villager',
        startTime: Date.now(),
        duration: 15000 * count, // 15s per villager
        payload: { count }
    }];

    return {
        resourceDeltas,
        newTasks,
        log: { message: `Began training ${count} new villager(s).`, icon: 'villager' },
        activityStatus: `Training ${count} new villager(s)...`
    };
}

const upgradeBuilding = (context: BuildingServiceContext, payload: { building: BuildingInstance, upgradePath: BuildingUpgradePath }): ServiceResult => {
    const { resources, unlimitedResources, buildings } = context;
    const { building, upgradePath } = payload;
    
     if (!unlimitedResources) {
        const missing = Object.entries(upgradePath.cost).filter(([res, cost]) => (resources[res] || 0) < (cost || 0));
        if (missing.length > 0) {
            return { error: `Need more ${missing.map(([res, cost]) => `${cost} ${res}`).join(' and ')}.` };
        }
    }

    const originalBuildingType = Object.keys(buildings).find(type => buildings[type].some(b => b.id === building.id));
    if (!originalBuildingType) return { error: "Original building not found." };
    
    const resourceDeltas = unlimitedResources ? {} : Object.entries(upgradePath.cost).reduce((acc, [k, v]) => ({ ...acc, [k]: -(v || 0) }), {});
    
    return {
        resourceDeltas,
        newTasks: [{
            id: `${Date.now()}-upgrade-${building.id}`,
            type: 'upgrade_building',
            startTime: Date.now(),
            duration: upgradePath.time * 1000,
            payload: {
                originalBuildingId: building.id,
                originalBuildingType: originalBuildingType,
                targetBuildingType: upgradePath.id
            }
        }],
        log: { message: `Upgrading ${building.name} to a ${upgradePath.id}...`, icon: upgradePath.id },
        activityStatus: `Upgrading ${building.name}...`
    }
}

const advanceAge = (context: BuildingServiceContext): ServiceResult => {
     const { resources, activeTasks, unlimitedResources } = context;

    if (activeTasks.some(t => t.type === 'advance_age')) {
        return { error: "Advancement already in progress." };
    }
    
    let resourceDeltas = {};
    if (!unlimitedResources) {
        const missing = [];
        if ((resources.food || 0) < 500) missing.push(`${500 - (resources.food || 0)} Food`);
        if ((resources.gold || 0) < 200) missing.push(`${200 - (resources.gold || 0)} Gold`);
        if (missing.length > 0) {
            return { error: `To advance, you need ${missing.join(' and ')}.` };
        }
        resourceDeltas = { food: -500, gold: -200 };
    }
    
    return {
        resourceDeltas,
        newTasks: [{ id: `${Date.now()}-advance_age`, type: 'advance_age', startTime: Date.now(), duration: 60000 }],
        log: { message: `Advancing to the next age...`, icon: 'age' },
        activityStatus: 'Advancing to the next age...'
    };
}


// The main service function that acts as a router
export const handleBuildingAction = (context: BuildingServiceContext): ServiceResult => {
    const { action } = context;

    switch (action.type) {
        case 'DEMOLISH':
            return demolishBuilding(context, action.payload);
        
        case 'TRAIN_UNIT':
            return trainUnit(context, action.payload);

        case 'TRAIN_VILLAGER':
            return trainVillager(context, action.payload);
        
        case 'UPGRADE_BUILDING':
            return upgradeBuilding(context, action.payload);

        case 'ADVANCE_AGE':
            return advanceAge(context);
    }
};
