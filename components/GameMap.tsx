
import React, { useState, useEffect, useMemo } from 'react';
import type { Buildings, BuildingType, BuildingInstance, ConstructingBuilding, GameTask, BuildingInfo, PlayerActionState, ResourceNode, ResourceNodeType } from '../types';
import { iconMap } from './GameUI';
import ProgressBar from './ProgressBar';

const ConstructionTooltip: React.FC<{ task: GameTask; buildingInfo: BuildingInfo | undefined; builderCount: number }> = ({ task, buildingInfo, builderCount }) => {
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

const ResourceNodeTooltip: React.FC<{ node: ResourceNode; gatherInfo: Record<ResourceNodeType, { rate: number }> }> = ({ node, gatherInfo }) => {
    const gatherRate = node.assignedVillagers.length > 0 ? node.assignedVillagers.length * gatherInfo[node.type].rate : 0;
    
    return (
        <div className="bg-stone-dark text-white text-xs rounded py-1 px-2 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
            <p className="capitalize font-bold">{node.type}</p>
            <p>Amount: {Math.floor(node.amount)}</p>
            {node.assignedVillagers.length > 0 && (
                <>
                    <hr className="border-stone-light/20 my-1" />
                    <p>Workers: {node.assignedVillagers.length}</p>
                    <p>Rate: {gatherRate.toFixed(1)}/s</p>
                </>
            )}
        </div>
    );
};


interface GameMapProps {
    buildings: Buildings;
    constructingBuildings: ConstructingBuilding[];
    activeTasks: GameTask[];
    playerAction: PlayerActionState;
    onConfirmPlacement: (position: { x: number; y: number; }) => void;
    onCancelPlayerAction: () => void;
    onBuildingClick: (building: BuildingInstance, rect: DOMRect) => void;
    mapDimensions: { width: number; height: number; };
    buildingList: BuildingInfo[];
    resourceNodes: ResourceNode[];
    onOpenAssignmentPanel: (nodeId: string, rect: DOMRect) => void;
    onOpenConstructionPanel: (constructionId: string, rect: DOMRect) => void;
    gatherInfo: Record<ResourceNodeType, { rate: number }>;
}

const GameMap: React.FC<GameMapProps> = ({ buildings, constructingBuildings, activeTasks, playerAction, onConfirmPlacement, onCancelPlayerAction, onBuildingClick, mapDimensions, buildingList, resourceNodes, onOpenAssignmentPanel, onOpenConstructionPanel, gatherInfo }) => {
    const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; } | null>(null);

    const occupiedCells = useMemo(() => {
        const cellSet = new Set<string>();
        Object.values(buildings).flat().forEach(building => {
            cellSet.add(`${building.position.x},${building.position.y}`);
        });
        constructingBuildings.forEach(building => {
            cellSet.add(`${building.position.x},${building.position.y}`);
        });
        resourceNodes.forEach(node => {
            cellSet.add(`${node.position.x},${node.position.y}`);
        });
        return cellSet;
    }, [buildings, constructingBuildings, resourceNodes]);

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
            const found = buildings[buildingType as BuildingType].find(b => b.position.x === x && b.position.y === y);
            if (found) return found;
        }
        return undefined;
    };

    const getConstructionAt = (x: number, y: number): ConstructingBuilding | undefined => {
        return constructingBuildings.find(b => b.position.x === x && b.position.y === y);
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
                const construction = getConstructionAt(x, y);
                const resourceNode = getResourceNodeAt(x, y);
                const isOccupied = !!building || !!construction || !!resourceNode;
                const buildTask = construction ? activeTasks.find(t => t.id === construction.id) : undefined;
                const gatherTask = resourceNode ? activeTasks.find(t => t.id === resourceNode.id) : undefined;
                const buildingInfo = construction ? buildingList.find(b => b.id === construction.type) : undefined;

                let cellClass = "bg-stone-dark/20 hover:bg-stone-light/10 transition-colors duration-150";
                if((resourceNode || construction) && !playerAction) {
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
                            } else if (construction) {
                                onOpenConstructionPanel(construction.id, e.currentTarget.getBoundingClientRect());
                            } else if (building) {
                                onBuildingClick(building, e.currentTarget.getBoundingClientRect());
                            }
                        }}
                    >
                        {building && (
                             <div className="absolute inset-0 p-1 text-parchment-light cursor-pointer">
                                {iconMap[Object.keys(buildings).find(key => buildings[key as BuildingType].some(b => b.id === building.id)) as BuildingType]}
                                <div className="bg-stone-dark text-white text-xs rounded py-1 px-2 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                    {building.name}
                                </div>
                             </div>
                        )}
                        {construction && (
                            <div className="absolute inset-0 p-1 text-parchment-light opacity-60 flex flex-col justify-center items-center gap-1 group">
                                {iconMap[construction.type]}
                                {buildTask && <ProgressBar startTime={buildTask.startTime} duration={buildTask.duration} className="w-10/12 h-1.5"/>}
                                {buildTask && buildingInfo && <ConstructionTooltip task={buildTask} buildingInfo={buildingInfo} builderCount={construction.villagerIds.length} />}
                            </div>
                        )}
                        {resourceNode && (
                            <div className="absolute inset-0 p-1.5 text-parchment-light/80 flex flex-col items-center justify-center group">
                                {iconMap[resourceNode.type]}
                                <ResourceNodeTooltip node={resourceNode} gatherInfo={gatherInfo} />
                                {gatherTask && (
                                    <div className="absolute bottom-0.5 w-10/12 h-1.5">
                                        <ProgressBar startTime={gatherTask.startTime} duration={gatherTask.duration}/>
                                    </div>
                                )}
                            </div>
                        )}
                        {playerAction?.mode === 'build' && hoveredCell?.x === x && hoveredCell?.y === y && !isOccupied && (
                            <div className="absolute inset-0 p-1 text-parchment-light opacity-50">
                               {iconMap[playerAction.buildingType]}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default GameMap;
