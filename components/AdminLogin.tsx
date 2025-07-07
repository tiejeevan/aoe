import React, { useState } from 'react';

interface AdminLoginProps {
    onLoginSuccess: () => void;
    onClose: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onClose }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = () => {
        if (username === 'admin' && password === 'admin') {
            setError('');
            onLoginSuccess();
        } else {
            setError('Invalid username or password.');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="bg-stone-dark p-8 rounded-lg shadow-2xl border-2 border-stone-light w-full max-w-sm mx-auto text-center">
                <h2 className="text-2xl font-serif text-brand-gold mb-4">Admin Login</h2>
                {error && <p className="text-brand-red mb-4">{error}</p>}
                <div className="space-y-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Username"
                        className="bg-parchment-dark text-stone-dark placeholder-stone-light w-full mx-auto text-center font-sans text-xl p-3 rounded-lg border-2 border-stone-light focus:border-brand-gold focus:outline-none"
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Password"
                        className="bg-parchment-dark text-stone-dark placeholder-stone-light w-full mx-auto text-center font-sans text-xl p-3 rounded-lg border-2 border-stone-light focus:border-brand-gold focus:outline-none"
                    />
                </div>
                 <div className="flex gap-4 justify-center mt-6">
                    <button
                        onClick={onClose}
                        className="bg-stone-light hover:bg-stone-dark text-white font-bold py-2 px-6 rounded-lg text-lg font-serif tracking-wide transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleLogin}
                        className="bg-brand-red hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg text-lg font-serif tracking-wide transition-colors"
                    >
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
