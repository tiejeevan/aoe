
import React, { useState, useEffect } from 'react';
import type { ResourceNode, ResourceNodeType, ConstructingBuilding, BuildingInfo } from '../types';
import { FoodIcon, WoodIcon, GoldIcon, StoneIcon, VillagerIcon, ClockIcon, GatherIcon, BuildIcon } from './icons/ResourceIcons';
import { iconMap } from './GameUI';

interface ResourceAssignmentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentTarget: (ResourceNode | ConstructingBuilding) | null;
    idleVillagerCount: number;
    onAssignVillagers: (targetId: string, count: number) => void;
    gatherInfo: Record<ResourceNodeType, { rate: number }>;
    buildingList: BuildingInfo[];
    anchorRect: DOMRect | null;
    panelOpacity: number;
}

const InfoIcon: React.FC<{ icon: React.ReactNode; value: string | number; tooltip: string }> = ({ icon, value, tooltip }) => (
    <div className="relative group flex items-center gap-1.5 text-parchment-dark">
        <div className="w-5 h-5">{icon}</div>
        <span className="font-bold text-sm">{value}</span>
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">
            {tooltip}
        </div>
    </div>
);


const ResourceAssignmentPanel: React.FC<ResourceAssignmentPanelProps> = (props) => {
    const { isOpen, onClose, assignmentTarget, idleVillagerCount, onAssignVillagers, gatherInfo, buildingList, anchorRect, panelOpacity } = props;
    
    const [assignCount, setAssignCount] = useState(1);
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ assignmentTarget, anchorRect });
    
    useEffect(() => {
        if (isOpen) {
            setAssignCount(idleVillagerCount > 0 ? 1 : 0);
        }
    }, [isOpen, idleVillagerCount]);
    
    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ assignmentTarget, anchorRect });
        }
    }, [assignmentTarget, anchorRect, isOpen, isClosing]);
    
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const handleAssign = () => {
        if (currentData.assignmentTarget && assignCount > 0) {
            onAssignVillagers(currentData.assignmentTarget.id, assignCount);
        }
    };
    
    if (!isOpen && !isClosing) return null;

    const { assignmentTarget: currentTarget, anchorRect: currentAnchor } = currentData;
    if (!currentTarget || !currentAnchor) return null;

    const isConstruction = 'villagerIds' in currentTarget;
    const isResource = 'amount' in currentTarget;

    let title = "Assign Villagers";
    let MainIcon = GatherIcon;
    let InfoIcons: React.ReactNode = null;
    let AssignIcon = GatherIcon;
    
    if (isResource) {
        const node = currentTarget as ResourceNode;
        title = `Gather ${node.type}`;
        MainIcon = { food: FoodIcon, wood: WoodIcon, gold: GoldIcon, stone: StoneIcon }[node.type];
        const projectedRate = assignCount * gatherInfo[node.type].rate;
        InfoIcons = (
            <>
                <InfoIcon icon={<MainIcon />} value={Math.floor(node.amount)} tooltip="Remaining Amount" />
                <InfoIcon icon={<VillagerIcon />} value={`${node.assignedVillagers.length} / ${idleVillagerCount}`} tooltip="Assigned / Idle" />
                <InfoIcon icon={<ClockIcon />} value={`${projectedRate.toFixed(1)}/s`} tooltip="Projected Gather Rate" />
            </>
        );
    }

    if (isConstruction) {
        const construction = currentTarget as ConstructingBuilding;
        const buildingInfo = buildingList.find(b => b.id === construction.type);
        title = `Construct ${buildingInfo?.name || 'Building'}`;
        MainIcon = iconMap[construction.type] as React.FC;
        AssignIcon = BuildIcon;
        InfoIcons = (
             <>
                <InfoIcon icon={<BuildIcon />} value={construction.villagerIds.length} tooltip="Current Builders" />
                <InfoIcon icon={<VillagerIcon />} value={idleVillagerCount} tooltip="Idle Villagers Available" />
            </>
        )
    }

    const maxAssignable = idleVillagerCount;
    
    const panelStyle: React.CSSProperties = { top: `${currentAnchor.bottom + 8}px`, left: `max(8px, ${currentAnchor.left - 144}px)`, transformOrigin: 'top center', '--panel-opacity': panelOpacity } as React.CSSProperties;

    return (
        <div style={panelStyle} className={`fixed z-40 w-72 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8"><MainIcon /></div>
                        <h2 className="text-2xl font-serif capitalize">{title}</h2>
                    </div>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-around items-center bg-black/20 p-2 rounded-md">
                       {InfoIcons}
                    </div>
                    
                    <hr className="border-stone-light/20 my-2" />
                    
                    <div className="flex items-center gap-3">
                         <input
                            id="villager-slider"
                            type="range"
                            min="0"
                            max={maxAssignable}
                            value={assignCount}
                            onChange={(e) => setAssignCount(Number(e.target.value))}
                            className="sci-fi-slider flex-grow"
                            disabled={maxAssignable === 0}
                            aria-label="Assign Villagers"
                        />
                        <span className="font-bold text-lg w-12 text-center bg-black/20 p-1 rounded-md">{assignCount}</span>
                        <div className="relative group">
                            <button
                                onClick={handleAssign}
                                disabled={assignCount === 0 || maxAssignable === 0}
                                className="sci-fi-action-button"
                            >
                                <div className="w-6 h-6"><AssignIcon /></div>
                            </button>
                             <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                {maxAssignable === 0 ? 'No Idle Villagers' : `Assign ${assignCount} Villager(s)`}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceAssignmentPanel;
