import React, { useState, useEffect } from 'react';
import type { ResourceNode, ResourceNodeType } from '../types';
import { FoodIcon, WoodIcon, GoldIcon, StoneIcon } from './icons/ResourceIcons';

interface ResourceAssignmentPanelProps {
    isOpen: boolean;
    onClose: () => void;
    node: ResourceNode | null;
    idleVillagerCount: number;
    onAssign: (nodeId: string, count: number) => void;
    gatherInfo: Record<ResourceNodeType, { rate: number }>;
    anchorRect: DOMRect | null;
    panelOpacity: number;
}

const ResourceAssignmentPanel: React.FC<ResourceAssignmentPanelProps> = ({ isOpen, onClose, node, idleVillagerCount, onAssign, gatherInfo, anchorRect, panelOpacity }) => {
    const [assignCount, setAssignCount] = useState(1);
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ node, anchorRect });
    
    useEffect(() => {
        if (isOpen) {
            setAssignCount(idleVillagerCount > 0 ? 1 : 0);
        }
    }, [isOpen, idleVillagerCount]);
    
    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ node, anchorRect });
        }
    }, [node, anchorRect, isOpen, isClosing]);
    
    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    const handleAssign = () => {
        if (currentData.node && assignCount > 0) {
            onAssign(currentData.node.id, assignCount);
        }
    };
    
    if (!isOpen && !isClosing) return null;

    const { node: currentNode, anchorRect: currentAnchor } = currentData;
    if (!currentNode || !currentAnchor) return null;

    const maxAssignable = idleVillagerCount;
    const currentRate = gatherInfo[currentNode.type].rate;
    const projectedRate = assignCount * currentRate;

    const Icon = { food: FoodIcon, wood: WoodIcon, gold: GoldIcon, stone: StoneIcon }[currentNode.type];
    
    const panelStyle: React.CSSProperties = { top: `${currentAnchor.bottom + 8}px`, left: `max(8px, ${currentAnchor.left - 150}px)`, transformOrigin: 'top center', '--panel-opacity': panelOpacity } as React.CSSProperties;

    return (
        <div style={panelStyle} className={`fixed z-40 w-80 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8"><Icon /></div>
                        <h2 className="text-2xl font-serif capitalize">Gather {currentNode.type}</h2>
                    </div>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                        <p className="text-parchment-dark">Amount: <span className="font-bold">{Math.floor(currentNode.amount)}</span></p>
                        <p className="text-parchment-dark">Idle: <span className="font-bold">{idleVillagerCount}</span></p>
                    </div>
                    
                    <hr className="border-stone-light/20 my-2" />
                    
                    <div>
                        <label htmlFor="villager-slider" className="block text-lg font-serif text-brand-gold mb-2">Assign Villagers</label>
                        <div className="flex items-center gap-4">
                            <input
                                id="villager-slider"
                                type="range"
                                min="0"
                                max={maxAssignable}
                                value={assignCount}
                                onChange={(e) => setAssignCount(Number(e.target.value))}
                                className="sci-fi-slider"
                                disabled={maxAssignable === 0}
                            />
                            <span className="font-bold text-xl w-16 text-center bg-black/20 p-2 rounded-md">{assignCount}</span>
                        </div>
                    </div>

                    <p className="text-parchment-dark text-sm">Projected rate: <span className="font-bold">{projectedRate.toFixed(1)}/s</span></p>

                    <button
                        onClick={handleAssign}
                        disabled={assignCount === 0 || maxAssignable === 0}
                        className="sci-fi-button w-full mt-2 rounded-md"
                    >
                        {maxAssignable === 0 ? 'No Idle Villagers' : `Assign ${assignCount} Villager(s)`}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResourceAssignmentPanel;
