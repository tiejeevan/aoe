

import React, { useState, useEffect } from 'react';
import type { BuildingType, BuildingConfig, GameTask } from '../types';
import { iconMap } from './GameUI';
import { buildingIconMap } from './icons/iconRegistry';

// StatBox component copied from GameUI for reuse in this panel.
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

interface AllBuildingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    buildingList: BuildingConfig[];
    buildingCounts: Record<string, number>;
    activeTasks: GameTask[];
    onOpenBuildingPanel: (type: BuildingType | string, instanceId: string, rect: DOMRect) => void;
    anchorRect: DOMRect | null;
}


const AllBuildingsPanel: React.FC<AllBuildingsPanelProps> = ({ isOpen, onClose, buildingList, buildingCounts, activeTasks, onOpenBuildingPanel, anchorRect }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ anchorRect });
    
    const constructionTasks = activeTasks.filter(t => t.type === 'build');

    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ anchorRect });
        }
    }, [anchorRect, isOpen, isClosing]);

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

    const panelWidth = 288; // from w-72
    const panelGap = 8;

    const panelStyle: React.CSSProperties = {
        transformOrigin: 'bottom center',
        maxHeight: `${currentAnchor.top - 24}px`,
    };
    
    panelStyle.bottom = `${window.innerHeight - currentAnchor.top + panelGap}px`;

    let leftPos = currentAnchor.left + currentAnchor.width / 2 - panelWidth / 2;
    if (leftPos + panelWidth > window.innerWidth - panelGap) {
        leftPos = window.innerWidth - panelWidth - panelGap;
    }
    if (leftPos < panelGap) {
        leftPos = panelGap;
    }
    panelStyle.left = `${leftPos}px`;
    
    const totalBuildings = Object.values(buildingCounts).reduce((a, b) => a + b, 0);

    return (
        <div
            style={panelStyle}
            className={`fixed z-40 w-72 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
             <div className="sci-fi-panel-popup sci-fi-grid p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-serif">Structures ({totalBuildings})</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="space-y-2 flex-grow overflow-y-auto pr-2">
                    {(totalBuildings > 0 || constructionTasks.length > 0) ? (
                        buildingList
                            .sort((a, b) => a.order - b.order)
                            .map((info) => {
                                const type = info.id;
                                const count = buildingCounts[type] || 0;
                                const isConstructing = constructionTasks.some(t => t.payload?.buildingType === type);
                                if(count === 0 && !isConstructing) return null;
                                
                                const IconComponent = buildingIconMap[info.iconId] || buildingIconMap.default;

                                const constructingCount = constructionTasks.filter(t => t.payload?.buildingType === type).length;
                                const displayValue = count > 0 ? `${count}${constructingCount > 0 ? ` (+${constructingCount})` : ''}` : `Constructing...`;

                                return (
                                    <StatBox 
                                        key={type} 
                                        icon={<IconComponent />}
                                        label={info.name}
                                        value={displayValue} 
                                        colorClass="text-parchment-dark" 
                                        onActionClick={count > 0 ? (e) => {
                                            onOpenBuildingPanel(type, '', e.currentTarget.getBoundingClientRect());
                                        } : undefined}
                                    />
                                );
                            })
                    ) : (
                        <p className="text-center text-parchment-dark py-8">You have no buildings.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
export default AllBuildingsPanel;
