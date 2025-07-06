
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
            .sci-fi-grid {
                background-color: black;
                background-image:
                linear-gradient(rgba(69, 133, 136, 0.15) 1px, transparent 1px),
                linear-gradient(90deg, rgba(69, 133, 136, 0.15) 1px, transparent 1px);
                background-size: 20px 20px;
            }
            .sci-fi-close-button { color: #bdae93; transition: all 0.2s ease-in-out; text-shadow: none; }
            .sci-fi-close-button:hover { color: #fb4934; transform: rotate(90deg) scale(1.1); text-shadow: 0 0 5px rgba(251, 73, 52, 0.5); }
            input[type=range].sci-fi-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; background: rgba(0,0,0,0.5); border-radius: 3px; outline: none; border: 1px solid rgba(69, 133, 136, 0.5); }
            input[type=range].sci-fi-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; background: #a7f3d0; cursor: pointer; border-radius: 50%; border: 1px solid rgba(13, 33, 51, 0.8); box-shadow: 0 0 5px rgba(167, 243, 208, 0.5); }
            input[type=range].sci-fi-slider::-moz-range-thumb { width: 16px; height: 16px; background: #a7f3d0; cursor: pointer; border-radius: 50%; border: 1px solid rgba(13, 33, 51, 0.8); box-shadow: 0 0 5px rgba(167, 243, 208, 0.5); }
        `;
        document.head.appendChild(style);
    }, []);

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
