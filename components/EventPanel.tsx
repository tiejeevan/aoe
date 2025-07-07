
import React, { useState, useEffect } from 'react';
import type { GameEvent, GameEventChoice } from '../types';
import { EventIcon } from './icons/ResourceIcons';

interface EventPanelProps {
    event: GameEvent | null;
    onChoice: (choice: GameEventChoice) => void;
}

const EventPanel: React.FC<EventPanelProps> = ({ event, onChoice }) => {
    const [isShowing, setIsShowing] = useState(false);

    useEffect(() => {
        if (event) {
            // Use a short timeout to allow the fade-in animation to play correctly
            const timer = setTimeout(() => setIsShowing(true), 50);
            return () => clearTimeout(timer);
        } else {
            setIsShowing(false);
        }
    }, [event]);

    const handleChoiceClick = (choice: GameEventChoice) => {
        setIsShowing(false);
        // Allow fade-out animation to complete before notifying parent
        setTimeout(() => {
            onChoice(choice);
        }, 300);
    };

    if (!event) {
        return null;
    }

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isShowing ? 'opacity-100' : 'opacity-0'}`}>
            <div 
                className={`sci-fi-panel-popup sci-fi-grid p-6 w-full max-w-lg transform transition-all duration-300 ease-in-out ${isShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 text-brand-gold mb-3">
                        <EventIcon />
                    </div>
                    <h2 className="text-2xl font-serif mb-4">An Event Occurs</h2>
                    
                    <p className="text-parchment-dark mb-6 min-h-[40px]">{event.message}</p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center w-full">
                        {event.choices.map(choice => (
                            <button 
                                key={choice.text} 
                                onClick={() => handleChoiceClick(choice)} 
                                className="sci-fi-button !text-base !font-serif !px-6 !py-2 flex-grow"
                            >
                                {choice.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPanel;
