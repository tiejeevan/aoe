

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameStatus, type Civilization, type Resources, type Units, type Buildings, type GameEvent, type GameLogEntry, type LogIconType, type ResourceDeltas, BuildingType, UINotification, FullGameState, Villager, MilitaryUnit, UnitConfig, MilitaryUnitType, GameTask, TaskType, ResourceNode, ResourceNodeType, PlayerActionState, GameEventChoice, GameItem, Reward, ActiveBuffs, BuildingInstance, AgeConfig, BuildingConfig } from '@/types';
import { getPredefinedCivilization, getPredefinedGameEvent } from '@/services/geminiService';
import { saveGameState, loadGameState, getAllSaveNames, deleteGameState, getAllAgeConfigs, getAllBuildingConfigs, getAllUnitConfigs, saveAgeConfig, saveBuildingConfig, saveUnitConfig } from '@/services/dbService';
import { getRandomNames } from '@/services/nameService';
import { GAME_ITEMS } from '@/data/itemContent';
import { INITIAL_AGES } from '@/data/ageInfo';
import { INITIAL_BUILDINGS } from '@/data/buildingInfo';
import { INITIAL_UNITS } from '@/data/unitInfo';
import GameUI from '@/components/GameUI';
import StartScreen from '@/components/StartScreen';
import LoadingScreen from '@/components/LoadingScreen';
import BuildPanel from '@/components/BuildPanel';
import NotificationManager from '@/components/NotificationManager';
import UnitManagementPanel from '@/components/UnitManagementPanel';
import BuildingManagementPanel from '@/components/BuildingManagementPanel';
import ResourceAssignmentPanel from '@/components/ResourceAssignmentPanel';
import CivilizationPanel from '@/components/CivilizationPanel';
import AllBuildingsPanel from '@/components/AllBuildingsPanel';
import InventoryPanel from '@/components/InventoryPanel';

const GATHER_INFO: Record<ResourceNodeType, { rate: number }> = {
    food: { rate: 10 },
    wood: { rate: 8 },
    gold: { rate: 5 },
    stone: { rate: 6 },
}

const initialBuildingsState: Buildings = {
    houses: [], barracks: [], archeryRange: [], stable: [], siegeWorkshop: [], blacksmith: [], watchTower: [], townCenter: []
};

const MAP_DIMENSIONS = { width: 25, height: 18 };


const GamePage: React.FC = () => {
    // Core Game State
    const [gameState, setGameState] = useState<GameStatus>(GameStatus.LOADING);
    const [civilization, setCivilization] = useState<Civilization | null>(null);
    const [resources, setResources] = useState<Resources>({ food: 200, wood: 150, gold: 50, stone: 100 });
    const [units, setUnits] = useState<Units>({ villagers: [], military: [] });
    const [buildings, setBuildings] = useState<Buildings>(initialBuildingsState);
    const [currentAge, setCurrentAge] = useState<string>('Nomadic Age');
    const [gameLog, setGameLog] = useState<GameLogEntry[]>([]);
    const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
    const [resourceDeltas, setResourceDeltas] = useState<ResourceDeltas>({});
    const [activityStatus, setActivityStatus] = useState<string>('Your story begins...');
    const [notifications, setNotifications] = useState<UINotification[]>([]);
    const [unlimitedResources, setUnlimitedResources] = useState<boolean>(false);
    const [allSaves, setAllSaves] = useState<string[]>([]);
    const [currentSaveName, setCurrentSaveName] = useState<string | null>(null);
    const [playerAction, setPlayerAction] = useState<PlayerActionState>(null);
    const [activeTasks, setActiveTasks] = useState<GameTask[]>([]);
    const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([]);
    const [inventory, setInventory] = useState<GameItem[]>([]);
    const [activeBuffs, setActiveBuffs] = useState<ActiveBuffs>({ resourceBoost: [] });
    
    // Master lists of all configurations from DB
    const [masterAgeList, setMasterAgeList] = useState<AgeConfig[]>([]);
    const [masterBuildingList, setMasterBuildingList] = useState<BuildingConfig[]>([]);
    const [masterUnitList, setMasterUnitList] = useState<UnitConfig[]>([]);

    // App Loading State
    const [isAppLoading, setIsAppLoading] = useState(true);

    
    // Panel States
    const [buildPanelState, setBuildPanelState] = useState<{ isOpen: boolean; villagerId: string | null; anchorRect: DOMRect | null }>({ isOpen: false, villagerId: null, anchorRect: null });
    const [unitManagementPanel, setUnitManagementPanel] = useState<{ isOpen: boolean; type: 'villagers' | 'military' | null; anchorRect: DOMRect | null; }>({ isOpen: false, type: null, anchorRect: null });
    const [buildingManagementPanel, setBuildingManagementPanel] = useState<{ isOpen: boolean; type: BuildingType | string | null; instanceId?: string; anchorRect: DOMRect | null; }>({ isOpen: false, type: null, instanceId: null, anchorRect: null });
    const [allBuildingsPanel, setAllBuildingsPanel] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    const [assignmentPanelState, setAssignmentPanelState] = useState<{ isOpen: boolean; targetId: string | null; targetType: 'resource' | 'construction' | null; anchorRect: DOMRect | null; }>({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    const [civPanelState, setCivPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    const [inventoryPanelState, setInventoryPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });

    const deltaTimeoutRef = useRef<{ [key in keyof Resources]?: number }>({});
    const eventTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());
    const animationFrameRef = useRef<number>();
    
    // Derived state for active game configurations
    const ageProgressionList = masterAgeList.filter(age => age.isActive);
    const buildingList = masterBuildingList; // Keep all for lookups, filter on use
    const unitList = masterUnitList; // Keep all for lookups, filter on use

    const population = {
        current: units.villagers.length + units.military.length,
        capacity: (buildings.townCenter?.length > 0 ? 20 : 0) + (buildings.houses?.length || 0) * 5,
    };
    
    const fetchSavesAndConfigs = useCallback(async () => {
        try {
            const names = await getAllSaveNames();
            setAllSaves(names);
            
            let allAgeConfigs = await getAllAgeConfigs();
            if (allAgeConfigs.length === 0) {
                allAgeConfigs = [];
                for (const [index, pa] of INITIAL_AGES.entries()) {
                     const newPredefinedAge: AgeConfig = { id: pa.name, name: pa.name, description: pa.description, isActive: true, isPredefined: true, order: index };
                     await saveAgeConfig(newPredefinedAge);
                     allAgeConfigs.push(newPredefinedAge);
                }
            }
            setMasterAgeList(allAgeConfigs);

            let allBuildingConfigs = await getAllBuildingConfigs();
            if (allBuildingConfigs.length === 0) {
                allBuildingConfigs = [];
                const defaultAge = allAgeConfigs.find(a => a.order === 0)?.name || 'Nomadic Age';
                for (const [index, pb] of INITIAL_BUILDINGS.entries()) {
                    const newPredefinedBuilding: BuildingConfig = {
                        ...pb,
                        buildLimit: pb.isUnique ? 1 : (pb.buildLimit || 0),
                        isActive: true,
                        isPredefined: true,
                        order: index,
                        unlockedInAge: defaultAge, 
                        iconId: pb.id,
                        canTrainUnits: pb.canTrainUnits,
                        upgradesTo: pb.upgradesTo || []
                    };
                    await saveBuildingConfig(newPredefinedBuilding);
                    allBuildingConfigs.push(newPredefinedBuilding);
                }
            }
            setMasterBuildingList(allBuildingConfigs);

            let allUnitConfigs = await getAllUnitConfigs();
            if (allUnitConfigs.length === 0) {
                allUnitConfigs = [];
                for (const [index, pu] of INITIAL_UNITS.entries()) {
                     const newPredefinedUnit: UnitConfig = {
                        ...pu,
                        isActive: true,
                        isPredefined: true,
                        order: index,
                    };
                    await saveUnitConfig(newPredefinedUnit);
                    allUnitConfigs.push(newPredefinedUnit);
                }
            }
            setMasterUnitList(allUnitConfigs);
            
            return { allAgeConfigs, allBuildingConfigs, allUnitConfigs };
        } catch (error) {
            console.error("Error during initial config fetch:", error);
            // In case of a catastrophic DB failure, we can use fallbacks
            setMasterAgeList(INITIAL_AGES.map((a, i) => ({...a, id: a.name, isActive: true, isPredefined: true, order: i})));
            setMasterBuildingList(INITIAL_BUILDINGS.map((b, i) => ({...b, buildLimit: b.isUnique ? 1 : 0, isActive: true, isPredefined: true, order: i, unlockedInAge: 'Nomadic Age', iconId: b.id, canTrainUnits: b.canTrainUnits, upgradesTo: b.upgradesTo || []})));
            setMasterUnitList(INITIAL_UNITS.map((u, i) => ({...u, isActive: true, isPredefined: true, order: i})));
            return { allAgeConfigs: [], allBuildingConfigs: [], allUnitConfigs: [] }; // Return empty to signal fallback
        } finally {
            setIsAppLoading(false);
            setGameState(GameStatus.MENU);
        }
    }, []);
    
    useEffect(() => {
        fetchSavesAndConfigs();
    }, [fetchSavesAndConfigs]);
    
    useEffect(() => {
        if (gameState === GameStatus.PLAYING && civilization && currentSaveName) {
            const fullState: FullGameState = {
                civilization,
                resources,
                units,
                buildings,
                currentAge,
                gameLog,
                activeTasks,
                resourceNodes,
                inventory,
                activeBuffs,
            };
            saveGameState(currentSaveName, fullState);
        }
    }, [civilization, resources, units, buildings, currentAge, gameLog, gameState, currentSaveName, activeTasks, resourceNodes, inventory, activeBuffs]);

    const addNotification = useCallback((message: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        setNotifications(prev => [{ id, message }]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const addToLog = useCallback((message: string, icon: LogIconType) => {
        setGameLog(prev => [{ id: `${Date.now()}-${Math.random()}`, message, icon }, ...prev.slice(0, 19)]);
    }, []);
    
    const updateResources = useCallback((deltas: ResourceDeltas) => {
        setResources(prev => {
            const newResources = { ...prev };
            for (const key in deltas) {
                const resourceKey = key as keyof Resources;
                newResources[resourceKey] = Math.max(0, newResources[resourceKey] + (deltas[resourceKey] ?? 0));
            }
            return newResources;
        });

        setResourceDeltas(prev => ({...prev, ...deltas}));

        for (const key in deltas) {
            const resourceKey = key as keyof Resources;
            if (deltaTimeoutRef.current[resourceKey]) {
                window.clearTimeout(deltaTimeoutRef.current[resourceKey]);
            }
            deltaTimeoutRef.current[resourceKey] = window.setTimeout(() => {
                setResourceDeltas(prev => {
                    const newDeltas = {...prev};
                    delete newDeltas[resourceKey];
                    return newDeltas;
                });
            }, 1500);
        }
    }, []);

    const handleTaskCompletion = useCallback((task: GameTask) => {
        if (task.payload?.villagerIds && task.payload.villagerIds.length > 0) {
            setUnits(prev => ({ ...prev, villagers: prev.villagers.map(v => task.payload!.villagerIds!.includes(v.id) ? { ...v, currentTask: null } : v) }));
        }

        switch (task.type) {
            case 'build': {
                const { buildingType, position } = task.payload!;
                const buildingInfo = buildingList.find(b => b.id === buildingType)!;
                const [name] = getRandomNames('building', 1);
                const newBuilding: BuildingInstance = { id: task.id, name, position: position!, currentHp: buildingInfo.hp };
                
                setBuildings(p => {
                    const currentBuildings = p[buildingType as string] || [];
                    return { ...p, [buildingType as string]: [...currentBuildings, newBuilding] };
                });
                
                addToLog(`${task.payload!.villagerIds!.length} builder(s) have constructed ${name}, a new ${buildingInfo.name}.`, buildingInfo.iconId);
                setActivityStatus(`Construction of ${name} is complete.`);
                break;
            }
            case 'gather': break;
            case 'train_villager': {
                const { count } = task.payload!;
                const newVillagerNames = getRandomNames('villager', count!);
                const newVillagers: Villager[] = newVillagerNames.map(name => ({ id: `${Date.now()}-${name}`, name, currentTask: null }));
                setUnits(p => ({ ...p, villagers: [...p.villagers, ...newVillagers] }));
                addToLog(`${count} new villager(s) have joined your settlement.`, 'villager');
                setActivityStatus(`${count} new villager(s) are ready to work.`);
                break;
            }
            case 'train_military': {
                 const { unitType, count } = task.payload!;
                 const unitInfo = unitList.find(u => u.id === unitType)!;
                 const newUnitNames = getRandomNames('soldier', count!);
                 const newUnits: MilitaryUnit[] = newUnitNames.map(name => ({ id: `${Date.now()}-${unitType}-${name}`, name, title: '', unitType: unitType! }));
                 setUnits(p => ({ ...p, military: [...p.military, ...newUnits] }));
                 addToLog(`${count} ${unitInfo.name}(s) have been trained.`, unitType!);
                 setActivityStatus(`${count} new ${unitInfo.name}(s) are ready for battle.`);
                 break;
            }
            case 'advance_age': {
                const activeAges = masterAgeList.filter(a => a.isActive);
                const currentIndex = activeAges.findIndex(age => age.name === currentAge);
                const ageResult = activeAges[currentIndex + 1] || { name: 'Age of Legends', description: 'Your civilization transcends history and becomes a legend.'};
                setCurrentAge(ageResult.name);
                addToLog(`You have advanced to the ${ageResult.name}!`, 'age');
                addToLog(ageResult.description, 'age');
                setActivityStatus(`Welcome to the ${ageResult.name}!`);
                break;
            }
        }
    }, [currentAge, addToLog, buildingList, unitList, masterAgeList]);
    
    useEffect(() => {
        if (gameState !== GameStatus.PLAYING) {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            return;
        }

        const gameLoop = () => {
            const now = Date.now();
            const deltaTime = now - lastTickRef.current;
            lastTickRef.current = now;

            let completedTasks: GameTask[] = [];
            let resourceDeltasThisTick: ResourceDeltas = {};
            
            setActiveBuffs(prev => {
                const newResourceBoosts = prev.resourceBoost?.filter(b => b.endTime > now);
                if (newResourceBoosts?.length !== prev.resourceBoost?.length) {
                    addToLog("A resource gathering bonus has expired.", 'system');
                }
                return { ...prev, resourceBoost: newResourceBoosts };
            });

            const tasksInProgress = activeTasks.map(task => {
                if (now >= task.startTime + task.duration) {
                    completedTasks.push(task);
                    return null;
                }
                if (task.type === 'gather') {
                    const node = resourceNodes.find(n => n.id === task.payload?.resourceNodeId);
                    const villagerCount = task.payload?.villagerIds?.length || 0;
                    if (!node || villagerCount === 0) {
                        completedTasks.push(task); return null; 
                    }
                    const baseRatePerSecond = GATHER_INFO[node.type].rate;
                    let civBonusMultiplier = 1;
                    if (civilization?.bonus.toLowerCase().includes(node.type.toLowerCase())) {
                        const match = civilization.bonus.match(/(\d+)%/);
                        if (match?.[1]) civBonusMultiplier = 1 + (parseInt(match[1], 10) / 100);
                    }
                    const itemBoostMultiplier = activeBuffs.resourceBoost?.find(b => b.resource === node.type)?.multiplier || 1;
                    const finalRatePerSecond = baseRatePerSecond * civBonusMultiplier * itemBoostMultiplier;
                    resourceDeltasThisTick[node.type] = (resourceDeltasThisTick[node.type] || 0) + (finalRatePerSecond / 1000) * deltaTime * villagerCount;
                }
                return task;
            }).filter(Boolean) as GameTask[];
            
            if (Object.keys(resourceDeltasThisTick).length > 0) {
                updateResources(resourceDeltasThisTick);
                setResourceNodes(prevNodes => prevNodes.map(node => {
                    const amountToDecrement = resourceDeltasThisTick[node.type];
                    if (!amountToDecrement) return node;
                    const newAmount = node.amount - amountToDecrement;
                    if (newAmount <= 0) {
                        const taskId = `gather-${node.id}`;
                        const task = tasksInProgress.find(t => t.id === taskId);
                        if(task) {
                            addToLog(`${task.payload?.villagerIds?.length || 0} villager(s) depleted a ${node.type} source, gaining ${Math.floor(node.amount)} ${node.type}.`, node.type);
                            setActivityStatus(`A ${node.type} source has been fully depleted.`);
                            completedTasks.push(task);
                        }
                        return null;
                    }
                    return { ...node, amount: newAmount };
                }).filter(Boolean) as ResourceNode[]);
            }

            const finalActiveTasks = tasksInProgress.filter(t => !completedTasks.some(ct => ct.id === t.id));
            setActiveTasks(finalActiveTasks);
            if (completedTasks.length > 0) completedTasks.forEach(handleTaskCompletion);
            
            animationFrameRef.current = requestAnimationFrame(gameLoop);
        };
        animationFrameRef.current = requestAnimationFrame(gameLoop);
        return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
    }, [gameState, activeTasks, resourceNodes, handleTaskCompletion, addToLog, updateResources, units.villagers, civilization, activeBuffs]);

    const handleNewEvent = useCallback(() => {
        if (!civilization || currentEvent) return;
        const event = getPredefinedGameEvent();
        setCurrentEvent(event);
        setActivityStatus('A new event requires your attention!');
    }, [civilization, currentEvent]);
    
    const scheduleNextEvent = useCallback(() => {
        if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
        eventTimerRef.current = setTimeout(() => handleNewEvent(), (10 + Math.random() * 15) * 1000);
    }, [handleNewEvent]);

    const generateResourceNodes = (existingPositions: Set<string>): ResourceNode[] => {
        const nodes: ResourceNode[] = [];
        const types: ResourceNodeType[] = ['food', 'wood', 'gold', 'stone'];
        const numNodes = 20 + Math.floor(Math.random() * 10);
        for (let i = 0; i < numNodes; i++) {
            let pos: {x: number, y: number};
            do { pos = { x: Math.floor(Math.random() * MAP_DIMENSIONS.width), y: Math.floor(Math.random() * MAP_DIMENSIONS.height) } } while (existingPositions.has(`${pos.x},${pos.y}`));
            existingPositions.add(`${pos.x},${pos.y}`);
            const type = types[Math.floor(Math.random() * types.length)];
            nodes.push({ id: `${Date.now()}-node-${i}`, type, position: pos, amount: Math.floor(Math.random() * 2001) + 500 });
        }
        return nodes;
    };

    const handleStartNewGame = async (saveName: string) => {
        if (allSaves.includes(saveName)) { addNotification(`A saga named "${saveName}" already exists.`); return; }
        setGameState(GameStatus.LOADING);
        setCurrentSaveName(saveName);
        
        const localAgeProgressionList = masterAgeList.filter(a => a.isActive);

        const civ = getPredefinedCivilization();
        setCivilization(civ);
        setResources({ food: 200, wood: 150, gold: 50, stone: 100 });
        const initialVillagers = getRandomNames('villager', 3).map(name => ({ id: `${Date.now()}-${name}`, name, currentTask: null }));
        setUnits({ villagers: initialVillagers, military: [] });
        const tcPosition = { x: Math.floor(MAP_DIMENSIONS.width / 2), y: Math.floor(MAP_DIMENSIONS.height / 2) };
        const tcInfo = masterBuildingList.find(b => b.id === 'townCenter')!;
        const initialTC = { id: `${Date.now()}-tc`, name: getRandomNames('building', 1)[0], position: tcPosition, currentHp: tcInfo.hp };
        setBuildings({...initialBuildingsState, townCenter: [initialTC]});
        setResourceNodes(generateResourceNodes(new Set([`${tcPosition.x},${tcPosition.y}`])));
        setCurrentAge(localAgeProgressionList[0]?.name || INITIAL_AGES[0].name);
        setGameLog([]); setCurrentEvent(null); setUnlimitedResources(false); setActiveTasks([]); setInventory([]); setActiveBuffs({ resourceBoost: [] });
        addToLog(`${civ.name} has been founded!`, 'system');
        addToLog('Your story begins...', 'system');
        setGameState(GameStatus.PLAYING);
        setActivityStatus('Your settlement awaits your command.');
    };

    const isVillagerBusy = useCallback((villagerId: string): boolean => !!units.villagers.find(v => v.id === villagerId)?.currentTask, [units.villagers]);

    const getVillagerTaskDetails = useCallback((villagerId: string): string => {
        const villager = units.villagers.find(v => v.id === villagerId);
        if (!villager?.currentTask) return 'Idle';
        const task = activeTasks.find(t => t.id === villager.currentTask);
        if (!task) return 'Idle (Finalizing Task)';
        if (task.type === 'build') return `Busy: Constructing ${buildingList.find(b => b.id === task.payload!.buildingType)?.name || 'a building'}`;
        if (task.type === 'gather') return `Busy: Gathering ${resourceNodes.find(n => n.id === task.payload!.resourceNodeId)?.type || 'resources'}`;
        return 'Idle';
    }, [activeTasks, resourceNodes, units.villagers, buildingList]);

    const handleResumeGame = async (saveName: string) => {
        const savedState = await loadGameState(saveName) as FullGameState;
        if (savedState) {
            setGameState(GameStatus.LOADING);
            setCurrentSaveName(saveName);
            setCivilization(savedState.civilization);
            setResources(savedState.resources);
            const migratedVillagers = (savedState.units.villagers || []).map(v => ({...v, currentTask: v.currentTask !== undefined ? v.currentTask : null}));
            const migratedTasks = (savedState.activeTasks || []).map(t => t.type === 'build' && !t.payload?.villagerIds ? { ...t, payload: { ...t.payload, villagerIds: [] } } : t);
            migratedTasks.forEach(task => task.payload?.villagerIds?.forEach(vid => { const v = migratedVillagers.find(v => v.id === vid); if(v) v.currentTask = task.id; }));
            setUnits({ ...savedState.units, villagers: migratedVillagers });
            
            const constructionTasks = migratedTasks.filter(t => t.type === 'build');
            const occupiedCells = new Set([...Object.values(savedState.buildings || {}).flat().map((b: any) => `${b.position.x},${b.position.y}`), ...constructionTasks.map(t => `${t.payload!.position!.x},${t.payload!.position!.y}`)]);
            let finalBuildings = { ...initialBuildingsState, ...(savedState.buildings || {}) };
            Object.keys(finalBuildings).forEach(bType => {
                const info = masterBuildingList.find(b => b.id === bType);
                if(info) finalBuildings[bType] = finalBuildings[bType].map(b => ({ ...b, currentHp: b.currentHp === undefined ? info.hp : b.currentHp }));
            });
            if (!finalBuildings.townCenter || finalBuildings.townCenter.length === 0) {
                let tcPos = { x: 10, y: 5 }; while (occupiedCells.has(`${tcPos.x},${tcPos.y}`)) { tcPos.x++; }
                const tcInfo = masterBuildingList.find(b => b.id === 'townCenter')!;
                finalBuildings.townCenter = [{ id: `${Date.now()}-tc`, name: getRandomNames('building', 1)[0], position: tcPos, currentHp: tcInfo.hp }];
                occupiedCells.add(`${tcPos.x},${tcPos.y}`);
            }
            setBuildings(finalBuildings);

            setResourceNodes((savedState.resourceNodes || []).length === 0 ? generateResourceNodes(occupiedCells) : (savedState.resourceNodes || []));
            setCurrentAge(savedState.currentAge); setGameLog(savedState.gameLog); setActiveTasks(migratedTasks);
            setInventory(savedState.inventory || []); setActiveBuffs(savedState.activeBuffs || { resourceBoost: [] });
            setCurrentEvent(null); setActivityStatus('Welcome back to your saga.');
            setGameState(GameStatus.PLAYING);
        } else {
            addNotification(`Could not find a saved game named "${saveName}".`);
        }
    };

    useEffect(() => {
        if (gameState !== GameStatus.PLAYING) return;
        if (!currentEvent) scheduleNextEvent();
        else if (eventTimerRef.current) clearTimeout(eventTimerRef.current);
        return () => { if (eventTimerRef.current) clearTimeout(eventTimerRef.current); };
    }, [gameState, currentEvent, scheduleNextEvent]);

    const handleEventChoice = (choice: GameEventChoice) => {
        if (choice.cost) {
            const missing = (Object.keys(choice.cost) as (keyof Resources)[]).filter(res => resources[res] < (choice.cost![res] || 0));
            if (missing.length > 0) { addNotification(`You lack the required resources: ${missing.join(', ')}.`); return; }
            updateResources(Object.entries(choice.cost).reduce((acc, [k, v]) => ({...acc, [k]: -v}), {}));
        }
        const isSuccess = choice.successChance === undefined || Math.random() < choice.successChance;
        const effects = isSuccess ? choice.successEffects : choice.failureEffects;
        if (!effects) { setCurrentEvent(null); scheduleNextEvent(); return; }

        let logMessage = `Decision: "${choice.text}". Outcome: ${isSuccess ? 'Success' : 'Failure'}. ${effects.log}`;
        effects.rewards.forEach((reward: Reward) => {
            if (reward.type === 'resource') {
                const amount = Array.isArray(reward.amount) ? Math.floor(Math.random() * (reward.amount[1] - reward.amount[0] + 1)) + reward.amount[0] : reward.amount;
                if (amount !== 0) { updateResources({ [reward.resource]: amount }); logMessage += ` You ${amount > 0 ? 'gained' : 'lost'} ${Math.abs(amount)} ${reward.resource}.`; }
            } else if (reward.type === 'item') {
                const itemInfo = GAME_ITEMS[reward.itemId];
                if (itemInfo) {
                    const newItems = Array.from({length: reward.amount}, (_, i) => ({ ...itemInfo, id: `${reward.itemId}-${Date.now()}-${i}` }));
                    setInventory(prev => [...prev, ...newItems]);
                    logMessage += ` You received ${reward.amount}x ${itemInfo.name}!`;
                }
            } else if (reward.type === 'unit' && reward.unitType === 'villager') {
                const newVillagers = getRandomNames('villager', reward.amount).map(name => ({ id: `${Date.now()}-${name}`, name, currentTask: null }));
                setUnits(p => ({ ...p, villagers: [...p.villagers, ...newVillagers] }));
                logMessage += ` You gained ${reward.amount} villager(s).`;
            } else if (reward.type === 'building') {
                const buildingInfo = buildingList.find(b => b.id === reward.buildingId);
                if (buildingInfo) {
                    const occupiedCells = new Set<string>();
                    Object.values(buildings).flat().forEach(b => occupiedCells.add(`${b.position.x},${b.position.y}`));
                    activeTasks.filter(t => t.type === 'build').forEach(t => t.payload?.position && occupiedCells.add(`${t.payload.position.x},${t.payload.position.y}`));
                    resourceNodes.forEach(n => occupiedCells.add(`${n.position.x},${n.position.y}`));
                    
                    let placed = false;
                    for (let i = 0; i < MAP_DIMENSIONS.width * MAP_DIMENSIONS.height; i++) {
                        const x = Math.floor(Math.random() * MAP_DIMENSIONS.width);
                        const y = Math.floor(Math.random() * MAP_DIMENSIONS.height);
                        if (!occupiedCells.has(`${x},${y}`)) {
                            const [name] = getRandomNames('building', 1);
                            const newBuilding: BuildingInstance = { id: `reward-${Date.now()}`, name, position: {x,y}, currentHp: buildingInfo.hp };
                            setBuildings(p => ({ ...p, [reward.buildingId as string]: [...(p[reward.buildingId as string] || []), newBuilding]}));
                            logMessage += ` You were gifted a new ${buildingInfo.name}!`;
                            placed = true;
                            break;
                        }
                    }
                    if (!placed) logMessage += ` You were to be gifted a ${buildingInfo.name}, but there was no room to build it!`;
                }
            }
        });
        
        addToLog(logMessage, 'event'); setActivityStatus(effects.log); setCurrentEvent(null); scheduleNextEvent();
    };

    const handleInitiateBuild = (villagerId: string, rect: DOMRect) => {
        if (isVillagerBusy(villagerId)) { addNotification("This villager is already busy."); return; }
        setBuildPanelState({ isOpen: true, villagerId, anchorRect: rect });
        setUnitManagementPanel({ isOpen: false, type: null, anchorRect: null });
    };
    
    const handleStartPlacement = (buildingId: BuildingType | string) => {
        const villagerId = buildPanelState.villagerId; if (!villagerId) return;
        const buildingInfo = buildingList.find(b => b.id === buildingId); if (!buildingInfo) return;

        const existingCount = buildings[buildingInfo.id as string]?.length || 0;
        const constructingCount = activeTasks.filter(t => t.type === 'build' && t.payload?.buildingType === buildingInfo.id).length;
        const totalCount = existingCount + constructingCount;
        const limit = buildingInfo.buildLimit || 0;

        if (limit > 0 && totalCount >= limit) {
            addNotification(`You have reached the build limit for ${buildingInfo.name} (${limit}).`);
            return;
        }

        const missing = unlimitedResources ? [] : (Object.keys(buildingInfo.cost) as (keyof Resources)[]).filter(res => resources[res] < (buildingInfo.cost[res] || 0));
        if (missing.length > 0) { addNotification(`Need more ${missing.join(', ')}.`); return; }
        
        setPlayerAction({ mode: 'build', buildingType: buildingId, villagerId });
        setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null });
        setActivityStatus(`Select a location to build a ${buildingInfo.name}. Right-click to cancel.`);
    };

    const handleConfirmPlacement = (position: { x: number; y: number }) => {
        if (playerAction?.mode !== 'build') return;
        const { buildingType, villagerId } = playerAction;
        const buildingInfo = buildingList.find(b => b.id === buildingType);
        const builder = units.villagers.find(v => v.id === villagerId);
        if (!buildingInfo || !builder) return;
        if (!unlimitedResources) updateResources(Object.entries(buildingInfo.cost).reduce((acc, [k, v]) => ({...acc, [k]: -v}), {}));
        
        let buildTime = buildingInfo.buildTime * 1000;
        if(activeBuffs.buildTimeReduction) {
            buildTime *= (1 - activeBuffs.buildTimeReduction.percentage);
            addToLog(`A Builder's Charm reduced construction time by ${activeBuffs.buildTimeReduction.percentage * 100}%!`, 'item');
            setActiveBuffs(prev => ({...prev, buildTimeReduction: prev.buildTimeReduction!.uses - 1 > 0 ? {...prev.buildTimeReduction!, uses: prev.buildTimeReduction!.uses - 1} : undefined }));
        }
        
        const taskId = `${Date.now()}-build-${buildingType}`;
        const taskPayload = { buildingType, villagerIds: [villagerId], position };
        if (unlimitedResources) {
             handleTaskCompletion({ id: taskId, type: 'build', startTime: 0, duration: 0, payload: { ...taskPayload, position } });
        } else {
            setActiveTasks(prev => [...prev, { id: taskId, type: 'build', startTime: Date.now(), duration: buildTime, payload: taskPayload }]);
            setUnits(prev => ({...prev, villagers: prev.villagers.map(v => v.id === villagerId ? {...v, currentTask: taskId} : v)}));
            setActivityStatus(`${builder.name} has started constructing a ${buildingInfo.name}.`);
            addToLog(`${builder.name} began construction of a new ${buildingInfo.name}.`, buildingInfo.iconId);
        }
        setPlayerAction(null);
    };

    const handleCancelPlayerAction = () => { setPlayerAction(null); setActivityStatus('Command cancelled.'); };

    const handleDemolishBuilding = (type: BuildingType | string, id: string) => {
        if (type === 'townCenter') { addNotification("The Town Center is the heart of your civilization and cannot be demolished."); return; }
        if(activeTasks.some(t => t.payload?.buildingId === id)) { addNotification("Cannot demolish a building with an active task."); return; }
        const buildingInfo = buildingList.find(b => b.id === type);
        const buildingInstance = buildings[type as string].find(b => b.id === id);
        if (!buildingInfo || !buildingInstance) return;
        if (type === 'houses' && population.current > (buildings.townCenter?.length > 0 ? 20 : 0) + (buildings.houses.length - 1) * 5) { addNotification("Cannot demolish this house, your people would be homeless."); return; }
        const refund = Object.entries(buildingInfo.cost).reduce((acc, [res, cost]) => { const amount = Math.floor((cost || 0) * 0.5); if (amount > 0) acc[res as keyof Resources] = amount; return acc; }, {} as ResourceDeltas);
        if (Object.keys(refund).length > 0) { updateResources(refund); addNotification(`Salvaged ${Object.entries(refund).map(([r,a]) => `${a} ${r}`).join(', ')}.`); }
        setBuildings(prev => ({ ...prev, [type as string]: prev[type as string].filter(b => b.id !== id) }));
        addToLog(`${buildingInstance.name} (${buildingInfo.name}) was demolished.`, buildingInfo.iconId);
        setBuildingManagementPanel({isOpen: false, type: null, instanceId: null, anchorRect: null });
    };

    const handleUpdateBuilding = (type: BuildingType | string, id: string, name: string) => {
        setBuildings(prev => ({ ...prev, [type as string]: prev[type as string].map(b => b.id === id ? { ...b, name } : b) }));
        addNotification("Building renamed.");
    };

    const handleTrainVillagers = (count: number) => {
        if (activeTasks.some(t => t.type === 'train_villager') || count <= 0) return;
        if (population.current + count > population.capacity) { addNotification(`Need space for ${count} more villagers.`); return; }
        if (!buildings.townCenter?.[0]) { addNotification(`No Town Center to train villagers.`); return; }
        if (!unlimitedResources) { const totalCost = 50 * count; if (resources.food < totalCost) { addNotification(`Need ${totalCost - resources.food} more Food.`); return; } updateResources({ food: -totalCost }); }
        
        if(unlimitedResources) handleTaskCompletion({ id: 'instant', type: 'train_villager', startTime: 0, duration: 0, payload: { count } });
        else {
            setActiveTasks(prev => [...prev, { id: `${Date.now()}-train-villager`, type: 'train_villager', startTime: Date.now(), duration: 10000 * count, payload: { count, buildingId: buildings.townCenter![0].id } }]);
            setActivityStatus(`Training ${count} villager(s)...`); addToLog(`Began training ${count} new villager(s).`, 'villager');
        }
        setBuildingManagementPanel({ isOpen: false, type: null, instanceId: null, anchorRect: null });
    };
    
    const handleTrainUnits = (unitType: MilitaryUnitType, count: number) => {
        const unitInfo = unitList.find(u => u.id === unitType);
        if (!unitInfo || activeTasks.some(t => t.payload?.unitType === unitType) || count <= 0) return;
        if (population.current + count > population.capacity) { addNotification(`Need space for ${count} more units.`); return; }
        const trainingBuilding = buildings[unitInfo.requiredBuilding as BuildingType]?.[0];
        if (!trainingBuilding) { addNotification(`No ${buildingList.find(b => b.id === unitInfo.requiredBuilding)?.name} to train units.`); return; }

        if (!unlimitedResources) {
            const missing = (Object.keys(unitInfo.cost) as (keyof Resources)[]).filter(res => resources[res] < (unitInfo.cost[res] || 0) * count);
            if (missing.length > 0) { addNotification(`Need more ${missing.join(' and ')}.`); return; }
            updateResources(Object.entries(unitInfo.cost).reduce((acc, [k, v]) => ({...acc, [k]: -(v || 0) * count}), {}));
        }
        
        let trainTime = unitInfo.trainTime * 1000 * count;
        if(activeBuffs.permanentTrainTimeReduction) trainTime *= (1 - activeBuffs.permanentTrainTimeReduction);
        if (activeBuffs.trainTimeReduction) {
            const applicable = Math.min(count, activeBuffs.trainTimeReduction.uses);
            trainTime = (unitInfo.trainTime * 1000 * applicable * (1 - activeBuffs.trainTimeReduction.percentage)) + (unitInfo.trainTime * 1000 * (count - applicable));
            if (activeBuffs.trainTimeReduction.uses - applicable > 0) setActiveBuffs(prev => ({...prev, trainTimeReduction: {...prev.trainTimeReduction!, uses: prev.trainTimeReduction!.uses - applicable}}));
            else { setActiveBuffs(prev => ({...prev, trainTimeReduction: undefined})); addToLog("The Drillmaster's Whistle buff has been fully used.", 'item'); }
        }
        
        if(unlimitedResources) handleTaskCompletion({ id: 'instant', type: 'train_military', startTime: 0, duration: 0, payload: { unitType, count } });
        else {
            setActiveTasks(prev => [...prev, { id: `${Date.now()}-train-${unitType}`, type: 'train_military', startTime: Date.now(), duration: trainTime, payload: { unitType, count, buildingId: trainingBuilding.id } }]);
            setActivityStatus(`Training ${count} ${unitInfo.name}(s)...`); addToLog(`Began training ${count} new ${unitInfo.name}(s).`, unitType);
        }
        setBuildingManagementPanel({ isOpen: false, type: null, instanceId: null, anchorRect: null });
    };

    const handleDismissSpecificUnit = (type: 'villagers' | 'military', id: string) => {
        if (type === 'villagers' && isVillagerBusy(id)) { addNotification("Cannot dismiss a busy villager."); return; }
        const unit = units[type].find(u => u.id === id); if (!unit) return;
        if (type === 'villagers' && units.villagers.length <= 1) { addNotification("Cannot dismiss your last villager."); return; }
        setUnits(prev => ({ ...prev, [type]: prev[type].filter(u => u.id !== id) }));
        const unitTypeName = type === 'villagers' ? 'villager' : (unit as MilitaryUnit).unitType;
        addToLog(`${unit.name} the ${unitTypeName} has been dismissed.`, type === 'villagers' ? 'villager' : (unit as MilitaryUnit).unitType);
        addNotification(`${unit.name} was dismissed.`);
    };

    const handleUpdateUnit = (type: 'villagers' | 'military', id: string, name: string, title?: string) => {
         setUnits(prev => ({ ...prev, [type]: prev[type].map(u => u.id === id ? (type === 'military' && title !== undefined ? { ...u, name, title } : { ...u, name }) : u)}));
        addNotification("Unit updated.");
    };

    const handleAssignVillagersToConstruction = (constructionId: string, count: number) => {
        const idleVillagers = units.villagers.filter(v => !v.currentTask);
        if (count <= 0 || idleVillagers.length === 0) { addNotification("No idle villagers available."); return; }
        const task = activeTasks.find(t => t.id === constructionId); if (!task || task.type !== 'build') return;
        const buildingInfo = buildingList.find(b => b.id === task.payload?.buildingType); if (!buildingInfo) return;

        const cappedCount = Math.min(count, idleVillagers.length);
        const villagersToAssign = idleVillagers.slice(0, cappedCount).map(v => v.id);
        const workDone = (Date.now() - task.startTime) * (task.payload?.villagerIds?.length || 1);
        const workRemaining = Math.max(0, (buildingInfo.buildTime * 1000) - workDone);
        const newWorkerCount = (task.payload?.villagerIds?.length || 0) + cappedCount;
        const newRemainingDuration = workRemaining / newWorkerCount;
        
        setUnits(prev => ({...prev, villagers: prev.villagers.map(v => villagersToAssign.includes(v.id) ? {...v, currentTask: constructionId} : v)}));
        setActiveTasks(prev => prev.map(t => t.id === constructionId ? { ...t, startTime: Date.now(), duration: newRemainingDuration, payload: { ...t.payload, villagerIds: [...t.payload!.villagerIds!, ...villagersToAssign] } } : t));
        addToLog(`${cappedCount} villager(s) are now assisting with the ${buildingInfo.name}.`, buildingInfo.iconId);
        setActivityStatus(`Construction of the ${buildingInfo.name} is now faster.`);
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };

    const handleAssignVillagers = (targetId: string, count: number) => {
        if (assignmentPanelState.targetType === 'construction') return handleAssignVillagersToConstruction(targetId, count);
        const idleVillagers = units.villagers.filter(v => !v.currentTask);
        if (count <= 0 || idleVillagers.length === 0) { addNotification("No idle villagers available."); return; }
        const targetNode = resourceNodes.find(n => n.id === targetId); if (!targetNode) return;
        const cappedCount = Math.min(count, idleVillagers.length);
        const villagersToAssign = idleVillagers.slice(0, cappedCount).map(v => v.id);
        const taskId = `gather-${targetId}`;
        const existingTask = activeTasks.find(t => t.id === taskId);
        
        if (unlimitedResources) {
            updateResources({ [targetNode.type]: targetNode.amount });
            addToLog(`${cappedCount} villager(s) instantly gathered ${Math.floor(targetNode.amount)} ${targetNode.type}.`, targetNode.type);
            setResourceNodes(prev => prev.filter(n => n.id !== targetId));
        } else {
            if (existingTask) setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, payload: { ...t.payload, villagerIds: [...new Set([...t.payload!.villagerIds!, ...villagersToAssign])] } } : t));
            else setActiveTasks(prev => [...prev, { id: taskId, type: 'gather', startTime: Date.now(), duration: 999999999, payload: { resourceNodeId: targetId, villagerIds: villagersToAssign } }]);
            setUnits(prev => ({...prev, villagers: prev.villagers.map(v => villagersToAssign.includes(v.id) ? {...v, currentTask: taskId} : v)}));
        }
        addToLog(`${cappedCount} villager(s) assigned to gather ${targetNode.type}.`, targetNode.type);
        setActivityStatus(`${cappedCount} villager(s) are now gathering ${targetNode.type}.`);
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };

    const handleRecallVillagers = (targetId: string, count: number, type: 'resource' | 'construction') => {
        const task = activeTasks.find(t => t.id === targetId);
        if (!task || (task.payload?.villagerIds?.length ?? 0) < count) return;
        
        const villagersToRecall = task.payload!.villagerIds!.slice(task.payload!.villagerIds!.length - count);
        if (type === 'construction' && villagersToRecall.length === task.payload!.villagerIds!.length) { addNotification("Cannot recall the last builder from a project."); return; }

        setUnits(prev => ({...prev, villagers: prev.villagers.map(v => villagersToRecall.includes(v.id) ? {...v, currentTask: null} : v)}));
        const remainingVillagers = task.payload!.villagerIds!.filter(id => !villagersToRecall.includes(id));
        
        if (remainingVillagers.length === 0) {
            setActiveTasks(prev => prev.filter(t => t.id !== targetId));
            const node = resourceNodes.find(n => n.id === targetId);
            if(node) addToLog(`All villagers recalled from gathering ${node.type}.`, 'villager');
        } else {
            const buildingInfo = buildingList.find(b => b.id === task.payload?.buildingType)!;
            const workDone = (Date.now() - task.startTime) * task.payload!.villagerIds!.length;
            const newRemainingDuration = (buildingInfo.buildTime * 1000 - workDone) / remainingVillagers.length;
            setActiveTasks(prev => prev.map(t => t.id === targetId ? { ...t, startTime: Date.now(), duration: newRemainingDuration, payload: { ...t.payload, villagerIds: remainingVillagers } } : t));
            if (type === 'construction') addToLog(`${count} builder(s) recalled. Construction will now be slower.`, 'villager');
        }
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };

    const handleAdvanceAge = async () => {
        if (activeTasks.some(t => t.type === 'advance_age')) { addNotification("Advancement already in progress."); return; }
        if (!unlimitedResources) {
            const missing = [];
            if (resources.food < 500) missing.push(`${500 - resources.food} Food`);
            if (resources.gold < 200) missing.push(`${200 - resources.gold} Gold`);
            if (missing.length > 0) { addNotification(`To advance, you need ${missing.join(' and ')}.`); return; }
            updateResources({ food: -500, gold: -200 });
        }
        const activeAges = masterAgeList.filter(a => a.isActive);
        const currentIndex = activeAges.findIndex(age => age.name === currentAge);
        if (currentIndex === -1 || currentIndex + 1 >= activeAges.length) { addNotification("You have reached the final available age."); return; }

        if(unlimitedResources) handleTaskCompletion({ id: 'instant', type: 'advance_age', startTime: 0, duration: 0, payload: {} });
        else {
            setActiveTasks(prev => [...prev, { id: `${Date.now()}-advance_age`, type: 'advance_age', startTime: Date.now(), duration: 60000 }]);
            setActivityStatus(`Your people begin the long journey to a new age.`);
            setBuildingManagementPanel({ isOpen: false, type: null, instanceId: null, anchorRect: null });
        }
    };
    
    const handleExitGame = async () => { setCurrentSaveName(null); await fetchSavesAndConfigs(); setGameState(GameStatus.MENU); };
    const handleDeleteGame = async (saveName: string) => { await deleteGameState(saveName); await fetchSavesAndConfigs(); addNotification(`Deleted saga: "${saveName}"`); };

    const handleToggleUnlimitedResources = () => {
        const newMode = !unlimitedResources;
        setUnlimitedResources(newMode);
        if (newMode) {
            setResources({ food: 99999, wood: 99999, gold: 99999, stone: 99999 });
            addNotification("Test Mode: ON - All active tasks completed.");
            const depletedNodeIds = new Set<string>();
            activeTasks.forEach(task => {
                if (task.type === 'gather' && task.payload?.resourceNodeId) {
                    depletedNodeIds.add(task.payload.resourceNodeId);
                    const node = resourceNodes.find(n => n.id === task.payload.resourceNodeId);
                    if (node) addToLog(`Instantly gathered all ${node.type} from a depleted source.`, node.type);
                }
                handleTaskCompletion(task);
            });
            setActiveTasks([]);
            if (depletedNodeIds.size > 0) setResourceNodes(prev => prev.filter(n => !depletedNodeIds.has(n.id)));
        } else addNotification("Test Mode: OFF");
    };
    
    const handleUseItem = (itemId: string) => {
        const item = inventory.find(i => i.id === itemId); if (!item) return;
        const baseItemId = item.id.split('-')[0];
        const constructionTasks = activeTasks.filter(t => t.type === 'build');
        switch(baseItemId) {
            case 'scroll_of_haste': case 'blueprint_of_the_master':
                if (constructionTasks.length > 0) {
                    const task = constructionTasks.sort((a,b) => (b.startTime + b.duration) - (a.startTime + a.duration))[0];
                    setActiveTasks(p => p.map(t => t.id === task.id ? { ...t, duration: Math.max(0, t.duration - (baseItemId === 'scroll_of_haste' ? 15000 : 60000)) } : t));
                    addToLog(`Used ${item.name} on the ${buildingList.find(b => b.id === task.payload?.buildingType)?.name}.`, 'item');
                } break;
            case 'hearty_meal': updateResources({ food: 75 }); addToLog(`Used ${item.name} to gain 75 food.`, 'item'); break;
            case 'builders_charm': setActiveBuffs(p => ({...p, buildTimeReduction: { percentage: 0.1, uses: 1 }})); addToLog(`Used ${item.name}. Next building is 10% faster.`, 'item'); break;
            case 'drillmasters_whistle': setActiveBuffs(p => ({...p, trainTimeReduction: { percentage: 0.25, uses: 5 }})); addToLog(`Used ${item.name}. Next 5 units train 25% faster.`, 'item'); break;
            case 'golden_harvest': setActiveBuffs(p => ({...p, resourceBoost: [...(p.resourceBoost || []), { resource: 'food', multiplier: 1.5, endTime: Date.now() + 60000 }]})); addToLog(`Used ${item.name}. Food gathering boosted by 50% for 60s.`, 'item'); break;
            case 'shard_of_the_ancients':
                if (constructionTasks.length > 0) {
                    const task = constructionTasks.sort((a,b) => (b.startTime + b.duration) - (a.startTime + a.duration))[0];
                    setActiveTasks(p => p.filter(t => t.id !== task.id)); handleTaskCompletion(task);
                    addToLog(`Used ${item.name} to instantly complete the ${buildingList.find(b => b.id === task.payload?.buildingType)?.name}.`, 'item');
                } break;
            case 'heart_of_the_mountain':
                setActiveBuffs(p => ({...p, resourceBoost: [...(p.resourceBoost || []), { resource: 'gold', multiplier: 2, endTime: Date.now() + 120000 }, { resource: 'stone', multiplier: 2, endTime: Date.now() + 120000 }]}));
                addToLog(`Used ${item.name}. Gold and Stone gathering doubled for 2 minutes.`, 'item'); break;
            case 'banner_of_command':
                setActiveBuffs(p => ({...p, permanentTrainTimeReduction: (p.permanentTrainTimeReduction || 0) + 0.05}));
                addToLog(`Used ${item.name}. Military units train 5% faster, permanently.`, 'item'); break;
            case 'whisper_of_the_creator':
                const tasks = [...activeTasks]; setActiveTasks([]); tasks.forEach(handleTaskCompletion);
                addToLog(`A divine whisper echoes, and all work is instantly finished.`, 'item'); break;
        }
        setInventory(prev => prev.filter(i => i.id !== itemId)); setInventoryPanelState({isOpen: false, anchorRect: null});
    };
    
    const buildingCounts = buildingList.reduce((acc, b) => { acc[b.id] = buildings[b.id as string]?.length || 0; return acc; }, {} as Record<string, number>);
    const idleVillagerCount = units.villagers.filter(v => !v.currentTask).length;
    const assignmentTarget = assignmentPanelState.targetType === 'resource' ? resourceNodes.find(n => n.id === assignmentPanelState.targetId) : activeTasks.find(t => t.type === 'build' && t.id === assignmentPanelState.targetId);
    
    const currentAgeIndex = ageProgressionList.findIndex(a => a.name === currentAge);
    const availableBuildings = buildingList.filter(b => {
        const unlockAgeIndex = ageProgressionList.findIndex(a => a.name === b.unlockedInAge);
        return b.isActive && unlockAgeIndex !== -1 && unlockAgeIndex <= currentAgeIndex;
    });

    const activeUnits = unitList.filter(u => u.isActive);

    const closeAllPanels = useCallback(() => {
        setUnitManagementPanel(p => p.isOpen ? { isOpen: false, type: null, anchorRect: null } : p);
        setBuildingManagementPanel(p => p.isOpen ? { isOpen: false, type: null, instanceId: null, anchorRect: null } : p);
        setBuildPanelState(p => p.isOpen ? { isOpen: false, villagerId: null, anchorRect: null } : p);
        setAssignmentPanelState(p => p.isOpen ? { isOpen: false, targetId: null, targetType: null, anchorRect: null } : p);
        setCivPanelState(p => p.isOpen ? { isOpen: false, anchorRect: null } : p);
        setAllBuildingsPanel(p => p.isOpen ? { isOpen: false, anchorRect: null } : p);
        setInventoryPanelState(p => p.isOpen ? { isOpen: false, anchorRect: null } : p);
    }, []);

    const handleOpenBuildingPanel = useCallback((type: BuildingType | string, instanceId: string, rect: DOMRect) => {
        closeAllPanels();
        setBuildingManagementPanel({ isOpen: true, type, instanceId, anchorRect: rect });
    }, [closeAllPanels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.sci-fi-panel-popup')) closeAllPanels();
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [closeAllPanels]);

    const renderContent = () => {
        if (isAppLoading) {
            return <LoadingScreen />;
        }

        switch (gameState) {
            case GameStatus.MENU: return <StartScreen onNewGame={handleStartNewGame} onResumeGame={handleResumeGame} savedGames={allSaves} onDeleteGame={handleDeleteGame} />;
            case GameStatus.LOADING: return <LoadingScreen />;
            case GameStatus.PLAYING:
                if (!civilization) return <LoadingScreen />;
                return (
                    <>
                        <GameUI
                            civilization={civilization} resources={resources} units={units} buildings={buildings} population={population} currentAge={currentAge} gameLog={gameLog} resourceDeltas={resourceDeltas} activityStatus={activityStatus} unitList={activeUnits} buildingList={buildingList}
                            onOpenUnitPanel={(type, rect) => { closeAllPanels(); setUnitManagementPanel({ isOpen: true, type, anchorRect: rect }); }}
                            onOpenBuildingPanel={handleOpenBuildingPanel}
                            onOpenAllBuildingsPanel={(rect) => { closeAllPanels(); setAllBuildingsPanel({ isOpen: true, anchorRect: rect }); }}
                            playerAction={playerAction} onConfirmPlacement={handleConfirmPlacement} onCancelPlayerAction={handleCancelPlayerAction}
                            onBuildingClick={(building, rect) => { closeAllPanels(); const type = Object.keys(buildings).find(key => buildings[key as string]?.some(b => b.id === building.id)); if(type) setBuildingManagementPanel({ isOpen: true, type, instanceId: building.id, anchorRect: rect }); }}
                            mapDimensions={MAP_DIMENSIONS} activeTasks={activeTasks} onExitGame={handleExitGame}
                            onOpenCivPanel={(rect) => { closeAllPanels(); setCivPanelState({ isOpen: true, anchorRect: rect }); }}
                            resourceNodes={resourceNodes}
                            onOpenAssignmentPanel={(nodeId, rect) => { closeAllPanels(); setAssignmentPanelState({ isOpen: true, targetId: nodeId, targetType: 'resource', anchorRect: rect }); }}
                            onOpenConstructionPanel={(constructionId, rect) => { closeAllPanels(); setAssignmentPanelState({ isOpen: true, targetId: constructionId, targetType: 'construction', anchorRect: rect }); }}
                            gatherInfo={GATHER_INFO} currentEvent={currentEvent} onEventChoice={handleEventChoice} inventory={inventory}
                            onOpenInventoryPanel={(rect) => { closeAllPanels(); setInventoryPanelState({ isOpen: true, anchorRect: rect }); }}
                        />
                        <BuildPanel isOpen={buildPanelState.isOpen} onClose={() => setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null })} onStartPlacement={handleStartPlacement} resources={resources} buildingCounts={buildingCounts} buildingList={availableBuildings} anchorRect={buildPanelState.anchorRect} />
                        <UnitManagementPanel isOpen={unitManagementPanel.isOpen} onClose={() => setUnitManagementPanel({ isOpen: false, type: null, anchorRect: null })} type={unitManagementPanel.type} units={units} onUpdateUnit={handleUpdateUnit} onDismissUnit={handleDismissSpecificUnit} onInitiateBuild={(villagerId, rect) => { closeAllPanels(); handleInitiateBuild(villagerId, rect); }} getVillagerTaskDetails={getVillagerTaskDetails} anchorRect={unitManagementPanel.anchorRect} />
                        <BuildingManagementPanel isOpen={buildingManagementPanel.isOpen} onClose={() => setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null })} panelState={buildingManagementPanel} buildings={buildings} buildingList={buildingList} onUpdateBuilding={handleUpdateBuilding} onDemolishBuilding={handleDemolishBuilding} onTrainUnits={handleTrainUnits} onTrainVillagers={handleTrainVillagers} resources={resources} population={population} unitList={activeUnits} onAdvanceAge={handleAdvanceAge} activeTasks={activeTasks} anchorRect={buildingManagementPanel.anchorRect} />
                        <ResourceAssignmentPanel isOpen={assignmentPanelState.isOpen} onClose={() => setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null })} assignmentTarget={assignmentTarget || null} idleVillagerCount={idleVillagerCount} onAssignVillagers={handleAssignVillagers} onRecallVillagers={handleRecallVillagers} gatherInfo={GATHER_INFO} buildingList={buildingList} units={units} anchorRect={assignmentPanelState.anchorRect} />
                        <CivilizationPanel isOpen={civPanelState.isOpen} onClose={() => setCivPanelState({ isOpen: false, anchorRect: null })} civilization={civilization} anchorRect={civPanelState.anchorRect} />
                        <AllBuildingsPanel isOpen={allBuildingsPanel.isOpen} onClose={() => setAllBuildingsPanel({ isOpen: false, anchorRect: null })} buildingList={buildingList} buildingCounts={buildingCounts} activeTasks={activeTasks} onOpenBuildingPanel={handleOpenBuildingPanel} anchorRect={allBuildingsPanel.anchorRect} />
                        <InventoryPanel isOpen={inventoryPanelState.isOpen} onClose={() => setInventoryPanelState({ isOpen: false, anchorRect: null })} inventory={inventory} onUseItem={handleUseItem} activeTasks={activeTasks} activeBuffs={activeBuffs} anchorRect={inventoryPanelState.anchorRect} />
                    </>
                );
            default: return <StartScreen onNewGame={handleStartNewGame} onResumeGame={handleResumeGame} savedGames={allSaves} onDeleteGame={handleDeleteGame} />;
        }
    };

    return (
        <div className="min-h-screen bg-stone-dark flex items-center justify-center p-4">
            {gameState === GameStatus.PLAYING && (
                 <button onClick={handleToggleUnlimitedResources} className="fixed bottom-4 left-4 z-[101] bg-brand-gold text-stone-dark font-bold py-1 px-3 rounded-full text-xs shadow-lg hover:scale-105 transition-transform" aria-label="Toggle unlimited resources test mode">Test Mode: {unlimitedResources ? 'ON' : 'OFF'}</button>
            )}
            <NotificationManager notifications={notifications} onRemoveNotification={removeNotification} />
            <main className="w-full max-w-7xl mx-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default GamePage;
