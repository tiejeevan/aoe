
import React, { useState, useEffect } from 'react';
import type { GameItem, ItemRarity, ActiveBuffs, GameTask } from '../types';
import { Package as PackageIcon, Info } from 'lucide-react';

interface InventoryPanelProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: GameItem[];
    onUseItem: (itemId: string) => void;
    activeTasks: GameTask[];
    activeBuffs: ActiveBuffs;
    anchorRect: DOMRect | null;
}

const rarityStyles: Record<ItemRarity, { color: string, shadow: string }> = {
    'Common': { color: '#c9d1d9', shadow: 'none' },
    'Epic': { color: '#b197fc', shadow: '0 0 8px rgba(177, 151, 252, 0.6)' },
    'Legendary': { color: '#f7b731', shadow: '0 0 10px rgba(247, 183, 49, 0.7)' },
    'Spiritual': { color: '#68d391', shadow: '0 0 12px rgba(104, 211, 145, 0.8)' },
};

const ItemRow: React.FC<{ 
    item: GameItem; 
    isUsable: boolean; 
    tooltip: string; 
    onUse: () => void; 
}> = ({ item, isUsable, tooltip, onUse }) => {
    const rarityStyle = rarityStyles[item.rarity];

    return (
        <div className="sci-fi-unit-row flex items-start gap-3">
            <div className="w-8 h-8 flex-shrink-0 mt-1">
                <PackageIcon style={{ color: rarityStyle.color, filter: `drop-shadow(${rarityStyle.shadow})` }}/>
            </div>
            <div className="flex-grow">
                <h4 className="font-bold" style={{ color: rarityStyle.color, textShadow: rarityStyle.shadow }}>{item.name}</h4>
                <p className="text-xs text-parchment-dark italic">[{item.rarity}]</p>
                <p className="text-sm mt-1">{item.description}</p>
            </div>
            <div className="relative group self-center flex-shrink-0">
                <button
                    onClick={onUse}
                    disabled={!isUsable}
                    className="sci-fi-button !px-4 !py-1 !text-sm"
                >
                    Use
                </button>
                 <div className="absolute bottom-full right-0 mb-2 w-max max-w-xs px-2 py-1 bg-stone-dark text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {tooltip}
                </div>
            </div>
        </div>
    );
};

const InventoryPanel: React.FC<InventoryPanelProps> = ({ isOpen, onClose, inventory, onUseItem, activeTasks, activeBuffs, anchorRect }) => {
    const [isClosing, setIsClosing] = useState(false);
    const [currentData, setCurrentData] = useState({ anchorRect, inventory });

    useEffect(() => {
        if (isOpen || isClosing) {
            setCurrentData({ anchorRect, inventory });
        }
    }, [anchorRect, inventory, isOpen, isClosing]);

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

    const getUsability = (item: GameItem): { isUsable: boolean; tooltip: string } => {
        const hasConstruction = activeTasks.some(t => t.type === 'build');
        switch(item.id.split('-')[0]) {
            case 'scroll_of_haste':
            case 'blueprint_of_the_master':
            case 'shard_of_the_ancients':
                return hasConstruction 
                    ? { isUsable: true, tooltip: `Use ${item.name}` }
                    : { isUsable: false, tooltip: "No active construction project." };
            case 'whisper_of_the_creator':
                 return activeTasks.length > 0
                    ? { isUsable: true, tooltip: `Use ${item.name}` }
                    : { isUsable: false, tooltip: "No active tasks to complete." };
            case 'builders_charm':
                return !activeBuffs.buildTimeReduction
                    ? { isUsable: true, tooltip: `Use ${item.name}` }
                    : { isUsable: false, tooltip: "A building charm is already active." };
            case 'drillmasters_whistle':
                return !activeBuffs.trainTimeReduction
                    ? { isUsable: true, tooltip: `Use ${item.name}` }
                    : { isUsable: false, tooltip: "A training buff is already active." };
            case 'hearty_meal':
            case 'golden_harvest':
            case 'heart_of_the_mountain':
            case 'banner_of_command':
                return { isUsable: true, tooltip: `Use ${item.name}` };
            default:
                return { isUsable: false, tooltip: "This item cannot be used." };
        }
    };
    
    const panelWidth = 448; // w-112
    const panelGap = 8;
    const panelStyle: React.CSSProperties = {
        transformOrigin: 'bottom center',
        maxHeight: `${window.innerHeight - 2 * panelGap}px`
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
    
    const rarities: ItemRarity[] = ['Spiritual', 'Legendary', 'Epic', 'Common'];
    const groupedInventory = rarities.map(rarity => ({
        rarity,
        items: inventory.filter(item => item.rarity === rarity)
    })).filter(group => group.items.length > 0);


    return (
        <div
            style={panelStyle}
            className={`fixed z-40 w-112 transform transition-all duration-300 ease-in-out ${isOpen && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
             <div className="sci-fi-panel-popup sci-fi-grid p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-2xl font-serif">Inventory</h2>
                    <button onClick={handleClose} className="text-3xl font-bold sci-fi-close-button">&times;</button>
                </div>

                <div className="space-y-4 flex-grow overflow-y-auto pr-2">
                    {inventory.length > 0 ? (
                        groupedInventory.map(group => (
                             <div key={group.rarity}>
                                <h3 className="font-serif text-lg mb-2" style={{color: rarityStyles[group.rarity].color}}>
                                    {group.rarity} Items
                                </h3>
                                <div className="space-y-2">
                                    {group.items.map(item => {
                                        const { isUsable, tooltip } = getUsability(item);
                                        return (
                                            <ItemRow 
                                                key={item.id} 
                                                item={item} 
                                                isUsable={isUsable}
                                                tooltip={tooltip}
                                                onUse={() => onUseItem(item.id)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-parchment-dark py-12 flex flex-col items-center">
                            <Info className="w-10 h-10 text-brand-blue mb-4" />
                            <p>Your inventory is empty.</p>
                            <p className="text-sm mt-1">Valuable items from events will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default InventoryPanel;
