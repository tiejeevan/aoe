import React, { useState, useEffect } from 'react';
import type { Civilization } from '../types';

interface CivilizationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    civilization: Civilization | null;
    anchorRect: DOMRect | null;
    panelOpacity: number;
}

const CivilizationPanel: React.FC<CivilizationPanelProps> = ({ isOpen, onClose, civilization, anchorRect, panelOpacity }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ civilization, anchorRect });

    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ civilization, anchorRect });
        }
    }, [civilization, anchorRect, isOpen, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false);
        }, 300);
    };

    if ((!isOpen && !isClosing) || !currentData.civilization || !currentData.anchorRect) return null;

    const { civilization: currentCiv, anchorRect: currentAnchor } = currentData;
    
    const panelStyle: React.CSSProperties = {
        top: `${currentAnchor.bottom + 8}px`,
        left: `${currentAnchor.left}px`,
        transformOrigin: 'top left',
        '--panel-opacity': panelOpacity,
    } as React.CSSProperties;

    return (
        <div 
            style={panelStyle}
            className={`fixed z-40 w-96 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif">{currentCiv.name}</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="flex gap-4">
                    <div className="w-1/3 flex-shrink-0">
                        <img src={currentCiv.bannerUrl} alt={`${currentCiv.name} banner`} className="w-full h-auto rounded-md object-cover border-2 border-brand-gold shadow-lg" />
                    </div>
                    <div className="w-2/3 text-sm text-parchment-dark space-y-2">
                        <p>{currentCiv.lore}</p>
                        <hr className="border-stone-light/20" />
                        <p><strong>Bonus:</strong> {currentCiv.bonus}</p>
                        <p><strong>Unique Unit:</strong> {currentCiv.uniqueUnit.name} - {currentCiv.uniqueUnit.description}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CivilizationPanel;
