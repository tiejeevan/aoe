
'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GameStatus, type Civilization, type Resources, type Units, type Buildings, type GameEvent, type GameLogEntry, type LogIconType, type ResourceDeltas, BuildingType, UINotification, FullGameState, Villager, MilitaryUnit, UnitConfig, MilitaryUnitType, GameTask, TaskType, ResourceNode, ResourceNodeType, PlayerActionState, GameEventChoice, GameItem, Reward, ActiveBuffs, BuildingInstance, AgeConfig, BuildingConfig, BuildingUpgradePath, ResourceConfig, ResearchConfig } from '../../types';
import type { BuildingAction, UnitAction, ResearchAction, EventAction } from '../../types/actions';
import { getPredefinedCivilization, getPredefinedGameEvent } from '../../services/geminiService';
import { saveGameState, loadGameState, getAllSaveNames, deleteGameState, getAllAgeConfigs, getAllBuildingConfigs, getAllUnitConfigs, saveAgeConfig, saveBuildingConfig, saveUnitConfig, getAllResourceConfigs, saveResourceConfig, getAllResearchConfigs, saveResearchConfig } from '../../services/dbService';
import { handleBuildingAction } from '../../services/buildingService';
import { handleUnitAction } from '../../services/unitService';
import { handleResearchAction } from '../../services/researchService';
import { handleEventAction } from '../../services/gameEventService';
import { getRandomNames } from '../../services/nameService';
import { GAME_ITEMS } from '../../data/itemContent';
import { INITIAL_AGES } from '../../data/ageInfo';
import { INITIAL_BUILDINGS } from '../../data/buildingInfo';
import { INITIAL_UNITS } from '../../data/unitInfo';
import { INITIAL_RESOURCES } from '../../data/resourceInfo';
import { INITIAL_RESEARCH } from '../../data/researchInfo';
import GameUI from '../../components/GameUI';
import StartScreen from '../../components/StartScreen';
import LoadingScreen from '../../components/LoadingScreen';
import BuildPanel from '../../components/BuildPanel';
import NotificationManager from '../../components/NotificationManager';
import UnitManagementPanel from '../../components/UnitManagementPanel';
import BuildingManagementPanel from '../../components/BuildingManagementPanel';
import ResourceAssignmentPanel from '../../components/ResourceAssignmentPanel';
import CivilizationPanel from '../../components/CivilizationPanel';
import AllBuildingsPanel from '../../components/AllBuildingsPanel';
import InventoryPanel from '../../components/InventoryPanel';
import ResearchPanel from '../../components/ResearchPanel';


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
    const [completedResearch, setCompletedResearch] = useState<string[]>([]);
    
    // Master lists of all configurations from DB
    const [masterAgeList, setMasterAgeList] = useState<AgeConfig[]>([]);
    const [masterBuildingList, setMasterBuildingList] = useState<BuildingConfig[]>([]);
    const [masterUnitList, setMasterUnitList] = useState<UnitConfig[]>([]);
    const [masterResourceList, setMasterResourceList] = useState<ResourceConfig[]>([]);
    const [masterResearchList, setMasterResearchList] = useState<ResearchConfig[]>([]);


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
    const [researchPanelState, setResearchPanelState] = useState<{ isOpen: boolean; anchorRect: DOMRect | null; }>({ isOpen: false, anchorRect: null });


    const deltaTimeoutRef = useRef<{ [key in keyof Resources]?: number }>({});
    const eventTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());
    const animationFrameRef = useRef<number>();
    const gatherInfoRef = useRef<Record<string, { rate: number }>>({});
    
    // Derived state for active game configurations
    const ageProgressionList = useMemo(() => masterAgeList.filter(age => age.isActive), [masterAgeList]);
    const buildingList = useMemo(() => masterBuildingList, [masterBuildingList]); // Keep all for lookups, filter on use
    const unitList = useMemo(() => masterUnitList, [masterUnitList]); // Keep all for lookups, filter on use

    const populationCapacity = useMemo(() => {
        let capacity = 0;
        for (const buildingType in buildings) {
            const buildingInfo = masterBuildingList.find(b => b.id === buildingType);
            if (buildingInfo && buildingInfo.populationCapacity) {
                capacity += buildings[buildingType].length * buildingInfo.populationCapacity;
            }
        }
        return capacity;
    }, [buildings, masterBuildingList]);
    
    const population = useMemo(() => {
        const militaryPop = units.military.reduce((acc, unit) => {
            const unitInfo = masterUnitList.find(u => u.id === unit.unitType);
            return acc + (unitInfo?.populationCost || 1);
        }, 0);
        
        return {
            current: units.villagers.length + militaryPop,
            capacity: populationCapacity,
        };
    }, [units, populationCapacity, masterUnitList]);

    const hasResearchBuildings = useMemo(() => {
        return masterBuildingList.some(buildingInfo => 
            buildingInfo.canResearch && (buildings[buildingInfo.id]?.length || 0) > 0
        );
    }, [buildings, masterBuildingList]);

    const addNotification = useCallback((message: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        setNotifications(prev => [{ id, message }]);
    }, []);

    const addToLog = useCallback((message: string, icon: LogIconType) => {
        setGameLog(prev => [{ id: `${Date.now()}-${Math.random()}`, message, icon }, ...prev.slice(0, 19)]);
    }, []);
    
    const updateResources = useCallback((deltas: ResourceDeltas) => {
        setResources(prev => {
            const newResources = { ...prev };
            for (const key in deltas) {
                const resourceKey = key as keyof Resources;
                newResources[resourceKey] = Math.max(0, (newResources[resourceKey] || 0) + (deltas[resourceKey] ?? 0));
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

    const dispatchBuildingAction = useCallback((action: BuildingAction) => {
        const result = handleBuildingAction({
            action,
            resources,
            buildings,
            activeTasks,
            population,
            buildingList: masterBuildingList,
            unitList: masterUnitList,
            completedResearch,
            unlimitedResources,
            activeBuffs,
        });

        if (result.error) {
            addNotification(result.error);
            return;
        }

        if (result.resourceDeltas) {
            updateResources(result.resourceDeltas);
        }
        if (result.newBuildings) {
            setBuildings(result.newBuildings);
        }
        if (result.newTasks) {
            setActiveTasks(prev => [...prev, ...result.newTasks!]);
        }
        if (result.updatedActiveBuffs) {
            setActiveBuffs(result.updatedActiveBuffs);
        }
        if (result.log) {
            addToLog(result.log.message, result.log.icon);
        }
        if (result.activityStatus) {
            setActivityStatus(result.activityStatus);
        }
        
        // Close relevant panels after a successful action
        setBuildingManagementPanel({ isOpen: false, type: null, instanceId: null, anchorRect: null });

    }, [resources, buildings, activeTasks, population, masterBuildingList, masterUnitList, completedResearch, unlimitedResources, activeBuffs, addNotification, updateResources, addToLog]);

    const dispatchUnitAction = useCallback((action: UnitAction) => {
        const result = handleUnitAction({
            action,
            units,
            buildings,
            resourceNodes,
            buildingList: masterBuildingList,
            unlimitedResources,
        });

        if (result.error) {
            addNotification(result.error);
            return;
        }

        if (result.newTasks) {
            setActiveTasks(prev => [...prev, ...result.newTasks!]);
        }
        if (result.updatedVillagers) {
            setUnits(prev => ({ ...prev, villagers: result.updatedVillagers! }));
        }
        if (result.log) {
            addToLog(result.log.message, result.log.icon);
        }
        if (result.activityStatus) {
            setActivityStatus(result.activityStatus);
        }

        // Close relevant panels
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    }, [units, buildings, resourceNodes, masterBuildingList, unlimitedResources, addNotification, addToLog]);

    const dispatchResearchAction = useCallback((action: ResearchAction) => {
        const result = handleResearchAction({
            action,
            resources,
            activeTasks,
            masterResearchList,
            unlimitedResources,
        });
        if (result.error) { addNotification(result.error); return; }
        if (result.resourceDeltas) { updateResources(result.resourceDeltas); }
        if (result.newTasks) { setActiveTasks(prev => [...prev, ...result.newTasks!]); }
        if (result.log) { addToLog(result.log.message, result.log.icon); }
        if (result.activityStatus) { setActivityStatus(result.activityStatus); }
        setBuildingManagementPanel({ isOpen: false, type: null, instanceId: null, anchorRect: null });
        setResearchPanelState({ isOpen: false, anchorRect: null });
    }, [resources, activeTasks, masterResearchList, unlimitedResources, addNotification, updateResources, addToLog]);

     const dispatchEventAction = useCallback((action: EventAction) => {
        const result = handleEventAction({
            action,
            resources,
            inventory,
            choice: action.payload.choice, // for internal service use
        });
        if (result.error) { addNotification(result.error); return; }
        if (result.resourceDeltas) { updateResources(result.resourceDeltas); }
        if (result.newInventory) { setInventory(result.newInventory); }
        if (result.log) { addToLog(result.log.message, result.log.icon); }
        if (result.activityStatus) { setActivityStatus(result.activityStatus); }
    }, [resources, inventory, addNotification, updateResources, addToLog]);


    const fetchResources = useCallback(async () => {
        let allItems = await getAllResourceConfigs();
        const itemMap = new Map(allItems.map(i => [i.id, i]));
        let needsUpdate = false;

        for (const [index, pItem] of INITIAL_RESOURCES.entries()) {
            const existingItem = itemMap.get(pItem.id);
            const newItem: ResourceConfig = { ...(pItem as any), ...(existingItem || {}), id: pItem.id, isPredefined: true, isActive: existingItem?.isActive ?? true, order: existingItem?.order ?? index };
            if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                await saveResourceConfig(newItem);
                needsUpdate = true;
            }
        }
        if (needsUpdate) allItems = await getAllResourceConfigs();
        setMasterResourceList(allItems);
        gatherInfoRef.current = allItems.reduce((acc, res) => {
            acc[res.id] = { rate: res.baseGatherRate };
            return acc;
        }, {} as Record<string, { rate: number }>);
        return allItems;
    }, []);
    
    const fetchSavesAndConfigs = useCallback(async () => {
        setIsAppLoading(true);
        try {
            const names = await getAllSaveNames();
            setAllSaves(names);
            
            // --- Smart Seeding/Updating for Ages ---
            let allAgeConfigs = await getAllAgeConfigs();
            let ageMap = new Map(allAgeConfigs.map(item => [item.id, item]));
            let agesNeedUpdate = false;
            for (const [index, pItem] of INITIAL_AGES.entries()) {
                const existingItem = ageMap.get(pItem.name);
                const newItem: AgeConfig = { ...(existingItem || {}), ...pItem, id: pItem.name, isPredefined: true, isActive: existingItem?.isActive ?? true, order: existingItem?.order ?? index };
                if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                    await saveAgeConfig(newItem);
                    agesNeedUpdate = true;
                }
            }
            if (agesNeedUpdate) allAgeConfigs = await getAllAgeConfigs();
            setMasterAgeList(allAgeConfigs);

            // --- Smart Seeding/Updating for Buildings ---
            let allBuildingConfigs = await getAllBuildingConfigs();
            let buildingMap = new Map(allBuildingConfigs.map(item => [item.id, item]));
            let buildingsNeedUpdate = false;
            const defaultAge = allAgeConfigs[0]?.name || INITIAL_AGES[0].name;
            for (const [index, pItem] of INITIAL_BUILDINGS.entries()) {
                const existingItem = buildingMap.get(pItem.id);
                 const newItem: BuildingConfig = {
                    ...(pItem as any), // Base predefined values
                    ...(existingItem || {}), // Overwrite with saved values
                    id: pItem.id,
                    isPredefined: true,
                    unlockedInAge: existingItem?.unlockedInAge || (pItem.id === 'townCenter' ? INITIAL_AGES[0].name : defaultAge),
                    isActive: existingItem?.isActive ?? true,
                    order: existingItem?.order ?? index,
                    treeId: existingItem?.treeId || `tree-predefined-${pItem.id}`,
                    populationCapacity: existingItem?.populationCapacity ?? pItem.populationCapacity,
                    generatesResource: existingItem?.generatesResource ?? pItem.generatesResource,
                    generationRate: existingItem?.generationRate ?? pItem.generationRate,
                    maintenanceCost: existingItem?.maintenanceCost ?? pItem.maintenanceCost,
                };

                if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                    await saveBuildingConfig(newItem);
                    buildingsNeedUpdate = true;
                }
            }
            if (buildingsNeedUpdate) allBuildingConfigs = await getAllBuildingConfigs();
            setMasterBuildingList(allBuildingConfigs);

            // --- Smart Seeding/Updating for Units ---
            let allUnitConfigs = await getAllUnitConfigs();
            const unitMap = new Map(allUnitConfigs.map(item => [item.id, item]));
            let unitsNeedUpdate = false;
            const initialUnitsWithIds = INITIAL_UNITS.map(u => ({ ...u, id: u.name.toLowerCase().replace(/\s/g, '') }));

            for (const [index, pItem] of initialUnitsWithIds.entries()) {
                const existingItem = unitMap.get(pItem.id);
                const newItem: UnitConfig = {
                    ...(pItem as any), // Base predefined values
                    ...(existingItem || {}), // Overwrite with saved values
                    id: pItem.id,
                    isPredefined: true,
                    isActive: existingItem?.isActive ?? true,
                    order: existingItem?.order ?? index,
                    treeId: existingItem?.treeId || `utree-predefined-${pItem.id}`,
                    populationCost: existingItem?.populationCost ?? pItem.populationCost,
                };

                if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                    await saveUnitConfig(newItem);
                    unitsNeedUpdate = true;
                }
            }
            if (unitsNeedUpdate) allUnitConfigs = await getAllUnitConfigs();
            setMasterUnitList(allUnitConfigs);
            
             // --- Smart Seeding/Updating for Research ---
            let allResearchConfigs = await getAllResearchConfigs();
            let researchMap = new Map(allResearchConfigs.map(item => [item.id, item]));
            let researchNeedUpdate = false;
            for (const [index, pItem] of INITIAL_RESEARCH.entries()) {
                const id = pItem.name.toLowerCase().replace(/\s/g, '_');
                const existingItem = researchMap.get(id);
                const newItem: ResearchConfig = {
                    ...(existingItem || {} as ResearchConfig), // Start with saved values
                    ...(pItem as any), // Overwrite with predefined base values
                    id, // Ensure ID is correct
                    isPredefined: true,
                    isActive: existingItem?.isActive ?? true,
                    order: existingItem?.order ?? index,
                    ageRequirement: existingItem?.ageRequirement || defaultAge,
                    requiredBuildingId: existingItem?.requiredBuildingId || 'blacksmith',
                };
                if (JSON.stringify(existingItem) !== JSON.stringify(newItem)) {
                    await saveResearchConfig(newItem);
                    researchNeedUpdate = true;
                }
            }
            if (researchNeedUpdate) allResearchConfigs = await getAllResearchConfigs();
            setMasterResearchList(allResearchConfigs);

            const allResourceConfigs = await fetchResources();

            return { allAgeConfigs, allBuildingConfigs, allUnitConfigs, allResourceConfigs, allResearchConfigs };
        } catch (error) {
            console.error("Error during initial config fetch:", error);
            const ages = INITIAL_AGES.map((a, i) => ({...a, id: a.name, isActive: true, isPredefined: true, order: i}));
            const buildings = INITIAL_BUILDINGS.map((b, i) => ({...b, isActive: true, isPredefined: true, order: i, unlockedInAge: 'Nomadic Age' } as BuildingConfig));
            const units = INITIAL_UNITS.map((u, i) => ({...u, id: u.name.toLowerCase().replace(/\s/g, ''), isActive: true, isPredefined: true, order: i}));
            const resources = INITIAL_RESOURCES.map((r,i) => ({...r, isActive: true, isPredefined: true, order: i}));
            const research = INITIAL_RESEARCH.map((r,i) => ({...r, id: r.name.toLowerCase().replace(/\s/g, '_'), isActive: true, isPredefined: true, order: i, ageRequirement: 'Nomadic Age'} as ResearchConfig));
            setMasterAgeList(ages);
            setMasterBuildingList(buildings);
            setMasterUnitList(units as UnitConfig[]);
            setMasterResourceList(resources);
            setMasterResearchList(research);
            return { allAgeConfigs: ages, allBuildingConfigs: buildings, allUnitConfigs: units as UnitConfig[], allResourceConfigs: resources, allResearchConfigs: research };
        } finally {
            setIsAppLoading(false);
            setGameState(GameStatus.MENU);
        }
    }, [fetchResources]);
    
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
                completedResearch,
            };
            saveGameState(currentSaveName, fullState);
        }
    }, [civilization, resources, units, buildings, currentAge, gameLog, gameState, currentSaveName, activeTasks, resourceNodes, inventory, activeBuffs, completedResearch]);

    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
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
            case 'upgrade_building': {
                const { originalBuildingId, originalBuildingType, targetBuildingType } = task.payload!;
                const originalBuilding = buildings[originalBuildingType as string]?.find(b => b.id === originalBuildingId);
                const targetBuildingInfo = buildingList.find(b => b.id === targetBuildingType);

                if (originalBuilding && targetBuildingInfo) {
                    const newBuilding: BuildingInstance = {
                        id: originalBuilding.id,
                        name: originalBuilding.name,
                        position: originalBuilding.position,
                        currentHp: targetBuildingInfo.hp,
                    };

                    setBuildings(p => {
                        const newBuildings = { ...p };
                        newBuildings[originalBuildingType as string] = (newBuildings[originalBuildingType as string] || []).filter(b => b.id !== originalBuildingId);
                        newBuildings[targetBuildingType as string] = [...(newBuildings[targetBuildingType as string] || []), newBuilding];
                        return newBuildings;
                    });
                     addToLog(`${originalBuilding.name} has been upgraded to a ${targetBuildingInfo.name}!`, targetBuildingInfo.iconId);
                     setActivityStatus(`Upgrade to ${targetBuildingInfo.name} complete.`);
                }
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
            case 'research': {
                const { researchId } = task.payload!;
                const researchInfo = masterResearchList.find(r => r.id === researchId);
                if (researchInfo) {
                    setCompletedResearch(prev => [...new Set([...prev, researchId!])]);
                    addToLog(`Research complete: ${researchInfo.name}!`, researchInfo.iconId);
                    setActivityStatus(`Completed research for ${researchInfo.name}.`);
                    // TODO: Apply research effects
                }
                break;
            }
        }
    }, [currentAge, addToLog, buildingList, unitList, masterAgeList, masterResearchList, buildings]);
    
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

            // --- Passive Generation and Maintenance ---
            Object.values(buildings).flat().forEach(instance => {
                const config = masterBuildingList.find(b => b.id === Object.keys(buildings).find(key => buildings[key as string].some(bInst => bInst.id === instance.id)));
                if (!config) return;

                // Passive Generation
                if (config.generatesResource && config.generatesResource !== 'none' && config.generationRate) {
                    const amountPerSecond = config.generationRate / 60;
                    resourceDeltasThisTick[config.generatesResource] = (resourceDeltasThisTick[config.generatesResource] || 0) + (amountPerSecond / 1000) * deltaTime;
                }

                // Maintenance Costs
                if (config.maintenanceCost) {
                    Object.entries(config.maintenanceCost).forEach(([res, cost]) => {
                        const costPerSecond = (cost || 0) / 60;
                        resourceDeltasThisTick[res as keyof Resources] = (resourceDeltasThisTick[res as keyof Resources] || 0) - (costPerSecond / 1000) * deltaTime;
                    });
                }
            });
            
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
                    const baseRatePerSecond = (gatherInfoRef.current[node.type]?.rate || 0) * (node.richness || 1);
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
                    if (!amountToDecrement || amountToDecrement <= 0) return node;
                    const newAmount = node.amount - amountToDecrement;
                    if (newAmount <= 0) {
                        const taskId = `gather-${node.id}`;
                        const task = tasksInProgress.find(t => t.id === taskId);
                        if(task) {
                            addToLog(`${task.payload?.villagerIds?.length || 0} villager(s) depleted a ${node.richness ? 'rich ' : ''}${node.type} source, gaining ${Math.floor(node.amount)} ${node.type}.`, node.type);
                            setActivityStatus(`A ${node.richness ? 'rich ' : ''}${node.type} source has been fully depleted.`);
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
    }, [gameState, activeTasks, resourceNodes, handleTaskCompletion, addToLog, updateResources, units.villagers, civilization, activeBuffs, buildings, masterBuildingList]);

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

    const generateResourceNodes = (startPosition: { x: number, y: number }): ResourceNode[] => {
        const nodes: ResourceNode[] = [];
        const occupiedCells = new Set<string>([`${startPosition.x},${startPosition.y}`]);
        const SAFE_RADIUS = 5;
        const RICH_CHANCE = 0.15; // 15% chance for a node to be rich

        const placeNode = (type: ResourceNodeType | string, amount: number, richness?: number, preferContested = false) => {
            let placed = false;
            for (let i = 0; i < 100; i++) { // Max 100 attempts to place a node
                const angle = Math.random() * 2 * Math.PI;
                const distance = preferContested 
                    ? SAFE_RADIUS + Math.random() * (Math.min(MAP_DIMENSIONS.width, MAP_DIMENSIONS.height) / 2 - SAFE_RADIUS)
                    : Math.random() * SAFE_RADIUS;
                
                const x = Math.round(startPosition.x + Math.cos(angle) * distance);
                const y = Math.round(startPosition.y + Math.sin(angle) * distance);

                if (x >= 0 && x < MAP_DIMENSIONS.width && y >= 0 && y < MAP_DIMENSIONS.height && !occupiedCells.has(`${x},${y}`)) {
                    nodes.push({ id: `${Date.now()}-node-${nodes.length}`, type, position: {x,y}, amount, richness });
                    occupiedCells.add(`${x},${y}`);
                    placed = true;
                    break;
                }
            }
            return placed;
        }

        const safeResources = masterResourceList.filter(r => r.spawnInSafeZone);
        const contestedResources = masterResourceList.filter(r => !r.spawnInSafeZone);
        
        // Place safe resources
        safeResources.forEach(res => {
            for (let i = 0; i < 3; i++) { // Attempt to place 3 nodes of each safe type
                 placeNode(res.id, 800 + Math.random() * 400, Math.random() < RICH_CHANCE ? 1.5 : 1, false);
            }
        });

        // Place contested resources
        contestedResources.forEach(res => {
            for (let i = 0; i < 2; i++) { // Attempt to place 2 nodes of each contested type
                placeNode(res.id, 1000 + Math.random() * 500, Math.random() < RICH_CHANCE ? 2 : 1, true);
            }
        });

        return nodes;
    };

    const handleStartNewGame = async (saveName: string) => {
        if (allSaves.includes(saveName)) { addNotification(`A saga named "${saveName}" already exists.`); return; }
        
        const configs = await fetchSavesAndConfigs();
        setGameState(GameStatus.LOADING);
        setCurrentSaveName(saveName);
        
        const localAgeProgressionList = configs.allAgeConfigs.filter(a => a.isActive);

        const civ = getPredefinedCivilization();
        setCivilization(civ);

        const initialRes: Resources = {};
        configs.allResourceConfigs.forEach(res => {
            if (res.isActive) initialRes[res.id] = res.initialAmount;
        });
        setResources(initialRes);

        const initialVillagers = getRandomNames('villager', 3).map(name => ({ id: `${Date.now()}-${name}`, name, currentTask: null }));
        setUnits({ villagers: initialVillagers, military: [] });
        const tcPosition = { x: Math.floor(MAP_DIMENSIONS.width / 2), y: Math.floor(MAP_DIMENSIONS.height / 2) };
        const tcInfo = configs.allBuildingConfigs.find(b => b.id === 'townCenter')!;
        const initialTC = { id: `${Date.now()}-tc`, name: getRandomNames('building', 1)[0], position: tcPosition, currentHp: tcInfo.hp };
        setBuildings({...initialBuildingsState, townCenter: [initialTC]});
        setResourceNodes(generateResourceNodes(tcPosition));
        setCurrentAge(localAgeProgressionList[0]?.name || INITIAL_AGES[0].name);
        setGameLog([]); setCurrentEvent(null); setUnlimitedResources(false); setActiveTasks([]); setInventory([]); setActiveBuffs({ resourceBoost: [] }); setCompletedResearch([]);
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
        const configs = await fetchSavesAndConfigs();
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
                const info = configs.allBuildingConfigs.find(b => b.id === bType);
                if(info) finalBuildings[bType] = finalBuildings[bType].map(b => ({ ...b, currentHp: b.currentHp === undefined ? info.hp : b.currentHp }));
            });
            let tcPosition = { x: 10, y: 5 };
            if (!finalBuildings.townCenter || finalBuildings.townCenter.length === 0) {
                 while (occupiedCells.has(`${tcPosition.x},${tcPosition.y}`)) { tcPosition.x++; }
                const tcInfo = configs.allBuildingConfigs.find(b => b.id === 'townCenter')!;
                finalBuildings.townCenter = [{ id: `${Date.now()}-tc`, name: getRandomNames('building', 1)[0], position: tcPosition, currentHp: tcInfo.hp }];
                occupiedCells.add(`${tcPosition.x},${tcPosition.y}`);
            } else {
                tcPosition = finalBuildings.townCenter[0].position;
            }
            setBuildings(finalBuildings);

            setResourceNodes((savedState.resourceNodes || []).length === 0 ? generateResourceNodes(tcPosition) : (savedState.resourceNodes || []));
            setCurrentAge(savedState.currentAge); setGameLog(savedState.gameLog); setActiveTasks(migratedTasks);
            setInventory(savedState.inventory || []); setActiveBuffs(savedState.activeBuffs || { resourceBoost: [] });
            setCompletedResearch(savedState.completedResearch || []);
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
        dispatchEventAction({ type: 'PROCESS_CHOICE', payload: { choice } });
        setCurrentEvent(null);
        scheduleNextEvent();
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

        const missing = unlimitedResources ? [] : (Object.keys(buildingInfo.cost) as (keyof Resources)[]).filter(res => (resources[res] || 0) < (buildingInfo.cost[res] || 0));
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
        if (!unlimitedResources) updateResources(Object.entries(buildingInfo.cost).reduce((acc, [k, v]) => ({...acc, [k]: -(v || 0)}), {}));
        
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

    const handleUpdateBuilding = (type: BuildingType | string, id: string, name: string) => {
        setBuildings(prev => ({ ...prev, [type as string]: prev[type as string].map(b => b.id === id ? { ...b, name } : b) }));
        addNotification("Building renamed.");
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
        if (assignmentPanelState.targetType === 'construction') {
            return handleAssignVillagersToConstruction(targetId, count);
        }

        const idleVillagers = units.villagers.filter(v => !v.currentTask);
        if (count <= 0 || idleVillagers.length === 0) {
            addNotification("No idle villagers available.");
            return;
        }

        const cappedCount = Math.min(count, idleVillagers.length);
        const villagersToAssign = idleVillagers.slice(0, cappedCount).map(v => v.id);

        if (unlimitedResources) {
            const targetNode = resourceNodes.find(n => n.id === targetId);
            if (targetNode) {
                 updateResources({ [targetNode.type]: targetNode.amount });
                addToLog(`${cappedCount} villager(s) instantly gathered ${Math.floor(targetNode.amount)} ${targetNode.type}.`, targetNode.type);
                setResourceNodes(prev => prev.filter(n => n.id !== targetId));
            }
        } else {
             dispatchUnitAction({
                type: 'GATHER',
                payload: { villagerIds: villagersToAssign, resourceNodeId: targetId }
            });
        }

        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };

    const handleRecallVillagers = (targetId: string, count: number, type: 'resource' | 'construction') => {
        const taskId = type === 'resource' ? `gather-${targetId}` : targetId;
        const task = activeTasks.find(t => t.id === taskId);
        if (!task || (task.payload?.villagerIds?.length ?? 0) < count) return;
        
        const villagersToRecall = task.payload!.villagerIds!.slice(task.payload!.villagerIds!.length - count);
        if (type === 'construction' && villagersToRecall.length === task.payload!.villagerIds!.length) { addNotification("Cannot recall the last builder from a project."); return; }

        setUnits(prev => ({...prev, villagers: prev.villagers.map(v => villagersToRecall.includes(v.id) ? {...v, currentTask: null} : v)}));
        const remainingVillagers = task.payload!.villagerIds!.filter(id => !villagersToRecall.includes(id));
        
        if (remainingVillagers.length === 0) {
            setActiveTasks(prev => prev.filter(t => t.id !== taskId));
            if (type === 'resource') {
                const node = resourceNodes.find(n => n.id === targetId);
                if(node) addToLog(`All villagers recalled from gathering ${node.type}.`, 'villager');
            }
        } else {
            const buildingInfo = buildingList.find(b => b.id === task.payload?.buildingType)!;
            const workDone = (Date.now() - task.startTime) * task.payload!.villagerIds!.length;
            const newRemainingDuration = (buildingInfo.buildTime * 1000 - workDone) / remainingVillagers.length;
            setActiveTasks(prev => prev.map(t => t.id === taskId ? { ...t, startTime: Date.now(), duration: newRemainingDuration, payload: { ...t.payload, villagerIds: remainingVillagers } } : t));
            if (type === 'construction') addToLog(`${count} builder(s) recalled. Construction will now be slower.`, 'villager');
        }
        setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null });
    };
    
    const handleExitGame = async () => { setCurrentSaveName(null); await fetchSavesAndConfigs(); setGameState(GameStatus.MENU); };
    const handleDeleteGame = async (saveName: string) => { await deleteGameState(saveName); await fetchSavesAndConfigs(); addNotification(`Deleted saga: "${saveName}"`); };

    const handleToggleUnlimitedResources = () => {
        const newMode = !unlimitedResources;
        setUnlimitedResources(newMode);
        if (newMode) {
            const maxedResources = masterResourceList.reduce((acc, res) => ({...acc, [res.id]: 99999}), {});
            setResources(maxedResources);
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
    const assignmentTarget = assignmentPanelState.targetType === 'resource' 
        ? resourceNodes.find(n => n.id === assignmentPanelState.targetId) 
        : activeTasks.find(t => t.type === 'build' && t.id === assignmentPanelState.targetId);
    
    const currentAgeIndex = ageProgressionList.findIndex(a => a.name === currentAge);
    const availableBuildings = buildingList.filter(b => {
        const unlockAgeIndex = ageProgressionList.findIndex(a => a.name === b.unlockedInAge);
        return b.isActive && !b.isUpgradeOnly && unlockAgeIndex !== -1 && unlockAgeIndex <= currentAgeIndex;
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
        setResearchPanelState(p => p.isOpen ? { isOpen: false, anchorRect: null } : p);
    }, []);

    const handleOpenBuildingPanel = useCallback((type: BuildingType | string, instanceId: string, rect: DOMRect) => {
        closeAllPanels();
        setBuildingManagementPanel({ isOpen: true, type, instanceId, anchorRect: rect });
    }, [closeAllPanels]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.sci-fi-panel-popup, [data-radix-popper-content-wrapper]')) closeAllPanels();
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
                            gatherInfo={gatherInfoRef.current} currentEvent={currentEvent} onEventChoice={handleEventChoice} inventory={inventory}
                            onOpenInventoryPanel={(rect) => { closeAllPanels(); setInventoryPanelState({ isOpen: true, anchorRect: null }); }}
                            onOpenResearchPanel={(rect) => { closeAllPanels(); setResearchPanelState({ isOpen: true, anchorRect: null }); }}
                            hasResearchBuildings={hasResearchBuildings}
                            resourceList={masterResourceList}
                        />
                        <BuildPanel isOpen={buildPanelState.isOpen} onClose={() => setBuildPanelState({ isOpen: false, villagerId: null, anchorRect: null })} onStartPlacement={handleStartPlacement} resources={resources} buildingCounts={buildingCounts} buildingList={availableBuildings} anchorRect={buildPanelState.anchorRect} />
                        <UnitManagementPanel isOpen={unitManagementPanel.isOpen} onClose={() => setUnitManagementPanel({ isOpen: false, type: null, anchorRect: null })} type={unitManagementPanel.type} units={units} onUpdateUnit={handleUpdateUnit} onDismissUnit={handleDismissSpecificUnit} onInitiateBuild={(villagerId, rect) => { closeAllPanels(); handleInitiateBuild(villagerId, rect); }} getVillagerTaskDetails={getVillagerTaskDetails} anchorRect={unitManagementPanel.anchorRect} />
                        <BuildingManagementPanel 
                            isOpen={buildingManagementPanel.isOpen} 
                            onClose={() => setBuildingManagementPanel({ isOpen: false, type: null, anchorRect: null })} 
                            panelState={buildingManagementPanel} 
                            buildings={buildings} 
                            buildingList={buildingList} 
                            onUpdateBuilding={handleUpdateBuilding} 
                            onDemolishBuilding={(type, id) => dispatchBuildingAction({ type: 'DEMOLISH', payload: { buildingId: id, buildingType: type as BuildingType } })} 
                            onTrainUnits={(unitType, count) => dispatchBuildingAction({ type: 'TRAIN_UNIT', payload: { unitType, count } })} 
                            onTrainVillagers={(count) => dispatchBuildingAction({ type: 'TRAIN_VILLAGER', payload: { count } })} 
                            onUpgradeBuilding={(building, path) => dispatchBuildingAction({ type: 'UPGRADE_BUILDING', payload: { building, upgradePath: path } })}
                            onStartResearch={(researchId) => dispatchResearchAction({ type: 'START_RESEARCH', payload: { researchId } })}
                            onAdvanceAge={() => dispatchBuildingAction({ type: 'ADVANCE_AGE', payload: {} })}
                            resources={resources} 
                            population={population} 
                            unitList={activeUnits} 
                            activeTasks={activeTasks} 
                            anchorRect={buildingManagementPanel.anchorRect} 
                            masterResearchList={masterResearchList} 
                            completedResearch={completedResearch} 
                            currentAge={currentAge} 
                            ageProgressionList={ageProgressionList} 
                        />
                        <ResourceAssignmentPanel isOpen={assignmentPanelState.isOpen} onClose={() => setAssignmentPanelState({ isOpen: false, targetId: null, targetType: null, anchorRect: null })} assignmentTarget={assignmentTarget || null} idleVillagerCount={idleVillagerCount} onAssignVillagers={handleAssignVillagers} onRecallVillagers={handleRecallVillagers} gatherInfo={gatherInfoRef.current} buildingList={buildingList} units={units} anchorRect={assignmentPanelState.anchorRect} />
                        <CivilizationPanel isOpen={civPanelState.isOpen} onClose={() => setCivPanelState({ isOpen: false, anchorRect: null })} civilization={civilization} anchorRect={civPanelState.anchorRect} />
                        <AllBuildingsPanel isOpen={allBuildingsPanel.isOpen} onClose={() => setAllBuildingsPanel({ isOpen: false, anchorRect: null })} buildingList={buildingList} buildingCounts={buildingCounts} activeTasks={activeTasks} onOpenBuildingPanel={handleOpenBuildingPanel} anchorRect={allBuildingsPanel.anchorRect} />
                        <InventoryPanel isOpen={inventoryPanelState.isOpen} onClose={() => setInventoryPanelState({ isOpen: false, anchorRect: null })} inventory={inventory} onUseItem={handleUseItem} activeTasks={activeTasks} activeBuffs={activeBuffs} anchorRect={inventoryPanelState.anchorRect} />
                        <ResearchPanel 
                            isOpen={researchPanelState.isOpen} 
                            onClose={() => setResearchPanelState({ isOpen: false, anchorRect: null })}
                            masterResearchList={masterResearchList}
                            completedResearch={completedResearch}
                            activeTasks={activeTasks}
                            resources={resources}
                            currentAge={currentAge}
                            ageProgressionList={ageProgressionList}
                            onStartResearch={(researchId) => dispatchResearchAction({ type: 'START_RESEARCH', payload: { researchId } })}
                        />
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
