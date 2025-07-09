'use client';
import React from 'react';
import { Group, Rect, Path, Circle } from 'react-konva';
import type Konva from 'konva';

const ResearchLab = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    return (
        <Group {...props} ref={ref}>
            <Rect x={-50} y={-50} width={100} height={100} fill="#458588" stroke="#fbf1c7" strokeWidth={3} cornerRadius={50} />
            <Circle x={0} y={0} radius={30} fill="#83a598" />
             {/* Flask Icon */}
             <Circle x={0} y={10} radius={12} stroke="white" strokeWidth={3} />
             <Rect x={-5} y={-20} width={10} height={20} fill="white" />
             <Rect x={-10} y={-20} width={20} height={5} fill="white" />
        </Group>
    );
});
ResearchLab.displayName = 'ResearchLab';
export default ResearchLab;
