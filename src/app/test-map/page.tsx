
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import AnimatedVillager from '../../../components/AnimatedVillager';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 40;
const MAP_HEIGHT_CELLS = 25;
const MAX_HP = 10;

interface Villager {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    hp: number;
    attack: number;
    targetId: string | null;
    attackLastTime: number;
    task: 'idle' | 'moving' | 'attacking' | 'dead';
    isSelected: boolean;
}

const getVillagerNode = (node: Konva.Node | null): Konva.Group | null => {
    if (!node) return null;
    if (node.name() === 'villager' && node instanceof Konva.Group) {
        return node;
    }
    if (node.getParent()) {
        return getVillagerNode(node.getParent());
    }
    return null;
};


const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    
    // State for panning and zooming
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);

    // State for selection
    const [selectionBox, setSelectionBox] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
    const [mouseDownPos, setMouseDownPos] = useState<{x: number, y: number} | null>(null);

    const stageRef = useRef<Konva.Stage>(null);

    // Initial setup on component mount
    useEffect(() => {
        setIsClient(true);
        // Create multiple villagers
        const initialVillagers: Villager[] = Array.from({ length: 5 }).map((_, i) => {
            const x = (10 + i * 4) * GRID_SIZE;
            const y = (10 + (i%2) * 4) * GRID_SIZE;
            return {
                id: `villager-${i + 1}`,
                x: x,
                y: y,
                targetX: x,
                targetY: y,
                hp: MAX_HP,
                attack: 2,
                targetId: null,
                attackLastTime: 0,
                task: 'idle',
                isSelected: false,
            };
        });
        setVillagers(initialVillagers);
    }, []);

    // Game Loop for Combat and State Updates
    useEffect(() => {
        if (!isClient) return;
        
        let animationFrameId: number;

        const gameLoop = () => {
            setVillagers(currentVillagers => {
                let villagersToUpdate = JSON.parse(JSON.stringify(currentVillagers)) as Villager[];
                const now = Date.now();

                const damageMap = new Map<string, number>();

                villagersToUpdate.forEach((villager: Villager) => {
                    if (villager.task === 'moving' && villager.targetId) {
                        const target = villagersToUpdate.find((v: Villager) => v.id === villager.targetId);
                        if (target && target.task !== 'dead') {
                            const dx = target.x - villager.x;
                            const dy = target.y - villager.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);
                            const ATTACK_RANGE = 40; // pixels

                            if (distance <= ATTACK_RANGE) {
                                villager.task = 'attacking';
                            }
                        } else {
                            villager.task = 'idle';
                            villager.targetId = null;
                        }
                    }

                    if (villager.task === 'attacking' && villager.targetId) {
                        const target = villagersToUpdate.find((v: Villager) => v.id === villager.targetId);
                        if (target && target.task !== 'dead') {
                            const ATTACK_COOLDOWN = 1000; // 1 second
                            if (now - villager.attackLastTime > ATTACK_COOLDOWN) {
                                const currentDamage = damageMap.get(target.id) || 0;
                                damageMap.set(target.id, currentDamage + villager.attack);
                                villager.attackLastTime = now;
                            }
                        } else {
                            villager.task = 'idle';
                            villager.targetId = null;
                        }
                    }
                });

                if (damageMap.size > 0) {
                    villagersToUpdate = villagersToUpdate.map((v: Villager) => {
                        if (damageMap.has(v.id)) {
                            const newHp = v.hp - (damageMap.get(v.id) || 0);
                            if (newHp <= 0) {
                                return { ...v, hp: 0, task: 'dead' as const, isSelected: false, targetId: null };
                            }
                            return { ...v, hp: newHp };
                        }
                        return v;
                    });
                }
                return villagersToUpdate;
            });
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isClient]);


    // Add keyboard listeners for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); setIsSpacebarPressed(true); }};
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacebarPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    // Helper function to get the correct pointer position on the stage
    const getStagePointerPosition = (): { x: number; y: number } | null => {
        const stage = stageRef.current;
        if (!stage) return null;
        const pointer = stage.getPointerPosition();
        if (!pointer) return null;

        // Apply inverse transform to get the correct world coordinates
        return {
            x: (pointer.x - stage.x()) / stage.scaleX(),
            y: (pointer.y - stage.y()) / stage.scaleY(),
        };
    };

    // Handle stage zoom
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault();
        const stage = e.target.getStage();
        if (!stage) return;
        const scaleBy = 1.05;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const clampedScale = Math.max(0.5, Math.min(newScale, 3.0));
        if (clampedScale !== oldScale) {
            setStageScale(clampedScale);
            setStagePos({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
        }
    };
    
    const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        const pointerPos = getStagePointerPosition();
        if (!pointerPos) return;

        const targetVillagerNode = getVillagerNode(e.target);
        const targetId = targetVillagerNode ? targetVillagerNode.id() : null;
        
        setVillagers(currentVillagers =>
            currentVillagers.map(v => {
                if (v.isSelected && v.task !== 'dead' && v.id !== targetId) {
                    if (targetId) {
                        const targetVillager = currentVillagers.find(tv => tv.id === targetId);
                        if (targetVillager && targetVillager.task !== 'dead') {
                            return { 
                                ...v, 
                                task: 'moving',
                                targetX: targetVillager.x, 
                                targetY: targetVillager.y,
                                targetId: targetId,
                            };
                        }
                    } else {
                        return { 
                            ...v, 
                            task: 'moving',
                            targetX: pointerPos.x, 
                            targetY: pointerPos.y,
                            targetId: null,
                        };
                    }
                }
                return v;
            })
        );
    };

    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button !== 0 || isSpacebarPressed) return;
        
        const pos = getStagePointerPosition();
        if (!pos) return;

        setMouseDownPos(pos);
        setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, visible: true });
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!mouseDownPos) return;
        
        const pos = getStagePointerPosition();
        if (!pos) return;
        setSelectionBox(prev => ({ ...prev, x2: pos.x, y2: pos.y }));
    };

    const handleMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button !== 0 || !mouseDownPos) return;

        const { x1: selX1, y1: selY1, x2: selX2, y2: selY2 } = selectionBox;
        const dragDistance = Math.sqrt(Math.pow(selX2 - selX1, 2) + Math.pow(selY2 - selY1, 2));

        const isShiftPressed = e.evt.shiftKey;

        // Handle Click (short drag)
        if (dragDistance < 5) {
            const clickedVillagerNode = getVillagerNode(e.target);
            const clickedId = clickedVillagerNode?.id();

            setVillagers(v => v.map(villager => {
                 if (isShiftPressed) {
                     return villager.id === clickedId ? { ...villager, isSelected: !villager.isSelected } : villager;
                 }
                 return { ...villager, isSelected: villager.id === clickedId };
            }));

        } else { // Handle Drag
            const x1 = Math.min(selX1, selX2);
            const y1 = Math.min(selY1, selY2);
            const x2 = Math.max(selX1, selX2);
            const y2 = Math.max(selY1, selY2);

            setVillagers(currentVillagers => 
                currentVillagers.map(v => {
                    const isWithinBox = v.task !== 'dead' && v.x > x1 && v.x < x2 && v.y > y1 && v.y < y2;
                    return { ...v, isSelected: isShiftPressed ? (isWithinBox || v.isSelected) : isWithinBox };
                })
            );
        }

        setMouseDownPos(null);
        setSelectionBox({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
    };

    const handleVillagerMoveEnd = (villagerId: string) => {
        setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                if (v.id === villagerId) {
                    return { ...v, task: 'idle', x: v.targetX, y: v.targetY };
                }
                return v;
            })
        );
    };

    // Render the background grid
    const renderGrid = () => {
        return Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => (
            <Rect 
                key={i} 
                x={(i % MAP_WIDTH_CELLS) * GRID_SIZE} 
                y={Math.floor(i / MAP_WIDTH_CELLS) * GRID_SIZE} 
                width={GRID_SIZE} 
                height={GRID_SIZE} 
                fill="#504945" 
                stroke="#665c54" 
                strokeWidth={1} 
                listening={false}
            />
        ));
    };
    
    if (!isClient) {
        return (
            <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
                <h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl mb-4">
                <h1 className="text-3xl font-serif text-brand-gold">Animation Test Map</h1>
                <p className="text-parchment-dark mb-4 text-sm">Drag to select. Right-click on ground to move, right-click on another villager to attack.</p>
            </div>
            <div className={`flex-grow w-full max-w-6xl aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative ${isSpacebarPressed ? 'cursor-grab' : 'cursor-default'}`}>
                 <Stage 
                    ref={stageRef} 
                    width={MAP_WIDTH_CELLS * GRID_SIZE} 
                    height={MAP_HEIGHT_CELLS * GRID_SIZE} 
                    className="mx-auto" 
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onContextMenu={handleStageContextMenu}
                    draggable={isSpacebarPressed} 
                    scaleX={stageScale} 
                    scaleY={stageScale} 
                    x={stagePos.x} 
                    y={stagePos.y}
                    onDragEnd={(e) => setStagePos(e.target.position())}
                >
                    <Layer>
                        {renderGrid()}
                        
                        {villagers.map(villager => (
                            <AnimatedVillager
                                key={villager.id}
                                id={villager.id}
                                x={villager.x}
                                y={villager.y}
                                targetX={villager.targetX}
                                targetY={villager.targetY}
                                hp={villager.hp}
                                maxHp={MAX_HP}
                                task={villager.task}
                                isSelected={villager.isSelected}
                                onMoveEnd={() => handleVillagerMoveEnd(villager.id)}
                            />
                        ))}

                         <Rect
                            x={Math.min(selectionBox.x1, selectionBox.x2)}
                            y={Math.min(selectionBox.y1, selectionBox.y2)}
                            width={Math.abs(selectionBox.x1 - selectionBox.x2)}
                            height={Math.abs(selectionBox.y1 - selectionBox.y2)}
                            fill="rgba(131, 165, 152, 0.3)"
                            stroke="#83a598"
                            strokeWidth={1 / stageScale}
                            visible={selectionBox.visible}
                            listening={false}
                        />
                    </Layer>
                </Stage>
            </div>
            <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
