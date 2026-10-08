export type ProtocolType = 'elk-bledom' | 'leddmx';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type ColorOrder = 'RGB' | 'GRB' | 'BRG' | 'BGR';

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface DeviceState {
  power: boolean;
  color: RGBColor;
  brightness: number; // 0 - 100
  effectMode?: number;
  speed?: number; // 0 - 100
}

export interface DeviceRecord {
  id: string; // Bluetooth device ID or stored unique identifier
  name: string; // User-defined name (e.g., "Desk Backlight")
  originalName: string; // Name advertised by Bluetooth (e.g., "ELK-BLEDOM")
  protocol: ProtocolType;
  colorOrder?: ColorOrder; // Defaults to 'RGB' if omitted
  lastKnownState: {
    power: boolean;
    color: RGBColor;
    brightness: number;
    effectMode?: number;
    speed?: number;
  };
  createdAt: number;
  lastConnectedAt?: number;
}

export interface DeviceGroup {
  id: string;
  name: string;
  deviceIds: string[];
  icon: 'monitor' | 'bed' | 'sofa' | 'tv' | 'sparkles' | 'sun';
  colorTag: string; // Tailwind color or hex
  createdAt: number;
}

export interface DeviceWithConnection extends DeviceRecord {
  connectionStatus: ConnectionStatus;
  errorMessage?: string;
}

export interface DeviceSchedule {
  id: string;
  targetType: 'device' | 'group' | 'all';
  targetId?: string;
  name: string;
  enabled: boolean;
  time: string; // e.g. "07:30" (24h format)
  days: number[]; // 0 = Sun, 1 = Mon, ..., 6 = Sat
  action: 'power_on' | 'power_off';
  color?: RGBColor;
}
