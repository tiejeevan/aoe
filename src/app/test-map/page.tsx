
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva';
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

type Resources = {
    wood: number;
    gold: number;
    stone: number;
};

const buildingStats: Record<BuildingType, { name: string; cost: Partial<Resources>; hp: number; providesCapacity?: number }> = {
    hut: { name: 'Hut', cost: { wood: 50 }, hp: 250, providesCapacity: 5 },
    barracks: { name: 'Barracks', cost: { wood: 100, stone: 25 }, hp: 600 },
    castle: { name: 'Castle', cost: { stone: 250 }, hp: 2000 },
    workshop: { name: 'Workshop', cost: { wood: 125 }, hp: 400 },
    researchLab: { name: 'Research Lab', cost: { wood: 75, gold: 100 }, hp: 350 },
};


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
    workApplied: number; // 0 to BUILD_TIME
    builderIds: string[];
    cost: Partial<Resources>;
}

interface Building {
    id: string;
    x: number;
    y: number;
    type: BuildingType;
    hp: number;
    maxHp: number;
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

const getBuildingNode = (node: Konva.Node | null): Konva.Group | null => {
    if (!node) return null;
    if (node.name() === 'building' && node instanceof Konva.Group) {
        return node;
    }
    if (node.getParent()) {
        return getBuildingNode(node.getParent());
    }
    return null;
}

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
    const [log, setLog] = useState<{ id: string; message: string }[]>([]);
    const [resources, setResources] = useState<Resources>({ wood: 500, gold: 200, stone: 300 });
    const [population, setPopulation] = useState({ current: 5, capacity: 10 });
    
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
    const [buildingPopup, setBuildingPopup] = useState<{ visible: boolean; x: number; y: number; buildingId: string; } | null>(null);
    const [placementMode, setPlacementMode] = useState<{ active: boolean; type: 'build' | 'move'; initiatorId: string | null; buildingType: BuildingType | null; buildingId?: string; } | null>(null);
    const [previewPos, setPreviewPos] = useState<{x: number, y: number} | null>(null);
    const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; siteId: string; } | null>(null);

    const stageRef = useRef<Konva.Stage>(null);
    const lastTickRef = useRef<number>(Date.now());
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

    const addToLog = useCallback((message: string) => {
        const newEntry = { id: `${Date.now()}-${Math.random()}`, message };
        setLog(prevLog => [newEntry, ...prevLog.slice(0, 49)]);
    }, []);
    
    // Recalculate population and capacity whenever villagers or buildings change
    useEffect(() => {
        const newCapacity = 10 + buildings.reduce((acc, building) => {
            return acc + (buildingStats[building.type].providesCapacity || 0);
        }, 0);
        
        const currentPop = villagers.filter(v => v.task !== 'dead').length;

        setPopulation({ current: currentPop, capacity: newCapacity });
    }, [villagers, buildings]);

    // Game Loop
    useEffect(() => {
        if (!isClient) return;
        
        const gameLoop = () => {
             const now = Date.now();
             const deltaTime = now - lastTickRef.current;
             lastTickRef.current = now;

             // --- Combat and Death ---
             setVillagers(currentVillagers => {
                const damageMap = new Map<string, number>();
                let villagersNeedUpdate = false;

                let nextVillagers = currentVillagers.map(v => ({...v})); // Create a mutable copy

                // First pass: determine attacks and build damage map
                for (const villager of nextVillagers) {
                     if (villager.task === 'dead') continue;
                    if (villager.task === 'attacking' && villager.targetId) {
                        const targetVillager = nextVillagers.find(v => v.id === villager.targetId);
                        const targetBuilding = buildings.find(b => b.id === villager.targetId);

                        if (targetVillager && targetVillager.task !== 'dead') {
                             const dx = targetVillager.x - villager.x;
                             const dy = targetVillager.y - villager.y;
                             const distance = Math.sqrt(dx * dx + dy * dy);
                             if (distance > ATTACK_RANGE) {
                                villager.task = 'moving'; // Re-engage
                                const ratio = (distance - ATTACK_DISTANCE) / distance;
                                villager.targetX = villager.x + dx * ratio;
                                villager.targetY = villager.y + dy * ratio;
                                villagersNeedUpdate = true;
                             }
                        } else if (targetBuilding && targetBuilding.hp > 0) {
                             const dx = targetBuilding.x - villager.x;
                             const dy = targetBuilding.y - villager.y;
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
                         if (now - villager.attackLastTime > ATTACK_COOLDOWN) {
                            const targetVillager = nextVillagers.find(v => v.id === villager.targetId);
                            const targetBuilding = buildings.find(b => b.id === villager.targetId);
                            if (targetVillager && targetVillager.task !== 'dead') {
                                const currentDamage = damageMap.get(targetVillager.id) || 0;
                                damageMap.set(targetVillager.id, currentDamage + villager.attack);
                                villager.attackLastTime = now;
                            } else if (targetBuilding && targetBuilding.hp > 0) {
                                const currentDamage = damageMap.get(targetBuilding.id) || 0;
                                damageMap.set(targetBuilding.id, currentDamage + villager.attack);
                                villager.attackLastTime = now;
                            } else {
                                villager.task = 'idle';
                                villager.targetId = null;
                                villagersNeedUpdate = true;
                            }
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
                                addToLog(`${villager.name} has been defeated.`);
                            }
                        }
                    }
                    setBuildings(currentBuildings => currentBuildings.map(b => {
                        if (damageMap.has(b.id)) {
                            const newHp = b.hp - (damageMap.get(b.id) || 0);
                            if (newHp <= 0) {
                                addToLog(`${buildingStats[b.type].name} at (${Math.round(b.x)}, ${Math.round(b.y)}) has been destroyed!`);
                                return null;
                            }
                            return { ...b, hp: newHp };
                        }
                        return b;
                    }).filter(Boolean) as Building[]);
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
                let siteUpdated = false;
                const newSites = currentSites.map(site => {
                    if (site.builderIds.length > 0) {
                        siteUpdated = true;
                        const workThisTick = deltaTime * site.builderIds.length;
                        const newWorkApplied = site.workApplied + workThisTick;

                        if (newWorkApplied >= BUILD_TIME) {
                            const stats = buildingStats[site.type];
                            setBuildings(b => [...b, { id: `building-${site.id}`, x: site.x, y: site.y, type: site.type, hp: stats.hp, maxHp: stats.hp }]);
                            setVillagers(vs => vs.map(v => site.builderIds.includes(v.id) ? { ...v, task: 'idle', targetId: null } : v));
                            
                            const builderNames = site.builderIds.map(id => villagers.find(v => v.id === id)?.name || 'A villager').join(', ');
                            addToLog(`${builderNames} built a ${stats.name} at (${Math.round(site.x)}, ${Math.round(site.y)}).`);
                            return null;
                        }
                        return { ...site, workApplied: newWorkApplied };
                    }
                    return site;
                }).filter(Boolean) as ConstructionSite[];
                
                if (siteUpdated) {
                    return newSites;
                }
                return currentSites;
            });
            requestAnimationFrame(gameLoop);
        };

        const animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isClient, villagers, buildings, addToLog]);


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
        
        if (placementMode?.active) {
            setPlacementMode(null);
            setPreviewPos(null);
            addToLog("Action cancelled.");
            return;
        }

        const pointerPos = getStagePointerPosition();
        if (!pointerPos) return;

        const targetVillagerNode = getVillagerNode(e.target);
        const targetMineNode = getMineNode(e.target);
        const targetSiteNode = getConstructionSiteNode(e.target);
        const targetBuildingNode = getBuildingNode(e.target);

        const targetVillager = villagers.find(v => v.id === (targetVillagerNode?.id() || ''));
        const targetMine = goldMines.find(m => m.id === (targetMineNode?.id() || ''));
        const targetSite = constructionSites.find(s => s.id === (targetSiteNode?.id() || ''));
        const targetBuilding = buildings.find(b => b.id === (targetBuildingNode?.id() || ''));

        const selectedVillagers = villagers.filter(v => v.isSelected && v.task !== 'dead');
        if (selectedVillagers.length === 0) return;

        let sitesToUpdate = [...constructionSites];
        selectedVillagers.forEach(villager => {
            const currentVillagerState = villagers.find(v => v.id === villager.id);
            if (currentVillagerState?.task === 'building' && currentVillagerState.targetId) {
                const siteIndex = sitesToUpdate.findIndex(s => s.id === currentVillagerState.targetId);
                if (siteIndex !== -1) {
                    const site = sitesToUpdate[siteIndex];
                    const newBuilderIds = site.builderIds.filter(id => id !== villager.id);
                    sitesToUpdate[siteIndex] = { ...site, builderIds: newBuilderIds };
                    addToLog(`${villager.name} stopped building the ${buildingStats[site.type].name}.`);
                }
            }
        });
        setConstructionSites(sitesToUpdate);

        setVillagers(currentVillagers =>
            currentVillagers.map(v => {
                if (v.isSelected && v.task !== 'dead') {
                    setPopup(null);
                    setBuildingPopup(null);
                    if (targetMine) {
                        addToLog(`${v.name} is on the way to the Gold Mine.`);
                        const dx = targetMine.x - v.x;
                        const dy = targetMine.y - v.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        const standoff = 40;
                        const ratio = distance > standoff ? (distance - standoff) / distance : 0;
                        const targetX = v.x + dx * ratio;
                        const targetY = v.y + dy * ratio;
                        return { ...v, task: 'moving', targetX, targetY, targetId: targetMine.id };
                    } else if (targetSite) {
                         const siteName = buildingStats[targetSite.type].name;
                         addToLog(`${v.name} is going to construct the ${siteName}.`);
                         const dx = targetSite.x - v.x;
                         const dy = targetSite.y - v.y;
                         const distance = Math.sqrt(dx * dx + dy * dy);
                         const standoff = 30;
                         const ratio = distance > standoff ? (distance - standoff) / distance : 0;
                         const targetX = v.x + dx * ratio;
                         const targetY = v.y + dy * ratio;
                         return { ...v, task: 'moving', targetX, targetY, targetId: targetSite.id };
                    } else if (targetVillager && targetVillager.id !== v.id) {
                        addToLog(`${v.name} is attacking ${targetVillager.name}!`);
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
                        return { ...v, task: 'moving', targetX: finalTargetX, targetY: finalTargetY, targetId: targetVillager.id };
                    } else if (targetBuilding) {
                        const buildingName = buildingStats[targetBuilding.type].name;
                        addToLog(`${v.name} is attacking the ${buildingName}!`);
                        const dx = targetBuilding.x - v.x;
                        const dy = targetBuilding.y - v.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        let finalTargetX = targetBuilding.x;
                        let finalTargetY = targetBuilding.y;
                        if (distance > ATTACK_DISTANCE) {
                            const ratio = (distance - ATTACK_DISTANCE) / distance;
                            finalTargetX = v.x + dx * ratio;
                            finalTargetY = v.y + dy * ratio;
                        }
                        return { ...v, task: 'moving', targetX: finalTargetX, targetY: finalTargetY, targetId: targetBuilding.id };
                    } else {
                        addToLog(`${v.name} is moving to (${Math.round(pointerPos.x)}, ${Math.round(pointerPos.y)}).`);
                        return { ...v, task: 'moving', targetX: pointerPos.x, targetY: pointerPos.y, targetId: null };
                    }
                }
                return v;
            })
        );
    };

    const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Handle villager popup clicks
        if (popup?.visible) {
             const name = e.target.name();
             if (name === 'build-button') {
                 setPopup(p => p ? {...p, showBuildMenu: true} : null);
                 return;
             }
             if (name === 'dismiss-button') {
                 addToLog(`${villagers.find(v => v.id === popup.villagerId)?.name} has been dismissed.`);
                 setVillagers(vs => vs.filter(v => v.id !== popup.villagerId));
                 setPopup(null);
                 return;
             }
             if (name?.startsWith('build-type-')) {
                 const buildingType = name.replace('build-type-', '') as BuildingType;
                 const cost = buildingStats[buildingType].cost;
                 const canAfford = Object.entries(cost).every(([res, amount]) => resources[res as keyof Resources] >= (amount || 0));
                 if (canAfford) {
                    setPlacementMode({ active: true, type: 'build', initiatorId: popup.villagerId, buildingType, buildingId: undefined });
                    setPopup(null);
                 } else {
                     addToLog("Not enough resources!");
                 }
                 return;
             }
        }
        // Handle building popup clicks
        if (buildingPopup?.visible) {
            const name = e.target.name();
            if (name === 'move-button') {
                const building = buildings.find(b => b.id === buildingPopup.buildingId);
                if (building) {
                    setPlacementMode({ active: true, type: 'move', initiatorId: null, buildingType: building.type, buildingId: building.id });
                    setBuildingPopup(null);
                    addToLog(`Moving ${buildingStats[building.type].name}. Click to place.`);
                }
                return;
            }
            if (name === 'demolish-button') {
                const building = buildings.find(b => b.id === buildingPopup.buildingId);
                if (building) {
                    const cost = buildingStats[building.type].cost;
                    const refund = Object.entries(cost).reduce((acc, [res, amount]) => {
                        acc[res as keyof Resources] = Math.floor((amount || 0) / 2);
                        return acc;
                    }, {} as Partial<Resources>);
                    
                    setResources(prev => {
                        const newRes = { ...prev };
                        for (const key in refund) {
                            newRes[key as keyof Resources] += refund[key as keyof Resources] || 0;
                        }
                        return newRes;
                    });
                    
                    setBuildings(bs => bs.filter(b => b.id !== building.id));
                    addToLog(`Demolished ${building.type}. Refunded ${Object.entries(refund).map(([r,a]) => `${a} ${r}`).join(', ')}.`);
                }
                setBuildingPopup(null);
                return;
            }
        }
    };


    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (e.evt.button !== 0 || isSpacebarPressed) return;
        
        const pos = getStagePointerPosition();
        if (!pos) return;
        
        // If in placement mode, place the object
        if (placementMode?.active) {
            if (placementMode.type === 'build' && placementMode.buildingType) {
                const stats = buildingStats[placementMode.buildingType];
                const cost = stats.cost;

                const canAfford = Object.entries(cost).every(([res, amount]) => resources[res as keyof Resources] >= (amount || 0));

                if (canAfford) {
                    setResources(prev => {
                        const newRes = { ...prev };
                        for (const key in cost) {
                            newRes[key as keyof Resources] -= cost[key as keyof Resources] || 0;
                        }
                        return newRes;
                    });

                    const siteId = `site-${Date.now()}`;
                    setConstructionSites(cs => [...cs, { id: siteId, x: pos.x, y: pos.y, type: placementMode.buildingType!, workApplied: 0, builderIds: [], cost }]);
                    
                    if (placementMode.initiatorId) {
                        const siteX = pos.x, siteY = pos.y;
                        setVillagers(vs => vs.map(v => {
                            if (v.id === placementMode.initiatorId) {
                                const dx = siteX - v.x; const dy = siteY - v.y;
                                const dist = Math.sqrt(dx*dx + dy*dy); const standoff = 30;
                                const ratio = dist > standoff ? (dist - standoff)/dist : 0;
                                addToLog(`${v.name} is going to construct the ${stats.name}.`);
                                return { ...v, task: 'moving', targetId: siteId, targetX: v.x + dx * ratio, targetY: v.y + dy * ratio };
                            }
                            return v;
                        }));
                    }
                    addToLog(`Construction started for ${stats.name}. Cost: ${Object.entries(cost).map(([r,a]) => `${a} ${r}`).join(', ')}.`);
                } else {
                     addToLog("Not enough resources to build!");
                }
            } else if (placementMode.type === 'move' && placementMode.buildingId) {
                setBuildings(bs => bs.map(b => 
                    b.id === placementMode.buildingId
                        ? { ...b, x: pos.x, y: pos.y }
                        : b
                ));
                const movedBuilding = buildings.find(b => b.id === placementMode.buildingId);
                if (movedBuilding) {
                    addToLog(`Moved ${buildingStats[movedBuilding.type].name} to (${Math.round(pos.x)}, ${Math.round(pos.y)}).`);
                }
            }

            setPlacementMode(null);
            setPreviewPos(null);
            return;
        }
        
        // Handle selection box start
        setMouseDownPos(pos);
        setSelectionBox({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, visible: true });
    };

    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const pos = getStagePointerPosition();
        if (!pos) return;

        // Handle selection box dragging
        if (mouseDownPos) {
            setSelectionBox(prev => ({ ...prev, x2: pos.x, y2: pos.y }));
        }

        // Handle placement preview
        if (placementMode?.active) {
            setPreviewPos(pos);
        }
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
            const clickedBuildingNode = getBuildingNode(e.target);
            const clickedId = clickedVillagerNode?.id() || clickedBuildingNode?.id();

            // Clicked on a villager
            if (clickedVillagerNode && clickedId) {
                setBuildingPopup(null);
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
            } else if (clickedBuildingNode && clickedId) {
                 // Clicked on a building
                 setPopup(null);
                 setVillagers(v => v.map(villager => ({ ...villager, isSelected: false })));
                 if (pos) {
                    setBuildingPopup({ visible: true, x: pos.x, y: pos.y - 40, buildingId: clickedId });
                 }
            } else {
                // Clicked on empty space, deselect all and hide popups
                const clickedOnPopup = isClickOnPopup(e.target);
                if (!isShiftPressed && !clickedOnPopup) {
                    setVillagers(v => v.map(villager => ({ ...villager, isSelected: false })));
                    setPopup(null);
                    setBuildingPopup(null);
                }
            }
        } else {
            // It was a drag selection
            setPopup(null);
            setBuildingPopup(null);
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
                const targetIsSite = constructionSites.find(s => s.id === v.targetId);
                const targetIsBuilding = buildings.find(b => b.id === v.targetId);
                
                if (targetIsVillager || targetIsBuilding) {
                    newTask = 'attacking';
                } else if (targetIsMine) {
                    newTask = 'mining';
                    addToLog(`${v.name} has started mining gold.`);
                } else if (targetIsSite) {
                    newTask = 'building';
                    const siteName = buildingStats[targetIsSite.type].name;
                    addToLog(`${v.name} has started building the ${siteName}.`);
                    setConstructionSites(cs => cs.map(s => {
                        if (s.id === v.targetId) {
                            const newBuilderIds = s.builderIds.includes(v.id) ? s.builderIds : [...s.builderIds, v.id];
                            return { ...s, builderIds: newBuilderIds };
                        }
                        return s;
                    }));
                } else {
                     addToLog(`${v.name} has arrived at their destination.`);
                }

                return { ...v, task: newTask, x: newPosition.x, y: newPosition.y };
            })
        );
    }, [goldMines, constructionSites, buildings, addToLog]);

    const handleMouseEnterEnemy = (isEnemy: boolean) => setIsHoveringEnemy(isEnemy);
    
    const handleCreateVillager = useCallback(() => {
        if (villagers.filter(v => v.task !== 'dead').length >= population.capacity) {
            addToLog("Not enough population capacity. Build more huts!");
            return;
        }

        setVillagers(current => {
            const newId = current.length > 0 ? Math.max(...current.map(v => parseInt(v.id.split('-')[1]))) + 1 : 1;
            const newVillagerId = `villager-${newId}`;
            const spawnX = (MAP_WIDTH_CELLS * GRID_SIZE / 2) + (Math.random() - 0.5) * 50;
            const spawnY = (MAP_HEIGHT_CELLS * GRID_SIZE / 2) + 100;
            const newVillager: Villager = { id: newVillagerId, name: `Villager ${newId}`, x: spawnX, y: spawnY, targetX: spawnX, targetY: spawnY, hp: MAX_HP, attack: ATTACK_POWER, targetId: null, attackLastTime: 0, task: 'idle', isSelected: false };
            addToLog("A new villager has arrived!");
            return [...current, newVillager];
        });
    }, [villagers, population.capacity, addToLog]);
    
    const handleMouseEnterClickable = (isClickable: boolean) => setIsHoveringClickable(isClickable);

    const handleMouseEnterSite = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const siteNode = getConstructionSiteNode(e.target);
        if (!siteNode) return;
        const site = constructionSites.find(s => s.id === siteNode.id());
        if (!site) return;
        
        setTooltip({
            visible: true,
            x: site.x,
            y: site.y - 45,
            siteId: site.id
        });
    };

    const handleMouseLeaveSite = () => {
        setTooltip(null);
    };

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
                <h1 className="text-3xl font-serif text-brand-gold">Resource & HP Test Map</h1>
                <p className="text-parchment-dark mb-4 text-sm">Click villager for options. Drag to select. Right-click to move/attack/build.</p>
            </div>
            <div className="flex-grow w-full max-w-6xl aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative">
                 <div className="absolute top-2 left-2 bg-black/50 text-white p-2 rounded-lg text-xs w-96 z-10 font-mono">
                    <h3 className="font-bold border-b mb-1 text-base">Activity Log</h3>
                    <div className="max-h-28 overflow-y-auto pr-2">
                        {log.length === 0 ? (
                            <p className="text-gray-400 italic">No activity yet.</p>
                        ) : (
                            log.map((entry) => (
                                <p key={entry.id}>{entry.message}</p>
                            ))
                        )}
                    </div>
                </div>
                 <div className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-lg text-sm z-10 font-mono">
                    <h3 className="font-bold border-b mb-1">Resources</h3>
                    <p>Wood: {resources.wood}</p>
                    <p>Gold: {resources.gold}</p>
                    <p>Stone: {resources.stone}</p>
                     <h3 className="font-bold border-b mb-1 mt-2">Status</h3>
                    <p>Population: {population.current} / {population.capacity}</p>
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
                            return (
                                <Group key={building.id} id={building.id} name="building" x={building.x} y={building.y} onMouseEnter={() => handleMouseEnterEnemy(true)} onMouseLeave={() => handleMouseEnterEnemy(false)}>
                                    <BuildingComponent />
                                    {building.hp < building.maxHp && (
                                        <Group y={-60}>
                                            <Rect x={-30} y={0} width={60} height={8} fill="#3c3836" />
                                            <Rect x={-30} y={0} width={60 * (building.hp / building.maxHp)} height={8} fill="#fb4934" />
                                        </Group>
                                    )}
                                </Group>
                            );
                        })}
                        {constructionSites.map(site => {
                            const BuildingComponent = BuildingComponents[site.type];
                            return (
                                <Group key={site.id} id={site.id} x={site.x} y={site.y} name="construction-site" onMouseEnter={handleMouseEnterSite} onMouseLeave={handleMouseLeaveSite}>
                                    <BuildingComponent opacity={0.3} />
                                    <Rect x={-30} y={40} width={60} height={8} fill="#3c3836" />
                                    <Rect x={-30} y={40} width={60 * (site.workApplied / BUILD_TIME)} height={8} fill="#98971a" />
                                </Group>
                            );
                        })}
                        {villagers.map(villager => <AnimatedVillager ref={(node) => { if (node) villagerRefs.current.set(villager.id, node); else villagerRefs.current.delete(villager.id); }} key={villager.id} id={villager.id} initialX={villager.x} initialY={villager.y} targetX={villager.targetX} targetY={villager.targetY} hp={villager.hp} maxHp={MAX_HP} task={villager.task} isSelected={villager.isSelected} onMoveEnd={(pos) => handleMoveEnd(villager.id, pos)} deathTime={villager.deathTime} onMouseEnter={() => { if(villagers.some(v => v.isSelected) && !villager.isSelected) handleMouseEnterEnemy(true); }} onMouseLeave={() => handleMouseEnterEnemy(false)} /> )}
                        {placementMode?.active && placementMode.buildingType && previewPos && (
                            React.createElement(BuildingComponents[placementMode.buildingType], {
                                x: previewPos.x,
                                y: previewPos.y,
                                opacity: 0.7,
                                listening: false,
                            })
                        )}
                         <Rect x={Math.min(selectionBox.x1, selectionBox.x2)} y={Math.min(selectionBox.y1, selectionBox.y2)} width={Math.abs(selectionBox.x1 - selectionBox.x2)} height={Math.abs(selectionBox.y1 - selectionBox.y2)} fill="rgba(131, 165, 152, 0.3)" stroke="#83a598" strokeWidth={1 / stageScale} visible={selectionBox.visible} listening={false} />
                         {tooltip?.visible && (() => {
                            const site = constructionSites.find(s => s.id === tooltip.siteId);
                            if (!site) return null;

                            const workRemaining = BUILD_TIME - site.workApplied;
                            const numBuilders = site.builderIds.length;
                            let timeRemainingText = "∞";

                            if (numBuilders > 0) {
                                const timeRemainingMs = workRemaining / numBuilders;
                                timeRemainingText = `${(timeRemainingMs / 1000).toFixed(1)}s`;
                            }
                            
                            const builderText = `Builders: ${numBuilders}`;
                            const buildingName = buildingStats[site.type].name;
                            const tooltipText = `Building: ${buildingName}\n${builderText}\nTime Left: ${timeRemainingText}`;

                            return (
                                <Group listening={false}>
                                    <Rect
                                        x={tooltip.x}
                                        y={tooltip.y}
                                        width={150}
                                        height={55}
                                        fill="#3c3836"
                                        stroke="#fbf1c7"
                                        strokeWidth={1 / stageScale}
                                        cornerRadius={4}
                                        opacity={0.8}
                                        offsetX={75}
                                    />
                                    <Text
                                        x={tooltip.x}
                                        y={tooltip.y}
                                        text={tooltipText}
                                        fontSize={12}
                                        fill="#fbf1c7"
                                        padding={5}
                                        offsetX={75}
                                        width={150}
                                        align="center"
                                    />
                                </Group>
                            );
                         })()}
                         {popup?.visible && (
                            popup.showBuildMenu ? (
                                <Group x={popup.x} y={popup.y} onClick={handleStageClick} onTap={handleStageClick} attrs={{ isPopup: true }}>
                                     <Rect width={150} height={Object.keys(buildingStats).length * 28 + 10} fill="#3c3836" stroke="#fbf1c7" strokeWidth={2} cornerRadius={5} />
                                     {Object.entries(buildingStats).map(([type, stats], index) => {
                                        const canAfford = Object.entries(stats.cost).every(([res, amount]) => resources[res as keyof Resources] >= (amount || 0));
                                        const costString = Object.entries(stats.cost).map(([res,amt]) => `${amt}${res.substring(0,1)}`).join(' ');
                                        return (
                                            <Group key={type} y={index * 28 + 5}>
                                                <Rect name={`build-type-${type}`} x={5} y={0} width={140} height={26} fill={canAfford ? "#504945" : "#282828"} cornerRadius={3} onMouseEnter={() => canAfford && handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                                                <Text text={`${stats.name}`} x={10} y={2} fill={canAfford ? "#fbf1c7" : "#928374"} listening={false} fontSize={12} />
                                                <Text text={costString} x={10} y={14} fill={canAfford ? "#bdae93" : "#665c54"} listening={false} fontSize={10} />
                                            </Group>
                                        )
                                     })}
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
                         {buildingPopup?.visible && (() => {
                            const building = buildings.find(b => b.id === buildingPopup.buildingId);
                            if (!building) return null;
                            return (
                                <Group x={buildingPopup.x} y={buildingPopup.y} onClick={handleStageClick} onTap={handleStageClick} attrs={{ isPopup: true }}>
                                    <Rect width={100} height={80} fill="#3c3836" stroke="#fbf1c7" strokeWidth={2} cornerRadius={5} />
                                    <Text text={`${buildingStats[building.type].name}`} x={10} y={8} fill="#fbf1c7" fontSize={12} fontStyle="bold" />
                                    <Text text={`HP: ${building.hp}/${building.maxHp}`} x={10} y={22} fill="#ebdbb2" fontSize={10} />
                                    <Rect name="move-button" x={5} y={38} width={90} height={18} fill="#458588" cornerRadius={3} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                                    <Text text="Move Building" x={15} y={41} fill="#fbf1c7" fontSize={10} listening={false}/>
                                    <Rect name="demolish-button" x={5} y={58} width={90} height={18} fill="#7c1e19" cornerRadius={3} onMouseEnter={() => handleMouseEnterClickable(true)} onMouseLeave={() => handleMouseEnterClickable(false)} />
                                    <Text text="Demolish" x={25} y={61} fill="#fbf1c7" fontSize={10} listening={false}/>
                                </Group>
                            );
                         })()}
                    </Layer>
                </Stage>
            </div>
            <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
