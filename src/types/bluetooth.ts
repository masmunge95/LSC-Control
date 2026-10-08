import type { ProtocolType, RGBColor } from './device';

export interface ProtocolDriver {
  name: string;
  type: ProtocolType;
  primaryServiceUuids: string[];
  characteristicUuids: string[];
  buildPowerPacket(on: boolean): Uint8Array[];
  buildColorPacket(color: RGBColor): Uint8Array[];
  buildBrightnessPacket(brightness: number): Uint8Array[];
  buildEffectPacket(effectId: number, speed: number): Uint8Array[];
  buildIdentifyPacket(): Uint8Array[];
  buildTimeSyncPacket?(date?: Date): Uint8Array[];
  buildSchedulePacket?(hour: number, min: number, on: boolean, daysMask?: number): Uint8Array[];
}

export interface BluetoothConnectionHandle {
  id: string;
  name?: string;
  isNative: boolean;
  // Web Bluetooth handles (only present on web)
  device?: BluetoothDevice;
  server?: BluetoothRemoteGATTServer;
  writeCharacteristic?: BluetoothRemoteGATTCharacteristic;
  // Resolved BLE identifiers (used by both web and native)
  discoveredServiceUuid?: string;
  discoveredCharacteristicUuid?: string;
  writeMethod?: 'writeWithoutResponse' | 'writeValueWithResponse';
}
