
'use client';

import React, { useRef, useEffect, useState, forwardRef } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Group } from "react-konva";
import Konva from "konva";

const TownCenter = forwardRef<Konva.Group, Konva.GroupConfig>((props, ref) => {
  const flagRef = useRef<Konva.Group>(null);
  const [flagWave, setFlagWave] = useState(0);

  // Animate flag wave
  useEffect(() => {
    const layer = flagRef.current?.getLayer();
    if (!layer) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const amplitude = 5;
      const period = 1000;
      const newY = Math.sin((frame.time * 2 * Math.PI) / period) * amplitude;
      setFlagWave(newY);
    }, layer);
    anim.start();
    return () => anim.stop();
  }, []);

  const windowColor = "#f0e68c";

  return (
    <Group {...props} ref={ref}>
        {/* Stone Path underneath */}
        <Rect x={-15} y={-100} width={30} height={200} fill="#a8a29e" cornerRadius={5} />
        
        {/* Main Building */}
        <Rect
            x={-100}
            y={-60}
            width={200}
            height={120}
            fill="#d9a066"
            stroke="#854d0e"
            strokeWidth={4}
            shadowBlur={15}
            shadowColor="rgba(0,0,0,0.5)"
            cornerRadius={5}
        />
         {/* Roof */}
        <Rect
            x={-110}
            y={-90}
            width={220}
            height={40}
            fill="#c1440e"
            stroke="#7a4b03"
            strokeWidth={3}
            cornerRadius={3}
        />

        {/* Windows */}
        <Rect x={-60} y={-20} width={30} height={40} fill={windowColor} stroke="black" strokeWidth={1} />
        <Rect x={30} y={-20} width={30} height={40} fill={windowColor} stroke="black" strokeWidth={1} />

        {/* Door */}
        <Rect x={-30} y={10} width={60} height={50} fill="#854d0e" stroke="black" strokeWidth={2} cornerRadius={2}/>
        <Circle x={-20} y={35} radius={3} fill="#facc15" />


        {/* Flag Pole and Animated Flag */}
        <Group ref={flagRef} x={-5}>
            <Line points={[0, -60, 0, -140]} stroke="#333" strokeWidth={4} />
            <Line
                points={[
                0, -140,
                30, -135 + flagWave,
                0, -130 + flagWave * 2
                ]}
                closed
                fill="#e63946"
                stroke="#c1440e"
                strokeWidth={1.5}
            />
        </Group>
    </Group>
  );
});

TownCenter.displayName = 'TownCenter';

export default TownCenter;
