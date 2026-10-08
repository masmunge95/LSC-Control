import type { ProtocolDriver } from '../../types/bluetooth';
import type { RGBColor } from '../../types/device';

export const ledDmxDriver: ProtocolDriver = {
  name: 'LEDDMX',
  type: 'leddmx',
  primaryServiceUuids: [
    '0000ffe0-0000-1000-8000-00805f9b34fb', // Standard DMX BLE FFE0
    '0000cc02-0000-1000-8000-00805f9b34fb',
    '0000fff0-0000-1000-8000-00805f9b34fb',
    '0000ae00-0000-1000-8000-00805f9b34fb',
    '0000fee0-0000-1000-8000-00805f9b34fb',
  ],
  characteristicUuids: [
    '0000ffe1-0000-1000-8000-00805f9b34fb', // Standard FFE1
    '0000cc03-0000-1000-8000-00805f9b34fb',
    '0000fff1-0000-1000-8000-00805f9b34fb',
    '0000fff3-0000-1000-8000-00805f9b34fb',
    '0000ae01-0000-1000-8000-00805f9b34fb',
  ],

    buildPowerPacket(on: boolean): Uint8Array[] {
    if (on) {
      return [
        // LEDDMX Power ON: 7B FF 04 01 FF FF FF FF BF
        new Uint8Array([0x7b, 0xff, 0x04, 0x01, 0xff, 0xff, 0xff, 0xff, 0xbf]),
      ];
    }
    return [
      // LEDDMX Power OFF: 7B FF 04 00 FF FF FF FF BF
      new Uint8Array([0x7b, 0xff, 0x04, 0x00, 0xff, 0xff, 0xff, 0xff, 0xbf]),
    ];
  },

  buildColorPacket(color: RGBColor): Uint8Array[] {
    const r = Math.max(0, Math.min(255, Math.round(color.r)));
    const g = Math.max(0, Math.min(255, Math.round(color.g)));
    const b = Math.max(0, Math.min(255, Math.round(color.b)));

    return [
      // Canonical LEDDMX Color: 7B FF 07 R G B 00 FF BF
      new Uint8Array([0x7b, 0xff, 0x07, r, g, b, 0x00, 0xff, 0xbf]),
    ];
  },

  buildBrightnessPacket(brightness: number): Uint8Array[] {
    const clamped = Math.max(0, Math.min(100, Math.round(brightness)));
    // Hardware 0-32 intensity register
    const scale32 = Math.max(1, Math.min(32, Math.round((clamped * 32) / 100)));

    return [
      // Canonical LEDDMX Brightness: 7B FF 01 (pct*32/100) pct 00 FF FF BF
      new Uint8Array([0x7b, 0xff, 0x01, scale32, clamped, 0x00, 0xff, 0xff, 0xbf]),
    ];
  },

    buildEffectPacket(effectId: number, speed: number): Uint8Array[] {
    const clampedSpeed = Math.max(0, Math.min(100, Math.round(speed)));
    // Scale 0-100 speed into LEDDMX's 1-32 hardware register
    const speed32 = Math.max(1, Math.min(32, Math.round((clampedSpeed * 32) / 100)));

    // Homogenized translation map: Translates UI / ELK effect IDs into exact LEDDMX firmware modes
    const DMX_EFFECT_MAP: Record<number, number> = {
      0x90: 0x01, // Rainbow Cycle -> 7-color smooth fade (0x01)
      0x8a: 0x01, // 7-Color Fade  -> 7-color smooth fade (0x01)
      0x89: 0x0e, // Breathing     -> 7-color pulse/breath (0x0E)
      0x88: 0x07, // 7-Color Jump  -> 7-color jump (0x07)
      0x87: 0x08, // RGB Tri-Jump  -> 3-color jump (0x08)
      0x8b: 0x09, // Strobe Flash  -> 7-color strobe (0x09)
      0x91: 0x02, // Sunset Fade   -> Warm/Red gradual fade (0x02)
    };

    const mode = DMX_EFFECT_MAP[effectId] ?? (effectId > 0x1e ? 0x01 : Math.max(1, effectId));

    return [
      // Canonical LEDDMX Effect: 7B FF 03 mode speed32 00 FF FF BF
      new Uint8Array([0x7b, 0xff, 0x03, mode, speed32, 0x00, 0xff, 0xff, 0xbf]),
    ];
  },

  buildIdentifyPacket(): Uint8Array[] {
    return [
      ...this.buildPowerPacket(true),
      ...this.buildBrightnessPacket(100),
      ...this.buildColorPacket({ r: 255, g: 0, b: 0 }),
    ];
  },

    buildTimeSyncPacket(date: Date = new Date()): Uint8Array[] {
    return [
      // 7B FF 08 [HH] [mm] [ss] [DayOfWeek: 1-7] 00 BF
      new Uint8Array([
        0x7b, 0xff, 0x08,
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getDay() === 0 ? 7 : date.getDay(),
        0x00,
        0xbf,
      ]),
    ];
  },

  buildSchedulePacket(hour: number, min: number, on: boolean, daysMask: number = 0x7f): Uint8Array[] {
    // 7B FF 09 [daysMask] [HH] [mm] [action: 0x01 on / 0x00 off] 00 BF
    return [
      new Uint8Array([
        0x7b, 0xff, 0x09,
        daysMask,
        hour,
        min,
        on ? 0x01 : 0x00,
        0x00,
        0xbf,
      ]),
    ];
  },
};
