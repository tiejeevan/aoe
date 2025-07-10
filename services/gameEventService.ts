
import type { EventAction, GameEventServiceContext } from '../types/actions';
import { GAME_ITEMS } from '../data/itemContent';
import type { GameItem, Reward } from '../types';

type ServiceResult = {
  error?: string;
  log?: { message: string, icon: string };
  activityStatus?: string;
  resourceDeltas?: Record<string, number>;
  newInventory?: GameItem[];
};

const handleEventChoice = (context: GameEventServiceContext): ServiceResult => {
    const { choice, resources, inventory } = context;

    // Check costs
    if (choice.cost) {
        const missing = (Object.keys(choice.cost) as (keyof typeof resources)[])
            .filter(res => (resources[res] || 0) < (choice.cost![res] || 0));
        if (missing.length > 0) {
            return { error: `You lack the required resources: ${missing.join(', ')}.` };
        }
    }

    const isSuccess = choice.successChance === undefined || Math.random() < choice.successChance;
    const effects = isSuccess ? choice.successEffects : choice.failureEffects;

    if (!effects) {
        return { log: { message: "Your decision had no immediate effect.", icon: 'system' } };
    }
    
    let logMessage = `Decision: "${choice.text}". ${effects.log}`;
    let resourceDeltas: Record<string, number> = {};
    let newInventory = [...inventory];

    if (choice.cost) {
        resourceDeltas = Object.entries(choice.cost).reduce((acc, [k, v]) => ({ ...acc, [k]: -(v || 0) }), {});
    }

    effects.rewards.forEach((reward: Reward) => {
        if (reward.type === 'resource') {
            const amount = Array.isArray(reward.amount)
                ? Math.floor(Math.random() * (reward.amount[1] - reward.amount[0] + 1)) + reward.amount[0]
                : reward.amount;
            if (amount !== 0) {
                resourceDeltas[reward.resource] = (resourceDeltas[reward.resource] || 0) + amount;
            }
        } else if (reward.type === 'item') {
            const itemInfo = GAME_ITEMS[reward.itemId];
            if (itemInfo) {
                const newItems = Array.from({ length: reward.amount }, (_, i) => ({
                    ...itemInfo,
                    id: `${reward.itemId}-${Date.now()}-${i}`,
                }));
                newInventory.push(...newItems);
            }
        }
        // Note: 'unit' and 'building' rewards are complex and handled by the game page for now.
    });

    return {
        log: { message: logMessage, icon: 'event' },
        activityStatus: effects.log,
        resourceDeltas,
        newInventory,
    };
};

export const handleEventAction = (context: GameEventServiceContext): ServiceResult => {
    const { action } = context;

    switch (action.type) {
        case 'PROCESS_CHOICE':
            return handleEventChoice({ ...context, choice: action.payload.choice });
    }
};
