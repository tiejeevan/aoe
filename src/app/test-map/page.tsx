
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Group, Label, Tag, Text } from 'react-konva';
import Konva from 'konva';
import AnimatedVillager from '../../../components/AnimatedVillager';
import AnimatedGoldMine from '../../../components/AnimatedGoldMine';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 40;
const MAP_HEIGHT_CELLS = 25;
const UNIT_SPEED = 100; // pixels per second

interface Villager {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    task: 'idle' | 'moving' | 'mining';
    targetMineId: string | null;
}

interface GoldMineData {
    id: string;
    x: number;
    y: number;
    amount: number;
}

const PickaxeIcon = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => (
    <Group {...props} ref={ref} listening={false} opacity={0.8}>
      <Rect x={-12} y={-12} width={24} height={24} fill="#201c1a" cornerRadius={4} />
      <Group rotation={-45}>
          <Rect x={-2} y={-10} width={4} height={20} fill="#8B4513" />
          <Rect x={-8} y={-12} width={16} height={6} fill="#6c757d" />
      </Group>
    </Group>
));
PickaxeIcon.displayName = 'PickaxeIcon';


const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    const [goldMines, setGoldMines] = useState<GoldMineData[]>([]);
    const [selectedVillagerIds, setSelectedVillagerIds] = useState<Set<string>>(new Set());
    const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number, visible: boolean } | null>(null);
    const [hoveredMineId, setHoveredMineId] =useState<string|null>(null);
    const [tooltipMineId, setTooltipMineId] = useState<string | null>(null);
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });


    const stageRef = useRef<Konva.Stage>(null);
    const villagerRefs = useRef<Record<string, Konva.Group>>({});
    const goldMineRefs = useRef<Record<string, Konva.Group>>({});
    const selectionRectRef = useRef<Konva.Rect>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const isSelecting = useRef(false);

    useEffect(() => {
        setIsClient(true);
        // Initialize villagers
        const initialVillagers: Villager[] = [];
        for (let i = 0; i < 5; i++) {
            const id = `villager-${i}`;
            const x = (Math.floor(Math.random() * 5) + 3) * GRID_SIZE;
            const y = (Math.floor(Math.random() * 5) + 3) * GRID_SIZE;
            initialVillagers.push({ id, x, y, targetX: x, targetY: y, task: 'idle', targetMineId: null });
        }
        setVillagers(initialVillagers);
        
        // Initialize gold mines
        setGoldMines([{ id: 'gold-mine-1', x: 25 * GRID_SIZE, y: 12 * GRID_SIZE, amount: 5000 }]);
    }, []);

    const updateVillagersState = useCallback(() => {
         setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                const node = villagerRefs.current[v.id];
                if (!node) return v;

                const isMoving = Math.hypot(v.targetX - node.x(), v.targetY - node.y()) > 5;
                const newIsMovingState = isMoving && v.task === 'moving';
                
                if(newIsMovingState) {
                    return { ...v, x: node.x(), y: node.y() };
                }
                
                if(!isMoving && v.task === 'moving') {
                    if(v.targetMineId) return { ...v, task: 'mining', x: node.x(), y: node.y() };
                    return { ...v, task: 'idle', x: node.x(), y: node.y() };
                }

                return v;
            })
        );
    }, []);

    useEffect(() => {
        if (!isClient || !layerRef.current) return;
        const layer = layerRef.current;

        const anim = new Konva.Animation(frame => {
            if (!frame) return;
            
            villagers.forEach(villagerData => {
                const villagerNode = villagerRefs.current[villagerData.id];
                if (!villagerNode || villagerData.task !== 'moving') return;

                const targetX = villagerData.targetX;
                const targetY = villagerData.targetY;
                const currentX = villagerNode.x();
                const currentY = villagerNode.y();

                const dx = targetX - currentX;
                const dy = targetY - currentY;
                const distance = Math.hypot(dx, dy);

                if (distance < 5) {
                    villagerNode.x(targetX);
                    villagerNode.y(targetY);
                    return;
                };
                
                const moveDistance = UNIT_SPEED * (frame.timeDiff / 1000);
                const ratio = Math.min(1, moveDistance / distance);
                villagerNode.position({ x: currentX + dx * ratio, y: currentY + dy * ratio });
            });

             const minersPerMine: Record<string, number> = {};
             villagers.forEach(v => {
                 if (v.task === 'mining' && v.targetMineId) {
                     minersPerMine[v.targetMineId] = (minersPerMine[v.targetMineId] || 0) + 1;
                 }
             });

             if (Object.keys(minersPerMine).length > 0) {
                 const MINE_RATE_PER_VILLAGER = 5; // Gold per second per villager
                 setGoldMines(currentMines =>
                     currentMines.map(mine => {
                         const miners = minersPerMine[mine.id] || 0;
                         if (miners === 0 || mine.amount <= 0) return mine;

                         const minedAmount = miners * MINE_RATE_PER_VILLAGER * (frame.timeDiff / 1000);
                         const newAmount = mine.amount - minedAmount;
                         
                         if (newAmount <= 0) {
                             setVillagers(currentVillagers =>
                                 currentVillagers.map(v => v.targetMineId === mine.id ? { ...v, task: 'idle', targetMineId: null } : v)
                             );
                             setTooltipMineId(prevId => prevId === mine.id ? null : prevId);
                         }

                         return { ...mine, amount: Math.max(0, newAmount) };
                     })
                 );
             }


            updateVillagersState();

        }, layer);
        
        anim.start();
        return () => anim.stop();

    }, [isClient, villagers, updateVillagersState]);

    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;

        const scaleBy = 1.05;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        
        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        
        const minScale = 0.5;
        const maxScale = 3.0;
        const clampedScale = Math.max(minScale, Math.min(newScale, maxScale));
        
        if (clampedScale !== oldScale) {
            setStageScale(clampedScale);
            const newPos = {
                x: pointer.x - mousePointTo.x * clampedScale,
                y: pointer.y - mousePointTo.y * clampedScale,
            };
            setStagePos(newPos);
        }
    };

    const handleMineClick = (mineId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
        e.evt.stopPropagation();
        setTooltipMineId(prevId => (prevId === mineId ? null : mineId));
    };

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button !== 0 || e.evt.altKey || e.evt.ctrlKey) return;

        if (e.target === stageRef.current) {
            setTooltipMineId(null);
            isSelecting.current = true;
            const pos = stageRef.current.getPointerPosition();
            if (!pos) return;
            setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
        }
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isSelecting.current) return;
        
        const pos = stageRef.current?.getPointerPosition();
        if (!pos || !selectionRect) return;

        setSelectionRect({
            ...selectionRect,
            width: pos.x - selectionRect.x,
            height: pos.y - selectionRect.y
        });
    };

    const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        isSelecting.current = false;
        if (!selectionRect) return;

        const selectionBox = selectionRectRef.current?.getClientRect();
        setSelectionRect(null);

        if (e.evt.button !== 0 || !selectionBox) return;

        const isDrag = Math.abs(selectionBox.width) > 5 || Math.abs(selectionBox.height) > 5;

        if (isDrag) {
            const newSelectedIds = new Set<string>();
            Object.values(villagerRefs.current).forEach(node => {
                if (node && Konva.Util.haveIntersection(selectionBox, node.getClientRect())) {
                    newSelectedIds.add(node.id());
                }
            });

            if (e.evt.shiftKey) {
                setSelectedVillagerIds(prev => {
                    const combined = new Set(prev);
                    newSelectedIds.forEach(id => combined.add(id));
                    return combined;
                });
            } else {
                setSelectedVillagerIds(newSelectedIds);
            }
        } else {
            if (e.target === stageRef.current) setSelectedVillagerIds(new Set());
        }
    };


    const handleUnitClick = (e: Konva.KonvaEventObject<MouseEvent>, villagerId: string) => {
        e.evt.stopPropagation();
        const currentlySelected = new Set(selectedVillagerIds);
        
        if (e.evt.shiftKey) {
            if (currentlySelected.has(villagerId)) currentlySelected.delete(villagerId);
            else currentlySelected.add(villagerId);
        } else {
            currentlySelected.clear();
            currentlySelected.add(villagerId);
        }
        setSelectedVillagerIds(currentlySelected);
        setTooltipMineId(null);
    };

    const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        if (selectedVillagerIds.size === 0) return;

        const pos = stageRef.current?.getPointerPosition();
        if (!pos) return;

        let targetX = pos.x;
        let targetY = pos.y;
        let targetRadius = 15;
        let targetMineId: string | null = null;
        
        const mineGroup = e.target.getAncestors().find(ancestor => ancestor.id()?.startsWith('gold-mine'));

        if (mineGroup) {
            targetMineId = mineGroup.id();
            const mineData = goldMines.find(m => m.id === targetMineId);
            if (mineData && mineData.amount <= 0) {
                 return;
            }
            targetX = mineGroup.x();
            targetY = mineGroup.y();
            targetRadius = 50; 
        }

        setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                if (selectedVillagerIds.has(v.id)) {
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.random() * targetRadius;
                    return {
                        ...v,
                        targetX: targetX + Math.cos(angle) * radius,
                        targetY: targetY + Math.sin(angle) * radius,
                        task: 'moving',
                        targetMineId,
                    };
                }
                return v;
            })
        );
    };

    const renderGrid = () => Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => {
        const x = i % MAP_WIDTH_CELLS;
        const y = Math.floor(i / MAP_HEIGHT_CELLS);
        return <Rect key={`${x}-${y}`} x={x*GRID_SIZE} y={y*GRID_SIZE} width={GRID_SIZE} height={GRID_SIZE} fill="#504945" stroke="#665c54" strokeWidth={1} listening={false}/>
    });

    const activeTooltipMine = tooltipMineId ? goldMines.find(m => m.id === tooltipMineId) : null;
    
    if (!isClient) return <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8"><h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1></div>;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">Resource Interaction Test Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">Left-click drag to select. Right-click to move. Scroll to zoom. Drag to pan.</p>
            <div className="w-full max-w-5xl aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative">
                 <Stage 
                    ref={stageRef} 
                    width={MAP_WIDTH_CELLS * GRID_SIZE} 
                    height={MAP_HEIGHT_CELLS * GRID_SIZE} 
                    className="mx-auto" 
                    onMouseDown={handleStageMouseDown}
                    onMouseMove={handleStageMouseMove}
                    onMouseUp={handleStageMouseUp}
                    onContextMenu={handleStageContextMenu}
                    onWheel={handleWheel}
                    draggable
                    scaleX={stageScale}
                    scaleY={stageScale}
                    x={stagePos.x}
                    y={stagePos.y}
                >
                    <Layer ref={layerRef}>
                        {renderGrid()}

                        {goldMines.map(mine => (
                            <AnimatedGoldMine
                                key={mine.id}
                                id={mine.id}
                                ref={node => { if(node) goldMineRefs.current[mine.id] = node; }}
                                x={mine.x}
                                y={mine.y}
                                onClick={(e) => handleMineClick(mine.id, e)}
                                onTap={(e) => handleMineClick(mine.id, e as any)}
                                onMouseEnter={() => {if(selectedVillagerIds.size > 0) setHoveredMineId(mine.id)}}
                                onMouseLeave={() => setHoveredMineId(null)}
                            />
                        ))}

                        {villagers.map(villager => {
                             const villagerNode = villagerRefs.current[villager.id];
                             const currentX = villagerNode?.x() || villager.x;
                             const currentY = villagerNode?.y() || villager.y;
                             const isActuallyMoving = Math.hypot(villager.targetX - currentX, villager.targetY - currentY) > 5 && villager.task === 'moving';

                             return (
                                <AnimatedVillager
                                    key={villager.id}
                                    ref={node => { if(node) villagerRefs.current[villager.id] = node; }}
                                    id={villager.id}
                                    x={currentX}
                                    y={currentY}
                                    isMoving={isActuallyMoving}
                                    isMining={villager.task === 'mining'}
                                    isSelected={selectedVillagerIds.has(villager.id)}
                                    onClick={(e) => handleUnitClick(e, villager.id)}
                                    onTap={(e) => handleUnitClick(e, villager.id)}
                                />
                             )
                        })}
                        {selectionRect?.visible &&
                            <Rect
                                ref={selectionRectRef}
                                x={selectionRect.x}
                                y={selectionRect.y}
                                width={selectionRect.width}
                                height={selectionRect.height}
                                fill="rgba(131, 165, 152, 0.3)"
                                stroke="#83a598"
                                strokeWidth={1}
                            />
                        }
                        {hoveredMineId && goldMines.find(m => m.id === hoveredMineId) && (
                            <PickaxeIcon
                                x={goldMines.find(m => m.id === hoveredMineId)!.x}
                                y={goldMines.find(m => m.id === hoveredMineId)!.y - 60}
                            />
                        )}
                         {activeTooltipMine && (
                            <Label x={activeTooltipMine.x} y={activeTooltipMine.y - 90} opacity={0.9} listening={false} >
                                <Tag fill='#201c1a' pointerDirection='down' pointerWidth={10} pointerHeight={10} lineJoin='round' cornerRadius={5} shadowColor='black' shadowBlur={5} shadowOpacity={0.4} />
                                <Text text={`Gold: ${Math.floor(activeTooltipMine.amount)}`} fontFamily='Quattrocento Sans, sans-serif' fontSize={16} padding={8} fill='#fbf1c7' />
                            </Label>
                        )}
                    </Layer>
                </Stage>
            </div>
             <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
