
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Group, Rect } from 'react-konva';
import Konva from 'konva';

interface KonvaProgressBarProps {
    x: number;
    y: number;
    width: number;
    height: number;
    startTime: number;
    duration: number;
    progressColor?: string;
    backgroundColor?: string;
    borderColor?: string;
}

const KonvaProgressBar: React.FC<KonvaProgressBarProps> = ({ x, y, width, height, startTime, duration, progressColor = '#458588', backgroundColor = '#282828', borderColor = '#fbf1c7' }) => {
    const rectRef = useRef<Konva.Rect>(null);
    const animRef = useRef<Konva.Animation>();

    useEffect(() => {
        const node = rectRef.current;
        if (!node) return;
        const layer = node.getLayer();
        if (!layer) return;

        animRef.current = new Konva.Animation(frame => {
            const elapsedTime = Date.now() - startTime;
            const newProgress = Math.min(1, duration > 0 ? elapsedTime / duration : 1);
            node.width(width * newProgress);
        }, layer);

        animRef.current.start();
        
        return () => {
            animRef.current?.stop();
        };
    }, [startTime, duration, width]);

    return (
        <Group x={x} y={y}>
            <Rect width={width} height={height} fill={backgroundColor} stroke={borderColor} strokeWidth={1} />
            <Rect ref={rectRef} width={0} height={height} fill={progressColor} />
        </Group>
    );
};

export default KonvaProgressBar;
