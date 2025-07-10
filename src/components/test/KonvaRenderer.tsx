
'use client';

import React from 'react';
import { Group, Rect, Circle, Ellipse, Line, Text, Path, Star, Ring, Wedge, Arc, Image, Sprite, Shape, Layer } from 'react-konva';
import Konva from 'konva';

// A mapping from string identifiers to the actual Konva components
const componentMap: { [key: string]: React.ComponentType<any> } = {
  Group,
  Rect,
  Circle,
  Ellipse,
  Line,
  Text,
  Path,
  Star,
  Ring,
  Wedge,
  Arc,
  Image,
  Sprite,
  Shape,
  Layer,
};

interface NodeConfig extends Konva.NodeConfig {
  className: string;
  children?: NodeConfig[];
}

interface KonvaRendererProps {
  node: NodeConfig;
}

const KonvaRendererNode: React.FC<KonvaRendererProps> = ({ node }) => {
  const Component = componentMap[node.className];

  if (!Component) {
    console.warn(`Konva component "${node.className}" not found. Skipping.`);
    return null;
  }

  // Filter out children from props passed to the component itself
  const { children, ...restOfProps } = node;

  return (
    <Component {...restOfProps.attrs}>
      {children && children.map((childNode, index) => (
        <KonvaRendererNode key={index} node={childNode} />
      ))}
    </Component>
  );
};


const KonvaRenderer: React.FC<KonvaRendererProps> = ({ node }) => {
    // The top-level node is the Stage, which is already provided by the parent component.
    // We want to render its children (the Layers).
    if (node.className !== 'Stage' || !node.children) {
        console.warn('Root node of JSON must be a "Stage" with "children" (Layers).');
        return <KonvaRendererNode node={node} />;
    }

    return (
        <>
            {node.children.map((layerNode, index) => (
                <KonvaRendererNode key={index} node={layerNode} />
            ))}
        </>
    );
};


export default KonvaRenderer;
