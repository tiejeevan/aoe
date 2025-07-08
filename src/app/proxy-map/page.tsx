
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Define a type for our game objects
type GameObject = {
    id: string;
    type: 'townCenter' | 'food' | 'wood' | 'gold' | 'stone';
    position: L.LatLngExpression;
    name: string;
};

// Create custom icons using placeholder images for clarity
const townCenterIcon = L.icon({
    iconUrl: 'https://placehold.co/48x48/a89984/3c3836?text=TC',
    iconSize: [48, 48],
});

const foodIcon = L.icon({
    iconUrl: 'https://placehold.co/32x32/f59e0b/3c3836?text=F',
    iconSize: [32, 32],
});

const woodIcon = L.icon({
    iconUrl: 'https://placehold.co/32x32/a16207/fbf1c7?text=W',
    iconSize: [32, 32],
});

const goldIcon = L.icon({
    iconUrl: 'https://placehold.co/32x32/facc15/3c3836?text=G',
    iconSize: [32, 32],
});

const stoneIcon = L.icon({
    iconUrl: 'https://placehold.co/32x32/a8a29e/3c3836?text=S',
    iconSize: [32, 32],
});

const iconMap = {
    townCenter: townCenterIcon,
    food: foodIcon,
    wood: woodIcon,
    gold: goldIcon,
    stone: stoneIcon,
};

const ProxyMapPage = () => {
    // State to hold our game objects, centered around [0, 0]
    const [gameObjects, setGameObjects] = useState<GameObject[]>([
        { id: 'tc1', type: 'townCenter', position: [0, 0], name: 'Town Center' },
        { id: 'wood1', type: 'wood', position: [5, -10], name: 'Forest' },
        { id: 'wood2', type: 'wood', position: [-8, 8], name: 'Forest' },
        { id: 'food1', type: 'food', position: [-10, -5], name: 'Berry Bush' },
        { id: 'food2', type: 'food', position: [12, 12], name: 'Berry Bush' },
        { id: 'gold1', type: 'gold', position: [20, -15], name: 'Gold Mine' },
        { id: 'stone1', type: 'stone', position: [-15, 20], name: 'Stone Deposit' },
    ]);

    // Define the boundaries of our map to prevent infinite panning
    const bounds = L.latLngBounds(L.latLng(-50, -50), L.latLng(50, 50));

    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-serif text-brand-gold mb-4">Proxy Map Development</h1>
            <p className="text-parchment-dark mb-8">Placing initial Town Center and Resource Nodes.</p>
            
            <div className="w-full max-w-4xl h-[60vh] bg-black/30 rounded-lg border-2 border-stone-light">
                <MapContainer 
                    center={[0, 0]} 
                    zoom={5} 
                    style={{ height: '100%', width: '100%', backgroundColor: '#1d2021' }} 
                    className="rounded-lg"
                    crs={L.CRS.Simple} // Use a simple, non-geographical coordinate system
                    maxBounds={bounds} // Restrict panning to these bounds
                    minZoom={4}
                >
                    {gameObjects.map(obj => (
                        <Marker key={obj.id} position={obj.position} icon={iconMap[obj.type]}>
                            <Popup>
                                {obj.name}
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>

            <Link href="/" className="mt-8 text-brand-blue hover:underline">
                &larr; Back to Main Menu
            </Link>
        </div>
    );
};

export default ProxyMapPage;
