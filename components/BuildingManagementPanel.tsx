import React, { useState, useEffect } from 'react';
import type { Buildings, BuildingInstance, BuildingType, BuildingInfo, Resources, UnitInfo, MilitaryUnitType, GameTask } from '../types';
import { DemolishIcon, EditIcon, FoodIcon, GoldIcon, StoneIcon, WoodIcon, AgeIcon } from './icons/ResourceIcons';
import ProgressBar from './ProgressBar';

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
    panelOpacity: number;
}

const BuildingRow: React.FC<{
    building: BuildingInstance;
    type: BuildingType;
    onUpdate: (type: BuildingType, id: string, name: string) => void;
    onDemolish: (type: BuildingType, id: string) => void;
}> = ({ building, type, onUpdate, onDemolish }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(building.name);

    const handleSave = () => {
        if (name.trim()) {
            onUpdate(type, building.id, name.trim());
            setIsEditing(false);
        }
    };

    return (
        <div className="sci-fi-unit-row flex items-center gap-4">
            {isEditing ? (
                <>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="sci-fi-input w-full" />
                    <div className="flex gap-1">
                        <button onClick={handleSave} className="bg-brand-green/80 hover:bg-brand-green text-white px-2 py-0.5 text-xs rounded-md">✓</button>
                        <button onClick={() => setIsEditing(false)} className="bg-stone-light/80 hover:bg-stone-light text-white px-2 py-0.5 text-xs rounded-md">×</button>
                    </div>
                </>
            ) : (
                <>
                    <p className="flex-grow font-bold">{building.name}</p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsEditing(true)} title="Rename" className="sci-fi-action-button"><EditIcon /></button>
                        <button onClick={() => onDemolish(type, building.id)} title="Demolish" className="sci-fi-action-button"><DemolishIcon /></button>
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
    const { isOpen, onClose, panelState, buildings, buildingList, onUpdateBuilding, onDemolishBuilding, onTrainUnits, onTrainVillagers, resources, population, unitList, onAdvanceAge, activeTasks, anchorRect, panelOpacity } = props;
    
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ panelState, buildings, anchorRect });
    const [trainCount, setTrainCount] = useState(1);

    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ panelState, buildings, anchorRect });
        }
    }, [panelState, buildings, anchorRect, isOpen, isClosing]);

    useEffect(() => {
        if (!isOpen) return;
        const popSpace = population.capacity - population.current;
        setTrainCount(popSpace > 0 ? 1 : 0);
    }, [isOpen, panelState.type, population.capacity, population.current]);

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
    
    const activeTrainTask = activeTasks.find(t => t.type === 'train_military' && t.payload?.unitType === unitToTrain?.id);
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

    const panelStyle: React.CSSProperties = { top: `${currentAnchor.bottom + 8}px`, left: `${currentAnchor.left}px`, transformOrigin: 'top left', '--panel-opacity': panelOpacity } as React.CSSProperties;

    return (
        <div style={panelStyle} className={`fixed z-40 w-96 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif">Manage {buildingInfo?.name}</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {buildingInstances.length > 0 ? (
                        buildingInstances.map(instance => (
                            <BuildingRow key={instance.id} building={instance} type={type} onUpdate={onUpdateBuilding} onDemolish={onDemolishBuilding} />
                        ))
                    ) : ( <p className="text-center text-parchment-dark py-4">You have no {buildingInfo?.name?.toLowerCase()}s.</p> )}

                    {type === 'townCenter' && (
                         <>
                            <hr className="border-stone-light/20 my-3" />
                            <div className="space-y-3">
                                <h3 className="text-xl font-serif text-brand-gold">Train Villagers</h3>
                                {activeVillagerTask ? (
                                    <div className="h-16 flex flex-col justify-center items-center"><p className="text-sm text-parchment-dark mb-2">Training {activeVillagerTask.payload?.count} Villager(s)...</p><ProgressBar startTime={activeVillagerTask.startTime} duration={activeVillagerTask.duration} className="w-full h-2"/></div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="1" max={Math.max(1, popSpace)} value={trainCount} onChange={(e) => setTrainCount(Math.min(Number(e.target.value), popSpace))} className="sci-fi-slider" disabled={popSpace <= 0}/>
                                            <span className="font-bold text-lg w-12 text-center bg-black/20 p-1 rounded-md">{popSpace > 0 ? trainCount : 0}</span>
                                        </div>
                                        <div><h4 className="font-serif text-sm text-parchment-dark">Total Cost:</h4><CostDisplay cost={totalVillagerCost} resources={resources} /></div>
                                        <button onClick={() => onTrainVillagers(trainCount)} disabled={!canTrainVillagers} className="sci-fi-button w-full rounded-md text-sm">{!hasPopCapacity ? `Need ${trainCount - popSpace} housing` : !canAffordVillagers ? 'Insufficient Food' : `Train ${trainCount} Villager(s)`}</button>
                                    </>
                                )}
                            </div>
                            <hr className="border-stone-light/20 my-3" />
                            <div className="space-y-2">
                                <h3 className="text-xl font-serif text-brand-gold">Civilization Actions</h3>
                                {activeAgeTask ? (
                                    <div className="h-12 flex flex-col justify-center items-center"><p className="text-sm text-parchment-dark mb-2">Advancing to the next age...</p><ProgressBar startTime={activeAgeTask.startTime} duration={activeAgeTask.duration} className="w-full h-2"/></div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <button onClick={onAdvanceAge} disabled={!!activeAgeTask || resources.food < 500 || resources.gold < 200} className="sci-fi-button rounded-md !p-2" aria-label="Advance Age"><div className="w-6 h-6"><AgeIcon /></div></button>
                                        <div><p className="font-bold font-serif text-base">Advance Age (60s)</p><CostDisplay cost={{ food: 500, gold: 200 }} resources={resources} /></div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                    {unitToTrain && (
                        <>
                            <hr className="border-stone-light/20 my-3" />
                            <div className="space-y-3">
                                <h3 className="text-xl font-serif text-brand-gold">Train {unitToTrain.name}s</h3>
                                {activeTrainTask ? (
                                    <div className="h-16 flex flex-col justify-center items-center"><p className="text-sm text-parchment-dark mb-2">Training {activeTrainTask.payload?.count} {unitToTrain.name}(s)...</p><ProgressBar startTime={activeTrainTask.startTime} duration={activeTrainTask.duration} className="w-full h-2"/></div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4">
                                            <input type="range" min="1" max={Math.max(1, popSpace)} value={trainCount} onChange={(e) => setTrainCount(Math.min(Number(e.target.value), popSpace))} className="sci-fi-slider" disabled={popSpace <= 0}/>
                                            <span className="font-bold text-lg w-12 text-center bg-black/20 p-1 rounded-md">{popSpace > 0 ? trainCount : 0}</span>
                                        </div>
                                        <div><h4 className="font-serif text-sm text-parchment-dark">Total Cost:</h4><CostDisplay cost={totalUnitCost} resources={resources} /></div>
                                        <button onClick={() => onTrainUnits(unitToTrain.id, trainCount)} disabled={!canTrainUnit} className="sci-fi-button w-full rounded-md text-sm">{!hasPopCapacity ? `Need ${trainCount - popSpace} housing` : !canAffordUnit ? 'Insufficient Resources' : `Train ${trainCount} ${unitToTrain.name}(s)`}</button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuildingManagementPanel;
