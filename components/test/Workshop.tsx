'use client';
import React from 'react';
import { Group, Rect, Path, Circle } from 'react-konva';
import type Konva from 'konva';

const Workshop = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    return (
        <Group {...props} ref={ref}>
            <Rect x={-60} y={-30} width={120} height={60} fill="#854d0e" stroke="#3c3836" strokeWidth={3} cornerRadius={5} />
             {/* Slanted Roof */}
            <Path data="M -65 -30 L 0 -60 L 65 -30 Z" fill="#a16207" stroke="#3c3836" strokeWidth={3} closed/>
             {/* Gear Icon */}
             <Circle x={0} y={0} radius={15} stroke="white" strokeWidth={4} />
             <Circle x={0} y={0} radius={8} fill="white" />
             {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => (
                 <Rect key={angle} x={-5} y={-18} width={10} height={8} fill="white" rotation={angle} offsetX={-5} offsetY={-18}/>
             ))}
        </Group>
    );
});
Workshop.displayName = 'Workshop';
export default Workshop;
