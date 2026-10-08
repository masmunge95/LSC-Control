import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';
import type { ProtocolType, RGBColor, DeviceRecord, ColorOrder } from '../types/device';
import type { BluetoothConnectionHandle, ProtocolDriver } from '../types/bluetooth';
import { elkBledomDriver } from './protocols/elkBledom';
import { ledDmxDriver } from './protocols/ledDmx';

export type StatusChangeCallback = (
  deviceId: string,
  status: 'disconnected' | 'connecting' | 'connected' | 'error',
  error?: string
) => void;

export function applyColorOrder(color: RGBColor, order: ColorOrder = 'RGB'): RGBColor {
  switch (order) {
    case 'GRB':
      return { r: color.g, g: color.r, b: color.b };
    case 'BRG':
      return { r: color.b, g: color.r, b: color.g };
    case 'BGR':
      return { r: color.b, g: color.g, b: color.r };
    case 'RGB':
    default:
      return color;
  }
}

// Comprehensive list of Bluetooth Low Energy LED service UUIDs (both 16-bit hex and 128-bit strings)
const COMPREHENSIVE_BLE_SERVICES: BluetoothServiceUUID[] = [
  // 16-bit integer IDs
  0xfff0,
  0xffe0,
  0xfee0,
  0xffe5,
  0xcc02,
  0xae00,
  0xae10,
  0x5301,
  0x1000,
  0xff00,
  0xffd0,
  0xffd5,
  // 128-bit canonical strings
  '0000fff0-0000-1000-8000-00805f9b34fb', // ELK-BLEDOM, Magic Lantern
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard BLE Serial / LEDDMX
  '0000fee0-0000-1000-8000-00805f9b34fb',
  '0000ffe5-0000-1000-8000-00805f9b34fb',
  '0000cc02-0000-1000-8000-00805f9b34fb',
  '0000ae00-0000-1000-8000-00805f9b34fb',
  '0000ae10-0000-1000-8000-00805f9b34fb',
  '00005301-0000-1000-8000-00805f9b34fb',
  '00001000-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffd0-0000-1000-8000-00805f9b34fb',
  '0000ffd5-0000-1000-8000-00805f9b34fb',
  '00010203-0405-0607-0809-0a0b0c0d1910',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART
];

export class BleManager {
  private static instance: BleManager;
  private connections = new Map<string, BluetoothConnectionHandle>();
  private statusListeners = new Set<StatusChangeCallback>();
  private pendingConnectAbortControllers = new Map<string, AbortController>();
  private nativeInitialized = false;

   private async ensureInitialized(): Promise<void> {
    if (Capacitor.isNativePlatform() && !this.nativeInitialized) {
      console.log('[BLE] Initializing Capacitor Native BleClient...');
      await BleClient.initialize();
      this.nativeInitialized = true;
    }
  }

  public static getInstance(): BleManager {
    if (!this.instance) {
      this.instance = new BleManager();
    }
    return this.instance;
  }

  public cancelPendingConnect(deviceId?: string): void {
    if (deviceId) {
      const ctrl = this.pendingConnectAbortControllers.get(deviceId);
      if (ctrl) {
        ctrl.abort(new Error('Pairing was cancelled by the user.'));
        this.pendingConnectAbortControllers.delete(deviceId);
      }
    } else {
      for (const ctrl of this.pendingConnectAbortControllers.values()) {
        ctrl.abort(new Error('Pairing was cancelled by the user.'));
      }
      this.pendingConnectAbortControllers.clear();
    }
  }

  private withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    signal: AbortSignal,
    errorMessage: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;

      const abortHandler = () => {
        if (timer) clearTimeout(timer);
        reject(signal.reason || new Error('Operation cancelled by user.'));
      };

      if (signal.aborted) {
        reject(signal.reason || new Error('Operation cancelled by user.'));
        return;
      }

      signal.addEventListener('abort', abortHandler, { once: true });

      timer = setTimeout(() => {
        signal.removeEventListener('abort', abortHandler);
        reject(new Error(errorMessage));
      }, timeoutMs);

      promise
        .then((res) => {
          if (timer) clearTimeout(timer);
          signal.removeEventListener('abort', abortHandler);
          resolve(res);
        })
        .catch((err) => {
          if (timer) clearTimeout(timer);
          signal.removeEventListener('abort', abortHandler);
          reject(err);
        });
    });
  }

  public isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatus(
    deviceId: string,
    status: 'disconnected' | 'connecting' | 'connected' | 'error',
    error?: string
  ): void {
    this.statusListeners.forEach((listener) => listener(deviceId, status, error));
  }

  public getDriver(protocol: ProtocolType): ProtocolDriver {
    return protocol === 'elk-bledom' ? elkBledomDriver : ledDmxDriver;
  }

  public getConnectionInfo(deviceId: string) {
    const conn = this.connections.get(deviceId);
    if (!conn) return null;
    return {
      service: conn.discoveredServiceUuid,
      characteristic: conn.discoveredCharacteristicUuid,
      method: conn.writeMethod,
    };
  }

  /**
   * Prompts the browser's native Bluetooth pairing dialog.
   */
  public async requestDevice(): Promise<{ device: { id: string; name?: string }; detectedProtocol: ProtocolType }> {
    await this.ensureInitialized();

    if (Capacitor.isNativePlatform()) {
      console.log('[BLE Native] Requesting device via BleClient (open scan)...');
      const bleDevice = await BleClient.requestDevice({
        // Omitting 'services' allows Android to report all nearby BLE devices
        optionalServices: COMPREHENSIVE_BLE_SERVICES.filter(
          (s): s is string => typeof s === 'string'
        ),
        allowExtendedAdvertising: true,
      });
      const nameUpper = (bleDevice.name || '').toUpperCase();
      let detectedProtocol: ProtocolType = 'elk-bledom';
      if (nameUpper.includes('DMX')) {
        detectedProtocol = 'leddmx';
      }
      return {
        device: { id: bleDevice.deviceId, name: bleDevice.name },
        detectedProtocol,
      };
    }

    // Web Bluetooth fallback
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    console.log('[BLE] Requesting device with permissive service filters...');

    const device = await navigator.bluetooth.requestDevice({
      filters: [
        { namePrefix: 'ELK' },
        { namePrefix: 'elk' },
        { namePrefix: 'MELK' },
        { namePrefix: 'BLEDOM' },
        { namePrefix: 'BLEDON' },
        { namePrefix: 'LEDDMX' },
        { namePrefix: 'DMX' },
        { namePrefix: 'LED' },
        { namePrefix: 'LEDBLE' },
        { namePrefix: 'Triones' },
        { namePrefix: 'BLE-LED' },
        { namePrefix: 'HJ-' },
        { namePrefix: 'MX-' },
      ],
      optionalServices: COMPREHENSIVE_BLE_SERVICES,
    });

    console.log('[BLE] Device selected:', device.name, 'ID:', device.id);

    const nameUpper = (device.name || '').toUpperCase();
    let detectedProtocol: ProtocolType = 'elk-bledom';
    if (nameUpper.includes('DMX')) {
      detectedProtocol = 'leddmx';
    }

    return { device: { id: device.id, name: device.name }, detectedProtocol };
  }

    /**
   * Synchronizes the hardware controller's internal RTC clock with local device time.
   */
  public async syncControllerTime(device: DeviceRecord, date: Date = new Date()): Promise<void> {
    if (!this.isConnected(device.id)) return;
    try {
      const driver = this.getDriver(device.protocol);
      if (typeof driver.buildTimeSyncPacket === 'function') {
        const packets = driver.buildTimeSyncPacket(date);
        await this.writePackets(device.id, packets);
        console.log(`[BLE] ⏱️ Synchronized controller time for "${device.name}" (${date.toLocaleTimeString()})`);
      }
    } catch (err) {
      console.warn(`[BLE] Could not sync time for "${device.name}":`, err);
    }
  }

  /**
   * Connects to the GATT server with a 12s timeout and discovers the optimal writable characteristic.
   */
    public async connect(
    device: { id: string; name?: string; gatt?: BluetoothRemoteGATTServer },
    protocol: ProtocolType
  ): Promise<void> {
    await this.ensureInitialized();

    if (Capacitor.isNativePlatform()) {
      return this.connectNative(device.id, device.name, protocol);
    }
    // Web Bluetooth flow
    return this.connectWeb(device as BluetoothDevice, protocol);
  }

  private async connectNative(
    deviceId: string,
    name: string | undefined,
    protocol: ProtocolType
  ): Promise<void> {
    this.notifyStatus(deviceId, 'connecting');

    try {
      console.log(`[BLE Native] Connecting to "${name || deviceId}"...`);
      await BleClient.connect(deviceId, (disconnectedId) => {
        console.warn(`[BLE Native] Device disconnected: ${disconnectedId}`);
        this.connections.delete(disconnectedId);
        this.notifyStatus(disconnectedId, 'disconnected');
      });

      // Discover GATT services on Android
      const services = await BleClient.getServices(deviceId);
      const driver = this.getDriver(protocol);

      let matchedServiceUuid: string | undefined;
      let matchedCharUuid: string | undefined;

      // 1. Check protocol-specific characteristics first
      for (const service of services) {
        for (const char of service.characteristics) {
          const isTarget = driver.characteristicUuids.some(
            (u) => u.toLowerCase() === char.uuid.toLowerCase()
          );
          if (isTarget && (char.properties.writeWithoutResponse || char.properties.write)) {
            matchedServiceUuid = service.uuid;
            matchedCharUuid = char.uuid;
            break;
          }
        }
        if (matchedCharUuid) break;
      }

      // 2. Fallback: Find any writable characteristic
      if (!matchedCharUuid) {
        for (const service of services) {
          for (const char of service.characteristics) {
            if (char.properties.writeWithoutResponse || char.properties.write) {
              matchedServiceUuid = service.uuid;
              matchedCharUuid = char.uuid;
              break;
            }
          }
          if (matchedCharUuid) break;
        }
      }

      if (!matchedServiceUuid || !matchedCharUuid) {
        throw new Error(`Connected to ${name || deviceId}, but no writable characteristic was found.`);
      }

      this.connections.set(deviceId, {
        id: deviceId,
        name,
        isNative: true,
        discoveredServiceUuid: matchedServiceUuid,
        discoveredCharacteristicUuid: matchedCharUuid,
        writeMethod: 'writeWithoutResponse',
      });

      this.notifyStatus(deviceId, 'connected');
      console.log(`[BLE Native] Successfully connected! Svc: ${matchedServiceUuid}, Char: ${matchedCharUuid}`);
    } catch (err: any) {
      console.error('[BLE Native] Connection error:', err);
      this.notifyStatus(deviceId, 'error', err?.message || 'Connection failed');
      throw err;
    }

    // Synchronize physical controller time upon successful GATT connection
    const driver = this.getDriver(protocol);
    if (typeof driver.buildTimeSyncPacket === 'function') {
      const syncPackets = driver.buildTimeSyncPacket(new Date());
      // Transmit non-blocking so connection finishes promptly
      this.writePackets(deviceId, syncPackets).catch((e) => console.warn('[BLE] Time sync warning:', e));
    }
  }

    private async connectWeb(device: BluetoothDevice, protocol: ProtocolType): Promise<void> {
    const deviceId = device.id;
    this.notifyStatus(deviceId, 'connecting');

    const abortController = new AbortController();
    this.pendingConnectAbortControllers.set(deviceId, abortController);

    const timeoutId = setTimeout(() => {
      abortController.abort(
        new Error(
          `Connection timed out after 12s. Device "${device.name || deviceId}" did not respond. Check range and power.`
        )
      );
    }, 12000);

    const checkAborted = () => {
      if (abortController.signal.aborted) {
        throw abortController.signal.reason || new Error('Connection cancelled.');
      }
    };

    try {
      device.addEventListener('gattserverdisconnected', () => {
        console.warn(`[BLE] Device disconnected: ${device.name || deviceId}`);
        this.connections.delete(deviceId);
        this.notifyStatus(deviceId, 'disconnected');
      });

      console.log(`[BLE] Step 1: Initiating GATT connection to "${device.name || deviceId}"...`);
      checkAborted();

      if (!device.gatt) {
        throw new Error('Device does not support GATT or server is unavailable.');
      }

      let server = await this.withTimeout(
        device.gatt.connect(),
        8000,
        abortController.signal,
        `GATT connection to "${device.name || deviceId}" timed out after 8s.`
      );

      await new Promise((r) => setTimeout(r, 350));
      checkAborted();

      if (!server.connected) {
        console.log('[BLE] Retrying secondary GATT handshake...');
        await new Promise((r) => setTimeout(r, 500));
        checkAborted();
        server = await this.withTimeout(
          device.gatt.connect(),
          8000,
          abortController.signal,
          'Secondary GATT connection attempt timed out.'
        );
        await new Promise((r) => setTimeout(r, 350));
      }

      if (!server || !server.connected) {
        throw new Error(`Failed to establish stable GATT link with "${device.name || deviceId}".`);
      }

      console.log(`[BLE] Step 2: Querying primary services on "${device.name || deviceId}"...`);
      checkAborted();

      const services = await this.withTimeout(
        server.getPrimaryServices(),
        6000,
        abortController.signal,
        'Primary service discovery timed out after 6s.'
      );

      // Synchronize physical controller time upon successful GATT connection
      const driver = this.getDriver(protocol);
      if (typeof driver.buildTimeSyncPacket === 'function') {
        const syncPackets = driver.buildTimeSyncPacket(new Date());
        // Transmit non-blocking so connection finishes promptly
        this.writePackets(deviceId, syncPackets).catch((e) => console.warn('[BLE] Time sync warning:', e));
      }
      let targetChar: BluetoothRemoteGATTCharacteristic | null = null;
      let targetServiceUuid: string | undefined;

      for (const service of services) {
        checkAborted();
        try {
          const chars = await this.withTimeout(
            service.getCharacteristics(),
            4000,
            abortController.signal,
            `Characteristic discovery on ${service.uuid} timed out.`
          );

          for (const char of chars) {
            const isTarget = driver.characteristicUuids.some(
              (u) => u.toLowerCase() === char.uuid.toLowerCase()
            );
            if (isTarget && (char.properties.writeWithoutResponse || char.properties.write)) {
              targetChar = char;
              targetServiceUuid = service.uuid;
              break;
            }
          }
          if (targetChar) break;

          for (const char of chars) {
            if (char.properties.writeWithoutResponse || char.properties.write) {
              targetChar = char;
              targetServiceUuid = service.uuid;
              break;
            }
          }
          if (targetChar) break;
        } catch (charErr) {
          console.warn(`[BLE] Could not read characteristics for service ${service.uuid}:`, charErr);
        }
      }

      if (!targetChar) {
        throw new Error(
          `Connected to "${device.name || deviceId}", but no writable GATT characteristic was found.`
        );
      }

      const writeMethod: 'writeWithoutResponse' | 'writeValueWithResponse' =
        targetChar.properties.writeWithoutResponse ? 'writeWithoutResponse' : 'writeValueWithResponse';

      this.connections.set(deviceId, {
        id: deviceId,
        name: device.name,
        isNative: false,
        device,
        server,
        writeCharacteristic: targetChar,
        discoveredServiceUuid: targetServiceUuid,
        discoveredCharacteristicUuid: targetChar.uuid,
        writeMethod,
      });

      clearTimeout(timeoutId);
      this.pendingConnectAbortControllers.delete(deviceId);
      this.notifyStatus(deviceId, 'connected');
      console.log(`[BLE] Connected to "${device.name || deviceId}" via ${targetChar.uuid} (${writeMethod})`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      this.pendingConnectAbortControllers.delete(deviceId);
      console.error('[BLE] Connect Error:', err);
      this.notifyStatus(deviceId, 'error', err?.message || 'Connection failed.');
      throw err;
    }
  }

  public async disconnect(deviceId: string): Promise<void> {
    this.cancelPendingConnect(deviceId);
    const conn = this.connections.get(deviceId);
    if (conn) {
      if (conn.isNative) {
        try {
          await BleClient.disconnect(deviceId);
        } catch (err) {
          console.warn(`[BLE Native] Error disconnecting ${deviceId}:`, err);
        }
      } else if (conn.server && conn.server.connected) {
        conn.server.disconnect();
      }
    }
    this.connections.delete(deviceId);
    this.notifyStatus(deviceId, 'disconnected');
  }

  public isConnected(deviceId: string): boolean {
    const conn = this.connections.get(deviceId);
    if (!conn) return false;
    if (conn.isNative) return true;
    return !!(conn?.server?.connected && conn.writeCharacteristic);
  }


  /**
   * Retrieves all devices that have already been granted permission by the user in this browser.
   */
  public async getGrantedDevices(): Promise<BluetoothDevice[]> {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      return [];
    }
    const navBle = navigator.bluetooth as any;
    if (typeof navBle.getDevices === 'function') {
      try {
        return await navBle.getDevices();
      } catch (err) {
        console.warn('[BLE] Could not retrieve granted devices:', err);
        return [];
      }
    }
    return [];
  }

  /**
   * Revokes the browser-level permission for a Bluetooth device and closes GATT link.
   * This forces Chrome to perform a clean scan dialog next time the device is requested.
   */
  public async forgetDevice(deviceId: string): Promise<void> {
    // 1. Terminate active connection
    this.disconnect(deviceId);

    // 2. Locate BluetoothDevice instance either from connection or from getGrantedDevices()
    const granted = await this.getGrantedDevices();
    const targetDevice = granted.find((d) => d.id === deviceId);

    if (targetDevice && typeof (targetDevice as any).forget === 'function') {
      try {
        await (targetDevice as any).forget();
        console.log(`[BLE] Successfully revoked browser permission for device: ${targetDevice.name ?? deviceId}`);
      } catch (forgetErr) {
        console.warn(`[BLE] Failed to forget device ${deviceId}:`, forgetErr);
      }
    }
  }

  /**
   * Cleans slate: revokes permissions and disconnects all granted devices.
   */
  public async forgetAllDevices(): Promise<void> {
    const granted = await this.getGrantedDevices();
    for (const dev of granted) {
      this.disconnect(dev.id);
      if (typeof (dev as any).forget === 'function') {
        try {
          await (dev as any).forget();
          console.log(`[BLE] Revoked browser permission for: ${dev.name ?? dev.id}`);
        } catch (err) {
          console.warn(`[BLE] Failed to forget device ${dev.id}:`, err);
        }
      }
    }
    this.connections.clear();
  }

  /**
   * Low-level write packet transmission with dual write method fallback and FIFO pacing.
   */
    public async writePackets(deviceId: string, packetArray: Uint8Array[]): Promise<void> {
    const conn = this.connections.get(deviceId);
    if (!conn) {
      throw new Error(`Cannot write packets: Device [${deviceId}] is not connected.`);
    }

    // --- NATIVE ANDROID BLE PATH ---
    if (conn.isNative) {
      if (!conn.discoveredServiceUuid || !conn.discoveredCharacteristicUuid) {
        throw new Error(`Missing service/characteristic UUIDs for native device [${deviceId}]`);
      }

      for (const packet of packetArray) {
        const dataView = new DataView(packet.buffer, packet.byteOffset, packet.byteLength);
        try {
          await BleClient.writeWithoutResponse(
            deviceId,
            conn.discoveredServiceUuid,
            conn.discoveredCharacteristicUuid,
            dataView
          );
        } catch (err) {
          console.warn('[BLE Native] writeWithoutResponse failed, attempting write with response:', err);
          await BleClient.write(
            deviceId,
            conn.discoveredServiceUuid,
            conn.discoveredCharacteristicUuid,
            dataView
          );
        }

        if (packetArray.length > 1) {
          await new Promise((r) => setTimeout(r, 55));
        }
      }
      return;
    }

    // --- WEB BLUETOOTH PATH ---
    const char = conn.writeCharacteristic;
    if (!char) {
      throw new Error(`No writable characteristic available for Web Bluetooth device [${deviceId}]`);
    }

    for (const packet of packetArray) {
      const payload = packet as unknown as BufferSource;
      if (char.properties.writeWithoutResponse && typeof char.writeValueWithoutResponse === 'function') {
        await char.writeValueWithoutResponse(payload);
      } else {
        await char.writeValueWithResponse(payload);
      }
      if (packetArray.length > 1) {
        await new Promise((r) => setTimeout(r, 55));
      }
    }
  }

  // --- High-level Control Actions ---
  public async setPower(device: DeviceRecord, on: boolean): Promise<void> {
    const driver = this.getDriver(device.protocol);
    const packets = driver.buildPowerPacket(on);
    await this.writePackets(device.id, packets);
  }

    public async setColor(device: DeviceRecord, color: RGBColor): Promise<void> {
    const driver = this.getDriver(device.protocol);
    let calibratedColor = applyColorOrder(color, device.colorOrder || 'RGB');

    // 1. Red-Blue quadrant calibration for ELK-BLEDOM (pinks, magentas, violets)
    if (
      device.protocol === 'elk-bledom' &&
      color.r > 30 &&
      color.b > 30 &&
      color.g < 90
    ) {
      calibratedColor = {
        ...calibratedColor,
        r: Math.min(255, Math.round(calibratedColor.r * 1.35)),
        b: Math.round(calibratedColor.b * 0.65),
      };
    }

    // 2. Warm Cozy / Amber calibration for ELK-BLEDOM:
    // Slightly tone down green and blue in warm white so ELK-BLEDOM projects richer incandescent warmth
    if (
      device.protocol === 'elk-bledom' &&
      color.r > 240 &&
      color.g > 140 &&
      color.b > 50 &&
      color.g > color.b
    ) {
      calibratedColor = {
        ...calibratedColor,
        g: Math.round(calibratedColor.g * 0.88),
        b: Math.round(calibratedColor.b * 0.75),
      };
    }

    const packets = driver.buildColorPacket(calibratedColor);
    await this.writePackets(device.id, packets);
  }

  public async setBrightness(device: DeviceRecord, brightness: number): Promise<void> {
    const driver = this.getDriver(device.protocol);
    const packets = driver.buildBrightnessPacket(brightness);
    await this.writePackets(device.id, packets);
  }

  public async setEffect(device: DeviceRecord, effectId: number, speed: number): Promise<void> {
    const driver = this.getDriver(device.protocol);
    const packets = driver.buildEffectPacket(effectId, speed);
    await this.writePackets(device.id, packets);
  }

  public async identify(device: DeviceRecord): Promise<void> {
    const driver = this.getDriver(device.protocol);
    const packets = driver.buildIdentifyPacket();
    await this.writePackets(device.id, packets);
  }

  /**
   * Broadcasts a unison color/brightness/power/effect command to a list of devices concurrently.
   */
  public async sendUnisonCommand(
    devices: DeviceRecord[],
    action: { power?: boolean; color?: RGBColor; brightness?: number; effectMode?: number; speed?: number }
  ): Promise<void> {
    const tasks = devices
      .filter((d) => this.isConnected(d.id))
      .map(async (dev) => {
        try {
          if (action.power !== undefined) {
            await this.setPower(dev, action.power);
          }
          if (action.color) {
            await this.setColor(dev, action.color);
          }
          if (action.brightness !== undefined) {
            await this.setBrightness(dev, action.brightness);
          }
          if (action.effectMode !== undefined) {
            await this.setEffect(dev, action.effectMode, action.speed ?? 80);
          }
        } catch (err) {
          console.error(`[BLE Unison Error] Failed on device ${dev.name}:`, err);
        }
      });

    await Promise.allSettled(tasks);
  }
}
