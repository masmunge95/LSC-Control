import type { DeviceRecord, DeviceGroup, DeviceSchedule } from '../types/device';

const DB_NAME = 'lsc_control_db';
const DB_VERSION = 2;

const STORES = {
  DEVICES: 'devices',
  GROUPS: 'groups',
  SETTINGS: 'settings',
  SCHEDULES: 'schedules',
} as const;

export class StorageDB {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.DEVICES)) {
          db.createObjectStore(STORES.DEVICES, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.GROUPS)) {
          db.createObjectStore(STORES.GROUPS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }

        if (!db.objectStoreNames.contains('schedules')) {
          db.createObjectStore('schedules', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Device Methods ---
  public static async getAllDevices(): Promise<DeviceRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICES, 'readonly');
      const store = tx.objectStore(STORES.DEVICES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public static async saveDevice(device: DeviceRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICES, 'readwrite');
      const store = tx.objectStore(STORES.DEVICES);
      const req = store.put(device);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteDevice(deviceId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DEVICES, 'readwrite');
      const store = tx.objectStore(STORES.DEVICES);
      const req = store.delete(deviceId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Group Methods ---
  public static async getAllGroups(): Promise<DeviceGroup[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GROUPS, 'readonly');
      const store = tx.objectStore(STORES.GROUPS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public static async saveGroup(group: DeviceGroup): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GROUPS, 'readwrite');
      const store = tx.objectStore(STORES.GROUPS);
      const req = store.put(group);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteGroup(groupId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.GROUPS, 'readwrite');
      const store = tx.objectStore(STORES.GROUPS);
      const req = store.delete(groupId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

    // --- Schedule Methods ---
  public static async getAllSchedules(): Promise<DeviceSchedule[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SCHEDULES, 'readonly');
      const store = tx.objectStore(STORES.SCHEDULES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public static async saveSchedule(schedule: DeviceSchedule): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SCHEDULES, 'readwrite');
      const store = tx.objectStore(STORES.SCHEDULES);
      const req = store.put(schedule);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteSchedule(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SCHEDULES, 'readwrite');
      const store = tx.objectStore(STORES.SCHEDULES);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

