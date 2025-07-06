import React, { useState, useEffect } from 'react';
import type { BuildingInfo, BuildingType, Resources, BuildingCosts } from '../types';
import { FoodIcon, WoodIcon, GoldIcon, StoneIcon, BarracksIcon, HouseIcon, ArcheryRangeIcon, StableIcon, SiegeWorkshopIcon, BlacksmithIcon, WatchTowerIcon, TownCenterIcon, ClockIcon, BuildIcon } from './icons/ResourceIcons';

interface BuildPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onStartPlacement: (buildingId: BuildingType) => void;
    resources: Resources;
    buildingCounts: Record<BuildingType, number>;
    buildingList: BuildingInfo[];
    anchorRect: DOMRect | null;
}

const buildingIcons: Record<BuildingType, React.FC> = {
    houses: HouseIcon,
    barracks: BarracksIcon,
    archeryRange: ArcheryRangeIcon,
    stable: StableIcon,
    siegeWorkshop: SiegeWorkshopIcon,
    blacksmith: BlacksmithIcon,
    watchTower: WatchTowerIcon,
    townCenter: TownCenterIcon,
};

const CostDisplay: React.FC<{ cost: BuildingCosts, resources: Resources }> = ({ cost, resources }) => {
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {(Object.entries(cost) as [keyof Resources, number][]).map(([resource, amount]) => {
                if (!amount) return null;
                const hasEnough = resources[resource] >= amount;
                const Icon = { food: FoodIcon, wood: WoodIcon, gold: GoldIcon, stone: StoneIcon }[resource];
                return (
                    <span key={resource} className={`flex items-center ${hasEnough ? '' : 'text-brand-red'}`}>
                        <div className="w-4 h-4"><Icon /></div>
                        <span className="ml-1">{amount}</span>
                    </span>
                );
            })}
        </div>
    );
};

const BuildPanel: React.FC<BuildPanelProps> = ({ isOpen, onClose, onStartPlacement, resources, buildingCounts, buildingList, anchorRect }) => {
    const constructibleBuildings = buildingList.filter(b => b.id !== 'townCenter');
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo>(constructibleBuildings[0] ?? null);
    
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ anchorRect, buildingList });

    useEffect(() => {
        if (isOpen && !selectedBuilding) {
            setSelectedBuilding(constructibleBuildings[0] ?? null);
        }
    }, [isOpen, selectedBuilding, constructibleBuildings]);

    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ anchorRect, buildingList });
        }
    }, [anchorRect, buildingList, isOpen, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    if (!isOpen && !isClosing) return null;
    
    const { anchorRect: currentAnchor } = currentData;
    if (!currentAnchor) return null;

    const isAffordable = selectedBuilding ? Object.entries(selectedBuilding.cost).every(([res, cost]) => resources[res as keyof Resources] >= (cost || 0)) : false;
    const isBuilt = selectedBuilding ? selectedBuilding.isUnique && buildingCounts[selectedBuilding.id] > 0 : false;
    const canBuild = isAffordable && !isBuilt;

    const panelStyle: React.CSSProperties = {
        top: `${currentAnchor.bottom + 8}px`,
        left: `${currentAnchor.left}px`,
        transformOrigin: 'top left',
    } as React.CSSProperties;
    
    const constructButtonTooltip = isBuilt ? 'Already Built' : !isAffordable ? 'Insufficient Resources' : `Construct ${selectedBuilding?.name}`;

    return (
        <div 
            style={panelStyle}
            className={`fixed z-40 w-[500px] transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif">Construct Building</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="flex gap-4">
                    {/* Left: Building Grid */}
                    <div className="w-2/5 pr-4 border-r border-stone-light/20">
                         <div className="grid grid-cols-3 gap-2">
                            {constructibleBuildings.map((building) => {
                                const Icon = buildingIcons[building.id];
                                const isSelected = selectedBuilding?.id === building.id;
                                return (
                                    <div key={building.id} className="relative group">
                                         <button
                                            onClick={() => setSelectedBuilding(building)}
                                            className={`w-full aspect-square p-1.5 bg-stone-dark/50 rounded-md border-2 transition-all duration-150
                                                ${isSelected ? 'border-brand-gold bg-stone-light/20' : 'border-stone-light/50 hover:border-brand-gold/70'}
                                            `}
                                        >
                                            <div className={`w-full h-full ${isSelected ? 'text-brand-gold' : 'text-parchment-dark group-hover:text-c9d1d9'}`}>
                                                <Icon />
                                            </div>
                                        </button>
                                        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            {building.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Details */}
                    <div className="w-3/5 flex flex-col">
                        {selectedBuilding ? (
                            <>
                                <div className="flex-grow">
                                    <h3 className="text-xl font-serif text-brand-gold">{selectedBuilding.name}</h3>
                                    <p className="text-sm text-parchment-dark mt-1 mb-3 h-10">{selectedBuilding.description}</p>
                                    
                                    <hr className="border-stone-light/20 my-2" />

                                    <div className="space-y-1">
                                        <h4 className="font-serif text-base">Cost:</h4>
                                        <CostDisplay cost={selectedBuilding.cost} resources={resources}/>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-xs">
                                        <div className="w-4 h-4 text-parchment-dark"><ClockIcon /></div>
                                        <span>Build Time: {selectedBuilding.buildTime}s</span>
                                    </div>
                                     {selectedBuilding.isUnique && (
                                        <p className="text-xs text-brand-blue mt-2">
                                            Unique Building ({buildingCounts[selectedBuilding.id]} / 1 built)
                                        </p>
                                     )}
                                </div>
                                
                                <div className="relative group self-end">
                                    <button
                                        onClick={() => { if(canBuild) onStartPlacement(selectedBuilding.id); }}
                                        disabled={!canBuild}
                                        className="sci-fi-action-button"
                                        aria-label={constructButtonTooltip}
                                    >
                                        <div className="w-8 h-8"><BuildIcon /></div>
                                    </button>
                                    <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        {constructButtonTooltip}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full text-parchment-dark">
                                <p>Select a building.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuildPanel;
