import { BarracksIcon, HouseIcon, ArcheryRangeIcon, StableIcon, SiegeWorkshopIcon, BlacksmithIcon, WatchTowerIcon, TownCenterIcon } from './ResourceIcons';
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
