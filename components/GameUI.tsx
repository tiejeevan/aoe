
import React from 'react';
import type { Civilization, Resources, Units, Buildings, GameEvent, GameLogEntry, LogIconType, ResourceDeltas, BuildingType, BuildingInfo, UnitInfo, MilitaryUnitType, BuildingInstance, ConstructingBuilding, GameTask, PlayerActionState, ResourceNode, ResourceNodeType } from '../types';
import { FoodIcon, WoodIcon, GoldIcon, StoneIcon, PopulationIcon, BarracksIcon, HouseIcon, VillagerIcon, SwordIcon, BowIcon, KnightIcon, CatapultIcon, EventIcon, SystemIcon, AgeIcon, ArcheryRangeIcon, StableIcon, SiegeWorkshopIcon, BlacksmithIcon, WatchTowerIcon, ExitIcon, TownCenterIcon, SettingsIcon } from './icons/ResourceIcons';
import GameMap from './GameMap';
import { ScrollText } from 'lucide-react';

interface GameUIProps {
    civilization: Civilization;
    resources: Resources;
    units: Units;
    buildings: Buildings;
    population: { current: number; capacity: number };
    currentAge: string;
    gameLog: GameLogEntry[];
    currentEvent: GameEvent | null;
    onEventChoice: (choice: GameEvent['choices'][0]) => void;
    resourceDeltas: ResourceDeltas;
    activityStatus: string;
    unitList: UnitInfo[];
    buildingList: BuildingInfo[];
    onOpenUnitPanel: (type: 'villagers' | 'military', rect: DOMRect) => void;
    onOpenBuildingPanel: (type: BuildingType, instanceId: string, rect: DOMRect) => void;
    playerAction: PlayerActionState;
    onConfirmPlacement: (position: { x: number; y: number }) => void;
    onCancelPlayerAction: () => void;
    onBuildingClick: (building: BuildingInstance, rect: DOMRect) => void;
    mapDimensions: { width: number; height: number; };
    constructingBuildings: ConstructingBuilding[];
    activeTasks: GameTask[];
    onExitGame: () => void;
    onOpenSettingsPanel: (rect: DOMRect) => void;
    onOpenCivPanel: (rect: DOMRect) => void;
    resourceNodes: ResourceNode[];
    onOpenAssignmentPanel: (nodeId: string, rect: DOMRect) => void;
    onOpenConstructionPanel: (constructionId: string, rect: DOMRect) => void;
    gatherInfo: Record<ResourceNodeType, { rate: number }>;
}

const ResourceChange: React.FC<{ change: number }> = ({ change }) => {
    const isPositive = change > 0;
    const color = isPositive ? 'text-brand-green' : 'text-brand-red';
    return (
        <span className={`absolute -top-1 right-0 text-lg font-bold opacity-0 animate-fade-up-out ${color}`}>
            {isPositive ? '+' : ''}{change}
        </span>
    );
};

const HeaderStat: React.FC<{ icon: React.ReactNode; value: string | number; delta?: number; tooltip: string; colorClass?: string; }> = ({ icon, value, delta, tooltip, colorClass }) => (
    <div className="relative group flex items-center space-x-2 bg-stone-dark/70 px-3 py-1 rounded-md border border-stone-light/30">
        <div className={`w-5 h-5 ${colorClass}`}>{icon}</div>
        <span className="font-bold text-md text-parchment-light">{value}</span>
        {delta != null && delta !== 0 && <ResourceChange change={delta} />}
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tooltip}
        </div>
    </div>
);

const StatBox: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    value: string | number; 
    colorClass: string;
    onActionClick?: (event: React.MouseEvent<HTMLElement>) => void; 
}> = ({ icon, label, value, colorClass, onActionClick }) => {
    const Component = onActionClick ? 'button' : 'div';
    
    return (
        <Component
            onClick={onActionClick}
            className={`relative flex items-center space-x-3 w-full p-2 rounded-lg border border-stone-light/50 transition-colors duration-200
            bg-stone-dark/50 ${colorClass}
            ${onActionClick ? 'hover:bg-stone-light/10 cursor-pointer' : ''}
            overflow-hidden text-left`}
        >
            <div className="w-8 h-8">{icon}</div>
            <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight">{value}</span>
                <span className="text-xs text-parchment-dark leading-tight">{label}</span>
            </div>
        </Component>
    );
};

export const iconMap: Record<LogIconType, React.ReactNode> = {
    food: <FoodIcon />, wood: <WoodIcon />, gold: <GoldIcon />, stone: <StoneIcon />,
    villager: <VillagerIcon />, 
    swordsman: <SwordIcon />,
    archer: <BowIcon />,
    knight: <KnightIcon />,
    catapult: <CatapultIcon />,
    houses: <HouseIcon />, barracks: <BarracksIcon />, 
    archeryRange: <ArcheryRangeIcon />, stable: <StableIcon />,
    siegeWorkshop: <SiegeWorkshopIcon />, blacksmith: <BlacksmithIcon />,
    watchTower: <WatchTowerIcon/>, townCenter: <TownCenterIcon />,
    age: <AgeIcon />, event: <EventIcon />, system: <SystemIcon />,
};

const LogIcon: React.FC<{icon: LogIconType}> = ({icon}) => {
    const foundIcon = iconMap[icon];
    if (!foundIcon) return null;
    return <div className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0">{foundIcon}</div>;
}

const GameUI: React.FC<GameUIProps> = (props) => {
    const {
        civilization, resources, units, buildings, population, currentAge, gameLog, currentEvent, onEventChoice, resourceDeltas, activityStatus, unitList, buildingList, onOpenUnitPanel, onOpenBuildingPanel, playerAction, onConfirmPlacement, onCancelPlayerAction, onBuildingClick, mapDimensions, constructingBuildings, activeTasks, onExitGame, onOpenSettingsPanel, onOpenCivPanel, resourceNodes, onOpenAssignmentPanel, onOpenConstructionPanel, gatherInfo
    } = props;
    
    const buildingCounts = Object.keys(buildings).reduce((acc, key) => {
        const buildingType = key as BuildingType;
        acc[buildingType] = buildings[buildingType].length;
        return acc;
    }, {} as Record<BuildingType, number>);
    
    const militaryUnitCounts = units.military.reduce((acc, unit) => {
        acc[unit.unitType] = (acc[unit.unitType] || 0) + 1;
        return acc;
    }, {} as Record<MilitaryUnitType, number>);
    
    const busyVillagerCount = new Set(activeTasks.flatMap(t => t.payload?.villagerIds || [])).size;

    return (
        <div className="w-full h-full bg-stone-dark p-4 rounded-lg shadow-2xl border-2 border-stone-light flex flex-col space-y-4">
            {/* Top Header */}
            <header className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                <div className="flex items-center space-x-2 text-brand-gold">
                    <div className="relative group">
                         <button 
                            onClick={(e) => onOpenCivPanel(e.currentTarget.getBoundingClientRect())} 
                            className="flex items-center gap-2 text-brand-gold hover:text-yellow-400 transition-colors"
                            aria-label="View Civilization Details"
                        >
                            <div className="w-8 h-8"><AgeIcon/></div>
                            <h2 className="text-2xl font-serif text-parchment-light">{currentAge}</h2>
                            <div className="w-5 h-5 text-parchment-dark/70 ml-1"><ScrollText /></div>
                         </button>
                         <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Civilization Details
                        </div>
                    </div>
                </div>

                <HeaderStat icon={<PopulationIcon/>} value={`${population.current}/${population.capacity}`} tooltip="Population / Capacity" colorClass="text-brand-blue" />

                <div className="flex items-center space-x-2">
                    <HeaderStat icon={<FoodIcon/>} value={resources.food} delta={resourceDeltas.food} tooltip="Food" colorClass="text-brand-green"/>
                    <HeaderStat icon={<WoodIcon/>} value={resources.wood} delta={resourceDeltas.wood} tooltip="Wood" colorClass="text-amber-700"/>
                    <HeaderStat icon={<GoldIcon/>} value={resources.gold} delta={resourceDeltas.gold} tooltip="Gold" colorClass="text-brand-gold"/>
                    <HeaderStat icon={<StoneIcon/>} value={resources.stone} delta={resourceDeltas.stone} tooltip="Stone" colorClass="text-gray-400"/>
                    
                    <div className="relative group pl-4">
                         <button 
                            onClick={(e) => onOpenSettingsPanel(e.currentTarget.getBoundingClientRect())} 
                            className="w-8 h-8 p-1 text-parchment-dark hover:text-brand-gold transition-colors duration-200"
                            aria-label="Open Settings"
                        >
                            <SettingsIcon />
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Settings
                        </div>
                    </div>
                    <div className="relative group">
                         <button 
                            onClick={onExitGame} 
                            className="w-8 h-8 p-1 text-parchment-dark hover:text-brand-red transition-colors duration-200"
                            aria-label="Exit to Main Menu"
                        >
                            <ExitIcon />
                        </button>
                        <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Exit to Menu
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left Panel: Buildings */}
                <div className="md:col-span-1 bg-stone-dark/30 p-4 rounded-lg border border-stone-light/30 flex flex-col space-y-4">
                    <div className="space-y-1 flex-grow">
                        <h4 className="font-serif text-parchment-dark mb-2">Buildings</h4>
                        <div className="space-y-2">
                             {Object.entries(buildingCounts)
                                .sort(([typeA], [typeB]) => {
                                    const order = ['townCenter', 'houses'];
                                    const indexA = order.indexOf(typeA);
                                    const indexB = order.indexOf(typeB);
                                    if(indexA !== -1 && indexB !== -1) return indexA - indexB;
                                    if(indexA !== -1) return -1;
                                    if(indexB !== -1) return 1;
                                    return typeA.localeCompare(typeB);
                                })
                                .map(([type, count]) => {
                                if(count === 0 && constructingBuildings.every(b => b.type !== type)) return null;

                                const info = buildingList.find(b => b.id === type);
                                if (!info) return null;
                                
                                const Icon = iconMap[type as BuildingType];
                                if (!Icon) return null;

                                return (
                                    <StatBox 
                                        key={type} 
                                        icon={Icon} 
                                        label={info.name}
                                        value={count > 0 ? count : '0'} 
                                        colorClass="text-parchment-dark" 
                                        onActionClick={count > 0 ? (e) => onOpenBuildingPanel(type as BuildingType, '', e.currentTarget.getBoundingClientRect()) : undefined}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Center Panel: Map, Units, Events & Log */}
                <div className="md:col-span-2 bg-stone-dark/30 p-4 rounded-lg border border-stone-light/30 flex flex-col gap-4">
                     <GameMap
                        buildings={buildings}
                        constructingBuildings={constructingBuildings}
                        activeTasks={activeTasks}
                        playerAction={playerAction}
                        onConfirmPlacement={onConfirmPlacement}
                        onCancelPlayerAction={onCancelPlayerAction}
                        onBuildingClick={onBuildingClick}
                        mapDimensions={mapDimensions}
                        buildingList={buildingList}
                        resourceNodes={resourceNodes}
                        onOpenAssignmentPanel={onOpenAssignmentPanel}
                        onOpenConstructionPanel={onOpenConstructionPanel}
                        gatherInfo={gatherInfo}
                    />

                    <div className="flex justify-center gap-4 -mt-2">
                        {/* Villager Button */}
                        <div className="relative group">
                            <button 
                                onClick={(e) => onOpenUnitPanel('villagers', e.currentTarget.getBoundingClientRect())}
                                className="flex items-center gap-4 px-6 py-2 rounded-lg bg-stone-dark/60 border-2 border-stone-light/40 hover:bg-brand-blue/20 hover:border-brand-blue/70 transition-all duration-200"
                            >
                                <div className="w-10 h-10 text-brand-blue"><VillagerIcon /></div>
                                <div className="text-left">
                                    <p className="text-2xl font-bold">{units.villagers.length}</p>
                                    <p className="text-xs text-parchment-dark -mt-1">Villagers</p>
                                </div>
                            </button>
                            <div className="absolute bottom-full mb-2 w-max px-3 py-2 bg-stone-dark text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left sci-fi-panel-popup">
                                <p className="font-serif text-brand-gold text-base">Manage Villagers</p>
                                <p className="text-sm text-parchment-dark">{busyVillagerCount} Busy / {units.villagers.length - busyVillagerCount} Idle</p>
                                <hr className="border-stone-light/20 my-1" />
                                <p className="text-xs italic text-parchment-dark/70">Click to manage individual villagers.</p>
                            </div>
                        </div>

                        {/* Military Button */}
                        <div className="relative group">
                            <button 
                                onClick={(e) => onOpenUnitPanel('military', e.currentTarget.getBoundingClientRect())}
                                className="flex items-center gap-4 px-6 py-2 rounded-lg bg-stone-dark/60 border-2 border-stone-light/40 hover:bg-brand-red/20 hover:border-brand-red/70 transition-all duration-200"
                            >
                                <div className="w-10 h-10 text-brand-red"><SwordIcon /></div>
                                 <div className="text-left">
                                    <p className="text-2xl font-bold">{units.military.length}</p>
                                    <p className="text-xs text-parchment-dark -mt-1">Military</p>
                                </div>
                            </button>
                            <div className="absolute bottom-full mb-2 w-max px-3 py-2 bg-stone-dark text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-left sci-fi-panel-popup">
                                <p className="font-serif text-brand-gold text-base">Manage Military</p>
                                {units.military.length > 0 ? (
                                    <div className="mt-1 space-y-0.5 text-sm text-parchment-dark">
                                    {unitList.map(unitInfo => {
                                            if (militaryUnitCounts[unitInfo.id] > 0) {
                                                return (
                                                    <p key={unitInfo.id}>{unitInfo.name}s: <span className="font-bold">{militaryUnitCounts[unitInfo.id]}</span></p>
                                                )
                                            }
                                            return null;
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-parchment-dark">No military units trained.</p>
                                )}
                                <hr className="border-stone-light/20 my-1" />
                                <p className="text-xs italic text-parchment-dark/70">Click to manage your forces.</p>
                            </div>
                        </div>
                    </div>


                    <div className="flex flex-col flex-grow">
                        <h2 className="text-2xl font-serif text-center mb-1">Chronicles</h2>
                        <p className="text-center text-parchment-dark text-sm italic mb-3 h-5">{activityStatus}</p>
                        
                        <div className="bg-parchment-dark text-stone-dark p-4 rounded-lg shadow-inner min-h-[150px] mb-4 flex flex-col justify-center">
                            {currentEvent ? (
                                <div>
                                    <p className="mb-4">{currentEvent.message}</p>
                                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                                        {currentEvent.choices.map(choice => (
                                            <button key={choice.text} onClick={() => onEventChoice(choice)} className="bg-stone-light hover:bg-stone-dark text-parchment-light font-bold py-2 px-4 rounded-md transition duration-200">
                                                {choice.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-stone-light">The air is calm. Your people await your command.</p>
                            )}
                        </div>

                        <div className="flex-grow bg-black/30 p-3 rounded-lg overflow-y-auto h-48">
                            {gameLog.map((log, index) => (
                                <div key={log.id} className={`flex items-start text-sm mb-1 ${index === 0 ? 'text-parchment-light' : 'text-parchment-dark'}`}>
                                    <LogIcon icon={log.icon} />
                                    <span>{log.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameUI;
