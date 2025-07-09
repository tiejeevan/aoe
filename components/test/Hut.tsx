'use client';

import React from 'react';
import { Group, Rect, Line, Circle } from 'react-konva';
import type Konva from 'konva';

// This component is adapted from the user-provided code.
// The Stage, Layer, and decorative scene elements have been removed.
// The drawing has been centered and scaled to work as a reusable component on the map.
const Hut = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    // The original drawing was very large. We scale it down to fit on our grid.
    const scale = 0.4; 
    
    // The original drawing was at an absolute position. 
    // These offsets re-center the drawing around (0,0) so it can be placed anywhere.
    const offsetX = 100;
    const offsetY = 75;

    return (
        <Group {...props} ref={ref} scale={{ x: scale, y: scale }}>
            {/* Hut Walls */}
            <Rect
                x={-offsetX}
                y={-offsetY}
                width={200}
                height={150}
                fill="#DEB887"
                stroke="brown"
                strokeWidth={4 / scale}
            />

            {/* Door */}
            <Rect
                x={80 - offsetX}
                y={90 - offsetY}
                width={40}
                height={60}
                fill="#654321"
                stroke="black"
                strokeWidth={2 / scale}
                cornerRadius={6}
            />

            {/* Door Knob */}
            <Circle
                x={115 - offsetX}
                y={120 - offsetY}
                radius={3}
                fill="gold"
            />

            {/* Window Left */}
            <Rect
                x={20 - offsetX}
                y={40 - offsetY}
                width={35}
                height={35}
                fill="#ADD8E6"
                stroke="black"
                strokeWidth={2 / scale}
            />

            {/* Window Right */}
            <Rect
                x={145 - offsetX}
                y={40 - offsetY}
                width={35}
                height={35}
                fill="#ADD8E6"
                stroke="black"
                strokeWidth={2 / scale}
            />

            {/* Roof */}
            <Line
                points={[
                  -30 - offsetX, 0 - offsetY,
                  100 - offsetX, -90 - offsetY,
                  230 - offsetX, 0 - offsetY,
                ]}
                closed
                fill="#A0522D"
                stroke="brown"
                strokeWidth={5 / scale}
            />

            {/* Chimney */}
            <Rect
                x={150 - offsetX}
                y={-70 - offsetY}
                width={25}
                height={45}
                fill="#8B0000"
                stroke="black"
                strokeWidth={2 / scale}
            />
        </Group>
    );
});

Hut.displayName = 'Hut';
export default Hut;
