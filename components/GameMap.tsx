





import React, { useState, useEffect, useMemo } from 'react';
import type { Buildings, BuildingType, BuildingInstance, GameTask, BuildingConfig, PlayerActionState, ResourceNode, Units, Villager, ResourceConfig } from '../types';
import { iconMap } from './GameUI';
import ProgressBar from './ProgressBar';
import { VillagerIcon } from './icons/ResourceIcons';
import { buildingIconMap, resourceIconMap } from './icons/iconRegistry';

const ConstructionTooltip: React.FC<{ task: GameTask; buildingInfo: BuildingConfig | undefined; builderCount: number }> = ({ task, buildingInfo, builderCount }) => {
    const [remainingTime, setRemainingTime] = useState(0);

    useEffect(() => {
        const calculateRemaining = () => {
            const endTime = task.startTime + task.duration;
            const remaining = Math.max(0, endTime - Date.now());
            setRemainingTime(Math.ceil(remaining / 1000));
        };

        calculateRemaining();
        const interval = setInterval(calculateRemaining, 1000);

        return () => clearInterval(interval);
    }, [task]);

    if (!buildingInfo) return null;

    return (
        <div className="bg-stone-dark text-white text-xs rounded py-1 px-2 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
            <p>Constructing: {buildingInfo.name}</p>
            <p>Builders: {builderCount}</p>
            <p>Time remaining: {remainingTime}s</p>
        </div>
    );
};

const ResourceNodeTooltip: React.FC<{ node: ResourceNode; gatherInfo: Record<string, { rate: number }>; villagerCount: number }> = ({ node, gatherInfo, villagerCount }) => {
    const gatherRate = villagerCount > 0 ? villagerCount * (gatherInfo[node.type]?.rate || 0) * (node.richness || 1) : 0;
    
    return (
        <div className="bg-stone-dark text-white text-xs rounded py-1 px-2 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
            <p className="capitalize font-bold">{node.type} {node.richness && `(Rich)`}</p>
            <p>Amount: {Math.floor(node.amount)}</p>
            {villagerCount > 0 && (
                <>
                    <hr className="border-stone-light/20 my-1" />
                    <p>Workers: {villagerCount}</p>
                    <p>Rate: {gatherRate.toFixed(1)}/s</p>
                </>
            )}
        </div>
    );
};


interface GameMapProps {
    buildings: Buildings;
    activeTasks: GameTask[];
    playerAction: PlayerActionState;
    onConfirmPlacement: (position: { x: number; y: number; }) => void;
    onCancelPlayerAction: () => void;
    onBuildingClick: (building: BuildingInstance, rect: DOMRect) => void;
    mapDimensions: { width: number; height: number; };
    buildingList: BuildingConfig[];
    resourceNodes: ResourceNode[];
    units: Units;
    onOpenAssignmentPanel: (nodeId: string, rect: DOMRect) => void;
    onOpenConstructionPanel: (constructionId: string, rect: DOMRect) => void;
    gatherInfo: Record<string, { rate: number }>;
    resourceList: ResourceConfig[];
}

const GameMap: React.FC<GameMapProps> = ({ buildings, activeTasks, playerAction, onConfirmPlacement, onCancelPlayerAction, onBuildingClick, mapDimensions, buildingList, resourceNodes, units, onOpenAssignmentPanel, onOpenConstructionPanel, gatherInfo, resourceList }) => {
    const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; } | null>(null);

    const constructionTasks = useMemo(() => activeTasks.filter(t => t.type === 'build'), [activeTasks]);
    const upgradeTasks = useMemo(() => activeTasks.filter(t => t.type === 'upgrade_building'), [activeTasks]);

    const occupiedCells = useMemo(() => {
        const cellSet = new Set<string>();
        Object.values(buildings).flat().forEach(building => {
            cellSet.add(`${building.position.x},${building.position.y}`);
        });
        constructionTasks.forEach(task => {
            if(task.payload?.position) {
                cellSet.add(`${task.payload.position.x},${task.payload.position.y}`);
            }
        });
        resourceNodes.forEach(node => {
            cellSet.add(`${node.position.x},${node.position.y}`);
        });
        return cellSet;
    }, [buildings, constructionTasks, resourceNodes]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancelPlayerAction();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancelPlayerAction]);

    const handleCellClick = (x: number, y: number) => {
        if (playerAction?.mode === 'build') {
            if (!occupiedCells.has(`${x},${y}`)) {
                onConfirmPlacement({ x, y });
            }
        }
    };
    
    const getBuildingAt = (x: number, y: number): BuildingInstance | undefined => {
        for (const buildingType in buildings) {
            const found = buildings[buildingType as string].find(b => b.position.x === x && b.position.y === y);
            if (found) return found;
        }
        return undefined;
    };

    const getConstructionAt = (x: number, y: number): GameTask | undefined => {
        return constructionTasks.find(t => t.payload?.position?.x === x && t.payload?.position?.y === y);
    }
    
    const getResourceNodeAt = (x: number, y: number): ResourceNode | undefined => {
        return resourceNodes.find(n => n.position.x === x && n.position.y === y);
    }

    return (
        <div
            className={`bg-black/30 p-2 rounded-lg grid gap-0.5`}
            style={{ 
                gridTemplateColumns: `repeat(${mapDimensions.width}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${mapDimensions.height}, minmax(0, 1fr))`,
                cursor: playerAction?.mode === 'build' ? 'copy' : 'default'
            }}
            onMouseLeave={() => setHoveredCell(null)}
            onContextMenu={(e) => { e.preventDefault(); onCancelPlayerAction(); }}
        >
            {Array.from({ length: mapDimensions.width * mapDimensions.height }).map((_, index) => {
                const x = index % mapDimensions.width;
                const y = Math.floor(index / mapDimensions.width);
                const building = getBuildingAt(x, y);
                const constructionTask = getConstructionAt(x, y);
                const resourceNode = getResourceNodeAt(x, y);
                const isOccupied = !!building || !!constructionTask || !!resourceNode;
                const upgradeTask = building ? upgradeTasks.find(t => t.payload?.originalBuildingId === building.id) : undefined;
                
                const gatherTask = resourceNode ? activeTasks.find(t => t.id === `gather-${resourceNode.id}`) : undefined;
                const assignedVillagerCount = resourceNode ? units.villagers.filter(v => v.currentTask === `gather-${resourceNode.id}`).length : 0;
                const buildingInfo = constructionTask ? buildingList.find(b => b.id === constructionTask.payload?.buildingType) : undefined;

                let cellClass = "bg-stone-dark/20 hover:bg-stone-light/10 transition-colors duration-150";
                if((resourceNode || constructionTask) && !playerAction) {
                    cellClass += " cursor-pointer hover:bg-brand-blue/20";
                }
                
                if (playerAction?.mode === 'build') {
                    const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
                    if (isOccupied) {
                        cellClass = "bg-brand-red/40";
                    } else {
                        cellClass = "bg-brand-green/20 hover:bg-brand-green/40";
                        if(isHovered) {
                           cellClass = "bg-brand-green/40";
                        }
                    }
                }

                return (
                    <div
                        key={`${x}-${y}`}
                        className={`relative group w-full aspect-square ${cellClass}`}
                        onMouseEnter={() => setHoveredCell({ x, y })}
                        onClick={(e) => {
                            if (playerAction) {
                                handleCellClick(x, y);
                                return;
                            }
                            if (resourceNode) {
                                onOpenAssignmentPanel(resourceNode.id, e.currentTarget.getBoundingClientRect());
                            } else if (constructionTask) {
                                onOpenConstructionPanel(constructionTask.id, e.currentTarget.getBoundingClientRect());
                            } else if (building) {
                                onBuildingClick(building, e.currentTarget.getBoundingClientRect());
                            }
                        }}
                    >
                        {building && (
                             <div className="absolute inset-0 p-1 text-parchment-light cursor-pointer">
                                {React.createElement(buildingIconMap[buildingList.find(b => b.id === (Object.keys(buildings).find(key => buildings[key as string].some(b => b.id === building.id))))?.iconId || 'default'] || buildingIconMap.default)}
                                <div className="bg-stone-dark text-white text-xs rounded py-1 px-2 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                    {building.name}
                                    {upgradeTask && ' (Upgrading...)'}
                                </div>
                                {upgradeTask && (
                                    <div className="absolute bottom-1 w-10/12 left-1/2 -translate-x-1/2 h-1.5">
                                        <ProgressBar startTime={upgradeTask.startTime} duration={upgradeTask.duration} />
                                    </div>
                                )}
                             </div>
                        )}
                        {constructionTask && buildingInfo && (
                            <div className="absolute inset-0 p-1 text-parchment-light opacity-60 flex flex-col justify-center items-center gap-1 group">
                                {React.createElement(buildingIconMap[buildingInfo.iconId] || buildingIconMap.default)}
                                <ProgressBar startTime={constructionTask.startTime} duration={constructionTask.duration} className="w-10/12 h-1.5"/>
                                {buildingInfo && <ConstructionTooltip task={constructionTask} buildingInfo={buildingInfo} builderCount={constructionTask.payload.villagerIds?.length || 0} />}
                                {(constructionTask.payload.villagerIds?.length || 0) > 0 && (
                                    <div className="absolute top-0.5 right-0.5 flex items-center bg-stone-dark/80 rounded-full px-1.5 py-0.5 text-xs text-brand-blue z-10">
                                        <div className="w-3 h-3"><VillagerIcon /></div>
                                        <span className="ml-1 font-bold">{constructionTask.payload.villagerIds?.length}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {resourceNode && (
                            <div className="absolute inset-0 p-1.5 text-parchment-light/80 flex flex-col items-center justify-center group">
                                {(() => {
                                    const resourceConfig = resourceList.find(r => r.id === resourceNode.type);
                                    const IconComponent = resourceIconMap[resourceConfig?.iconId || 'default'] || resourceIconMap.default;
                                    return <IconComponent />;
                                })()}
                                <ResourceNodeTooltip node={resourceNode} gatherInfo={gatherInfo} villagerCount={assignedVillagerCount} />
                                {gatherTask && (
                                    <div className="absolute bottom-0.5 w-10/12 h-1.5">
                                        <ProgressBar startTime={gatherTask.startTime} duration={gatherTask.duration}/>
                                    </div>
                                )}
                                {assignedVillagerCount > 0 && (
                                    <div className="absolute top-0.5 right-0.5 flex items-center bg-stone-dark/80 rounded-full px-1.5 py-0.5 text-xs text-brand-blue z-10">
                                        <div className="w-3 h-3"><VillagerIcon /></div>
                                        <span className="ml-1 font-bold">{assignedVillagerCount}</span>
                                    </div>
                                )}
                            </div>
                        )}
                        {playerAction?.mode === 'build' && hoveredCell?.x === x && hoveredCell?.y === y && !isOccupied && (
                            <div className="absolute inset-0 p-1 text-parchment-light opacity-50">
                               {React.createElement(buildingIconMap[buildingList.find(b => b.id === playerAction.buildingType)!.iconId] || buildingIconMap.default)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GameMap;
