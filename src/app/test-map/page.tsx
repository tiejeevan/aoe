
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import AnimatedVillager from '../../../components/AnimatedVillager';
import TownCenter from '../../../components/TownCenter';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 40;
const MAP_HEIGHT_CELLS = 25;
const MAX_HP = 10;
const ATTACK_POWER = 2;
const ATTACK_DISTANCE = 35; // Villagers will stop this far away to attack
const ATTACK_RANGE = 40;    // They can attack from this far away
const ATTACK_COOLDOWN = 1000; // ms
const DEATH_DURATION = 10000; // 10 seconds

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
    task: 'idle' | 'moving' | 'attacking' | 'dead' | 'building' | 'mining';
    isSelected: boolean;
    deathTime?: number;
    showAttackPreview?: boolean;
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

    // State for selection and interaction
    const [selectionBox, setSelectionBox] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
    const [mouseDownPos, setMouseDownPos] = useState<{x: number, y: number} | null>(null);
    const [isHoveringEnemy, setIsHoveringEnemy] = useState(false);
    const [isHoveringClickable, setIsHoveringClickable] = useState(false);

    const stageRef = useRef<Konva.Stage>(null);
    const villagerRefs = useRef<Map<string, Konva.Group>>(new Map());

    // Initial setup on component mount
    useEffect(() => {
        setIsClient(true);
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
                attack: ATTACK_POWER,
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
        
        const gameLoop = () => {
             setVillagers(currentVillagers => {
                const now = Date.now();
                const damageMap = new Map<string, number>();
                let villagersNeedUpdate = false;

                let nextVillagers = currentVillagers.map(v => ({...v})); // Create a mutable copy

                // First pass: determine attacks and build damage map
                for (const villager of nextVillagers) {
                     if (villager.task === 'dead') continue;

                    // If an attacking villager's target moves out of range, re-engage
                    if (villager.task === 'attacking' && villager.targetId) {
                        const target = nextVillagers.find(v => v.id === villager.targetId);
                        if (target && target.task !== 'dead') {
                             const dx = target.x - villager.x;
                             const dy = target.y - villager.y;
                             const distance = Math.sqrt(dx * dx + dy * dy);
                             if (distance > ATTACK_RANGE) {
                                villager.task = 'moving'; // Re-engage
                                const ratio = (distance - ATTACK_DISTANCE) / distance;
                                villager.targetX = villager.x + dx * ratio;
                                villager.targetY = villager.y + dy * ratio;
                                villagersNeedUpdate = true;
                             }
                        }
                    }

                    if (villager.task === 'attacking' && villager.targetId) {
                        const target = nextVillagers.find(v => v.id === villager.targetId);
                        if (target && target.task !== 'dead') {
                            if (now - villager.attackLastTime > ATTACK_COOLDOWN) {
                                const currentDamage = damageMap.get(target.id) || 0;
                                damageMap.set(target.id, currentDamage + villager.attack);
                                villager.attackLastTime = now;
                            }
                        } else {
                            villager.task = 'idle';
                            villager.targetId = null;
                            villagersNeedUpdate = true;
                        }
                    }
                }

                // Second pass: apply damage and check for deaths
                if (damageMap.size > 0) {
                    villagersNeedUpdate = true;
                    for (const villager of nextVillagers) {
                        if (damageMap.has(villager.id)) {
                            const newHp = villager.hp - (damageMap.get(villager.id) || 0);
                            villager.hp = Math.max(0, newHp);
                            if (villager.hp === 0) {
                                villager.task = 'dead';
                                villager.deathTime = now;
                                villager.isSelected = false;
                                villager.targetId = null;
                            }
                        }
                    }
                }
                
                // Third pass: remove vanished villagers
                const vanishedCount = nextVillagers.filter(v => v.task === 'dead' && v.deathTime && now - v.deathTime > DEATH_DURATION).length;
                if (vanishedCount > 0) {
                    nextVillagers = nextVillagers.filter(v => !(v.task === 'dead' && v.deathTime && now - v.deathTime > DEATH_DURATION));
                    villagersNeedUpdate = true;
                }

                return villagersNeedUpdate ? nextVillagers : currentVillagers;
            });
            requestAnimationFrame(gameLoop);
        };

        const animationFrameId = requestAnimationFrame(gameLoop);
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
        const targetVillager = villagers.find(v => v.id === targetId);
        
        setVillagers(currentVillagers =>
            currentVillagers.map(v => {
                if (v.isSelected && v.task !== 'dead' && v.id !== targetId) {
                    if (targetVillager && targetVillager.task !== 'dead') {
                        // Attack command
                        const dx = targetVillager.x - v.x;
                        const dy = targetVillager.y - v.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        let finalTargetX = targetVillager.x;
                        let finalTargetY = targetVillager.y;
                        if (distance > ATTACK_DISTANCE) {
                            const ratio = (distance - ATTACK_DISTANCE) / distance;
                            finalTargetX = v.x + dx * ratio;
                            finalTargetY = v.y + dy * ratio;
                        }
                        return { ...v, task: 'moving', targetX: finalTargetX, targetY: finalTargetY, targetId: targetId };
                    } else {
                         // Move command
                        return { ...v, task: 'moving', targetX: pointerPos.x, targetY: pointerPos.y, targetId: null };
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

        if (dragDistance < 5) {
            const clickedVillagerNode = getVillagerNode(e.target);
            const clickedId = clickedVillagerNode?.id();

            setVillagers(v => v.map(villager => {
                 if (isShiftPressed) {
                     return villager.id === clickedId ? { ...villager, isSelected: !villager.isSelected } : villager;
                 }
                 return { ...villager, isSelected: villager.id === clickedId };
            }));

        } else {
            const x1 = Math.min(selX1, selX2);
            const y1 = Math.min(selY1, selY2);
            const x2 = Math.max(selX1, selX2);
            const y2 = Math.max(selY1, selY2);

            setVillagers(currentVillagers => 
                currentVillagers.map(v => {
                    const node = villagerRefs.current.get(v.id);
                    if (!node) return v;
                    const { x: vx, y: vy } = node.position();
                    const isWithinBox = v.task !== 'dead' && vx > x1 && vx < x2 && vy > y1 && vy < y2;
                    return { ...v, isSelected: isShiftPressed ? (isWithinBox || v.isSelected) : isWithinBox };
                })
            );
        }

        setMouseDownPos(null);
        setSelectionBox({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
    };

    const handleMoveEnd = useCallback((villagerId: string, newPosition: {x: number, y: number}) => {
        setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                if (v.id !== villagerId) return v;
                
                const task = v.targetId ? 'attacking' : 'idle';

                return { ...v, task, x: newPosition.x, y: newPosition.y };
            })
        );
    }, []);

    const handleMouseEnterEnemy = (isEnemy: boolean) => {
        setIsHoveringEnemy(isEnemy);
        const anySelected = villagers.some(v => v.isSelected);
        if (anySelected && isEnemy) {
            setVillagers(v => v.map(vill => vill.isSelected ? {...vill, showAttackPreview: true} : vill));
        }
    };
    
    const handleMouseLeaveEnemy = () => {
        setIsHoveringEnemy(false);
         setVillagers(v => v.map(vill => ({...vill, showAttackPreview: false})));
    };
    
    const handleCreateVillager = useCallback(() => {
        setVillagers(current => {
            const newVillagerId = `villager-${Date.now()}`;
            const spawnX = (MAP_WIDTH_CELLS * GRID_SIZE / 2) + (Math.random() - 0.5) * 50;
            const spawnY = (MAP_HEIGHT_CELLS * GRID_SIZE / 2) + 100;

            const newVillager: Villager = {
                id: newVillagerId,
                x: spawnX,
                y: spawnY,
                targetX: spawnX,
                targetY: spawnY,
                hp: MAX_HP,
                attack: ATTACK_POWER,
                targetId: null,
                attackLastTime: 0,
                task: 'idle',
                isSelected: false,
            };
            return [...current, newVillager];
        });
    }, []);
    
    const handleMouseEnterClickable = (isClickable: boolean) => {
        setIsHoveringClickable(isClickable);
    };

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

    const hasSelection = villagers.some(v => v.isSelected);
    const attackCursorUrl = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23fb4934" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 9.5l-5-5-5 5 5 5 5-5z"/><path d="M9.5 14.5l5 5 5-5-5-5-5 5z"/><path d="M2.5 12l9 9"/><path d="M12.5 2.5l9 9"/></svg>'), auto`;
    let stageCursor = 'default';
    if (isSpacebarPressed) stageCursor = 'grab';
    else if (hasSelection && isHoveringEnemy) stageCursor = attackCursorUrl;
    else if (isHoveringClickable) stageCursor = 'pointer';

    
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
                <p className="text-parchment-dark mb-4 text-sm">Click the Town Center to create villagers. Drag to select. Right-click on ground to move, right-click on another villager to attack.</p>
            </div>
            <div className="flex-grow w-full max-w-6xl aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative">
                 <Stage 
                    ref={stageRef} 
                    width={MAP_WIDTH_CELLS * GRID_SIZE} 
                    height={MAP_HEIGHT_CELLS * GRID_SIZE} 
                    className="mx-auto" 
                    style={{ cursor: stageCursor }}
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

                        <TownCenter 
                            x={MAP_WIDTH_CELLS * GRID_SIZE / 2} 
                            y={MAP_HEIGHT_CELLS * GRID_SIZE / 2} 
                            onClick={handleCreateVillager}
                            onTap={handleCreateVillager}
                            onMouseEnter={() => handleMouseEnterClickable(true)}
                            onMouseLeave={() => handleMouseEnterClickable(false)}
                        />
                        
                        {villagers.map(villager => (
                            <AnimatedVillager
                                ref={(node) => {
                                    if (node) villagerRefs.current.set(villager.id, node);
                                    else villagerRefs.current.delete(villager.id);
                                }}
                                key={villager.id}
                                id={villager.id}
                                name="villager"
                                initialX={villager.x}
                                initialY={villager.y}
                                targetX={villager.targetX}
                                targetY={villager.targetY}
                                hp={villager.hp}
                                maxHp={MAX_HP}
                                task={villager.task}
                                isSelected={villager.isSelected}
                                onMoveEnd={(pos) => handleMoveEnd(villager.id, pos)}
                                deathTime={villager.deathTime}
                                showAttackPreview={villager.showAttackPreview}
                                onMouseEnter={() => {
                                    const anySelected = villagers.some(v => v.isSelected);
                                    if(anySelected && !villager.isSelected) handleMouseEnterEnemy(true);
                                }}
                                onMouseLeave={() => handleMouseEnterEnemy(false)}
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

    