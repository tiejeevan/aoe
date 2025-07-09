'use client';
import React from 'react';
import { Group, Rect } from 'react-konva';
import type Konva from 'konva';

const Castle = React.forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
    return (
        <Group {...props} ref={ref}>
            <Rect x={-75} y={-60} width={150} height={120} fill="#a8a29e" stroke="#3c3836" strokeWidth={4} cornerRadius={5} />
            {/* Main Tower */}
            <Rect x={-25} y={-90} width={50} height={100} fill="#78716c" stroke="#3c3836" strokeWidth={3} />
            {/* Crenellations */}
            <Rect x={-80} y={-70} width={20} height={20} fill="#78716c" stroke="#3c3836" strokeWidth={2}/>
            <Rect x={60} y={-70} width={20} height={20} fill="#78716c" stroke="#3c3836" strokeWidth={2}/>
            <Rect x={-30} y={-100} width={15} height={15} fill="#a8a29e" stroke="#3c3836" strokeWidth={2}/>
            <Rect x={15} y={-100} width={15} height={15} fill="#a8a29e" stroke="#3c3836" strokeWidth={2}/>
             {/* Gate */}
            <Rect x={-20} y={30} width={40} height={30} fill="#854d0e" stroke="#3c3836" strokeWidth={3} />
        </Group>
    );
});
Castle.displayName = 'Castle';
export default Castle;
