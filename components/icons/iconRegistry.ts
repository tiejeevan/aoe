import { BarracksIcon, HouseIcon, ArcheryRangeIcon, StableIcon, SiegeWorkshopIcon, BlacksmithIcon, WatchTowerIcon, TownCenterIcon, SwordIcon, BowIcon, KnightIcon, CatapultIcon, FoodIcon, WoodIcon, GoldIcon, StoneIcon, CrystalIcon, ManaIcon, BeakerIcon } from './ResourceIcons';
import { Package, Sprout, Shield, Wrench, Target } from 'lucide-react';

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

export const resourceIconMap: Record<string, React.FC> = {
    food: FoodIcon,
    wood: WoodIcon,
    gold: GoldIcon,
    stone: StoneIcon,
    crystal: CrystalIcon,
    mana: ManaIcon,
    default: Sprout,
};

export const researchIconMap: Record<string, React.FC> = {
    shield: Shield,
    wrench: Wrench,
    beaker: BeakerIcon,
    target: Target,
    default: BeakerIcon,
};
