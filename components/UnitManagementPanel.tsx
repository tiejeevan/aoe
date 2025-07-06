
import React, { useState, useEffect } from 'react';
import type { Units, Villager, MilitaryUnit } from '../types';
import { DismissIcon, EditIcon, BuildIcon } from './icons/ResourceIcons';

type UnitType = 'villagers' | 'military';

interface UnitManagementPanelProps {
    isOpen: boolean;
    onClose: () => void;
    units: Units;
    type: UnitType | null;
    onUpdateUnit: (type: UnitType, id: string, name: string, title?: string) => void;
    onDismissUnit: (type: UnitType, id: string) => void;
    onInitiateBuild: (villagerId: string, rect: DOMRect) => void;
    getVillagerTaskDetails: (villagerId: string) => string;
    anchorRect: DOMRect | null;
    panelOpacity: number;
}

const ActionButton: React.FC<{
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
}> = ({ onClick, disabled, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="sci-fi-action-button"
    >
        <div className="w-5 h-5">{children}</div>
    </button>
);

const UnitRow: React.FC<{
    unit: Villager | MilitaryUnit;
    type: UnitType;
    onUpdate: (id: string, name: string, title?: string) => void;
    onDismiss: (id: string) => void;
    onBuild: (id: string, rect: DOMRect) => void;
    canDismiss: boolean;
    taskDetails: string;
}> = ({ unit, type, onUpdate, onDismiss, onBuild, canDismiss, taskDetails }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(unit.name);
    const [title, setTitle] = useState('title' in unit ? unit.title : '');

    const isBusy = taskDetails !== 'Idle';

    const handleSave = () => {
        if (name.trim()) {
            onUpdate(unit.id, name.trim(), title.trim());
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setName(unit.name);
        setTitle('title' in unit ? unit.title : '');
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="sci-fi-unit-row editing flex flex-col sm:flex-row items-center gap-2">
                <div className="flex-grow w-full">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="sci-fi-input w-full"
                        placeholder="Name"
                    />
                    {type === 'military' && (
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="sci-fi-input w-full mt-1"
                            placeholder="Title (e.g., 'The Brave')"
                        />
                    )}
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                    <button onClick={handleSave} className="bg-brand-green/80 hover:bg-brand-green text-white px-3 py-1 text-xs rounded-md transition-colors">Save</button>
                    <button onClick={handleCancel} className="bg-stone-light/80 hover:bg-stone-light text-white px-3 py-1 text-xs rounded-md transition-colors">Cancel</button>
                </div>
            </div>
        );
    }

    return (
        <div className={`sci-fi-unit-row flex items-center gap-4 ${isBusy ? 'busy' : ''}`}>
            <div className="flex-grow">
                <p className="font-bold">{unit.name}</p>
                {type === 'military' && 'title' in unit && unit.title && (
                    <p className="text-sm text-brand-gold italic">"{unit.title}"</p>
                )}
                 {type === 'military' && 'unitType' in unit && (
                    <p className="text-xs text-brand-blue capitalize">{unit.unitType}</p>
                )}
                {isBusy && <p className="text-xs text-brand-gold italic">{taskDetails}</p>}
            </div>
            <div className="flex items-center gap-1">
                <ActionButton onClick={() => setIsEditing(true)} title={isBusy ? taskDetails : 'Edit Name/Title'}>
                    <EditIcon />
                </ActionButton>
                {type === 'villagers' && (
                    <ActionButton onClick={(e) => onBuild(unit.id, e.currentTarget.getBoundingClientRect())} title={isBusy ? taskDetails : 'Construct Building'}>
                        <BuildIcon />
                    </ActionButton>
                )}
                <ActionButton 
                    onClick={() => onDismiss(unit.id)} 
                    disabled={!canDismiss} 
                    title={isBusy ? taskDetails : (canDismiss ? "Dismiss" : "Cannot dismiss")}
                >
                    <DismissIcon />
                </ActionButton>
            </div>
        </div>
    );
};


const UnitManagementPanel: React.FC<UnitManagementPanelProps> = ({ isOpen, onClose, units, type, onUpdateUnit, onDismissUnit, onInitiateBuild, getVillagerTaskDetails, anchorRect, panelOpacity }) => {
    
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ type, units, anchorRect });

    useEffect(() => {
        // Always keep data fresh if the panel is open (or about to close)
        if (isOpen || isClosing) {
            setCurrentData({ type, units, anchorRect });
        }
    }, [type, units, anchorRect, isOpen, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false); // Reset for next time
        }, 300); // Must match animation duration
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
            .sci-fi-unit-row { background: rgba(0,0,0,0.3); border-radius: 0.25rem; padding: 0.5rem 0.75rem; border: 1px solid rgba(69, 133, 136, 0.3); transition: all 0.2s ease-in-out; }
            .sci-fi-unit-row:hover { background: rgba(69, 133, 136, 0.15); border-color: rgba(69, 133, 136, 0.7); }
            .sci-fi-unit-row.busy { opacity: 0.6; background: rgba(0,0,0,0.5); }
            .sci-fi-unit-row.busy .sci-fi-action-button { pointer-events: none; }
            .sci-fi-unit-row.editing { background: rgba(69, 133, 136, 0.1); border-color: rgba(69, 133, 136, 0.6); }
            .sci-fi-input { background: rgba(0,0,0,0.4); border: 1px solid rgba(69, 133, 136, 0.5); color: #c9d1d9; border-radius: 0.25rem; padding: 0.25rem 0.5rem; font-size: 0.875rem; }
            .sci-fi-input:focus { outline: none; border-color: rgba(131, 207, 255, 0.8); box-shadow: 0 0 5px rgba(131, 207, 255, 0.5); }
            .sci-fi-action-button { padding: 0.375rem; border-radius: 9999px; transition: all 0.2s ease-in-out; color: #bdae93; }
            .sci-fi-action-button:not(:disabled):hover { color: #a7f3d0; background: rgba(69, 133, 136, 0.3); transform: scale(1.1); text-shadow: 0 0 5px rgba(167, 243, 208, 0.5); }
            .sci-fi-action-button:disabled { color: rgba(102, 92, 84, 0.5); cursor: not-allowed; }
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

    const { type: currentType, units: currentUnits, anchorRect: currentAnchor } = currentData;
    if (!currentType || !currentAnchor) return null;

    const unitList = currentType === 'villagers' ? currentUnits.villagers : currentUnits.military;
    const titleText = currentType === 'villagers' ? 'Your Villagers' : 'Your Military Forces';

    const panelStyle: React.CSSProperties = {
        top: `${currentAnchor.bottom + 8}px`,
        left: `${currentAnchor.left}px`,
        transformOrigin: 'top left',
        '--panel-opacity': panelOpacity,
    } as React.CSSProperties;

    return (
        <div
            style={panelStyle}
            className={`fixed z-40 w-80 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
             <div className="sci-fi-panel-popup sci-fi-grid p-4">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-serif">{titleText}</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="space-y-2 flex-grow overflow-y-auto max-h-80 pr-2">
                    {unitList.length > 0 ? (
                        unitList.map(unit => (
                            <UnitRow
                                key={unit.id}
                                unit={unit}
                                type={currentType}
                                onUpdate={(id, name, title) => onUpdateUnit(currentType, id, name, title)}
                                onDismiss={(id) => onDismissUnit(currentType, id)}
                                onBuild={onInitiateBuild}
                                canDismiss={currentType !== 'villagers' || currentUnits.villagers.length > 1}
                                taskDetails={currentType === 'villagers' ? getVillagerTaskDetails(unit.id) : 'Idle'}
                            />
                        ))
                    ) : (
                        <p className="text-center text-parchment-dark py-8">You have no {currentType}.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UnitManagementPanel;
