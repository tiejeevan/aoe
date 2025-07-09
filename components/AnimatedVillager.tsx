import React from 'react';
import { Rect, Circle, Group } from 'react-konva';
import type Konva from 'konva';

// All dimensions are scaled down to fit within a grid cell
const scale = 0.1; // Make it about 10% of its original size

const AnimatedVillager = React.forwardRef<Konva.Group, {
    isSelected: boolean;
    leftLegRef: React.RefObject<Konva.Rect>;
    rightLegRef: React.RefObject<Konva.Rect>;
}>(({ isSelected, leftLegRef, rightLegRef }, ref) => {
    return (
        <Group ref={ref} offsetY={130 * scale}>
            {/* Body (torso) */}
            <Rect x={-40 * scale} y={-110 * scale} width={80 * scale} height={130 * scale} fill="#3b5998" stroke="black" strokeWidth={2 * scale} cornerRadius={20 * scale}/>
            {/* Left Arm */}
            <Rect x={-70 * scale} y={-100 * scale} width={30 * scale} height={90 * scale} fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}/>
            {/* Right Arm */}
            <Rect x={40 * scale} y={-100 * scale} width={30 * scale} height={90 * scale} fill="#f5d6b4" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}/>
            {/* Legs */}
            <Rect ref={leftLegRef} x={-30 * scale} y={20 * scale} width={30 * scale} height={110 * scale} fill="#654321" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}/>
            <Rect ref={rightLegRef} x={10 * scale} y={20 * scale} width={30 * scale} height={110 * scale} fill="#654321" stroke="black" strokeWidth={2 * scale} cornerRadius={15 * scale}/>
            {/* Head */}
            <Circle x={0} y={-150 * scale} radius={40 * scale} fill="#f5d6b4" stroke="black" strokeWidth={2 * scale}/>
            {/* Selection Indicator */}
            {isSelected && <Circle radius={60 * scale} y={-30 * scale} stroke="#d79921" strokeWidth={3 * scale} dash={[10 * scale, 5 * scale]} listening={false}/>}
        </Group>
    );
});
AnimatedVillager.displayName = 'AnimatedVillager';

export default AnimatedVillager;
