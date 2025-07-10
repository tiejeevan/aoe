
'use client';

import React from 'react';
import { Group, Line, Circle, Stage, Layer } from 'react-konva';
import type Konva from 'konva';

// This component is a direct representation of the provided JSX stick figure design.
const CustomBuilding1 = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    return (
        // We wrap the original Layer content in a Group so it can be positioned
        // on the stage by the parent component using x and y props.
        <Group {...props} ref={ref}>
            {/* Body */}
            <Line
                points={[0, 25, 0, 125]} // torso (adjusted to be relative to the group's center)
                stroke="black"
                strokeWidth={4}
            />

            {/* Arms */}
            <Line
                points={[-50, 55, 0, 45, 50, 55]} // arms outstretched
                stroke="black"
                strokeWidth={4}
            />

            {/* Legs */}
            <Line
                points={[0, 125, -30, 195]} // left leg
                stroke="black"
                strokeWidth={4}
            />
            <Line
                points={[0, 125, 30, 195]} // right leg
                stroke="black"
                strokeWidth={4}
            />

            {/* Head */}
            <Circle
                x={0}
                y={0}
                radius={30}
                fill="#ffcc99"
                stroke="black"
                strokeWidth={2}
            />

            {/* Hair */}
            <Group>
                <Line
                    points={[-30, -30, 30, -30, 20, -20, -20, -20]}
                    fill="brown"
                    closed
                />
                <Line
                    points={[-25, -35, 25, -35, 20, -30, -20, -30]}
                    fill="saddlebrown"
                    closed
                />
            </Group>
      </Group>
    );
});

CustomBuilding1.displayName = 'CustomBuilding1';
export default CustomBuilding1;
