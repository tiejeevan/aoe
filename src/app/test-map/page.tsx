
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect } from 'react-konva';
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
    isMoving: boolean;
}

const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    const [goldMines, setGoldMines] = useState<{ id: string; x: number; y: number }[]>([]);
    const [selectedVillagerIds, setSelectedVillagerIds] = useState<Set<string>>(new Set());
    const [selectionRect, setSelectionRect] = useState<{ x: number, y: number, width: number, height: number, visible: boolean } | null>(null);

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
            initialVillagers.push({ id, x, y, targetX: x, targetY: y, isMoving: false });
        }
        setVillagers(initialVillagers);
        
        // Initialize gold mines
        setGoldMines([{ id: 'gold-mine-1', x: 25 * GRID_SIZE, y: 12 * GRID_SIZE }]);
    }, []);

    const updateVillagersMovingState = useCallback(() => {
        setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                const node = villagerRefs.current[v.id];
                if (!node) return v;
                const isMoving = Math.hypot(v.targetX - node.x(), v.targetY - node.y()) > 5;
                return v.isMoving !== isMoving ? { ...v, isMoving, x: node.x(), y: node.y() } : v;
            })
        );
    }, []);

    useEffect(() => {
        if (!isClient || !layerRef.current) return;
        const layer = layerRef.current;

        const anim = new Konva.Animation(frame => {
            if (!frame) return;
            let aVillagerIsMoving = false;
            
            villagers.forEach(villagerData => {
                const villagerNode = villagerRefs.current[villagerData.id];
                if (!villagerNode) return;

                const targetX = villagerData.targetX;
                const targetY = villagerData.targetY;
                const currentX = villagerNode.x();
                const currentY = villagerNode.y();

                const dx = targetX - currentX;
                const dy = targetY - currentY;
                const distance = Math.hypot(dx, dy);

                if (distance < 5) return;
                
                aVillagerIsMoving = true;
                const moveDistance = UNIT_SPEED * (frame.timeDiff / 1000);
                const ratio = Math.min(1, moveDistance / distance);
                villagerNode.position({ x: currentX + dx * ratio, y: currentY + dy * ratio });
            });
            if (aVillagerIsMoving || villagers.some(v => v.isMoving)) {
                 updateVillagersMovingState();
            }

        }, layer);
        
        anim.start();
        return () => anim.stop();

    }, [isClient, villagers, updateVillagersMovingState]);

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Only start selection on left-click on the stage background
        if (e.evt.button !== 0 || e.target !== stageRef.current) return;

        isSelecting.current = true;
        const pos = stageRef.current.getPointerPosition();
        if (!pos) return;
        setSelectionRect({ x: pos.x, y: pos.y, width: 0, height: 0, visible: true });
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
        const selectionBox = selectionRectRef.current?.getClientRect();
        setSelectionRect(null); // Hide rect immediately

        if (e.evt.button !== 0 || !selectionBox) {
            return;
        }

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
            // This is a click, not a drag. Deselect if clicking on background.
            if (e.target === stageRef.current) {
                setSelectedVillagerIds(new Set());
            }
        }
    };


    const handleUnitClick = (e: Konva.KonvaEventObject<MouseEvent>, villagerId: string) => {
        e.evt.stopPropagation();
        const currentlySelected = new Set(selectedVillagerIds);
        
        if (e.evt.shiftKey) {
            if (currentlySelected.has(villagerId)) {
                currentlySelected.delete(villagerId);
            } else {
                currentlySelected.add(villagerId);
            }
        } else {
            currentlySelected.clear();
            currentlySelected.add(villagerId);
        }
        setSelectedVillagerIds(currentlySelected);
    };

    const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        if (selectedVillagerIds.size === 0) return;

        const pos = stageRef.current?.getPointerPosition();
        if (!pos) return;

        let targetX = pos.x;
        let targetY = pos.y;
        let targetRadius = 15;
        
        // Check if right-clicking on a mine. The name "gold-mine" is set on the Group in AnimatedGoldMine.
        const clickedNode = e.target;
        const mineGroup = clickedNode.getAncestors().find(ancestor => ancestor.id()?.startsWith('gold-mine'));

        if (mineGroup) {
            targetX = mineGroup.x();
            targetY = mineGroup.y();
            targetRadius = 50; // Scatter wider around the mine
        }

        setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                if (selectedVillagerIds.has(v.id)) {
                    // Simple scatter logic
                    const angle = Math.random() * 2 * Math.PI;
                    const radius = Math.sqrt(selectedVillagerIds.size) * targetRadius;
                    return {
                        ...v,
                        targetX: targetX + Math.cos(angle) * radius,
                        targetY: targetY + Math.sin(angle) * radius,
                    };
                }
                return v;
            })
        );
    };

    const renderGrid = () => Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => {
        const x = i % MAP_WIDTH_CELLS;
        const y = Math.floor(i / MAP_WIDTH_CELLS);
        return <Rect key={`${x}-${y}`} x={x*GRID_SIZE} y={y*GRID_SIZE} width={GRID_SIZE} height={GRID_SIZE} fill="#504945" stroke="#665c54" strokeWidth={1} listening={false}/>
    });
    
    if (!isClient) return <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8"><h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1></div>;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">Drag-to-Select Test Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">Drag to select villagers. Right-click to move them or target the mine.</p>
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
                            />
                        ))}

                        {villagers.map(villager => 
                            <AnimatedVillager
                                key={villager.id}
                                ref={node => { if(node) villagerRefs.current[villager.id] = node; }}
                                id={villager.id}
                                x={villager.x}
                                y={villager.y}
                                isMoving={villager.isMoving}
                                isSelected={selectedVillagerIds.has(villager.id)}
                                onClick={(e) => handleUnitClick(e, villager.id)}
                                onTap={(e) => handleUnitClick(e, villager.id)}
                            />
                        )}
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
                    </Layer>
                </Stage>
            </div>
             <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
