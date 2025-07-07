import { BarracksIcon, HouseIcon, ArcheryRangeIcon, StableIcon, SiegeWorkshopIcon, BlacksmithIcon, WatchTowerIcon, TownCenterIcon, SwordIcon, BowIcon, KnightIcon, CatapultIcon } from './ResourceIcons';
import { Package } from 'lucide-react';

export const buildingIconMap: Record<string, React.FC> = {
    houses: HouseIcon,
    barracks: BarracksIcon,
    archeryRange: ArcheryRangeIcon,
    stable: StableIcon,
    siegeWorkshop: SiegeWorkshopIcon,
    blacksmith: BlacksmithIcon,
    watchTower: WatchTowerIcon,
    townCenter: TownCenterIcon,
    default: Package,
};

export const unitIconMap: Record<string, React.FC> = {
    swordsman: SwordIcon,
    archer: BowIcon,
    knight: KnightIcon,
    catapult: CatapultIcon,
    default: SwordIcon,
};
