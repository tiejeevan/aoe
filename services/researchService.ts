
import type { ResearchAction, ResearchServiceContext } from '../types/actions';
import type { GameTask } from '../types';

type ServiceResult = {
    error?: string;
    newTasks?: GameTask[];
    resourceDeltas?: Record<string, number>;
    log?: { message: string, icon: string };
    activityStatus?: string;
};

const startResearch = (context: ResearchServiceContext): ServiceResult => {
    const { resources, activeTasks, masterResearchList, unlimitedResources } = context;
    const { researchId } = context.action.payload;

    const researchInfo = masterResearchList.find(r => r.id === researchId);
    if (!researchInfo) {
        return { error: "Research not found." };
    }

    if (activeTasks.some(t => t.type === 'research' && t.payload?.researchId === researchId)) {
        return { error: "Research already in progress." };
    }

    let resourceDeltas = {};
    if (!unlimitedResources) {
        const missing = (Object.keys(researchInfo.cost) as string[]).filter(res =>
            (resources[res] || 0) < (researchInfo.cost[res] || 0)
        );
        if (missing.length > 0) {
            return { error: `Need more ${missing.join(' and ')}.` };
        }
        resourceDeltas = Object.entries(researchInfo.cost).reduce(
            (acc, [k, v]) => ({ ...acc, [k]: -(v || 0) }), {}
        );
    }
    
    const researchTask: GameTask = {
        id: `${Date.now()}-research-${researchId}`,
        type: 'research',
        startTime: Date.now(),
        duration: researchInfo.researchTime * 1000,
        payload: { researchId },
    };

    return {
        newTasks: [researchTask],
        resourceDeltas,
        log: { message: `Began research for ${researchInfo.name}.`, icon: researchInfo.iconId },
        activityStatus: `Researching ${researchInfo.name}...`
    };
};

export const handleResearchAction = (context: ResearchServiceContext): ServiceResult => {
    const { action } = context;

    switch (action.type) {
        case 'START_RESEARCH':
            return startResearch(context);
    }
};
