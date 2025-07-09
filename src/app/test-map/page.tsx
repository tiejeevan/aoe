
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import Konva from 'konva';
import AnimatedVillager from '../../../components/AnimatedVillager';
import TownCenter from '../../../components/TownCenter';
import AnimatedGoldMine from '../../../components/AnimatedGoldMine';
import Hut from '../../../components/test/Hut';
import Barracks from '../../../components/test/Barracks';
import Castle from '../../../components/test/Castle';
import Workshop from '../../../components/test/Workshop';
import ResearchLab from '../../../components/test/ResearchLab';


const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 40;
const MAP_HEIGHT_CELLS = 25;
const MAX_HP = 10;
const ATTACK_POWER = 2;
const ATTACK_DISTANCE = 35; // Villagers will stop this far away to attack
const ATTACK_RANGE = 40;    // They can attack from this far away
const ATTACK_COOLDOWN = 1000; // ms
const DEATH_DURATION = 10000; // 10 seconds
const BUILD_TIME = 10000; // 10 seconds in ms

type BuildingType = 'hut' | 'barracks' | 'castle' | 'workshop' | 'researchLab';

const buildingTypes: {id: BuildingType, name: string}[] = [
    { id: 'hut', name: 'Hut' },
    { id: 'barracks', name: 'Barracks' },
    { id: 'castle', name: 'Castle' },
    { id: 'workshop', name: 'Workshop' },
    { id: 'researchLab', name: 'Research Lab' },
];

interface Villager {
    id: string;
    name: string;
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
}

interface GoldMine {
    id: string;
    x: number;
    y: number;
}

interface ConstructionSite {
    id: string;
    x: number;
    y: number;
    type: BuildingType;
    progress: number; // 0-100
    builderId: string | null;
    startTime: number;
}

interface Building {
    id: string;
    x: number;
    y: number;
    type: BuildingType;
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

const getMineNode = (node: Konva.Node | null): Konva.Group | null => {
    if (!node) return null;
    if (node.name() === 'gold-mine' && node instanceof Konva.Group) {
        return node;
    }
    if (node.getParent()) {
        return getMineNode(node.getParent());
    }
    return null;
};

const getConstructionSiteNode = (node: Konva.Node | null): Konva.Group | null => {
    if (!node) return null;
    if (node.name() === 'construction-site' && node instanceof Konva.Group) {
        return node;
    }
    if (node.getParent()) {
        return getConstructionSiteNode(node.getParent());
    }
    return null;
};

const isClickOnPopup = (node: Konva.Node | null): boolean => {
    if (!node) return false;
    if (node.getAttr('isPopup')) return true;
    return isClickOnPopup(node.getParent());
};


const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    const [goldMines, setGoldMines] = useState<GoldMine[]>([]);
    const [constructionSites, setConstructionSites] = useState<ConstructionSite[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [log, setLog] = useState<string[]>([]);
    
    // State for panning and zooming
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);

    // State for selection and interaction
    const [selectionBox, setSelectionBox] = useState({ x1: 0, y1: 0, x2: 0, y2: 0, visible: false });
    const [mouseDownPos, setMouseDownPos] = useState<{x: number, y: number} | null>(null);
    const [isHoveringEnemy, setIsHoveringEnemy] = useState(false);
    const [isHoveringClickable, setIsHoveringClickable] = useState(false);
    
    // State for UI panels
    const [popup, setPopup] = useState<{ visible: boolean; x: number; y: number; villagerId: string; showBuildMenu: boolean; } | null>(null);
    const [placementMode, setPlacementMode] = useState<{ active: boolean; initiatorId: string | null; buildingType: BuildingType | null } | null>(null);

    const stageRef = useRef<Konva.Stage>(null);
    const villagerRefs = useRef<Map<string, Konva.Group>>(new Map());

    const BuildingComponents: Record<BuildingType, React.ForwardRefExoticComponent<Konva.GroupConfig & React.RefAttributes<Konva.Group>>> = {
        hut: Hut,
        barracks: Barracks,
        castle: Castle,
        workshop: Workshop,
        researchLab: ResearchLab,
    };

    // Initial setup on component mount
    useEffect(() => {
        setIsClient(true);
        const initialVillagers: Villager[] = Array.from({ length: 5 }).map((_, i) => {
            const x = (10 + i * 4) * GRID_SIZE;
            const y = (10 + (i%2) * 4) * GRID_SIZE;
            return {
                id: `villager-${i + 1}`,
                name: `Villager ${i + 1}`,
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
        setGoldMines([{ id: 'gold-mine-1', x: 8 * GRID_SIZE, y: 12 * GRID_SIZE }]);
    }, []);

    // Game Loop
    useEffect(() => {
        if (!isClient) return;
        
        const gameLoop = () => {
             // --- Combat and Death ---
             setVillagers(currentVillagers => {
                const now = Date.now();
                const damageMap = new Map<string, number>();
                let villagersNeedUpdate = false;

                let nextVillagers = currentVillagers.map(v => ({...v})); // Create a mutable copy

                // First pass: determine attacks and build damage map
                for (const villager of nextVillagers) {
                     if (villager.task === 'dead') continue;
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

             // --- Construction ---
            setConstructionSites(currentSites => {
                const newSites = currentSites.map(site => {
                    if (site.builderId) {
                        const builder = villagers.find(v => v.id === site.builderId);
                        if (builder && builder.task === 'building') {
                            const newProgress = site.progress + (100 / (BUILD_TIME / 16)); // ~60fps
                            if (newProgress >= 100) {
                                setBuildings(b => [...b, { id: `building-${site.id}`, x: site.x, y: site.y, type: site.type }]);
                                setVillagers(vs => vs.map(v => v.id === site.builderId ? { ...v, task: 'idle', targetId: null } : v));
                                
                                const endTime = Date.now();
                                const timeTaken = ((endTime - site.startTime) / 1000).toFixed(1);
                                const builderName = builder ? builder.name : 'A villager';
                                const buildingName = buildingTypes.find(b => b.id === site.type)?.name || 'a building';
                                const newLogEntry = `${builderName} built a ${buildingName} at (${Math.round(site.x)}, ${Math.round(site.y)}) in ${timeTaken} seconds.`;
                                setLog(prevLog => [newLogEntry, ...prevLog.slice(0, 4)]);
                                return null;
                            }
                            return { ...site, progress: newProgress };
                        }
                    }
                    return site;
                }).filter(Boolean) as ConstructionSite[];
                
                if (newSites.length !== currentSites.length || newSites.some((s, i) => s.progress !== currentSites[i].progress)) {
                    return newSites;
                }
                return currentSites;
            });
            requestAnimationFrame(gameLoop);
        };

        const animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isClient, villagers]);


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
        const targetMineNode = getMineNode(e.target);
        const targetSiteNode = getConstructionSiteNode(e.target);

        const targetVillagerId = targetVillagerNode ? targetVillagerNode.id() : null;
        const targetMineId = targetMineNode ? targetMineNode.id() : null;
        const targetSiteId = targetSiteNode ? targetSiteNode.id() : null;

        const targetVillager = villagers.find(v => v.id === targetVillagerId);
        const targetMine = goldMines.find(m => m.id === targetMineId);
        const targetSite = constructionSites.find(s => s.id === targetSiteId);
        
        setVillagers(currentVillagers =>
            currentVillagers.map(v => {
                if (v.isSelected && v.task !== 'dead') {
                    setPopup(null);
                    if (targetMine) {
                        const dx = targetMine.x - v.x;
                        const dy = targetMine.y - v.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const standoff = 40;
                        const ratio = distance > standoff ? (distance - standoff) / distance : 0;
                        const targetX = v.x + dx * ratio;
                        const targetY = v.y + dy * ratio;
                        return { ...v, task: 'moving', targetX, targetY, targetId: targetMineId };
                    } else if (targetSite) {
                         const dx = targetSite.x - v.x;
                         const dy = targetSite.y - v.y;
                         const distance = Math.sqrt(dx * dx + dy * dy);
                         const standoff = 30;
                         const ratio = distance > standoff ? (distance - standoff) / distance : 0;
                         const targetX = v.x + dx * ratio;
                         const targetY = v.y + dy * ratio;
                         return { ...v, task: 'moving', targetX, targetY, targetId: targetSiteId };
                    } else if (targetVillager && targetVillager.id !== v.id) {
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
                        return { ...v, task: 'moving', targetX: finalTargetX, targetY: finalTargetY, targetId: targetVillagerId };
                    } else {
                         // Move command
                        return { ...v, task: 'moving', targetX: pointerPos.x, targetY: pointerPos.y, targetId: null };
                    }
                }
                return v;
            })
        );
    };

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Handle popup clicks
        if (popup?.visible) {
             const name = e.target.name();
             if (name === 'build-button') {
                 setPopup(p => p ? {...p, showBuildMenu: true} : null);
                 return;
             }
             if (name === 'dismiss-button') {
                 setVillagers(vs => vs.filter(v => v.id !== popup.villagerId));
                 setPopup(null);
                 return;
             }
             if (name?.startsWith('build-type-')) {
                 const buildingType = name.replace('build-type-', '') as BuildingType;
                 setPlacementMode({ active: true, initiatorId: popup.villagerId, buildingType });
                 setPopup(null);
                 return;
             }
        }
    };


    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button !== 0 || isSpacebarPressed) return;
        
        const pos = getStagePointerPosition();
        if (!pos) return;
        
        // If in placement mode, place the object
        if (placementMode?.active && placementMode.buildingType) {
            const siteId = `site-${Date.now()}`;
            setConstructionSites(cs => [...cs, { id: siteId, x: pos.x, y: pos.y, type: placementMode.buildingType!, progress: 0, builderId: null, startTime: Date.now() }]);
            
            // Auto-assign the initiator to build
             if (placementMode.initiatorId) {
                const siteX = pos.x, siteY = pos.y;
                setVillagers(vs => vs.map(v => {
                    if (v.id === placementMode.initiatorId) {
                        const dx = siteX - v.x; const dy = siteY - v.y;
                        const dist = Math.sqrt(dx*dx + dy*dy); const standoff = 30;
                        const ratio = dist > standoff ? (dist - standoff)/dist : 0;
                        return { ...v, task: 'moving', targetId: siteId, targetX: v.x + dx * ratio, targetY: v.y + dy * ratio };
                    }
                    return v;
                }));
             }
             setPlacementMode({ active: false, initiatorId: null, buildingType: null });
            return;
        }
        
        // Handle selection box start
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
        const pos = getStagePointerPosition();

        // If it was a small drag, treat as a click
        if (dragDistance < 5) {
            const clickedVillagerNode = getVillagerNode(e.target);
            const clickedId = clickedVillagerNode?.id();

            // Clicked on a villager
            if (clickedVillagerNode && clickedId) {
                setVillagers(v => v.map(villager => {
                    if (isShiftPressed) {
                        return villager.id === clickedId ? { ...villager, isSelected: !villager.isSelected } : villager;
                    }
                    return { ...villager, isSelected: villager.id === clickedId };
                }));
                // Show popup for single selection
                if (!isShiftPressed && pos) {
                    setPopup({ visible: true, x: pos.x, y: pos.y - 60, villagerId: clickedId, showBuildMenu: false });
                } else {
                    setPopup(null);
                }
            } else {
                // Clicked on empty space, deselect all and hide popup
                const clickedOnPopup = isClickOnPopup(e.target);
                if (!isShiftPressed && !clickedOnPopup) {
                    setVillagers(v => v.map(villager => ({ ...villager, isSelected: false })));
                    setPopup(null);
                }
            }
        } else {
            // It was a drag selection
            setPopup(null);
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
                
                let newTask: Villager['task'] = 'idle';
                const targetIsVillager = currentVillagers.some(tv => tv.id === v.targetId);
                const targetIsMine = goldMines.some(m => m.id === v.targetId);
                const targetIsSite = constructionSites.some(s => s.id === v.targetId);
                
                if (targetIsVillager) newTask = 'attacking';
                else if (targetIsMine) newTask = 'mining';
                else if (targetIsSite) {
                    newTask = 'building';
                    setConstructionSites(cs => cs.map(s => s.id === v.targetId ? { ...s, builderId: v.id } : s));
                }

                return { ...v, task: newTask, x: newPosition.x, y: newPosition.y };
            })
        );
    }, [goldMines, constructionSites]);

    const handleMouseEnterEnemy = (isEnemy: boolean) => setIsHoveringEnemy(isEnemy);
    
    const handleCreateVillager = useCallback(() => {
        setVillagers(current => {
            const newId = current.length > 0 ? Math.max(...current.map(v => parseInt(v.id.split('-')[1]))) + 1 : 1;
            const newVillagerId = `villager-${newId}`;
            const spawnX = (MAP_WIDTH_CELLS * GRID_SIZE / 2) + (Math.random() - 0.5) * 50;
            const spawnY = (MAP_HEIGHT_CELLS * GRID_SIZE / 2) + 100;
            const newVillager: Villager = { id: newVillagerId, name: `Villager ${newId}`, x: spawnX, y: spawnY, targetX: spawnX, targetY: spawnY, hp: MAX_HP, attack: ATTACK_POWER, targetId: null, attackLastTime: 0, task: 'idle', isSelected: false };
            return [...current, newVillager];
        });
    }, []);
    
    const handleMouseEnterClickable = (isClickable: boolean) => setIsHoveringClickable(isClickable);

    const renderGrid = () => Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => ( <Rect key={i} x={(i % MAP_WIDTH_CELLS) * GRID_SIZE} y={Math.floor(i / MAP_WIDTH_CELLS) * GRID_SIZE} width={GRID_SIZE} height={GRID_SIZE} fill="#504945" stroke="#665c54" strokeWidth={1} listening={false} /> ));

    const hasSelection = villagers.some(v => v.isSelected);
    const attackCursorUrl = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="%23fb4934" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 9.5l-5-5-5 5 5 5 5-5z"/><path d="M9.5 14.5l5 5 5-5-5-5-5 5z"/><path d="M2.5 12l9 9"/><path d="M12.5 2.5l9 9"/></svg>'), auto`;
    const buildCursorUrl = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="%2398971a" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>'), auto`;
    let stageCursor = 'default';
    if (isSpacebarPressed) stageCursor = 'grab';
    else if (placementMode?.active) stageCursor = buildCursorUrl;
    else if (hasSelection && isHoveringEnemy) stageCursor = attackCursorUrl;
    else if (isHoveringClickable) stageCursor = 'pointer';

    
    if (!isClient) return <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8"><h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1></div>;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl mb-4">
                <h1 className="text-3xl font-serif text-brand-gold">Animation Test Map</h1>
                <p className="text-parchment-dark mb-4 text-sm">Click villager for options. Drag to select. Right-click to move/attack/build.</p>
            </div>
            <div className="flex-grow w-full max-w-6xl aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative">
                 <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded-lg text-xs w-96 z-10 font-mono">
                    <h3 className="font-bold border-b mb-1 text-base">Activity Log</h3>
                    {log.map((entry, i) => (
                        <p key={i} className="truncate">{entry}</p>
                    ))}
                </div>
                 <Stage 
                    ref={stageRef} width={MAP_WIDTH_CELLS * GRID_SIZE} height={MAP_HEIGHT_CELLS * GRID_SIZE} className="mx-auto" 
                    style={{ cursor: stageCursor }}
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onClick={handleStageClick}
                    onContextMenu={handleStageContextMenu}
                    draggable={isSpacebarPressed} 
                    scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y}
                    onDragEnd={(e) => setStagePos(e.target.position())}
                >
                    <Layer>
                        {renderGrid()}
                        <TownCenter onClick={handleCreateVillager} onTap={handleCreateVillager} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                        {goldMines.map(mine => <AnimatedGoldMine key={mine.id} id={mine.id} name="gold-mine" x={mine.x} y={mine.y} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} /> )}
                        {buildings.map(building => {
                            const BuildingComponent = BuildingComponents[building.type];
                            return <BuildingComponent key={building.id} x={building.x} y={building.y} />
                        })}
                        {constructionSites.map(site => {
                            const BuildingComponent = BuildingComponents[site.type];
                            return (
                                <Group key={site.id} x={site.x} y={site.y} name="construction-site" onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)}>
                                    <BuildingComponent opacity={0.3} />
                                    <Rect x={-30} y={40} width={60} height={8} fill="#3c3836" />
                                    <Rect x={-30} y={40} width={60 * (site.progress / 100)} height={8} fill="#98971a" />
                                </Group>
                            );
                        })}
                        {villagers.map(villager => <AnimatedVillager ref={(node) => { if (node) villagerRefs.current.set(villager.id, node); else villagerRefs.current.delete(villager.id); }} key={villager.id} id={villager.id} initialX={villager.x} initialY={villager.y} targetX={villager.targetX} targetY={villager.targetY} hp={villager.hp} maxHp={MAX_HP} task={villager.task} isSelected={villager.isSelected} onMoveEnd={(pos) => handleMoveEnd(villager.id, pos)} deathTime={villager.deathTime} onMouseEnter={() => { if(villagers.some(v => v.isSelected) && !villager.isSelected) handleMouseEnterEnemy(true); }} onMouseLeave={() => handleMouseEnterEnemy(false)} /> )}
                        {placementMode?.active && placementMode.buildingType && (
                            React.createElement(BuildingComponents[placementMode.buildingType], {
                                x: getStagePointerPosition()?.x,
                                y: getStagePointerPosition()?.y,
                                opacity: 0.7,
                                listening: false,
                            })
                        )}
                         <Rect x={Math.min(selectionBox.x1, selectionBox.x2)} y={Math.min(selectionBox.y1, selectionBox.y2)} width={Math.abs(selectionBox.x1 - selectionBox.x2)} height={Math.abs(selectionBox.y1 - selectionBox.y2)} fill="rgba(131, 165, 152, 0.3)" stroke="#83a598" strokeWidth={1 / stageScale} visible={selectionBox.visible} listening={false} />
                         {popup?.visible && (
                            popup.showBuildMenu ? (
                                <Group x={popup.x} y={popup.y} onClick={handleStageClick} onTap={handleStageClick} attrs={{ isPopup: true }}>
                                    <Rect width={100} height={buildingTypes.length * 22 + 10} fill="#3c3836" stroke="#fbf1c7" strokeWidth={2} cornerRadius={5} />
                                    {buildingTypes.map((building, index) => (
                                        <Group key={building.id} y={index * 22 + 5}>
                                            <Rect name={`build-type-${building.id}`} x={5} y={0} width={90} height={20} fill="#504945" cornerRadius={3} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                                            <Text text={building.name} x={10} y={3} fill="#fbf1c7" listening={false} fontSize={12} />
                                        </Group>
                                    ))}
                                </Group>
                            ) : (
                                <Group x={popup.x} y={popup.y} onClick={handleStageClick} onTap={handleStageClick} attrs={{ isPopup: true }}>
                                    <Rect width={80} height={50} fill="#3c3836" stroke="#fbf1c7" strokeWidth={2} cornerRadius={5} />
                                    <Rect name="build-button" x={5} y={5} width={70} height={20} fill="#504945" cornerRadius={3} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                                    <Text text="Build" x={25} y={8} fill="#fbf1c7" listening={false} />
                                    <Rect name="dismiss-button" x={5} y={27} width={70} height={18} fill="#504945" cornerRadius={3} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                                    <Text text="Dismiss" x={18} y={30} fill="#fbf1c7" fontSize={10} listening={false} />
                                </Group>
                            )
                         )}
                    </Layer>
                </Stage>
            </div>
            <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
