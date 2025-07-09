'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Stage, Layer, Rect, Circle } from 'react-konva';
import Konva from 'konva';

const GRID_SIZE = 30;
const MAP_WIDTH_CELLS = 30;
const MAP_HEIGHT_CELLS = 20;

const TestMapPage = () => {
    const [targetPosition, setTargetPosition] = useState({ x: 5, y: 5 });
    const [isClient, setIsClient] = useState(false);
    const unitRef = useRef<Konva.Circle>(null);

    useEffect(() => {
        // Konva requires the window object, so we only render it on the client.
        setIsClient(true);
    }, []);

    // This effect runs when the target position changes, triggering the animation.
    useEffect(() => {
        if (isClient && unitRef.current) {
            new Konva.Tween({
                node: unitRef.current,
                duration: 0.3, // Duration of the movement in seconds
                x: targetPosition.x * GRID_SIZE + GRID_SIZE / 2,
                y: targetPosition.y * GRID_SIZE + GRID_SIZE / 2,
                easing: Konva.Easings.EaseInOut,
            }).play();
        }
    }, [targetPosition, isClient]);

    const handleCellClick = (x: number, y: number) => {
        setTargetPosition({ x, y });
    };

    const renderGrid = () => {
        const grid = [];
        for (let y = 0; y < MAP_HEIGHT_CELLS; y++) {
            for (let x = 0; x < MAP_WIDTH_CELLS; x++) {
                grid.push(
                    <Rect
                        key={`${x}-${y}`}
                        x={x * GRID_SIZE}
                        y={y * GRID_SIZE}
                        width={GRID_SIZE}
                        height={GRID_SIZE}
                        fill="#504945"
                        stroke="#665c54"
                        strokeWidth={1}
                        onClick={() => handleCellClick(x, y)}
                        onTap={() => handleCellClick(x, y)}
                    />
                );
            }
        }
        return grid;
    };

    if (!isClient) {
        return (
             <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
                <h1 className="text-4xl font-serif text-brand-gold mb-4">Loading Map Engine...</h1>
             </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-serif text-brand-gold mb-2">High-Performance RTS Map</h1>
            <p className="text-parchment-dark mb-4 text-sm">
                This map uses an HTML5 Canvas for fast rendering. Click a tile to move the unit.
            </p>
            <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border-2 border-stone-light">
                 <Stage
                    width={MAP_WIDTH_CELLS * GRID_SIZE}
                    height={MAP_HEIGHT_CELLS * GRID_SIZE}
                    className="mx-auto"
                >
                    <Layer>
                        {/* Render the grid cells */}
                        {renderGrid()}

                        {/* Render the movable unit */}
                        <Circle
                            ref={unitRef}
                            x={targetPosition.x * GRID_SIZE + GRID_SIZE / 2}
                            y={targetPosition.y * GRID_SIZE + GRID_SIZE / 2}
                            radius={GRID_SIZE / 3}
                            fill="#83a598"
                            stroke="#fdf6e3"
                            strokeWidth={2}
                            shadowBlur={5}
                            shadowColor="#458588"
                        />
                    </Layer>
                </Stage>
            </div>
             <Link href="/" className="sci-fi-button mt-6">
                Return to Main Menu
            </Link>
        </div>
    );
};

export default TestMapPage;
