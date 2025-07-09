
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import AnimatedVillager from '../../../components/AnimatedVillager';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 40;
const MAP_HEIGHT_CELLS = 25;

interface Villager {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    task: 'idle' | 'moving';
}

const TestMapPage = () => {
    const [isClient, setIsClient] = useState(false);
    const [villagers, setVillagers] = useState<Villager[]>([]);
    
    // State for panning and zooming
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);

    const stageRef = useRef<Konva.Stage>(null);

    // Initial setup on component mount
    useEffect(() => {
        setIsClient(true);
        const initialX = 10 * GRID_SIZE;
        const initialY = 10 * GRID_SIZE;
        // Create one villager at a fixed position
        setVillagers([{
            id: 'villager-1',
            x: initialX,
            y: initialY,
            targetX: initialX,
            targetY: initialY,
            task: 'idle',
        }]);
    }, []);

    // Add keyboard listeners for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === ' ') { e.preventDefault(); setIsSpacebarPressed(true); }};
        const handleKeyUp = (e: KeyboardEvent) => { if (e.key === ' ') setIsSpacebarPressed(false); };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
    }, []);

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
    
    // New handler for right-click movement
    const handleStageContextMenu = (e: Konva.KonvaEventObject<PointerEvent>) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;

        // Move the first villager
        if (villagers.length > 0) {
            setVillagers(currentVillagers => {
                const newVillagers = [...currentVillagers];
                const villager = newVillagers[0];
                newVillagers[0] = { 
                    ...villager, 
                    targetX: pointerPos.x, 
                    targetY: pointerPos.y,
                    task: 'moving'
                };
                return newVillagers;
            });
        }
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
                y={Math.floor(i / MAP_HEIGHT_CELLS) * GRID_SIZE} 
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
                <h1 className="text-3xl font-serif text-brand-gold">Animation Test Map - Step 3: Smooth Movement</h1>
                <p className="text-parchment-dark mb-4 text-sm">Right-click on the map to move the villager. It should now glide smoothly with a walking animation.</p>
            </div>
            <div className={`flex-grow aspect-[40/25] bg-black rounded-lg overflow-hidden border-2 border-stone-light relative ${isSpacebarPressed ? 'cursor-grab' : 'cursor-default'}`}>
                 <Stage 
                    ref={stageRef} 
                    width={MAP_WIDTH_CELLS * GRID_SIZE} 
                    height={MAP_HEIGHT_CELLS * GRID_SIZE} 
                    className="mx-auto" 
                    onWheel={handleWheel}
                    onContextMenu={handleStageContextMenu}
                    draggable={isSpacebarPressed} 
                    scaleX={stageScale} 
                    scaleY={stageScale} 
                    x={stagePos.x} 
                    y={stagePos.y}
                >
                    <Layer>
                        {renderGrid()}
                        
                        {villagers.map(villager => (
                            <AnimatedVillager
                                key={villager.id}
                                id={villager.id}
                                x={villager.x} // Initial X
                                y={villager.y} // Initial Y
                                targetX={villager.targetX}
                                targetY={villager.targetY}
                                task={villager.task}
                                onMoveEnd={() => handleVillagerMoveEnd(villager.id)}
                            />
                        ))}

                    </Layer>
                </Stage>
            </div>
            <Link href="/" className="sci-fi-button mt-6">Return to Main Menu</Link>
        </div>
    );
};

export default TestMapPage;
