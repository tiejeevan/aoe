import type { FullGameState, AgeConfig } from '../types';

const DB_NAME = 'GeminiEmpiresDB';
const GAME_STATE_STORE_NAME = 'gameState';
const AGES_CONFIG_STORE_NAME = 'ageConfigurations';
const DB_VERSION = 3; // Incremented version

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
            const db = request.result;
            if (!db.objectStoreNames.contains(GAME_STATE_STORE_NAME)) {
                db.createObjectStore(GAME_STATE_STORE_NAME);
            }
            // Handle old store name for migration if needed, for simplicity we create the new one
            if (db.objectStoreNames.contains('customAges')) {
                db.deleteObjectStore('customAges');
            }
            if (!db.objectStoreNames.contains(AGES_CONFIG_STORE_NAME)) {
                db.createObjectStore(AGES_CONFIG_STORE_NAME, { keyPath: 'id' });
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
        const transaction = db.transaction(GAME_STATE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(GAME_STATE_STORE_NAME);
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
        const transaction = db.transaction(GAME_STATE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(GAME_STATE_STORE_NAME);
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
        const transaction = db.transaction(GAME_STATE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(GAME_STATE_STORE_NAME);
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

export const deleteGameState = async (saveName: string): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(GAME_STATE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(GAME_STATE_STORE_NAME);
        store.delete(saveName);
        
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to delete game state:", error);
    }
};

// --- Age Configuration Functions ---

export const saveAgeConfig = async (age: AgeConfig): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(AGES_CONFIG_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(AGES_CONFIG_STORE_NAME);
        store.put(age);
        
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to save age config:", error);
    }
};

export const getAllAgeConfigs = async (): Promise<AgeConfig[]> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(AGES_CONFIG_STORE_NAME, 'readonly');
        const store = transaction.objectStore(AGES_CONFIG_STORE_NAME);
        const request = store.getAll();
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const ages = request.result as AgeConfig[];
                ages.sort((a, b) => a.order - b.order);
                resolve(ages);
            };
            request.onerror = () => {
                console.error("Failed to load age configs:", request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error("Failed to open DB for loading age configs:", error);
        return [];
    }
};

export const deleteAgeConfig = async (id: string): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(AGES_CONFIG_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(AGES_CONFIG_STORE_NAME);
        store.delete(id);
        
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error("Failed to delete age config:", error);
    }
};
