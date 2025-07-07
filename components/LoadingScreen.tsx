
import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="text-center p-8 w-full max-w-2xl mx-auto">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-brand-gold mx-auto mb-6"></div>
            <h2 className="text-3xl font-serif text-parchment-light">Forging a new destiny...</h2>
            <p className="text-parchment-dark mt-2">The bards are composing your civilization's epic...</p>
        </div>
    );
};

export default LoadingScreen;
