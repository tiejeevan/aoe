
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
    
    useEffect(() => {
        const styleId = 'sci-fi-panel-styles';
        if (document.getElementById(styleId)) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .sci-fi-panel-popup {
                position: relative;
                background: rgb(10, 10, 15);
                border: 1px solid rgba(69, 133, 136, 0.5);
                box-shadow: 0 0 25px rgba(69, 133, 136, 0.4), inset 0 0 20px rgba(69, 133, 136, 0.2);
                clip-path: polygon(0 20px, 20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px));
                color: #c9d1d9; /* Brighter base text color */
                text-shadow: 
                    0 0 3px rgba(173, 216, 230, 0.2),
                    0 0 5px rgba(69, 133, 136, 0.5);
            }
            .sci-fi-panel-popup h2, .sci-fi-panel-popup h3, .sci-fi-panel-popup .text-brand-gold {
                color: #d79921;
                text-shadow: 0 0 5px rgba(215, 153, 33, 0.6), 0 0 10px rgba(215, 153, 33, 0.3);
            }
            .sci-fi-panel-popup .text-brand-red {
                color: #fb4934;
                text-shadow: 0 0 5px rgba(251, 73, 52, 0.6), 0 0 10px rgba(251, 73, 52, 0.3);
            }
            .sci-fi-panel-popup .text-brand-blue {
                color: #83a598;
                text-shadow: 0 0 5px rgba(131, 165, 152, 0.6), 0 0 10px rgba(131, 165, 152, 0.3);
            }
            .sci-fi-panel-popup .text-parchment-dark {
                color: #a89984;
            }
            .sci-fi-grid {
                background-color: transparent;
                background-image:
                linear-gradient(rgba(69, 133, 136, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(69, 133, 136, 0.15) 1px, transparent 1px);
                background-size: 20px 20px;
            }
            .sci-fi-close-button { color: #bdae93; transition: all 0.2s ease-in-out; text-shadow: none; }
            .sci-fi-close-button:hover { color: #fb4934; transform: rotate(90deg) scale(1.1); text-shadow: 0 0 5px rgba(251, 73, 52, 0.5); }
            .sci-fi-button { background: rgba(0,0,0,0.4); border: 1px solid rgba(69, 133, 136, 0.5); color: #c9d1d9; padding: 0.5rem 1rem; font-weight: bold; transition: all 0.2s ease-in-out; text-shadow: 0 0 5px rgba(100, 180, 180, 0.5); }
            .sci-fi-button:not(:disabled):hover { background: rgba(69, 133, 136, 0.2); border-color: #a7f3d0; text-shadow: 0 0 8px rgba(167, 243, 208, 0.7); }
            .sci-fi-button:disabled { background: rgba(0,0,0,0.2); color: #665c54; border-color: #504945; cursor: not-allowed; text-shadow: none; }
            input[type=range].sci-fi-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; outline: none; border: 1px solid rgba(69, 133, 136, 0.5); }
            input[type=range].sci-fi-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #a7f3d0; cursor: pointer; border-radius: 50%; border: 1px solid rgba(13, 33, 51, 0.8); box-shadow: 0 0 5px rgba(167, 243, 208, 0.5); }
            input[type=range].sci-fi-slider::-moz-range-thumb { width: 16px; height: 16px; background: #a7f3d0; cursor: pointer; border-radius: 50%; border: 1px solid rgba(13, 33, 51, 0.8); box-shadow: 0 0 5px rgba(167, 243, 208, 0.5); }
        `;
        document.head.appendChild(style);
    }, []);

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
