'use client';
import React from 'react';
import { Group, Rect } from 'react-konva';
import type Konva from 'konva';

const Hut = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    return (
        <Group {...props} ref={ref}>
            <Rect x={-30} y={-30} width={60} height={60} fill="#a16207" stroke="#3c3836" strokeWidth={2} cornerRadius={5} />
            <Rect x={-35} y={-40} width={70} height={20} fill="#854d0e" stroke="#3c3836" strokeWidth={2} cornerRadius={2} />
        </Group>
    );
});
Hut.displayName = 'Hut';
export default Hut;
