import React, { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
    startTime: number;
    duration: number; // in milliseconds
    className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ startTime, duration, className = '' }) => {
    const [progress, setProgress] = useState(0);
    const requestRef = useRef<number | undefined>(undefined);

    const animate = (_timestamp: number) => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = duration > 0 ? (elapsedTime / duration) * 100 : 100;
        
        if (newProgress < 100) {
            setProgress(newProgress);
            requestRef.current = requestAnimationFrame(animate);
        } else {
            setProgress(100);
        }
    };

    useEffect(() => {
        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [startTime, duration]);

    return (
        <div className={`w-full bg-stone-dark/50 rounded-full h-full overflow-hidden ${className}`}>
            <div
                className="bg-brand-gold h-full rounded-full"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;