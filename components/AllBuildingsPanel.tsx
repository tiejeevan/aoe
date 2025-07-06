
import React, { useState, useEffect } from 'react';
import type { BuildingType, BuildingInfo, ConstructingBuilding } from '../types';
import { iconMap } from './GameUI';

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
    buildingList: BuildingInfo[];
    buildingCounts: Record<BuildingType, number>;
    constructingBuildings: ConstructingBuilding[];
    onOpenBuildingPanel: (type: BuildingType, instanceId: string, rect: DOMRect) => void;
    anchorRect: DOMRect | null;
    panelOpacity: number;
}


const AllBuildingsPanel: React.FC<AllBuildingsPanelProps> = ({ isOpen, onClose, buildingList, buildingCounts, constructingBuildings, onOpenBuildingPanel, anchorRect, panelOpacity }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ anchorRect });

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

    const panelStyle: React.CSSProperties = {
        bottom: `${window.innerHeight - currentAnchor.top + 8}px`,
        left: `${currentAnchor.left}px`,
        transformOrigin: 'bottom left',
        maxHeight: `${currentAnchor.top - 24}px`,
        '--panel-opacity': panelOpacity,
    } as React.CSSProperties;
    
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
                    {(totalBuildings > 0 || constructingBuildings.length > 0) ? (
                        Object.entries(buildingCounts)
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
                                        onActionClick={count > 0 ? (e) => {
                                            onOpenBuildingPanel(type as BuildingType, '', e.currentTarget.getBoundingClientRect());
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
