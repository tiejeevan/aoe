'use client';
import React from 'react';
import { Group, Rect, Path } from 'react-konva';
import type Konva from 'konva';

const Barracks = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    return (
        <Group {...props} ref={ref}>
            <Rect x={-50} y={-40} width={100} height={80} fill="#c1440e" stroke="#3c3836" strokeWidth={3} cornerRadius={5} />
            <Rect x={-60} y={-50} width={120} height={20} fill="#854d0e" stroke="#3c3836" strokeWidth={2} />
            {/* Simple sword icon */}
            <Path x={-30} y={-15} data="M0 20 L0 5 M-5 5 L5 5 M0 5 L-2 2 M0 5 L2 2" stroke="white" strokeWidth={3} scale={{ x: 1.5, y: 1.5 }} />
            <Path x={30} y={-15} data="M0 20 L0 5 M-5 5 L5 5 M0 5 L-2 2 M0 5 L2 2" stroke="white" strokeWidth={3} scale={{ x: 1.5, y: 1.5 }} />
        </Group>
    );
});
Barracks.displayName = 'Barracks';
export default Barracks;
