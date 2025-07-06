import { buildingNames } from '../data/buildingNames';
import { villagerNames } from '../data/villagerNames';
import { soldierNames } from '../data/soldierNames';

type NameType = 'villager' | 'soldier' | 'building';

const nameLists: Record<NameType, string[]> = {
    villager: [...villagerNames],
    soldier: [...soldierNames],
    building: [...buildingNames],
};

// Shuffle the arrays to ensure random order on game load
Object.values(nameLists).forEach(list => {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
});

const nameIndices: Record<NameType, number> = {
    villager: 0,
    soldier: 0,
    building: 0,
};

/**
 * Gets a specified number of unique random names from the local lists.
 * When the list is exhausted, it will start providing generic fallback names.
 * @param type - The type of name to get ('villager', 'soldier', 'building').
 * @param count - The number of names to return.
 * @returns An array of strings with the requested names.
 */
export function getRandomNames(type: NameType, count: number): string[] {
    const names: string[] = [];
    const list = nameLists[type];
    
    for (let i = 0; i < count; i++) {
        const currentIndex = nameIndices[type];
        if (currentIndex < list.length) {
            names.push(list[currentIndex]);
            nameIndices[type]++;
        } else {
            // Fallback if we run out of unique names
            const baseName = type.charAt(0).toUpperCase() + type.slice(1);
            names.push(`A New ${baseName} #${Math.floor(Math.random() * 1000)}`);
        }
    }
    
    return names;
}
