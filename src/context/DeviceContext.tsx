import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { DeviceRecord, DeviceGroup, ConnectionStatus, RGBColor, ProtocolType, DeviceSchedule } from '../types/device';
import { StorageDB } from '../storage/db';
import { BleManager } from '../bluetooth/bleManager';
import { Capacitor } from '@capacitor/core';

interface TargetSelection {
  type: 'all' | 'group' | 'device';
  id?: string;
}

interface DeviceContextType {
  devices: DeviceRecord[];
  groups: DeviceGroup[];
  schedules: DeviceSchedule[];
  connectionMap: Record<string, { status: ConnectionStatus; error?: string }>;
  isBluetoothSupported: boolean;
  selectedTarget: TargetSelection;
  setSelectedTarget: (target: TargetSelection) => void;
  // Device actions
  pairDevice: (name: string, protocolOverride?: ProtocolType) => Promise<DeviceRecord>;
  cancelPairing: () => void;
  connectDevice: (deviceId: string) => Promise<void>;
  disconnectDevice: (deviceId: string) => void;
  toggleDevicePower: (deviceId: string) => Promise<void>;
  setDeviceColor: (deviceId: string, color: RGBColor) => Promise<void>;
  setDeviceBrightness: (deviceId: string, brightness: number) => Promise<void>;
  setDeviceEffect: (deviceId: string, effectId: number, speed: number) => Promise<void>;
  identifyDevice: (deviceId: string) => Promise<void>;
  updateDevice: (device: DeviceRecord) => Promise<void>;
  deleteDevice: (deviceId: string) => Promise<void>;
  unpairDevice: (deviceId: string) => Promise<void>;
  unpairAllDevices: () => Promise<void>;
  getBrowserGrantedDevices: () => Promise<BluetoothDevice[]>;
  // Group actions
  createGroup: (name: string, deviceIds: string[], icon?: DeviceGroup['icon'], colorTag?: string) => Promise<DeviceGroup>;
  updateGroup: (group: DeviceGroup) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  toggleGroupPower: (groupId: string) => Promise<void>;
  setGroupColor: (groupId: string, color: RGBColor) => Promise<void>;
  setGroupBrightness: (groupId: string, brightness: number) => Promise<void>;
  setGroupEffect: (groupId: string, effectId: number, speed: number) => Promise<void>;
  // Schedule actions
  saveSchedule: (schedule: DeviceSchedule) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export const DeviceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [groups, setGroups] = useState<DeviceGroup[]>([]);
  const [schedules, setSchedules] = useState<DeviceSchedule[]>([]);
  const [connectionMap, setConnectionMap] = useState<Record<string, { status: ConnectionStatus; error?: string }>>({});
  const [selectedTarget, setSelectedTarget] = useState<TargetSelection>({ type: 'all' });
  const ble = BleManager.getInstance();
  const isBluetoothSupported = ble.isSupported();

  // Load persisted devices and groups from IndexedDB on startup
  useEffect(() => {
    async function loadData() {
      try {
        const [savedDevices, savedGroups, savedSchedules] = await Promise.all([
          StorageDB.getAllDevices(),
          StorageDB.getAllGroups(),
          StorageDB.getAllSchedules(),
        ]);
        setDevices(savedDevices);
        setGroups(savedGroups);
        setSchedules(savedSchedules);

        // Initialize connection status map
        const initialStatusMap: Record<string, { status: ConnectionStatus }> = {};
        for (const dev of savedDevices) {
          initialStatusMap[dev.id] = { status: 'disconnected' };
        }
        setConnectionMap(initialStatusMap);
      } catch (err) {
        console.error('Failed to load data from IndexedDB:', err);
      }
    }
    loadData();

    // Subscribe to BLE manager status changes
    const unsubscribe = ble.onStatusChange((deviceId, status, error) => {
      setConnectionMap((prev) => ({
        ...prev,
        [deviceId]: { status, error },
      }));
    });

      return () => unsubscribe();
    }, []);

    useEffect(() => {
    const interval = setInterval(async () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Only check once per minute (at second 0-29)
      if (now.getSeconds() > 30) return;

      const activeSchedules = schedules.filter(
        (s) => s.enabled && s.time === currentHHMM && s.days.includes(currentDay)
      );

      for (const sched of activeSchedules) {
        console.log(`[Scheduler] Firing schedule: ${sched.name} (${sched.action})`);
                if (sched.targetType === 'all') {
          for (const dev of devices) {
            await ble.setPower(dev, sched.action === 'power_on');
          }
        } else if (sched.targetType === 'group' && sched.targetId) {
          const group = groups.find((g) => g.id === sched.targetId);
          if (group) {
            const groupDevs = devices.filter((d) => group.deviceIds.includes(d.id));
            for (const dev of groupDevs) {
              await ble.setPower(dev, sched.action === 'power_on');
            }
          }
        } else if (sched.targetType === 'device' && sched.targetId) {
          const dev = devices.find((d) => d.id === sched.targetId);
          if (dev) {
            await ble.setPower(dev, sched.action === 'power_on');
          }
        }
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [schedules, devices, groups, ble]);

  // --- Device Actions ---
  const pairDevice = useCallback(
    async (customName: string, protocolOverride?: ProtocolType): Promise<DeviceRecord> => {
      const { device, detectedProtocol } = await ble.requestDevice();
      const protocol = protocolOverride || detectedProtocol;

      // Verify connection and locate writable GATT characteristic BEFORE saving to DB
      await ble.connect(device, protocol);

      // Check if already registered
      const existing = devices.find((d) => d.id === device.id);
      if (existing) {
        return existing;
      }

      const newRecord: DeviceRecord = {
        id: device.id,
        name: customName.trim() || device.name || 'RGB Strip',
        originalName: device.name || 'Unknown BLE Device',
        protocol,
        lastKnownState: {
          power: true,
          color: { r: 255, g: 255, b: 255 },
          brightness: 100,
        },
        createdAt: Date.now(),
        lastConnectedAt: Date.now(),
      };

      await StorageDB.saveDevice(newRecord);
      setDevices((prev) => [...prev, newRecord]);

      try {
        await ble.identify(newRecord);
      } catch (pulseErr) {
        console.warn('[BLE] Identify pulse skipped:', pulseErr);
      }

      return newRecord;
    },
    [devices, ble]
  );

  const cancelPairing = useCallback(() => {
    ble.cancelPendingConnect();
  }, [ble]);

  const connectDevice = useCallback(
    async (deviceId: string) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      if (!ble.isSupported()) {
        throw new Error('Bluetooth is not supported in this environment.');
      }

      if (Capacitor.isNativePlatform()) {
        // On native Android, connect directly via MAC address without re-prompting picker
        await ble.connect({ id: dev.id, name: dev.name }, dev.protocol);
        return;
      }

      try {
        if ('getDevices' in navigator.bluetooth) {
          const granted = await (navigator.bluetooth as any).getDevices();
          const matched = granted.find((d: BluetoothDevice) => d.id === deviceId);
          if (matched) {
            await ble.connect(matched, dev.protocol);
            return;
          }
        }

        throw new Error(
          `Device "${dev.name}" is offline or permissions were cleared. Click "Add RGB Strip" to pair again.`
        );
      } catch (err) {
        console.error('Failed to connect to device:', err);
        throw err;
      }
    },
    [devices, ble]
  );

  const disconnectDevice = useCallback(
    (deviceId: string) => {
      ble.disconnect(deviceId);
    },
    [ble]
  );

  const toggleDevicePower = useCallback(
    async (deviceId: string) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      const newPower = !dev.lastKnownState.power;
      const updated: DeviceRecord = {
        ...dev,
        lastKnownState: { ...dev.lastKnownState, power: newPower },
      };

      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
      await StorageDB.saveDevice(updated);

      if (ble.isConnected(deviceId)) {
        await ble.setPower(dev, newPower);
      }
    },
    [devices, ble]
  );

    const setDeviceColor = useCallback(
    async (deviceId: string, color: RGBColor) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      const updated: DeviceRecord = {
        ...dev,
        lastKnownState: {
          ...dev.lastKnownState,
          color,
          power: true,
          effectMode: undefined, // Clear pattern mode when solid color is chosen
        },
      };

      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
      await StorageDB.saveDevice(updated);

      if (ble.isConnected(deviceId)) {
        await ble.setColor(dev, color);
      }
    },
    [devices, ble]
  );

  const setDeviceBrightness = useCallback(
    async (deviceId: string, brightness: number) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      const updated: DeviceRecord = {
        ...dev,
        lastKnownState: { ...dev.lastKnownState, brightness },
      };

      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
      await StorageDB.saveDevice(updated);

      if (ble.isConnected(deviceId)) {
        await ble.setBrightness(dev, brightness);
      }
    },
    [devices, ble]
  );

  const setDeviceEffect = useCallback(
    async (deviceId: string, effectId: number, speed: number) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev) return;

      const updated: DeviceRecord = {
        ...dev,
        lastKnownState: { ...dev.lastKnownState, effectMode: effectId, speed, power: true },
      };

      setDevices((prev) => prev.map((d) => (d.id === deviceId ? updated : d)));
      await StorageDB.saveDevice(updated);

      if (ble.isConnected(deviceId)) {
        await ble.setEffect(dev, effectId, speed);
      }
    },
    [devices, ble]
  );

    const identifyDevice = useCallback(
    async (deviceId: string) => {
      const dev = devices.find((d) => d.id === deviceId);
      if (!dev || !ble.isConnected(deviceId)) return;

      // 1. Snapshot previous state before flashing
      const original = { ...dev.lastKnownState };

      try {
        // 2. Pulse 2 times: Bright White (350ms) <-> Off (250ms)
        for (let i = 0; i < 2; i++) {
          await ble.setPower(dev, true);
          await ble.setBrightness(dev, 100);
          await ble.setColor(dev, { r: 255, g: 255, b: 255 });
          await new Promise((r) => setTimeout(r, 350));

          await ble.setPower(dev, false);
          await new Promise((r) => setTimeout(r, 250));
        }

        // 3. Revert strip cleanly to its original state
        if (original.power) {
          await ble.setPower(dev, true);
          await ble.setBrightness(dev, original.brightness);

          if (original.effectMode !== undefined) {
            // If it was playing a dynamic effect, restore that effect
            await ble.setEffect(dev, original.effectMode, original.speed ?? 80);
          } else {
            // Otherwise, restore the solid color
            await ble.setColor(dev, original.color);
          }
        } else {
          await ble.setPower(dev, false);
        }
      } catch (err) {
        console.error('[Identify Flash] Error:', err);
      }
    },
    [devices, ble]
  );

  const updateDevice = useCallback(async (device: DeviceRecord) => {
    await StorageDB.saveDevice(device);
    setDevices((prev) => prev.map((d) => (d.id === device.id ? device : d)));
  }, []);

  const deleteDevice = useCallback(
    async (deviceId: string) => {
      await ble.forgetDevice(deviceId);
      await StorageDB.deleteDevice(deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      // Remove device from any associated groups
      setGroups((prev) =>
        prev.map((g) => {
          if (g.deviceIds.includes(deviceId)) {
            const updatedGroup = { ...g, deviceIds: g.deviceIds.filter((id) => id !== deviceId) };
            StorageDB.saveGroup(updatedGroup);
            return updatedGroup;
          }
          return g;
        })
      );
    },
    [ble]
  );

  const unpairDevice = deleteDevice;

  const unpairAllDevices = useCallback(async () => {
    await ble.forgetAllDevices();
    for (const d of devices) {
      await StorageDB.deleteDevice(d.id);
    }
    setDevices([]);
    setGroups((prev) =>
      prev.map((g) => {
        const updatedGroup = { ...g, deviceIds: [] };
        StorageDB.saveGroup(updatedGroup);
        return updatedGroup;
      })
    );
  }, [ble, devices]);

  const getBrowserGrantedDevices = useCallback(async () => {
    return await ble.getGrantedDevices();
  }, [ble]);

  // --- Group Actions ---
  const createGroup = useCallback(
    async (
      name: string,
      deviceIds: string[],
      icon: DeviceGroup['icon'] = 'sparkles',
      colorTag = 'cyan'
    ): Promise<DeviceGroup> => {
      const newGroup: DeviceGroup = {
        id: crypto.randomUUID ? crypto.randomUUID() : `group_${Date.now()}`,
        name: name.trim() || 'New Group',
        deviceIds,
        icon,
        colorTag,
        createdAt: Date.now(),
      };

      await StorageDB.saveGroup(newGroup);
      setGroups((prev) => [...prev, newGroup]);
      return newGroup;
    },
    []
  );

  const updateGroup = useCallback(async (group: DeviceGroup) => {
    await StorageDB.saveGroup(group);
    setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)));
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    await StorageDB.deleteGroup(groupId);
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  const toggleGroupPower = useCallback(
    async (groupId: string) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const groupDevices = devices.filter((d) => group.deviceIds.includes(d.id));
      const anyOn = groupDevices.some((d) => d.lastKnownState.power);
      const targetPower = !anyOn;

      // Update in state & storage
      const updatedDevices = devices.map((d) => {
        if (group.deviceIds.includes(d.id)) {
          const upd = { ...d, lastKnownState: { ...d.lastKnownState, power: targetPower } };
          StorageDB.saveDevice(upd);
          return upd;
        }
        return d;
      });
      setDevices(updatedDevices);

      await ble.sendUnisonCommand(groupDevices, { power: targetPower });
    },
    [groups, devices, ble]
  );

  const setGroupColor = useCallback(
    async (groupId: string, color: RGBColor) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const groupDevices = devices.filter((d) => group.deviceIds.includes(d.id));

      const updatedDevices = devices.map((d) => {
        if (group.deviceIds.includes(d.id)) {
          const upd = {
            ...d,
            lastKnownState: {
              ...d.lastKnownState,
              color,
              power: true,
              effectMode: undefined, // Clear pattern mode when solid color is chosen
            },
          };
          StorageDB.saveDevice(upd);
          return upd;
        }
        return d;
      });
      setDevices(updatedDevices);

      await ble.sendUnisonCommand(groupDevices, { color, power: true });
    },
    [groups, devices, ble]
  );

  const setGroupBrightness = useCallback(
    async (groupId: string, brightness: number) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const groupDevices = devices.filter((d) => group.deviceIds.includes(d.id));

      const updatedDevices = devices.map((d) => {
        if (group.deviceIds.includes(d.id)) {
          const upd = { ...d, lastKnownState: { ...d.lastKnownState, brightness } };
          StorageDB.saveDevice(upd);
          return upd;
        }
        return d;
      });
      setDevices(updatedDevices);

      await ble.sendUnisonCommand(groupDevices, { brightness });
    },
    [groups, devices, ble]
  );

  const setGroupEffect = useCallback(
    async (groupId: string, effectId: number, speed: number) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const groupDevices = devices.filter((d) => group.deviceIds.includes(d.id));

      const updatedDevices = devices.map((d) => {
        if (group.deviceIds.includes(d.id)) {
          const upd = { ...d, lastKnownState: { ...d.lastKnownState, effectMode: effectId, speed, power: true } };
          StorageDB.saveDevice(upd);
          return upd;
        }
        return d;
      });
      setDevices(updatedDevices);

      await ble.sendUnisonCommand(groupDevices, { effectMode: effectId, speed, power: true });
    },
    [groups, devices, ble]
  );

  // --- Schedule Actions (Place here, right above return) ---
  const saveSchedule = useCallback(async (schedule: DeviceSchedule) => {
    await StorageDB.saveSchedule(schedule);
    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === schedule.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = schedule;
        return copy;
      }
      return [...prev, schedule];
    });
  }, []);

  const deleteSchedule = useCallback(async (id: string) => {
    await StorageDB.deleteSchedule(id);
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return (
    <DeviceContext.Provider
      value={{
        devices,
        groups,
        schedules,
        connectionMap,
        isBluetoothSupported,
        selectedTarget,
        setSelectedTarget,
        pairDevice,
        cancelPairing,
        connectDevice,
        disconnectDevice,
        toggleDevicePower,
        setDeviceColor,
        setDeviceBrightness,
        setDeviceEffect,
        identifyDevice,
        updateDevice,
        deleteDevice,
        unpairDevice,
        unpairAllDevices,
        getBrowserGrantedDevices,
        createGroup,
        updateGroup,
        deleteGroup,
        toggleGroupPower,
        setGroupColor,
        setGroupBrightness,
        setGroupEffect,
        saveSchedule,
        deleteSchedule,
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDevices = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices must be used within a DeviceProvider');
  }
  return context;
};

