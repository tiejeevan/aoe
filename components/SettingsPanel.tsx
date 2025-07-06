import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRect: DOMRect | null;
    opacity: number;
    onOpacityChange: (opacity: number) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, anchorRect, opacity, onOpacityChange }) => {
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
        top: `${currentAnchor.bottom + 8}px`,
        right: `${window.innerWidth - currentAnchor.right}px`,
        transformOrigin: 'top right',
        '--panel-opacity': opacity
    } as React.CSSProperties;

    return (
        <div 
            style={panelStyle}
            className={`fixed z-40 w-72 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
            <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-serif">Settings</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>
                
                <div className="space-y-4">
                    <label htmlFor="opacity-slider" className="block text-lg font-serif text-brand-gold mb-2">
                        UI Panel Opacity
                    </label>
                    <div className="flex items-center gap-4">
                         <input
                            id="opacity-slider"
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.05"
                            value={opacity}
                            onChange={(e) => onOpacityChange(e.target.valueAsNumber)}
                            className="sci-fi-slider"
                        />
                        <span className="font-bold text-lg w-16 text-center bg-black/20 p-1 rounded-md">
                            {Math.round(opacity * 100)}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
