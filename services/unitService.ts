import type { UnitAction, UnitServiceContext } from '../types/actions';
import type { GameTask, Villager } from '../types';

type ServiceResult = {
    error?: string;
    newTasks?: GameTask[];
    updatedVillagers?: Villager[];
    activityStatus?: string;
    log?: { message: string, icon: string };
};

// Internal handler for moving units
const moveUnits = (context: UnitServiceContext, payload: any): ServiceResult => {
    // This is a placeholder. In a real scenario, this would involve pathfinding.
    // For now, we assume the movement is instantaneous and handled on the client.
    // This service would be responsible for validating the move (e.g., terrain checks).
    return {
        activityStatus: `${payload.unitIds.length} unit(s) are on the move.`
    };
};

// Internal handler for gathering resources
const gatherResource = (context: UnitServiceContext, payload: { villagerIds: string[], resourceNodeId: string }): ServiceResult => {
    const { resourceNodes } = context;
    const { villagerIds, resourceNodeId } = payload;
    
    const node = resourceNodes.find(n => n.id === resourceNodeId);
    if (!node) {
        return { error: "Resource node not found." };
    }

    const taskId = `gather-${resourceNodeId}`;
    const newTasks: GameTask[] = [{
        id: taskId,
        type: 'gather',
        startTime: Date.now(),
        duration: 99999999, // Essentially infinite, ends when node is depleted
        payload: { villagerIds, resourceNodeId }
    }];

    const updatedVillagers = context.units.villagers.map(v => 
        villagerIds.includes(v.id) ? { ...v, currentTask: taskId } : v
    );

    return {
        newTasks,
        updatedVillagers,
        log: { message: `${villagerIds.length} villager(s) assigned to gather ${node.type}.`, icon: node.type },
        activityStatus: `${villagerIds.length} villager(s) are now gathering ${node.type}.`
    };
};

// Main service function that acts as a router
export const handleUnitAction = (context: UnitServiceContext): ServiceResult => {
    const { action } = context;

    switch (action.type) {
        case 'MOVE':
            return moveUnits(context, action.payload);
        
        case 'GATHER':
            return gatherResource(context, action.payload);
        
        // Cases for 'BUILD', 'ATTACK', etc., would be added here in the future.

        default:
            return { error: "Unknown unit action." };
    }
};
