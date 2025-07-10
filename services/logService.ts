import type { GameLogEntry, LogIconType } from '../types';

const MAX_LOG_ENTRIES = 50;

/**
 * Adds a new entry to the game log, ensuring the log does not exceed a maximum size.
 * @param currentLog - The existing array of log entries.
 * @param message - The text of the new log message.
 * @param icon - The icon to associate with the new message.
 * @returns The new, updated array of log entries.
 */
export const addLogEntry = (
    currentLog: GameLogEntry[], 
    message: string, 
    icon: LogIconType
): GameLogEntry[] => {
    const newEntry: GameLogEntry = {
        id: `${Date.now()}-${Math.random()}`,
        message,
        icon,
    };

    // Add the new entry to the front and trim the array to the max size
    const updatedLog = [newEntry, ...currentLog];
    if (updatedLog.length > MAX_LOG_ENTRIES) {
        return updatedLog.slice(0, MAX_LOG_ENTRIES);
    }
    
    return updatedLog;
};
