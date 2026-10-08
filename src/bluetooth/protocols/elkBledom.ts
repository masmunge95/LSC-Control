import type { ProtocolDriver } from '../../types/bluetooth';
import type { RGBColor } from '../../types/device';

export const elkBledomDriver: ProtocolDriver = {
  name: 'ELK-BLEDOM',
  type: 'elk-bledom',
  primaryServiceUuids: [
    '0000fff0-0000-1000-8000-00805f9b34fb', // Standard FFF0
    '0000ffe0-0000-1000-8000-00805f9b34fb', // Alternative FFE0
    '0000fee0-0000-1000-8000-00805f9b34fb', // Alternative FEE0
    '0000ffe5-0000-1000-8000-00805f9b34fb',
    '00010203-0405-0607-0809-0a0b0c0d1910', // Custom 128-bit
  ],
  characteristicUuids: [
    '0000fff3-0000-1000-8000-00805f9b34fb', // Standard write characteristic
    '0000ffe4-0000-1000-8000-00805f9b34fb',
    '0000ffe9-0000-1000-8000-00805f9b34fb',
    '0000ffe1-0000-1000-8000-00805f9b34fb',
    '00010203-0405-0607-0809-0a0b0c0d2b11',
  ],

  buildPowerPacket(on: boolean): Uint8Array[] {
    if (on) {
      return [
        // Canonical ELK-BLEDOM (0x00 in byte 2)
        new Uint8Array([0x7e, 0x00, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef]),
        // Alternate revision (0x04 in byte 2)
        new Uint8Array([0x7e, 0x04, 0x04, 0xf0, 0x00, 0x01, 0xff, 0x00, 0xef]),
      ];
    }
    return [
      // Canonical Power Off
      new Uint8Array([0x7e, 0x00, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef]),
      // Alternate Power Off
      new Uint8Array([0x7e, 0x04, 0x04, 0x00, 0x00, 0x00, 0xff, 0x00, 0xef]),
    ];
  },

  buildColorPacket(color: RGBColor): Uint8Array[] {
    const r = Math.max(0, Math.min(255, Math.round(color.r)));
    const g = Math.max(0, Math.min(255, Math.round(color.g)));
    const b = Math.max(0, Math.min(255, Math.round(color.b)));

    return [
      // Format A: Standard ELK-BLEDOM (0x00 byte 2) - 7e 00 05 03 R G B 00 ef
      new Uint8Array([0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, 0xef]),
      // Format B: Revision variant (0x07 byte 2) - 7e 07 05 03 R G B 00 ef
      new Uint8Array([0x7e, 0x07, 0x05, 0x03, r, g, b, 0x00, 0xef]),
    ];
  },

  buildBrightnessPacket(brightness: number): Uint8Array[] {
    const clamped = Math.max(0, Math.min(100, Math.round(brightness)));
    return [
      // Format A: Standard 7e 00 01 <val> 00 00 00 00 ef
      new Uint8Array([0x7e, 0x00, 0x01, clamped, 0x00, 0x00, 0x00, 0x00, 0xef]),
      // Format B: Variant 7e 04 01 <val> 00 00 ff 00 ef
      new Uint8Array([0x7e, 0x04, 0x01, clamped, 0x00, 0x00, 0xff, 0x00, 0xef]),
    ];
  },

  buildEffectPacket(effectId: number, speed: number): Uint8Array[] {
    const clampedSpeed = Math.max(0, Math.min(100, Math.round(speed)));
    return [
      new Uint8Array([0x7e, 0x00, 0x03, effectId & 0xff, clampedSpeed, 0x00, 0x00, 0x00, 0xef]),
      new Uint8Array([0x7e, 0x05, 0x03, effectId & 0xff, clampedSpeed, 0x00, 0xff, 0x00, 0xef]),
    ];
  },

  buildIdentifyPacket(): Uint8Array[] {
    return [
      ...this.buildPowerPacket(true),
      ...this.buildBrightnessPacket(100),
      ...this.buildColorPacket({ r: 255, g: 255, b: 255 }),
    ];
  },

  buildTimeSyncPacket(date: Date = new Date()): Uint8Array[] {
    return [
      // 0x7E 0x00 0x82 [YY] [MM] [DD] [HH] [mm] [ss] 0xEF
      new Uint8Array([
        0x7e, 0x00, 0x82,
        date.getFullYear() % 100,
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        0xef,
      ]),
      ];
  },

  buildSchedulePacket(hour: number, min: number, on: boolean, daysMask: number = 0x7f): Uint8Array[] {
    // 0x7E 0x00 0x83 [daysMask] [HH] [mm] [action: 0x01 on / 0x00 off] ... 0xEF
    return [
      new Uint8Array([
        0x7e, 0x00, 0x83,
        daysMask,
        hour,
        min,
        on ? 0x01 : 0x00,
        0x00,
        0x00,
        0xef,
      ]),
    ];
  },
};
