import React, { useState, useEffect, useRef } from 'react';
import type { Buildings, BuildingInstance, BuildingType, BuildingInfo, Resources, UnitInfo, MilitaryUnitType, GameTask } from '../types';
import { FoodIcon, GoldIcon, StoneIcon, WoodIcon, AgeIcon, VillagerIcon } from './icons/ResourceIcons';
import ProgressBar from './ProgressBar';
import { iconMap } from './GameUI';
import { Trash2 } from 'lucide-react';

interface BuildingManagementPanelProps {
    isOpen: boolean;
    onClose: () => void;
    panelState: {
        type: BuildingType | null;
        instanceId?: string;
    };
    buildings: Buildings;
    buildingList: BuildingInfo[];
    onUpdateBuilding: (type: BuildingType, id: string, name: string) => void;
    onDemolishBuilding: (type: BuildingType, id: string) => void;
    onTrainUnits: (unitType: MilitaryUnitType, count: number) => void;
    onTrainVillagers: (count: number) => void;
    resources: Resources;
    population: { current: number; capacity: number };
    unitList: UnitInfo[];
    onAdvanceAge: () => void;
    activeTasks: GameTask[];
    anchorRect: DOMRect | null;
}


const BuildingRow: React.FC<{
    building: BuildingInstance;
    type: BuildingType;
    onUpdate: (type: BuildingType, id: string, name: string) => void;
    onDemolish: (type: BuildingType, id: string) => void;
}> = ({ building, type, onUpdate, onDemolish }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(building.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (name.trim() && name.trim() !== building.name) {
            onUpdate(type, building.id, name.trim());
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setName(building.name);
            setIsEditing(false);
        }
    };

    return (
        <div className="sci-fi-unit-row flex items-center gap-2 p-2 justify-between">
            {isEditing ? (
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="sci-fi-input w-full !text-base"
                />
            ) : (
                <>
                    <div 
                        className="flex-grow cursor-pointer"
                        onDoubleClick={() => setIsEditing(true)}
                        title="Double-click to rename"
                    >
                        <p className="text-base font-bold">{building.name}</p>
                    </div>
                    <div className="relative group flex-shrink-0">
                        <button
                            onClick={() => onDemolish(type, building.id)}
                            className="p-1.5 text-parchment-dark/60 hover:text-brand-red rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-brand-red/50"
                            aria-label="Demolish"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-full right-1/2 translate-x-1/2 mb-1 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Demolish
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};


const CostDisplay: React.FC<{ cost: { [key in keyof Resources]?: number }, resources: Resources }> = ({ cost, resources }) => (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {(Object.entries(cost) as [keyof Resources, number][]).map(([resource, amount]) => {
            if (!amount) return null;
            const hasEnough = resources[resource] >= amount;
            const Icon = { food: FoodIcon, wood: WoodIcon, gold: GoldIcon, stone: StoneIcon }[resource];
            return (
                <span key={resource} className={`flex items-center ${hasEnough ? '' : 'text-brand-red'}`}>
                    <div className="w-4 h-4"><Icon /></div>
                    <span className="ml-1 font-mono">{amount}</span>
                </span>
            );
        })}
    </div>
);


const BuildingManagementPanel: React.FC<BuildingManagementPanelProps> = (props) => {
    const { isOpen, onClose, panelState, buildings, buildingList, onUpdateBuilding, onDemolishBuilding, onTrainUnits, onTrainVillagers, resources, population, unitList, onAdvanceAge, activeTasks, anchorRect } = props;
    
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ panelState, buildings, anchorRect });
    const [trainCount, setTrainCount] = useState(1);

     useEffect(() => {
        if (!isOpen) return;

        const popSpace = population.capacity - population.current;
        const currentCount = trainCount;

        if (currentCount > popSpace) {
             setTrainCount(Math.max(0, popSpace));
        } else if (currentCount === 0 && popSpace > 0) {
             setTrainCount(1);
        } else if (popSpace === 0) {
            setTrainCount(0);
        }

    }, [isOpen, panelState.type, population.capacity, population.current, trainCount]);

    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ panelState, buildings, anchorRect });
        }
    }, [panelState, buildings, anchorRect, isOpen, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => { onClose(); setIsClosing(false); }, 300);
    };

    if (!isOpen && !isClosing) return null;

    const { panelState: currentPanelState, buildings: currentBuildings, anchorRect: currentAnchor } = currentData;
    const { type } = currentPanelState;

    if (!type || !currentAnchor) return null;

    const buildingInfo = buildingList.find(b => b.id === type);
    const buildingInstances = currentBuildings[type];
    const unitToTrain = unitList.find(u => u.requiredBuilding === type);
    
    const activeTrainTask = unitToTrain ? activeTasks.find(t => t.type === 'train_military' && t.payload?.unitType === unitToTrain?.id) : undefined;
    const activeVillagerTask = activeTasks.find(t => t.type === 'train_villager');
    const activeAgeTask = activeTasks.find(t => t.type === 'advance_age');

    const popSpace = population.capacity - population.current;
    const hasPopCapacity = popSpace >= trainCount;

    const totalUnitCost = unitToTrain ? Object.entries(unitToTrain.cost).reduce((acc, [res, val]) => ({ ...acc, [res]: (val || 0) * trainCount }), {} as any) : {};
    const canAffordUnit = unitToTrain ? Object.entries(totalUnitCost).every(([res, cost]) => resources[res as keyof Resources] >= (cost as number)) : false;
    const canTrainUnit = unitToTrain && canAffordUnit && hasPopCapacity && !activeTrainTask;

    const totalVillagerCost = { food: 50 * trainCount };
    const canAffordVillagers = resources.food >= totalVillagerCost.food;
    const canTrainVillagers = canAffordVillagers && hasPopCapacity && !activeVillagerTask;

    const panelWidth = 384; // from w-96
    const panelHeightEstimate = 400; // A safe estimate
    const panelGap = 8;

    const panelStyle: React.CSSProperties = {};

    const spaceBelow = window.innerHeight - currentAnchor.bottom;
    const spaceAbove = currentAnchor.top;

    if (spaceBelow < panelHeightEstimate && spaceAbove > spaceBelow) {
        panelStyle.bottom = `${window.innerHeight - currentAnchor.top + panelGap}px`;
        panelStyle.transformOrigin = 'bottom center';
    } else {
        panelStyle.top = `${currentAnchor.bottom + panelGap}px`;
        panelStyle.transformOrigin = 'top center';
    }

    let leftPos = currentAnchor.left + currentAnchor.width / 2 - panelWidth / 2;
    if (leftPos + panelWidth > window.innerWidth - panelGap) {
        leftPos = window.innerWidth - panelWidth - panelGap;
    }
    if (leftPos < panelGap) {
        leftPos = panelGap;
    }
    panelStyle.left = `${leftPos}px`;


    // --- Tooltip Text Generation ---
    const getTrainUnitTooltip = () => {
        if (!unitToTrain) return '';
        if (activeTrainTask) return 'Training in progress...';
        if (!hasPopCapacity) return `Need ${trainCount - popSpace} more housing.`;
        if (!canAffordUnit) return 'Insufficient Resources.';
        return `Train ${trainCount} ${unitToTrain.name}(s)`;
    };

    const getTrainVillagerTooltip = () => {
        if (activeVillagerTask) return 'Training in progress...';
        if (!hasPopCapacity) return `Need ${trainCount - popSpace} more housing.`;
        if (!canAffordVillagers) return 'Insufficient Food.';
        return `Train ${trainCount} Villager(s)`;
    };
    
    const getAdvanceAgeTooltip = () => {
        if (activeAgeTask) return 'Advancement in progress.';
        if (resources.food < 500 || resources.gold < 200) return 'Insufficient resources to advance.';
        return 'Advance to the next age (60s)';
    };

    return (
        <div style={panelStyle} className={`fixed z-40 w-96 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif">{buildingInfo?.name}{!buildingInfo?.isUnique ? 's' : ''}</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {buildingInstances.length > 0 ? (
                        buildingInstances.map(instance => (
                            <BuildingRow key={instance.id} building={instance} type={type} onUpdate={onUpdateBuilding} onDemolish={onDemolishBuilding} />
                        ))
                    ) : ( <p className="text-center text-parchment-dark py-4">You have no {buildingInfo?.name?.toLowerCase()}s.</p> )}
                </div>

                {(type === 'townCenter' || unitToTrain) && <hr className="border-stone-light/20 my-3" />}
                
                <div className="space-y-3">
                    {type === 'townCenter' && (
                         <>
                            {activeVillagerTask ? (
                                <div className="h-14 flex flex-col justify-center items-center"><p className="text-sm text-parchment-dark mb-2">Training {activeVillagerTask.payload?.count} Villager(s)...</p><ProgressBar startTime={activeVillagerTask.startTime} duration={activeVillagerTask.duration} className="w-full h-2"/></div>
                            ) : (
                                <div className="sci-fi-unit-row !p-2 flex items-center gap-3">
                                    <div className="w-8 h-8 p-1 bg-black/30 rounded-md text-brand-blue"><VillagerIcon/></div>
                                    <div className="flex-grow"><CostDisplay cost={totalVillagerCost} resources={resources} /></div>
                                    <input type="range" min="1" max={Math.max(1, popSpace)} value={trainCount} onChange={(e) => setTrainCount(Math.min(Number(e.target.value), popSpace))} className="sci-fi-slider w-24" disabled={popSpace <= 0}/>
                                    <span className="font-bold text-base w-8 text-center bg-black/20 p-1 rounded-md">{popSpace > 0 ? trainCount : 0}</span>
                                    <div className="relative group">
                                        <button onClick={() => onTrainVillagers(trainCount)} disabled={!canTrainVillagers} className="sci-fi-action-button"><div className="w-6 h-6"><VillagerIcon/></div></button>
                                        <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{getTrainVillagerTooltip()}</div>
                                    </div>
                                </div>
                            )}
                             {activeAgeTask ? (
                                <div className="h-12 mt-2 flex flex-col justify-center items-center"><p className="text-sm text-parchment-dark mb-2">Advancing to the next age...</p><ProgressBar startTime={activeAgeTask.startTime} duration={activeAgeTask.duration} className="w-full h-2"/></div>
                            ) : (
                                <div className="sci-fi-unit-row !p-2 flex items-center gap-3 mt-2">
                                    <div className="w-8 h-8 p-1 bg-black/30 rounded-md text-brand-gold"><AgeIcon/></div>
                                    <div className="flex-grow"><CostDisplay cost={{ food: 500, gold: 200 }} resources={resources} /></div>
                                     <div className="relative group">
                                        <button onClick={onAdvanceAge} disabled={!!activeAgeTask || resources.food < 500 || resources.gold < 200} className="sci-fi-action-button"><div className="w-6 h-6"><AgeIcon /></div></button>
                                        <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{getAdvanceAgeTooltip()}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                    {unitToTrain && (
                        <>
                            {activeTrainTask ? (
                                <div className="h-16 flex flex-col justify-center items-center"><p className="text-sm text-parchment-dark mb-2">Training {activeTrainTask.payload?.count} {unitToTrain.name}(s)...</p><ProgressBar startTime={activeTrainTask.startTime} duration={activeTrainTask.duration} className="w-full h-2"/></div>
                            ) : (
                                 <div className="sci-fi-unit-row !p-2 flex items-center gap-3">
                                    <div className="w-8 h-8 p-1 bg-black/30 rounded-md text-brand-red">{iconMap[unitToTrain.id]}</div>
                                     <div className="flex-grow"><CostDisplay cost={totalUnitCost} resources={resources} /></div>
                                     <input type="range" min="1" max={Math.max(1, popSpace)} value={trainCount} onChange={(e) => setTrainCount(Math.min(Number(e.target.value), popSpace))} className="sci-fi-slider w-24" disabled={popSpace <= 0}/>
                                     <span className="font-bold text-base w-8 text-center bg-black/20 p-1 rounded-md">{popSpace > 0 ? trainCount : 0}</span>
                                     <div className="relative group">
                                         <button onClick={() => onTrainUnits(unitToTrain.id, trainCount)} disabled={!canTrainUnit} className="sci-fi-action-button"><div className="w-6 h-6">{iconMap[unitToTrain.id]}</div></button>
                                         <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{getTrainUnitTooltip()}</div>
                                     </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuildingManagementPanel;
