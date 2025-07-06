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
    <div className="relative group">
        <button
            onClick={onClick}
            disabled={disabled}
            className="sci-fi-action-button"
        >
            <div className="w-5 h-5">{children}</div>
        </button>
        <div className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
            {title}
        </div>
    </div>
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
                <div className="flex gap-1 self-end sm:self-center">
                    <button onClick={handleSave} title="Save" className="bg-brand-green/80 hover:bg-brand-green text-white px-2 py-0.5 text-xs rounded-md">✓</button>
                    <button onClick={handleCancel} title="Cancel" className="bg-stone-light/80 hover:bg-stone-light text-white px-2 py-0.5 text-xs rounded-md">×</button>
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
                    <ActionButton onClick={(e) => onBuild(unit.id, e.currentTarget.getBoundingClientRect())} title={isBusy ? taskDetails : 'Construct Building'} disabled={isBusy}>
                        <BuildIcon />
                    </ActionButton>
                )}
                <ActionButton 
                    onClick={() => onDismiss(unit.id)} 
                    disabled={!canDismiss || isBusy} 
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
        if (isOpen || isClosing) {
            setCurrentData({ type, units, anchorRect });
        }
    }, [type, units, anchorRect, isOpen, isClosing]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false); 
        }, 300); 
    };

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
        maxHeight: `calc(100vh - ${currentAnchor.bottom + 24}px)`,
    } as React.CSSProperties;

    return (
        <div
            style={panelStyle}
            className={`fixed z-40 w-80 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
             <div className="sci-fi-panel-popup sci-fi-grid p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-serif">{titleText}</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="space-y-2 flex-grow overflow-y-auto pr-2">
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
