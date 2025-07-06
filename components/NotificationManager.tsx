import React, { useEffect, useState, useRef } from 'react';
import type { UINotification } from '../types';

interface NotificationProps {
    notification: UINotification;
    onClose: (id: string) => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const autoCloseTimerRef = useRef<number | undefined>(undefined);

    // Effect for auto-closing the notification
    useEffect(() => {
        const exitTimer = window.setTimeout(() => {
            setIsExiting(true);
        }, 4500); // Start exit animation 0.5s before removal

        autoCloseTimerRef.current = window.setTimeout(() => {
            onClose(notification.id);
        }, 5000); // Remove after 5s

        return () => {
            window.clearTimeout(exitTimer);
            if (autoCloseTimerRef.current) {
                window.clearTimeout(autoCloseTimerRef.current);
            }
        };
    }, [onClose, notification.id]);

    // Handler for the manual close button
    const handleManualClose = () => {
        // Clear any pending auto-close timers
        if (autoCloseTimerRef.current) {
            window.clearTimeout(autoCloseTimerRef.current);
        }
        
        // Start the exit animation
        setIsExiting(true);
        
        // Remove the component after the animation completes (500ms duration)
        window.setTimeout(() => onClose(notification.id), 500);
    };

    return (
        <div
            className={`bg-brand-red text-parchment-light font-sans font-bold py-2 px-4 rounded-lg shadow-lg mb-2 transition-all duration-500 ease-in-out transform flex items-center justify-between ${
                isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
            }`}
            role="alert"
        >
            <span>{notification.message}</span>
            <button 
                onClick={handleManualClose} 
                className="-mr-1 p-1 rounded-full hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-parchment-light transition-colors"
                aria-label="Dismiss"
            >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};


interface NotificationManagerProps {
    notifications: UINotification[];
    onRemoveNotification: (id: string) => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ notifications, onRemoveNotification }) => {
    if (notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-[100] w-full max-w-sm">
            {notifications.map((notification) => (
                <Notification
                    key={notification.id}
                    notification={notification}
                    onClose={onRemoveNotification}
                />
            ))}
        </div>
    );
};

export default NotificationManager;
