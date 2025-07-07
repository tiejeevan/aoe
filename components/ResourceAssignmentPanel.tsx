
import React, { useState, useEffect, useMemo } from 'react';
import type { ResourceNode, GameTask, BuildingConfig, Units } from '../types';
import { VillagerIcon, ClockIcon, GatherIcon, BuildIcon } from './icons/ResourceIcons';
import { iconMap } from './GameUI';
import { Undo2 } from 'lucide-react';
import { resourceIconMap } from './icons/iconRegistry';

interface ResourceAssignmentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    assignmentTarget: (ResourceNode | GameTask) | null;
    idleVillagerCount: number;
    onAssignVillagers: (targetId: string, count: number) => void;
    onRecallVillagers: (targetId: string, count: number, type: 'resource' | 'construction') => void;
    gatherInfo: Record<string, { rate: number }>;
    buildingList: BuildingConfig[];
    units: Units;
    anchorRect: DOMRect | null;
}

const InfoIcon: React.FC<{ icon: React.ReactNode; value: string | number; tooltip: string }> = ({ icon, value, tooltip }) => (
    <div className="relative group flex items-center gap-1.5 text-parchment-dark">
        <div className="w-5 h-5">{icon}</div>
        <span className="font-bold text-sm">{value}</span>
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {tooltip}
        </div>
    </div>
);


const ResourceAssignmentPanel: React.FC<ResourceAssignmentPanelProps> = (props) => {
    const { isOpen, onClose, assignmentTarget, idleVillagerCount, onAssignVillagers, onRecallVillagers, gatherInfo, buildingList, units, anchorRect } = props;
    
    // --- Hooks ---
    const [assignCount, setAssignCount] = useState(1);
    const [recallCount, setRecallCount] = useState(1);
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ assignmentTarget, anchorRect, units });

    useEffect(() => {
        if (isOpen || isClosing) setCurrentData({ assignmentTarget, anchorRect, units });
    }, [assignmentTarget, anchorRect, units, isOpen, isClosing]);

    const { assignmentTarget: currentTarget, anchorRect: currentAnchor, units: currentUnits } = currentData;
    
    const assignedCount = useMemo(() => {
        if (!currentTarget || !currentUnits) return 0;
        if ('amount' in currentTarget) {
            return currentUnits.villagers.filter(v => v.currentTask === `gather-${currentTarget.id}`).length;
        }
        if ('type' in currentTarget && currentTarget.type === 'build') {
            return (currentTarget.payload?.villagerIds || []).length;
        }
        return 0;
    }, [currentTarget, currentUnits]);

    useEffect(() => {
        if (isOpen) {
            setAssignCount(idleVillagerCount > 0 ? 1 : 0);
            setRecallCount(assignedCount > 0 ? 1 : 0);
        }
    }, [isOpen, idleVillagerCount, assignedCount]);
    
    const handleClose = () => {
        setIsClosing(true); setTimeout(() => { onClose(); setIsClosing(false); }, 300);
    };

    const handleAssign = () => { if (currentTarget && assignCount > 0) onAssignVillagers(currentTarget.id, assignCount); };
    const handleRecall = () => { if (currentTarget && recallCount > 0) onRecallVillagers(currentTarget.id, recallCount, 'amount' in currentTarget ? 'resource' : 'construction'); };

    if (!isOpen && !isClosing || !currentTarget || !currentAnchor || !currentUnits) return null;

    let title = "Manage Workforce";
    let MainIcon: React.ReactNode = <GatherIcon />;
    let InfoIcons: React.ReactNode = null;
    let AssignIcon: React.ReactNode = <GatherIcon />;
    
    if ('amount' in currentTarget) {
        const node = currentTarget as ResourceNode;
        const assignedVillagersCount = currentUnits.villagers.filter(v => v.currentTask === `gather-${node.id}`).length;
        title = `Gather ${node.type}`;
        const IconComponent = resourceIconMap[node.type] || resourceIconMap.default;
        MainIcon = <IconComponent />;
        const currentRate = assignedVillagersCount * (gatherInfo[node.type]?.rate || 0);
        InfoIcons = (
            <>
                <InfoIcon icon={MainIcon} value={Math.floor(node.amount)} tooltip="Remaining Amount" />
                <InfoIcon icon={<VillagerIcon />} value={`${assignedVillagersCount}`} tooltip="Assigned Workers" />
                <InfoIcon icon={<ClockIcon />} value={`${currentRate.toFixed(1)}/s`} tooltip="Current Gather Rate" />
            </>
        );
    }

    if ('type' in currentTarget && currentTarget.type === 'build') {
        const task = currentTarget as GameTask;
        const buildingInfo = buildingList.find(b => b.id === task.payload!.buildingType);
        title = `Construct ${buildingInfo?.name || 'Building'}`;
        MainIcon = buildingInfo ? iconMap[buildingInfo.iconId] : <BuildIcon />;
        AssignIcon = <BuildIcon />;
        InfoIcons = (
             <>
                <InfoIcon icon={<BuildIcon />} value={task.payload!.villagerIds!.length} tooltip="Current Builders" />
                <InfoIcon icon={<VillagerIcon />} value={idleVillagerCount} tooltip="Idle Villagers Available" />
            </>
        )
    }

    const maxAssignable = idleVillagerCount;
    
    const panelWidth = 320; const panelHeightEstimate = 350; const panelGap = 8;
    const style: React.CSSProperties = {};
    const spaceBelow = window.innerHeight - currentAnchor.bottom;
    const spaceAbove = currentAnchor.top;
    if (spaceBelow < panelHeightEstimate && spaceAbove > spaceBelow) {
        style.bottom = `${window.innerHeight - currentAnchor.top + panelGap}px`; style.transformOrigin = 'bottom center';
    } else {
        style.top = `${currentAnchor.bottom + panelGap}px`; style.transformOrigin = 'top center';
    }
    let leftPos = currentAnchor.left + currentAnchor.width / 2 - panelWidth / 2;
    if (leftPos + panelWidth > window.innerWidth - panelGap) leftPos = window.innerWidth - panelWidth - panelGap;
    if (leftPos < panelGap) leftPos = panelGap;
    style.left = `${leftPos}px`;

    return (
        <div style={style} className={`fixed z-40 w-80 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3"><div className="w-8 h-8">{MainIcon}</div><h2 className="text-2xl font-serif capitalize">{title}</h2></div>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-around items-center bg-black/20 p-2 rounded-md">{InfoIcons}</div>
                    <hr className="border-stone-light/20 my-2" />
                    <div>
                        <label className="block text-sm font-serif text-brand-gold mb-1">Assign Idle Villagers ({idleVillagerCount} available)</label>
                        <div className="flex items-center gap-3">
                             <input type="range" min="0" max={maxAssignable} value={assignCount} onChange={(e) => setAssignCount(Number(e.target.value))} className="sci-fi-slider flex-grow" disabled={maxAssignable === 0} aria-label="Assign Villagers" />
                            <span className="font-bold text-lg w-12 text-center bg-black/20 p-1 rounded-md">{assignCount}</span>
                            <div className="relative group">
                                <button onClick={handleAssign} disabled={assignCount === 0 || maxAssignable === 0} className="sci-fi-action-button"><div className="w-6 h-6">{AssignIcon}</div></button>
                                 <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{maxAssignable === 0 ? 'No Idle Villagers' : `Assign ${assignCount} Villager(s)`}</div>
                            </div>
                        </div>
                    </div>
                    {assignedCount > 0 && (
                        <div>
                             <hr className="border-stone-light/20 my-3" />
                             <label className="block text-sm font-serif text-brand-red mb-1">Recall Villagers ({assignedCount} assigned)</label>
                             <div className="flex items-center gap-3">
                                 <input type="range" min="1" max={assignedCount} value={recallCount} onChange={(e) => setRecallCount(Number(e.target.value))} className="sci-fi-slider flex-grow" aria-label="Recall Villagers" />
                                <span className="font-bold text-lg w-12 text-center bg-black/20 p-1 rounded-md">{recallCount}</span>
                                <div className="relative group">
                                    <button onClick={handleRecall} className="sci-fi-action-button" aria-label={`Recall ${recallCount} Villager(s)`}><div className="w-6 h-6 text-brand-red"><Undo2/></div></button>
                                     <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">{`Recall ${recallCount} Villager(s)`}</div>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResourceAssignmentPanel;
