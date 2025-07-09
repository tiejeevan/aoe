import React, { useState, useRef, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StartScreenProps {
    onNewGame: (name: string) => void;
    onResumeGame: (name: string) => void;
    savedGames: string[];
    onDeleteGame: (name: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onNewGame, onResumeGame, savedGames, onDeleteGame }) => {
    const [isNaming, setIsNaming] = useState(false);
    const [newName, setNewName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    useEffect(() => {
        if (isNaming) {
            inputRef.current?.focus();
        }
    }, [isNaming]);

    const handleStart = () => {
        if (newName.trim().length >= 4) {
            onNewGame(newName.trim());
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleStart();
        }
    };

    return (
        <div className="text-center bg-stone-dark p-8 rounded-lg shadow-2xl border-2 border-stone-light w-full max-w-2xl mx-auto">
            <h1 className="text-6xl font-serif text-parchment-light mb-2 tracking-wider">Gemini Empires</h1>
            
            {isNaming ? (
                <div className="mt-8">
                    <h2 className="text-2xl font-serif text-brand-gold mb-4">Name Your Saga</h2>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                        placeholder="At least 4 characters..."
                        className="bg-parchment-dark text-stone-dark placeholder-stone-light w-full max-w-sm mx-auto text-center font-sans text-xl p-3 rounded-lg border-2 border-stone-light focus:border-brand-gold focus:outline-none uppercase"
                        maxLength={20}
                    />
                    <div className="flex gap-4 justify-center mt-6">
                         <button
                            onClick={() => setIsNaming(false)}
                            className="bg-stone-light hover:bg-stone-dark text-white font-bold py-3 px-8 rounded-lg text-xl font-serif tracking-wide transition-transform duration-200 ease-in-out hover:scale-105 shadow-lg"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleStart}
                            disabled={newName.trim().length < 4}
                            className="bg-brand-red hover:bg-red-700 disabled:bg-stone-dark disabled:text-stone-light/50 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-xl font-serif tracking-wide transition-transform duration-200 ease-in-out hover:scale-105 shadow-lg"
                        >
                            Begin
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-lg text-parchment-dark mb-8 font-sans">Your Civilization's Saga</p>
                    <div className="flex flex-col gap-4 items-center">
                        {savedGames.length > 0 && (
                            <div className="w-full max-w-sm">
                                <h3 className="text-xl font-serif text-brand-gold mb-2">Resume a Saga</h3>
                                <div className="flex flex-col gap-3 max-h-48 overflow-y-auto bg-black/20 p-2 rounded-md">
                                    {savedGames.map(name => (
                                        <div key={name} className="flex items-center gap-2">
                                            <button
                                                onClick={() => onResumeGame(name)}
                                                className="flex-grow bg-brand-green/80 hover:bg-brand-green text-white font-bold py-2 px-4 rounded-md text-lg font-sans transition-colors duration-200 text-left"
                                            >
                                                {name}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteGame(name);
                                                }}
                                                className="p-2 bg-stone-light/50 hover:bg-brand-red text-parchment-light rounded-md transition-colors"
                                                aria-label={`Delete ${name}`}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setIsNaming(true)}
                            className="bg-brand-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-2xl font-serif tracking-wide transition-transform duration-200 ease-in-out hover:scale-105 shadow-lg mt-4"
                        >
                            New Saga
                        </button>
                    </div>
                     <div className="mt-8 text-sm text-stone-light font-sans">
                        <p className='mb-2'>
                           {savedGames.length > 0
                               ? "Start a new saga or resume an existing one."
                               : "Lead your people from a nomadic tribe to a thriving empire. Every game is a unique story."
                           }
                        </p>
                         <div className="flex justify-center items-center gap-4">
                            <button onClick={() => router.push('/admin')} className="text-xs text-brand-blue hover:underline">
                                admin?
                            </button>
                            <button onClick={() => router.push('/proxy-map')} className="text-xs text-brand-gold hover:underline">
                                Proxy Map
                            </button>
                             <button onClick={() => router.push('/test-map')} className="text-xs text-brand-green hover:underline">
                                Test Map
                            </button>
                         </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StartScreen;
