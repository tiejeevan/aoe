
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Group, Label, Tag, Text, Line } from 'react-konva';
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
    task: 'idle' | 'moving' | 'mining' | 'building';
    targetMineId: string | null;
}

interface GoldMineData {
    id: string;
    x: number;
    y: number;
    amount: number;
}

interface Building {
    id: string;
    x: number;
    y: number;
    type: 'house';
}

type PlayerAction = 
    | { mode: 'moving_villager'; data: { villagerId: string } }
    | { mode: 'placing_building'; data: { buildingType: 'house' } }
    | null;

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

const House = React.forwardRef<Konva.Group, Konva.GroupConfig & { isPreview?: boolean }>(({ isPreview, ...props }, ref) => (
    <Group {...props} ref={ref} opacity={isPreview ? 0.6 : 1}>
        <Rect width={GRID_SIZE * 2} height={GRID_SIZE * 1.5} fill="#a16207" stroke="#3c3836" strokeWidth={2} cornerRadius={3} listening={false}/>
        <Line points={[0, 0, GRID_SIZE, -GRID_SIZE, GRID_SIZE * 2, 0]} closed fill="#854d0e" stroke="#3c3836" strokeWidth={2} listening={false}/>
        <Rect x={GRID_SIZE * 0.75} y={GRID_SIZE * 0.5} width={GRID_SIZE * 0.5} height={GRID_SIZE} fill="#3c3836" listening={false}/>
    </Group>
));
House.displayName = 'House';

const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    const [goldMines, setGoldMines] = useState<GoldMineData[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [selectedVillagerIds, setSelectedVillagerIds] = useState<Set<string>>(new Set());
    const [selectionRect, setSelectionRect] = useState<{ x1: number, y1: number, x2: number, y2: number, visible: boolean } | null>(null);
    const [hoveredMineId, setHoveredMineId] =useState<string|null>(null);
    const [tooltipMineId, setTooltipMineId] = useState<string | null>(null);
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [stageDraggable, setStageDraggable] = useState(true);
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
    const [playerAction, setPlayerAction] = useState<PlayerAction>(null);
    const [placementPreview, setPlacementPreview] = useState<{x: number, y: number} | null>(null);


    const stageRef = useRef<Konva.Stage>(null);
    const layerRef = useRef<Konva.Layer>(null);
    const villagerRefs = useRef<Record<string, Konva.Group>>({});
    const goldMineRefs = useRef<Record<string, Konva.Group>>({});
    const isSelecting = useRef(false);

    useEffect(() => {
        setIsClient(true);
        const initialVillagers: Villager[] = [];
        for (let i = 0; i < 5; i++) {
            const id = `villager-${i}`;
            const x = (Math.floor(Math.random() * 5) + 3) * GRID_SIZE;
            const y = (Math.floor(Math.random() * 5) + 3) * GRID_SIZE;
            initialVillagers.push({ id, x, y, targetX: x, targetY: y, task: 'idle', targetMineId: null });
        }
        setVillagers(initialVillagers);
        
        setGoldMines([{ id: 'gold-mine-1', x: 25 * GRID_SIZE, y: 12 * GRID_SIZE, amount: 5000 }]);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); setIsSpacebarPressed(true); }};
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacebarPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

    const updateVillagersState = useCallback(() => {
         setVillagers(currentVillagers => 
            currentVillagers.map(v => {
                const node = villagerRefs.current[v.id];
                if (!node) return v;

                const isMoving = Math.hypot(v.targetX - node.x(), v.targetY - node.y()) > 5;
                const newIsMovingState = isMoving && v.task === 'moving';
                
                if(newIsMovingState) return { ...v, x: node.x(), y: node.y() };
                
                if(!isMoving && v.task === 'moving') {
                    if(v.targetMineId) return { ...v, task: 'mining', x: node.x(), y: node.y() };
                    return { ...v, task: 'idle', x: node.x(), y: node.y() };
                }
                return v;
            })
        );
    }, []);

    useEffect(() => {
        if (!isClient) return;
        const layer = layerRef.current;
        if (!layer) return;

        const anim = new Konva.Animation(frame => {
            if (!frame) return;
            
            villagers.forEach(villagerData => {
                const villagerNode = villagerRefs.current[villagerData.id];
                if (!villagerNode || villagerData.task !== 'moving') return;
                const { targetX, targetY } = villagerData;
                const { x: currentX, y: currentY } = villagerNode.position();
                const dx = targetX - currentX; const dy = targetY - currentY;
                const distance = Math.hypot(dx, dy);
                if (distance < 5) { villagerNode.position({x: targetX, y: targetY}); return; };
                const moveDistance = UNIT_SPEED * (frame.timeDiff / 1000);
                const ratio = Math.min(1, moveDistance / distance);
                villagerNode.position({ x: currentX + dx * ratio, y: currentY + dy * ratio });
            });

             const minersPerMine: Record<string, number> = {};
             villagers.forEach(v => { if (v.task === 'mining' && v.targetMineId) minersPerMine[v.targetMineId] = (minersPerMine[v.targetMineId] || 0) + 1; });
             if (Object.keys(minersPerMine).length > 0) {
                 const MINE_RATE_PER_VILLAGER = 5;
                 setGoldMines(currentMines => currentMines.map(mine => {
                     const miners = minersPerMine[mine.id] || 0;
                     if (miners === 0 || mine.amount <= 0) return mine;
                     const newAmount = mine.amount - (miners * MINE_RATE_PER_VILLAGER * (frame.timeDiff / 1000));
                     if (newAmount <= 0) {
                         setVillagers(currentVillagers => currentVillagers.map(v => v.targetMineId === mine.id ? { ...v, task: 'idle', targetMineId: null } : v));
                         setTooltipMineId(prevId => prevId === mine.id ? null : prevId);
                     }
                     return { ...mine, amount: Math.max(0, newAmount) };
                 }));
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
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        const clampedScale = Math.max(0.5, Math.min(newScale, 3.0));
        if (clampedScale !== oldScale) {
            setStageScale(clampedScale);
            setStagePos({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
        }
    };

    const handleMineClick = (mineId: string, e: Konva.KonvaEventObject<MouseEvent>) => { e.evt.stopPropagation(); setTooltipMineId(prevId => (prevId === mineId ? null : mineId)); };

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (playerAction?.mode === 'placing_building') {
            const stage = stageRef.current; if (!stage) return;
            const pos = stage.getPointerPosition(); if (!pos) return;
            const transform = stage.getAbsoluteTransform().copy().invert();
            const { x, y } = transform.point(pos);
            setBuildings(prev => [...prev, { id: `house-${Date.now()}`, type: 'house', x, y }]);
            setPlayerAction(null); setPlacementPreview(null);
            return;
        }

        if (isSpacebarPressed || e.evt.button !== 0 || e.evt.altKey || e.evt.ctrlKey) return;
        if (e.target === stageRef.current) {
            setTooltipMineId(null);
            isSelecting.current = true;
            const stage = stageRef.current; if (!stage) return;
            const pos = stage.getPointerPosition(); if (!pos) return;
            const transform = stage.getAbsoluteTransform().copy().invert();
            const { x: x1, y: y1 } = transform.point(pos);
            setSelectionRect({ x1, y1, x2: x1, y2: y1, visible: true });
        }
    };

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = stageRef.current; if (!stage) return;
        const pos = stage.getPointerPosition(); if (!pos) return;
        const transform = stage.getAbsoluteTransform().copy().invert();
        const { x, y } = transform.point(pos);

        if (isSelecting.current && selectionRect) {
            setSelectionRect({ ...selectionRect, x2: x, y2: y });
        }
        if (playerAction?.mode === 'placing_building') {
            setPlacementPreview({ x, y });
        }
    };

    const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent>) => {
        isSelecting.current = false;
        if (!selectionRect) return;
        const stage = stageRef.current; if (!stage) { setSelectionRect(null); return; }
        const { x1, y1, x2, y2 } = selectionRect;
        const isDrag = Math.abs(x1 - x2) > 5 || Math.abs(y1 - y2) > 5;
        setSelectionRect(null);
        if (e.evt.button !== 0) return;
        if (isDrag) {
            const selectionBox = { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2) };
            const newSelectedIds = new Set<string>();
            Object.values(villagerRefs.current).forEach(node => { if (node && Konva.Util.haveIntersection(selectionBox, node.getClientRect({}))) newSelectedIds.add(node.id()); });
            if (e.evt.shiftKey) setSelectedVillagerIds(prev => { const combined = new Set(prev); newSelectedIds.forEach(id => combined.add(id)); return combined; });
            else setSelectedVillagerIds(newSelectedIds);
        } else if (e.target === stageRef.current) setSelectedVillagerIds(new Set());
    };

    const handleUnitClick = (e: Konva.KonvaEventObject<MouseEvent>, villagerId: string) => {
        e.evt.stopPropagation();
        const currentlySelected = new Set(selectedVillagerIds);
        if (e.evt.shiftKey) { if (currentlySelected.has(villagerId)) currentlySelected.delete(villagerId); else currentlySelected.add(villagerId); } 
        else { currentlySelected.clear(); currentlySelected.add(villagerId); }
        setSelectedVillagerIds(currentlySelected); setTooltipMineId(null);
    };

    const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        if (playerAction?.mode === 'placing_building') { setPlayerAction(null); setPlacementPreview(null); return; }
        if (selectedVillagerIds.size === 0) return;

        const stage = stageRef.current; if (!stage) return;
        const pos = stage.getPointerPosition(); if (!pos) return;
        const transform = stage.getAbsoluteTransform().copy().invert();
        let { x: targetX, y: targetY } = transform.point(pos);
        let targetRadius = 15; let targetMineId: string | null = null;
        
        const mineGroup = e.target.getAncestors().find(ancestor => ancestor.id()?.startsWith('gold-mine'));
        if (mineGroup) {
            targetMineId = mineGroup.id();
            const mineData = goldMines.find(m => m.id === targetMineId);
            if (mineData && mineData.amount <= 0) return;
            targetX = mineGroup.x(); targetY = mineGroup.y(); targetRadius = 50; 
        }
        setVillagers(currentVillagers => currentVillagers.map(v => {
            if (selectedVillagerIds.has(v.id)) {
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.random() * targetRadius;
                return { ...v, targetX: targetX + Math.cos(angle) * radius, targetY: targetY + Math.sin(angle) * radius, task: 'moving', targetMineId };
            }
            return v;
        }));
    };
    
    const handleEnterBuildMode = () => {
        setPlayerAction({ mode: 'placing_building', data: { buildingType: 'house' } });
    };

    const renderGrid = () => Array.from({ length: MAP_WIDTH_CELLS * MAP_HEIGHT_CELLS }).map((_, i) => <Rect key={i} x={(i % MAP_WIDTH_CELLS) * GRID_SIZE} y={Math.floor(i / MAP_WIDTH_CELLS) * GRID_SIZE} width={GRID_SIZE} height={GRID_SIZE} fill="#504945" stroke="#665c54" strokeWidth={1} listening={false}/>);
    const activeTooltipMine = tooltipMineId ? goldMines.find(m => m.id === tooltipMineId) : null;
    if (!isClient) return <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8"><h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1></div>;

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">Resource Interaction Test Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">Left-click drag to select. Right-click to move. Hold Spacebar + drag to pan. Scroll to zoom.</p>
            <div className="flex w-full max-w-6xl">
                <div className={`flex-grow aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative ${isSpacebarPressed ? 'cursor-grab' : 'cursor-default'}`}>
                     <Stage 
                        ref={stageRef} width={MAP_WIDTH_CELLS * GRID_SIZE} height={MAP_HEIGHT_CELLS * GRID_SIZE} 
                        className="mx-auto" onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove}
                        onMouseUp={handleStageMouseUp} onContextMenu={handleStageContextMenu} onWheel={handleWheel}
                        draggable={isSpacebarPressed} scaleX={stageScale} scaleY={stageScale} x={stagePos.x} y={stagePos.y}
                    >
                        <Layer ref={layerRef}>
                            {renderGrid()}
                            {buildings.map(building => (<House key={building.id} id={building.id} x={building.x} y={building.y} />))}
                            {goldMines.map(mine => (
                                <AnimatedGoldMine
                                    key={mine.id} id={mine.id} ref={node => { if(node) goldMineRefs.current[mine.id] = node; }}
                                    x={mine.x} y={mine.y} onClick={(e) => handleMineClick(mine.id, e)} onTap={(e) => handleMineClick(mine.id, e as any)}
                                    onMouseEnter={() => { if(selectedVillagerIds.size > 0) setHoveredMineId(mine.id); if(!isSpacebarPressed) setStageDraggable(false); }}
                                    onMouseLeave={() => { setHoveredMineId(null); if(!isSpacebarPressed) setStageDraggable(true); }}
                                />
                            ))}
                            {villagers.map(villager => {
                                 const villagerNode = villagerRefs.current[villager.id]; const currentX = villagerNode?.x() || villager.x; const currentY = villagerNode?.y() || villager.y;
                                 const isActuallyMoving = Math.hypot(villager.targetX - currentX, villager.targetY - currentY) > 5 && villager.task === 'moving';
                                 return ( <AnimatedVillager key={villager.id} ref={node => { if(node) villagerRefs.current[villager.id] = node; }} id={villager.id} x={currentX} y={currentY}
                                        isMoving={isActuallyMoving} isMining={villager.task === 'mining'} isSelected={selectedVillagerIds.has(villager.id)}
                                        onClick={(e) => handleUnitClick(e, villager.id)} onTap={(e) => handleUnitClick(e, villager.id)}
                                        onMouseEnter={() => { if(!isSpacebarPressed) setStageDraggable(false); }} onMouseLeave={() => { if(!isSpacebarPressed) setStageDraggable(true); }} /> )
                            })}
                            {selectionRect?.visible && (<Rect x={Math.min(selectionRect.x1, selectionRect.x2)} y={Math.min(selectionRect.y1, selectionRect.y2)} width={Math.abs(selectionRect.x1 - selectionRect.x2)} height={Math.abs(selectionRect.y1 - selectionRect.y2)} fill="rgba(131, 165, 152, 0.3)" stroke="#83a598" strokeWidth={1 / stageScale} listening={false} />)}
                            {hoveredMineId && goldMines.find(m => m.id === hoveredMineId) && (<PickaxeIcon x={goldMines.find(m => m.id === hoveredMineId)!.x} y={goldMines.find(m => m.id === hoveredMineId)!.y - 60}/>)}
                            {activeTooltipMine && (<Label x={activeTooltipMine.x} y={activeTooltipMine.y - 90} opacity={0.9} listening={false} ><Tag fill='#201c1a' pointerDirection='down' pointerWidth={10} pointerHeight={10} lineJoin='round' cornerRadius={5} shadowColor='black' shadowBlur={5} shadowOpacity={0.4} /><Text text={`Gold: ${Math.floor(activeTooltipMine.amount)}`} fontFamily='Quattrocento Sans, sans-serif' fontSize={16} padding={8} fill='#fbf1c7' /></Label>)}
                            {placementPreview && (<House x={placementPreview.x} y={placementPreview.y} isPreview />)}
                        </Layer>
                    </Stage>
                </div>
                {selectedVillagerIds.size > 0 && (
                    <div className="w-48 ml-4 p-4 bg-stone-dark/50 rounded-lg border border-stone-light/30">
                        <h3 className="font-serif text-lg text-brand-gold mb-2">{selectedVillagerIds.size} Villager(s) Selected</h3>
                        <div className="flex flex-col gap-2">
                           <button onClick={handleEnterBuildMode} className="text-left p-2 rounded-md hover:bg-brand-blue/20 transition-colors">Build House</button>
                        </div>
                    </div>
                )}
            </div>
             <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
