
'use client';

import React from 'react';
import Link from 'next/link';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ProxyMapPage = () => {
    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-serif text-brand-gold mb-4">Proxy Map Development</h1>
            <p className="text-parchment-dark mb-8">This is a sandboxed environment for building the new Leaflet map.</p>
            
            <div className="w-full max-w-4xl h-[60vh] bg-black/30 rounded-lg border-2 border-stone-light">
                <MapContainer center={[0, 0]} zoom={2} style={{ height: '100%', width: '100%', backgroundColor: '#1d2021' }} className="rounded-lg">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </MapContainer>
            </div>

            <Link href="/" className="mt-8 text-brand-blue hover:underline">
                &larr; Back to Main Menu
            </Link>
        </div>
    );
};

export default ProxyMapPage;
