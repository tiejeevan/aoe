
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GameStatus, type Civilization, type Resources, type Units, type Buildings, type GameEvent, type GameLogEntry, type LogIconType, type ResourceDeltas, BuildingType, BuildingInfo, UINotification, FullGameState, Villager, MilitaryUnit, UnitInfo, MilitaryUnitType, GameTask, ConstructingBuilding, TaskType, ResourceNode, ResourceNodeType, PlayerActionState } from '@/types';
import { getPredefinedCivilization, getPredefinedGameEvent, getPredefinedAge } from '@/services/geminiService';
import { saveGameState, loadGameState, getAllSaveNames } from '@/services/dbService';
import { getRandomNames } from '@/services/nameService';
import GameUI from '@/components/GameUI';
import StartScreen from '@/components/StartScreen';
import LoadingScreen from '@/components/LoadingScreen';
import BuildPanel from '@/components/BuildPanel';
import NotificationManager from '@/components/NotificationManager';
import UnitManagementPanel from '@/components/UnitManagementPanel';
import BuildingManagementPanel from '@/components/BuildingManagementPanel';
import ResourceAssignmentPanel from '@/components/ResourceAssignmentPanel';
import SettingsPanel from '@/components/SettingsPanel';
import CivilizationPanel from '@/components/CivilizationPanel';

const BUILDINGS_INFO: BuildingInfo[] = [
    { id: 'houses', name: 'House', description: 'Increases population capacity by 5.', cost: { wood: 50 }, isUnique: false, buildTime: 15 },
    { id: 'barracks', name: 'Barracks', description: 'Allows training of Swordsmen.', cost: { wood: 150, stone: 50 }, isUnique: true, buildTime: 60 },
    { id: 'archeryRange', name: 'Archery Range', description: 'Allows training of Archers.', cost: { wood: 175 }, isUnique: true, buildTime: 60 },
    { id: 'stable', name: 'Stables', description: 'Allows training of Knights.', cost: { wood: 175, gold: 75 }, isUnique: true, buildTime: 75 },
    { id: 'siegeWorkshop', name: 'Siege Workshop', description: 'Constructs powerful Catapults.', cost: { wood: 200, gold: 150 }, isUnique: true, buildTime: 90 },
    { id: 'blacksmith', name: 'Blacksmith', description: 'Researches infantry and cavalry upgrades.', cost: { wood: 100, gold: 100 }, isUnique: true, buildTime: 45 },
    { id: 'watchTower', name: 'Watch Tower', description: 'Provides defense against raids.', cost: { stone: 125 }, isUnique: true, buildTime: 45 },
    { id: 'townCenter', name: 'Town Center', description: 'The heart of your settlement.', cost: {}, isUnique: true, buildTime: 0 }
];

const UNIT_INFO: UnitInfo[] = [
    { id: 'swordsman', name: 'Swordsman', description: 'Basic melee infantry.', cost: { food: 60, gold: 20 }, requiredBuilding: 'barracks', trainTime: 22 },
    { id: 'archer', name: 'Archer', description: 'Ranged unit effective against infantry.', cost: { food: 30, wood: 40 }, requiredBuilding: 'archeryRange', trainTime: 25 },
    { id: 'knight', name: 'Knight', description: 'Fast and powerful cavalry.', cost: { food: 60, gold: 75 }, requiredBuilding: 'stable', trainTime: 30 },
    { id: 'catapult', name: 'Catapult', description: 'Siege engine devastating to buildings.', cost: { wood: 150, gold: 150 }, requiredBuilding: 'siegeWorkshop', trainTime: 45 },
];

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
    const [gameState, setGameState] = useState<GameStatus>(GameStatus.MENU);
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
    const [constructingBuildings, setConstructingBuildings] = useState<ConstructingBuilding[]>([]);
    const [resourceNodes, setResourceNodes] = useState<ResourceNode[]>([]);
    const [panelOpacity, setPanelOpacity] = useState(1.0);
    
    // Panel States
    const [buildPanelState, setBuildPanelState] = useState<{ isOpen: boolean; villagerId: string | null; anchorRect: DOMRect | null }>({ isOpen: false, villagerId: null, anchorRect: null });
    const [unitManagementPanel, setUnitManagementPanel] = useState<{ isOpen: boolean; type: 'villagers' | 'military' | null; anchorRect: DOMRect | null; }>({ isOpen: false, type: null, anchorRect: null });
    const [buildingManagementPanel, setBuildingManagementPanel] = useState<{ isOpen: boolean; type: BuildingType | null; instanceId?: string; anchorRect: DOMRect | null; }>({ isOpen: false, type: null, anchorRect: null });
    const [assignmentPanelState, setAssignmentPanelState] = useState<{ isOpen: boolean; targetId: string | null; targetType: 'resource' | 'construction' | null; anchorRect: DOMRect | null; }>({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    const [settingsPanelState, setSettingsPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });
    const [civPanelState, setCivPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });


    const deltaTimeoutRef = useRef<{ [key in keyof Resources]?: number }>({});

    const population = {
        current: units.villagers.length + units.military.length,
        capacity: (buildings.townCenter?.length > 0 ? 20 : 0) + buildings.houses.length * 5,
    };
    
    const fetchSaves = useCallback(async () => {
        const names = await getAllSaveNames();
        setAllSaves(names);
    }, []);
    
    useEffect(() => {
        fetchSaves();
    }, [fetchSaves]);
    
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
                constructingBuildings,
                resourceNodes,
            };
            saveGameState(currentSaveName, fullState);
        }
    }, [civilization, resources, units, buildings, currentAge, gameLog, gameState, currentSaveName, activeTasks, constructingBuildings, resourceNodes]);

    const addNotification = useCallback((message: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        setNotifications(prev => [...prev, { id, message }]);
    }, []);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const addToLog = (message: string, icon: LogIconType) => {
        setGameLog(prev => [{ id: `${Date.now()}-${Math.random()}`, message, icon }, ...prev.slice(0, 19)]);
    };
    
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

    const handleNewEvent = useCallback(() => {
        if (!civilization || currentEvent || activeTasks.length > 0) return;
        
        addToLog('A new chapter unfolds...', 'event');
        const event = getPredefinedGameEvent();
        setCurrentEvent(event);
        setActivityStatus('A new event requires your attention!');
    }, [civilization, currentEvent, activeTasks.length]);
    
    const generateResourceNodes = (existingPositions: Set<string>): ResourceNode[] => {
        const nodes: ResourceNode[] = [];
        const types: ResourceNodeType[] = ['food', 'wood', 'gold', 'stone'];
        const numNodes = 20 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < numNodes; i++) {
            let pos: {x: number, y: number};
            do {
                pos = {
                    x: Math.floor(Math.random() * MAP_DIMENSIONS.width),
                    y: Math.floor(Math.random() * MAP_DIMENSIONS.height),
                }
            } while (existingPositions.has(`${pos.x},${pos.y}`));
            
            existingPositions.add(`${pos.x},${pos.y}`);
            
            const type = types[Math.floor(Math.random() * types.length)];
            const amount = Math.floor(Math.random() * (2500 - 500 + 1)) + 500;

            nodes.push({ id: `${Date.now()}-node-${i}`, type, position: pos, amount, assignedVillagers: [] });
        }
        return nodes;
    };

    const handleStartNewGame = (saveName: string) => {
        if (allSaves.includes(saveName)) {
            addNotification(`A saga named "${saveName}" already exists.`); return;
        }
        setGameState(GameStatus.LOADING);
        setCurrentSaveName(saveName);

        const civ = getPredefinedCivilization();
        setCivilization(civ);
        setResources({ food: 200, wood: 150, gold: 50, stone: 100 });
        const initialVillagerNames = getRandomNames('villager', 3);
        const initialVillagers: Villager[] = initialVillagerNames.map(name => ({ id: `${Date.now()}-${name}`, name }));
        setUnits({ villagers: initialVillagers, military: [] });
        const [initialTCName] = getRandomNames('building', 1);
        const tcPosition = { x: Math.floor(MAP_DIMENSIONS.width / 2), y: Math.floor(MAP_DIMENSIONS.height / 2) };
        const initialTC: BuildingInstance = { id: `${Date.now()}-tc`, name: initialTCName, position: tcPosition };
        setBuildings({...initialBuildingsState, townCenter: [initialTC]});
        setResourceNodes(generateResourceNodes(new Set([`${tcPosition.x},${tcPosition.y}`])));
        setCurrentAge('Nomadic Age');
        setGameLog([]);
        setCurrentEvent(null);
        setUnlimitedResources(false);
        setActiveTasks([]);
        setConstructingBuildings([]);
        addToLog(`${civ.name} has been founded!`, 'system');
        addToLog('Your story begins...', 'system');
        setGameState(GameStatus.PLAYING);
        setActivityStatus('Your settlement awaits your command.');
        fetchSaves();
    };

    const getVillagerTaskDetails = useCallback((villagerId: string): string => {
        const task = activeTasks.find(t => t.payload?.villagerIds?.includes(villagerId));

        if (task) {
            if (task.type === 'build') {
                const buildingInfo = BUILDINGS_INFO.find(b => b.id === task.payload!.buildingType);
                return `Busy: Constructing ${buildingInfo?.name || 'a building'}`;
            }
            if (task.type === 'gather') {
                const node = resourceNodes.find(n => n.id === task.payload!.resourceNodeId);
                return `Busy: Gathering ${node?.type || 'resources'}`;
            }
        }
        
        return 'Idle';
    }, [activeTasks, resourceNodes]);

    const isVillagerBusy = useCallback((villagerId: string) => {
        return getVillagerTaskDetails(villagerId) !== 'Idle';
    }, [getVillagerTaskDetails]);

    const handleResumeGame = async (saveName: string) => {
        const savedState = await loadGameState(saveName) as FullGameState;
        if (savedState) {
            setGameState(GameStatus.LOADING);
            setCurrentSaveName(saveName);
            setCivilization(savedState.civilization);
            setResources(savedState.resources);
            
            if ((savedState.units as any)?.soldiers) {
                 const migratedMilitary: MilitaryUnit[] = (savedState.units as any).soldiers.map((s: any) => ({ ...s, unitType: 'swordsman' }));
                 setUnits({ villagers: savedState.units.villagers || [], military: migratedMilitary });
            } else {
                 setUnits(savedState.units || { villagers: [], military: [] });
            }
            
            let finalBuildings = { ...initialBuildingsState, ...(savedState.buildings || {}) };
            
            const occupiedCells = new Set(Object.values(finalBuildings).flat().map((b: any) => `${b.position.x},${b.position.y}`));

            if (!finalBuildings.townCenter || finalBuildings.townCenter.length === 0) {
                let tcPos = { x: 10, y: 5 };
                while (occupiedCells.has(`${tcPos.x},${tcPos.y}`)) { tcPos.x++; }
                const [tcName] = getRandomNames('building', 1);
                finalBuildings.townCenter = [{ id: `${Date.now()}-tc`, name: tcName, position: tcPos }];
                occupiedCells.add(`${tcPos.x},${tcPos.y}`);
            }

            const firstBuilding = Object.values(finalBuildings).flat()[0];
            if (firstBuilding && typeof firstBuilding === 'object' && !('position' in firstBuilding)) {
                const migrated = { ...initialBuildingsState };
                let y = 3;
                Object.entries(finalBuildings).forEach(([type, instances]) => {
                    let x = 5;
                    (instances as BuildingInstance[]).forEach(inst => {
                        while (occupiedCells.has(`${x},${y}`)) { x++; }
                        (migrated[type as BuildingType] as BuildingInstance[]).push({ ...inst, position: { x, y } });
                        occupiedCells.add(`${x},${y}`);
                        x++;
                    });
                });
                finalBuildings = migrated;
            }
            
            setBuildings(finalBuildings);

            const nodesToSet = (savedState.resourceNodes || []).map(n => ({...n, assignedVillagers: n.assignedVillagers || []}));
            if (nodesToSet.length === 0) {
                 setResourceNodes(generateResourceNodes(occupiedCells));
            } else {
                 setResourceNodes(nodesToSet);
            }

            setCurrentAge(savedState.currentAge);
            setGameLog(savedState.gameLog);
            setActiveTasks((savedState.activeTasks || []).map(t => {
                // Migration for old save format
                if (t.type === 'build' && t.payload?.villagerId) {
                    return { ...t, payload: { ...t.payload, villagerIds: [t.payload.villagerId], villagerId: undefined } };
                }
                return t;
            }));
            setConstructingBuildings((savedState.constructingBuildings || []).map(c => {
                 // Migration for old save format
                if ((c as any).villagerId) {
                    return { ...c, villagerIds: [(c as any).villagerId], villagerId: undefined };
                }
                return c;
            }));
            
            setCurrentEvent(null);
            setActivityStatus('Welcome back to your saga.');
            setGameState(GameStatus.PLAYING);
        } else {
            addNotification(`Could not find a saved game named "${saveName}".`);
        }
    };

    const handleTaskCompletion = useCallback((task: GameTask) => {
        switch (task.type) {
            case 'build': {
                const { buildingType, position, villagerIds } = task.payload!;
                const buildingInfo = BUILDINGS_INFO.find(b => b.id === buildingType)!;
                const [name] = getRandomNames('building', 1);
                const newBuilding: BuildingInstance = { id: task.id, name, position: position! };
                
                setConstructingBuildings(prev => prev.filter(b => b.id !== task.id));
                setBuildings(p => ({ ...p, [buildingType!]: [...p[buildingType!], newBuilding] }));
                
                if (villagerIds && villagerIds.length > 0) {
                    addToLog(`${villagerIds.length} builder(s) have constructed ${name}, a new ${buildingInfo.name}.`, buildingType!);
                    setActivityStatus(`Construction of ${name} is complete.`);
                }
                break;
            }
            case 'gather': {
                const { resourceNodeId } = task.payload!;

                setResourceNodes(prevNodes => {
                    const node = prevNodes.find(n => n.id === resourceNodeId);
                    
                    if (!node) {
                        console.warn(`Gather task completed for a non-existent or already processed node: ${resourceNodeId}`);
                        return prevNodes;
                    }
            
                    const amountToAdd = Math.floor(node.amount);
                    
                    if (amountToAdd > 0) {
                        updateResources({ [node.type]: amountToAdd });
                        addToLog(`${node.assignedVillagers.length} villager(s) depleted a ${node.type} source, gaining ${amountToAdd} ${node.type}.`, node.type);
                        setActivityStatus(`A ${node.type} source has been fully depleted.`);
                    }
                    
                    return prevNodes.filter(n => n.id !== resourceNodeId);
                });
                break;
            }
            case 'train_villager': {
                const { count } = task.payload!;
                const newVillagerNames = getRandomNames('villager', count!);
                const newVillagers: Villager[] = newVillagerNames.map(name => ({ id: `${Date.now()}-${name}`, name }));
                setUnits(p => ({ ...p, villagers: [...p.villagers, ...newVillagers] }));
                addToLog(`${count} new villager(s) have joined your settlement.`, 'villager');
                setActivityStatus(`${count} new villager(s) are ready to work.`);
                break;
            }
            case 'train_military': {
                 const { unitType, count } = task.payload!;
                 const unitInfo = UNIT_INFO.find(u => u.id === unitType)!;
                 const newUnitNames = getRandomNames('soldier', count!);
                 const newUnits: MilitaryUnit[] = newUnitNames.map(name => ({ id: `${Date.now()}-${unitType}-${name}`, name, title: '', unitType: unitType! }));
                 setUnits(p => ({ ...p, military: [...p.military, ...newUnits] }));
                 addToLog(`${count} ${unitInfo.name}(s) have been trained.`, unitType!);
                 setActivityStatus(`${count} new ${unitInfo.name}(s) are ready for battle.`);
                 break;
            }
            case 'advance_age': {
                const ageResult = getPredefinedAge(currentAge);
                setCurrentAge(ageResult.nextAgeName);
                addToLog(`You have advanced to the ${ageResult.nextAgeName}!`, 'age');
                addToLog(ageResult.description, 'age');
                setActivityStatus(`Welcome to the ${ageResult.nextAgeName}!`);
                break;
            }
        }
    }, [currentAge, updateResources]);

    // Game Loop
    useEffect(() => {
        const gameLoop = setInterval(() => {
            const now = Date.now();
            const completedTasks: GameTask[] = [];
            setActiveTasks(currentTasks => {
                return currentTasks.filter(task => {
                    if (now >= task.startTime + task.duration) {
                        completedTasks.push(task);
                        return false;
                    }
                    return true;
                });
            });

            if (completedTasks.length > 0) {
                completedTasks.forEach(handleTaskCompletion);
            }
        }, 1000);

        return () => clearInterval(gameLoop);
    }, [handleTaskCompletion]);


    useEffect(() => {
        if (gameState === GameStatus.PLAYING && !currentEvent && !playerAction && activeTasks.length === 0) {
            const timer = setTimeout(() => handleNewEvent(), 30000);
            return () => clearTimeout(timer);
        }
    }, [gameState, currentEvent, handleNewEvent, playerAction, activeTasks]);

    const handleEventChoice = (choice: GameEvent['choices'][0]) => {
        addToLog(`Choice: ${choice.text}.`, 'event');
        setActivityStatus(choice.effects.log);
        addToLog(choice.effects.log, choice.effects.resource !== 'none' ? choice.effects.resource as LogIconType : 'system');
        if (choice.effects.resource !== 'none') {
            updateResources({ [choice.effects.resource]: choice.effects.amount });
        }
        setCurrentEvent(null);
    };

    const handleInitiateBuild = (villagerId: string, rect: DOMRect) => {
        if (isVillagerBusy(villagerId)) {
            addNotification("This villager is already busy.");
            return;
        }
        setBuildPanelState({ isOpen: true, villagerId, anchorRect: rect });
        setUnitManagementPanel({ isOpen: false, type: null, anchorRect: null });
    };
    
    const handleStartPlacement = (buildingId: BuildingType) => {
        const villagerId = buildPanelState.villagerId;
        if (!villagerId) return;

        const buildingInfo = BUILDINGS_INFO.find(b => b.id === buildingId);
        if (!buildingInfo) return;

        if (buildingInfo.isUnique && (buildings[buildingInfo.id].length > 0 || constructingBuildings.some(b => b.type === buildingInfo.id))) {
            addNotification(`You can only build one ${buildingInfo.name}.`); return;
        }
        
        const cost = buildingInfo.cost;
        if (!unlimitedResources) {
            const missing: string[] = [];
            for (const res in cost) {
                const resourceKey = res as keyof Resources;
                if (resources[resourceKey] < (cost[resourceKey] ?? 0)) {
                     missing.push(`${(cost[resourceKey] ?? 0) - resources[resourceKey]} ${resourceKey}`);
                }
            }
             if (missing.length > 0) {
                addNotification(`Need ${missing.join(' and ')}.`); return;
            }
        }
        setPlayerAction({ mode: 'build', buildingType: buildingId, villagerId });
        setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null });
        setActivityStatus(`Select a location to build a ${buildingInfo.name}. Right-click to cancel.`);
    };

    const handleConfirmPlacement = (position: { x: number; y: number }) => {
        if (playerAction?.mode !== 'build') return;
        const { buildingType, villagerId } = playerAction;
        const buildingInfo = BUILDINGS_INFO.find(b => b.id === buildingType);
        const builder = units.villagers.find(v => v.id === villagerId);
        if (!buildingInfo || !builder) return;
        
        if (!unlimitedResources) {
            const cost = buildingInfo.cost;
            const negativeCost: ResourceDeltas = {};
            for(const resource in cost) {
                negativeCost[resource as keyof Resources] = -(cost[resource as keyof Resources] || 0);
            }
            updateResources(negativeCost);
        }
        
        const buildTime = buildingInfo.buildTime * 1000;
        const taskPayload = { buildingType, villagerIds: [villagerId], position };

        if (unlimitedResources) {
            handleTaskCompletion({ id: `${Date.now()}-instant-build`, type: 'build', startTime: 0, duration: 0, payload: taskPayload });
        } else {
            const taskId = `${Date.now()}-build-${buildingType}`;
            const newConstruction: ConstructingBuilding = { id: taskId, type: buildingType, position, villagerIds: [villagerId] };
            setConstructingBuildings(prev => [...prev, newConstruction]);

            const newTask: GameTask = {
                id: taskId, type: 'build', startTime: Date.now(), duration: buildTime, payload: taskPayload
            };
            setActiveTasks(prev => [...prev, newTask]);
            setActivityStatus(`${builder.name} has started constructing a ${buildingInfo.name}.`);
            addToLog(`${builder.name} began construction of a new ${buildingInfo.name}.`, buildingType);
        }
        
        setPlayerAction(null);
    };

    const handleCancelPlayerAction = () => {
        setPlayerAction(null);
        setActivityStatus('Command cancelled.');
    };

    const handleDemolishBuilding = (type: BuildingType, id: string) => {
        if(activeTasks.some(t => t.payload?.buildingId === id)) {
            addNotification("Cannot demolish a building with an active task."); return;
        }
        const buildingInfo = BUILDINGS_INFO.find(b => b.id === type);
        const buildingInstance = buildings[type].find(b => b.id === id);
        if (!buildingInfo || !buildingInstance) return;
        if (type === 'houses' && population.current > (buildings.townCenter?.length > 0 ? 20 : 0) + (buildings.houses.length - 1) * 5) {
             addNotification("Cannot demolish this house, your people would be homeless."); return;
        }
        const refund: ResourceDeltas = {};
        let refundMessageParts: string[] = [];
        for (const res in buildingInfo.cost) {
            const resourceKey = res as keyof Resources;
            const cost = buildingInfo.cost[resourceKey] || 0;
            const amount = Math.floor(cost * 0.5);
            if (amount > 0) {
                refund[resourceKey] = amount;
                refundMessageParts.push(`${amount} ${resourceKey}`);
            }
        }
        updateResources(refund);
        setBuildings(prev => ({ ...prev, [type]: prev[type].filter(b => b.id !== id) }));
        addToLog(`${buildingInstance.name} (${buildingInfo.name}) was demolished.`, type);
        if (refundMessageParts.length > 0) { addNotification(`Salvaged ${refundMessageParts.join(', ')}.`); }
        setBuildingManagementPanel({isOpen: false, type: null, anchorRect: null });
    };

    const handleUpdateBuilding = (type: BuildingType, id: string, name: string) => {
        setBuildings(prev => ({ ...prev, [type]: prev[type].map(b => b.id === id ? { ...b, name } : b) }));
        addNotification("Building renamed.");
    };

    const handleTrainVillagers = (count: number) => {
        if (activeTasks.some(t => t.type === 'train_villager') || count <= 0) return;
        const villagerCost = 50;
        const totalCost = villagerCost * count;
        if (population.current + count > population.capacity) { addNotification(`Need space for ${count} more villagers.`); return; }
        
        const townCenter = buildings.townCenter?.[0];
        if (!townCenter) { addNotification(`No Town Center to train villagers.`); return; }

        if (!unlimitedResources) {
            if (resources.food < totalCost) { addNotification(`Need ${totalCost - resources.food} more Food.`); return; }
            updateResources({ food: -totalCost });
        }
        const trainTime = 10000 * count; // 10s per villager
        if(unlimitedResources) {
            handleTaskCompletion({ id: 'instant', type: 'train_villager', startTime: 0, duration: 0, payload: { count } });
        } else {
            const taskId = `${Date.now()}-train-villager`;
            const newTask: GameTask = { id: taskId, type: 'train_villager', startTime: Date.now(), duration: trainTime, payload: { count, buildingId: townCenter.id } };
            setActiveTasks(prev => [...prev, newTask]);
            setActivityStatus(`Training ${count} villager(s)...`);
            addToLog(`Began training ${count} new villager(s).`, 'villager');
        }
        setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null });
    };
    
    const handleTrainUnits = (unitType: MilitaryUnitType, count: number) => {
        const unitInfo = UNIT_INFO.find(u => u.id === unitType);
        if (!unitInfo || activeTasks.some(t => t.payload?.unitType === unitType) || count <= 0) return;
        if (population.current + count > population.capacity) { addNotification(`Need space for ${count} more units.`); return; }
        
        const trainingBuilding = buildings[unitInfo.requiredBuilding]?.[0];
        if (!trainingBuilding) { addNotification(`No ${unitInfo.requiredBuilding} to train units.`); return; }

        if (!unlimitedResources) {
            const totalCost: ResourceDeltas = {}; const missing: string[] = [];
            for (const res in unitInfo.cost) {
                const resourceKey = res as keyof Resources;
                const cost = (unitInfo.cost[resourceKey] || 0) * count;
                totalCost[resourceKey] = -cost;
                if (resources[resourceKey] < cost) missing.push(`${cost - resources[resourceKey]} ${resourceKey}`);
            }
            if (missing.length > 0) { addNotification(`Need ${missing.join(' and ')}.`); return; }
            updateResources(totalCost);
        }
        const trainTime = unitInfo.trainTime * 1000 * count;
        if(unlimitedResources) {
            handleTaskCompletion({ id: 'instant', type: 'train_military', startTime: 0, duration: 0, payload: { unitType, count } });
        } else {
            const taskId = `${Date.now()}-train-${unitType}`;
            const newTask: GameTask = { id: taskId, type: 'train_military', startTime: Date.now(), duration: trainTime, payload: { unitType, count, buildingId: trainingBuilding.id } };
            setActiveTasks(prev => [...prev, newTask]);
            setActivityStatus(`Training ${count} ${unitInfo.name}(s)...`);
            addToLog(`Began training ${count} new ${unitInfo.name}(s).`, unitType);
        }
        setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null });
    };

    const handleDismissSpecificUnit = (type: 'villagers' | 'military', id: string) => {
        if (type === 'villagers' && isVillagerBusy(id)) {
            addNotification("Cannot dismiss a busy villager.");
            return;
        }
        const unit = units[type].find(u => u.id === id);
        if (!unit) return;
        if (type === 'villagers' && units.villagers.length <= 1) { addNotification("Cannot dismiss your last villager."); return; }
        setUnits(prev => ({ ...prev, [type]: prev[type].filter(u => u.id !== id) }));
        const unitTypeName = type === 'villagers' ? 'villager' : (unit as MilitaryUnit).unitType;
        addToLog(`${unit.name} the ${unitTypeName} has been dismissed.`, type === 'villagers' ? 'villager' : (unit as MilitaryUnit).unitType);
        addNotification(`${unit.name} was dismissed.`);
    };

    const handleUpdateUnit = (type: 'villagers' | 'military', id: string, name: string, title?: string) => {
         setUnits(prev => ({ ...prev, [type]: prev[type].map(u => {
                if (u.id === id) {
                    const updatedUnit = { ...u, name };
                    if (type === 'military' && title !== undefined) { (updatedUnit as MilitaryUnit).title = title; }
                    return updatedUnit;
                } return u;
            })
        }));
        addNotification("Unit updated.");
    };

    const handleAssignVillagersToNode = (nodeId: string, count: number) => {
        const idleVillagers = units.villagers.filter(v => !isVillagerBusy(v.id));
        if (count <= 0) return;
        let cappedCount = Math.min(count, idleVillagers.length);
        if (cappedCount === 0) { addNotification("No idle villagers available."); return; }
    
        const villagersToAssign = idleVillagers.slice(0, cappedCount);
        const villagerIdsToAssign = villagersToAssign.map(v => v.id);
    
        const targetNode = resourceNodes.find(n => n.id === nodeId);
        if (!targetNode) return;
    
        setResourceNodes(prevNodes => 
            prevNodes.map(n => n.id === nodeId ? {...n, assignedVillagers: [...new Set([...n.assignedVillagers, ...villagerIdsToAssign])]} : n)
        );
        
        const existingTask = activeTasks.find(t => t.type === 'gather' && t.payload?.resourceNodeId === nodeId);
        const gatherRatePerVillager = GATHER_INFO[targetNode.type].rate;

        if (unlimitedResources) { // Instant gather for test mode
            updateResources({ [targetNode.type]: targetNode.amount });
            addToLog(`${cappedCount} villager(s) instantly gathered ${Math.floor(targetNode.amount)} ${targetNode.type}.`, targetNode.type);
            setResourceNodes(prev => prev.filter(n => n.id !== nodeId));
        } else {
             const amountPerSecond = gatherRatePerVillager / 10;
             const gatherInterval = setInterval(() => {
                let nodeIsDepleted = false;
                setResourceNodes(prev => prev.map(n => {
                    if (n.id === nodeId) {
                        const newAmount = n.amount - amountPerSecond;
                        if (newAmount <= 0) {
                            nodeIsDepleted = true;
                            updateResources({ [n.type]: n.amount });
                            addToLog(`${n.assignedVillagers.length} villager(s) depleted a ${n.type} source.`, n.type);
                            return null;
                        }
                        updateResources({ [n.type]: amountPerSecond });
                        return { ...n, amount: newAmount };
                    }
                    return n;
                }).filter(Boolean) as ResourceNode[]);

                if (nodeIsDepleted) {
                     clearInterval(gatherInterval);
                     setActiveTasks(prev => prev.filter(t => t.id !== `gather-${nodeId}`));
                }
             }, 100);
            
            const newTask: GameTask = { id: `gather-${nodeId}`, type: 'gather', startTime: Date.now(), duration: 99999999, payload: { resourceNodeId: nodeId, villagerIds: villagersToAssign.map(v=>v.id) }};
            setActiveTasks(prev => [...prev.filter(t=> t.id !== `gather-${nodeId}`), newTask]);
        }
    
        addToLog(`${cappedCount} villager(s) assigned to gather ${targetNode.type}.`, targetNode.type);
        setActivityStatus(`${cappedCount} villager(s) are now gathering ${targetNode.type}.`);
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };

    const handleAssignVillagersToConstruction = (constructionId: string, count: number) => {
        const idleVillagers = units.villagers.filter(v => !isVillagerBusy(v.id));
        if (count <= 0) return;
        let cappedCount = Math.min(count, idleVillagers.length);
        if (cappedCount === 0) { addNotification("No idle villagers available to assist."); return; }

        const villagersToAssign = idleVillagers.slice(0, cappedCount).map(v => v.id);
        const task = activeTasks.find(t => t.id === constructionId);
        const construction = constructingBuildings.find(c => c.id === constructionId);

        if (!task || !construction) return;

        const buildingInfo = BUILDINGS_INFO.find(b => b.id === construction.type);
        if (!buildingInfo) return;

        const baseDuration = buildingInfo.buildTime * 1000;
        const oldWorkerCount = task.payload?.villagerIds?.length || 1;
        
        const timeElapsed = Date.now() - task.startTime;
        const workDone = timeElapsed * oldWorkerCount;
        const totalWork = baseDuration;
        const workRemaining = Math.max(0, totalWork - workDone);
        
        const newWorkerCount = oldWorkerCount + cappedCount;
        const newRemainingDuration = workRemaining / newWorkerCount;
        
        const updatedVillagerIds = [...task.payload!.villagerIds!, ...villagersToAssign];

        setActiveTasks(prev => prev.map(t => t.id === constructionId ? {
            ...t,
            startTime: Date.now(),
            duration: newRemainingDuration,
            payload: { ...t.payload, villagerIds: updatedVillagerIds }
        } : t));

        setConstructingBuildings(prev => prev.map(c => c.id === constructionId ? {
            ...c,
            villagerIds: updatedVillagerIds
        } : c));

        addToLog(`${cappedCount} villager(s) are now assisting with the ${buildingInfo.name}.`, buildingInfo.id);
        setActivityStatus(`Construction of the ${buildingInfo.name} is now faster.`);
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };

    const handleAssignVillagers = (targetId: string, count: number) => {
        if (assignmentPanelState.targetType === 'resource') {
            handleAssignVillagersToNode(targetId, count);
        } else if (assignmentPanelState.targetType === 'construction') {
            handleAssignVillagersToConstruction(targetId, count);
        }
    };

    const handleAdvanceAge = async () => {
        if (activeTasks.some(t => t.type === 'advance_age')) { addNotification("Advancement already in progress."); return; }
        if (!unlimitedResources) {
            if (resources.food < 500 || resources.gold < 200) {
                const missing: string[] = [];
                if (resources.food < 500) missing.push(`${500 - resources.food} Food`);
                if (resources.gold < 200) missing.push(`${200 - resources.gold} Gold`);
                addNotification(`To advance, you need ${missing.join(' and ')}.`);
                return;
            }
            updateResources({ food: -500, gold: -200 });
        }
        const duration = 60000;
        if(unlimitedResources) {
            handleTaskCompletion({ id: 'instant', type: 'advance_age', startTime: 0, duration: 0 });
        } else {
            const taskId = `${Date.now()}-advance_age`;
            const newTask: GameTask = { id: taskId, type: 'advance_age', startTime: Date.now(), duration };
            setActiveTasks(prev => [...prev, newTask]);
            setActivityStatus(`Your people begin the long journey to a new age.`);
            setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null });
        }
    };
    
    const handleExitGame = async () => {
        setCurrentSaveName(null);
        await fetchSaves();
        setGameState(GameStatus.MENU);
    };

    const handleToggleUnlimitedResources = () => {
        const newMode = !unlimitedResources;
        setUnlimitedResources(newMode);
        if (newMode) {
            setResources({ food: 99999, wood: 99999, gold: 99999, stone: 99999 });
            addNotification("Test Mode: ON");
        } else {
            addNotification("Test Mode: OFF");
        }
    };

    const buildingCounts = Object.keys(buildings).reduce((acc, key) => {
        const buildingType = key as BuildingType;
        acc[buildingType] = buildings[buildingType].length;
        return acc;
    }, {} as Record<BuildingType, number>);
    
    const idleVillagerCount = units.villagers.filter(v => !isVillagerBusy(v.id)).length;
    
    const assignmentTarget = assignmentPanelState.targetType === 'resource'
        ? resourceNodes.find(n => n.id === assignmentPanelState.targetId)
        : constructingBuildings.find(c => c.id === assignmentPanelState.targetId);

    const closeAllPanels = useCallback(() => {
        setUnitManagementPanel(p => p.isOpen ? { isOpen: false, type: null, anchorRect: null } : p);
        setBuildingManagementPanel(p => p.isOpen ? { isOpen: false, type: null, instanceId: undefined, anchorRect: null } : p);
        setBuildPanelState(p => p.isOpen ? { isOpen: false, villagerId: null, anchorRect: null } : p);
        setAssignmentPanelState(p => p.isOpen ? { isOpen: false, targetId: null, targetType: null, anchorRect: null } : p);
        setSettingsPanelState(p => p.isOpen ? { isOpen: false, anchorRect: null } : p);
        setCivPanelState(p => p.isOpen ? { isOpen: false, anchorRect: null } : p);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const isAnyPanelOpen = unitManagementPanel.isOpen || 
                                   buildingManagementPanel.isOpen || 
                                   buildPanelState.isOpen || 
                                   assignmentPanelState.isOpen || 
                                   settingsPanelState.isOpen ||
                                   civPanelState.isOpen;

            if (!isAnyPanelOpen) {
                return;
            }

            const target = event.target as Element;

            if (target.closest('.sci-fi-panel-popup')) {
                return;
            }

            closeAllPanels();
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [
        unitManagementPanel.isOpen, 
        buildingManagementPanel.isOpen,
        buildPanelState.isOpen,
        assignmentPanelState.isOpen,
        settingsPanelState.isOpen,
        civPanelState.isOpen,
        closeAllPanels
    ]);

    const renderContent = () => {
        switch (gameState) {
            case GameStatus.MENU:
                return <StartScreen onNewGame={handleStartNewGame} onResumeGame={handleResumeGame} savedGames={allSaves} />;
            case GameStatus.LOADING:
                return <LoadingScreen />;
            case GameStatus.PLAYING:
                if (!civilization) return <LoadingScreen />;
                return (
                    <>
                        <GameUI
                            civilization={civilization}
                            resources={resources}
                            units={units}
                            buildings={buildings}
                            population={population}
                            currentAge={currentAge}
                            gameLog={gameLog}
                            currentEvent={currentEvent}
                            onEventChoice={handleEventChoice}
                            resourceDeltas={resourceDeltas}
                            activityStatus={activityStatus}
                            unitList={UNIT_INFO}
                            buildingList={BUILDINGS_INFO}
                            onOpenUnitPanel={(type, rect) => { closeAllPanels(); setUnitManagementPanel({ isOpen: true, type, anchorRect: rect }); }}
                            onOpenBuildingPanel={(type, instanceId, rect) => { closeAllPanels(); setBuildingManagementPanel({ isOpen: true, type, instanceId, anchorRect: rect }); }}
                            playerAction={playerAction}
                            onConfirmPlacement={handleConfirmPlacement}
                            onCancelPlayerAction={handleCancelPlayerAction}
                            onBuildingClick={(building, rect) => {
                                closeAllPanels();
                                const type = Object.keys(buildings).find(key => buildings[key as BuildingType].some(b => b.id === building.id)) as BuildingType | undefined;
                                if(type) setBuildingManagementPanel({ isOpen: true, type, instanceId: building.id, anchorRect: rect });
                            }}
                            mapDimensions={MAP_DIMENSIONS}
                            constructingBuildings={constructingBuildings}
                            activeTasks={activeTasks}
                            onExitGame={handleExitGame}
                            onOpenSettingsPanel={(rect) => { closeAllPanels(); setSettingsPanelState({ isOpen: true, anchorRect: rect }); }}
                            onOpenCivPanel={(rect) => { closeAllPanels(); setCivPanelState({ isOpen: true, anchorRect: rect }); }}
                            resourceNodes={resourceNodes}
                            onOpenAssignmentPanel={(nodeId, rect) => { closeAllPanels(); setAssignmentPanelState({ isOpen: true, targetId: nodeId, targetType: 'resource', anchorRect: rect }); }}
                            onOpenConstructionPanel={(constructionId, rect) => { closeAllPanels(); setAssignmentPanelState({ isOpen: true, targetId: constructionId, targetType: 'construction', anchorRect: rect }); }}
                            gatherInfo={GATHER_INFO}
                        />
                        <BuildPanel 
                            isOpen={buildPanelState.isOpen}
                            onClose={() => setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null })}
                            onStartPlacement={handleStartPlacement}
                            resources={resources}
                            buildingCounts={buildingCounts}
                            buildingList={BUILDINGS_INFO}
                            anchorRect={buildPanelState.anchorRect}
                            panelOpacity={panelOpacity}
                        />
                        <UnitManagementPanel
                            isOpen={unitManagementPanel.isOpen}
                            onClose={() => setUnitManagementPanel({ isOpen: false, type: null, anchorRect: null })}
                            type={unitManagementPanel.type}
                            units={units}
                            onUpdateUnit={handleUpdateUnit}
                            onDismissUnit={handleDismissSpecificUnit}
                            onInitiateBuild={(villagerId, rect) => { closeAllPanels(); handleInitiateBuild(villagerId, rect); }}
                            getVillagerTaskDetails={getVillagerTaskDetails}
                            anchorRect={unitManagementPanel.anchorRect}
                            panelOpacity={panelOpacity}
                        />
                        <BuildingManagementPanel
                            isOpen={buildingManagementPanel.isOpen}
                            onClose={() => setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null })}
                            panelState={buildingManagementPanel}
                            buildings={buildings}
                            buildingList={BUILDINGS_INFO}
                            onUpdateBuilding={handleUpdateBuilding}
                            onDemolishBuilding={handleDemolishBuilding}
                            onTrainUnits={handleTrainUnits}
                            onTrainVillagers={handleTrainVillagers}
                            resources={resources}
                            population={population}
                            unitList={UNIT_INFO}
                            onAdvanceAge={handleAdvanceAge}
                            activeTasks={activeTasks}
                            anchorRect={buildingManagementPanel.anchorRect}
                            panelOpacity={panelOpacity}
                        />
                        <ResourceAssignmentPanel
                            isOpen={assignmentPanelState.isOpen}
                            onClose={() => setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null })}
                            assignmentTarget={assignmentTarget || null}
                            idleVillagerCount={idleVillagerCount}
                            onAssignVillagers={handleAssignVillagers}
                            gatherInfo={GATHER_INFO}
                            buildingList={BUILDINGS_INFO}
                            anchorRect={assignmentPanelState.anchorRect}
                            panelOpacity={panelOpacity}
                        />
                        <SettingsPanel
                            isOpen={settingsPanelState.isOpen}
                            onClose={() => setSettingsPanelState({ isOpen: false, anchorRect: null })}
                            anchorRect={settingsPanelState.anchorRect}
                            opacity={panelOpacity}
                            onOpacityChange={setPanelOpacity}
                        />
                        <CivilizationPanel
                            isOpen={civPanelState.isOpen}
                            onClose={() => setCivPanelState({ isOpen: false, anchorRect: null })}
                            civilization={civilization}
                            anchorRect={civPanelState.anchorRect}
                            panelOpacity={panelOpacity}
                        />
                    </>
                );
            default:
                return <StartScreen onNewGame={handleStartNewGame} onResumeGame={handleResumeGame} savedGames={allSaves} />;
        }
    };

    return (
        <div className="min-h-screen bg-stone-dark flex items-center justify-center p-4">
            {gameState === GameStatus.PLAYING && (
                 <button
                    onClick={handleToggleUnlimitedResources}
                    className="fixed bottom-4 left-4 z-[101] bg-brand-gold text-stone-dark font-bold py-1 px-3 rounded-full text-xs shadow-lg hover:scale-105 transition-transform"
                    aria-label="Toggle unlimited resources test mode"
                >
                    Test Mode: {unlimitedResources ? 'ON' : 'OFF'}
                </button>
            )}
            <NotificationManager notifications={notifications} onRemoveNotification={removeNotification} />
            <main className="w-full max-w-7xl mx-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default GamePage;
