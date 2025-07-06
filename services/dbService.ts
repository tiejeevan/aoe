import type { FullGameState } from '../types';

const DB_NAME = 'GeminiEmpiresDB';
const STORE_NAME = 'gameState';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            console.error("IndexedDB error:", request.error);
            reject(request.error);
        };
    });
};

export const saveGameState = async (saveName: string, state: FullGameState): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.put(state, saveName);
        
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to save game state:", error);
    }
};

export const loadGameState = async (saveName: string): Promise<FullGameState | undefined> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(saveName);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result as FullGameState | undefined);
            };
            request.onerror = () => {
                console.error("Failed to load game state:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Failed to open DB for loading:", error);
        return undefined;
    }
};

export const getAllSaveNames = async (): Promise<string[]> => {
     try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result as string[]);
            };
            request.onerror = () => {
                console.error("Failed to get all save names:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Failed to open DB for getting save names:", error);
        return [];
    }
}

export const clearGameState = async (saveName: string): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(saveName);
        
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to clear game state:", error);
    }
};