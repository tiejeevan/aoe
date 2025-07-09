'use client';

import React from 'react';
import Link from 'next/link';

const TestMapPage = () => {
    return (
        <div className="min-h-screen bg-stone-dark text-parchment-light flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-serif text-brand-gold mb-4">Test Map Sandbox</h1>
            <p className="text-parchment-dark mb-8">This is a new area for map development.</p>
            <Link href="/" className="sci-fi-button">
                Return to Main Menu
            </Link>
        </div>
    );
};

export default TestMapPage;
