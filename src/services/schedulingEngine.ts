import type { DeviceRecord } from '../types/device';

export interface SchedulingEngineConfig {
  /**
   * Grace period in milliseconds during which a manual user command
   * prevents a scheduled command from overwriting the strip state (Default: 90 seconds).
   */
  manualOverrideGraceMs?: number;
}

export class SchedulingEngine {
  private static instance: SchedulingEngine;
  private manualOverrides = new Map<string, number>(); // deviceId -> timestamp
  private firedMinuteKeys = new Set<string>(); // "scheduleId-YYYYMMDDHHmm"
  private gracePeriodMs: number;

  private constructor(config?: SchedulingEngineConfig) {
    this.gracePeriodMs = config?.manualOverrideGraceMs ?? 90 * 1000; // 90-second grace window
  }

  public static getInstance(config?: SchedulingEngineConfig): SchedulingEngine {
    if (!SchedulingEngine.instance) {
      SchedulingEngine.instance = new SchedulingEngine(config);
    }
    return SchedulingEngine.instance;
  }

  /**
   * Call whenever the user manually toggles power, adjusts color, or changes patterns.
   */
  public recordManualOverride(deviceId: string): void {
    this.manualOverrides.set(deviceId, Date.now());
    console.log(`[SchedulingEngine] Manual override registered for device [${deviceId}]`);
  }

  /**
   * Checks whether a manual action was recently executed on this device.
   */
  public isDeviceOverridden(deviceId: string): boolean {
    const lastManual = this.manualOverrides.get(deviceId);
    if (!lastManual) return false;
    const elapsed = Date.now() - lastManual;
    return elapsed < this.gracePeriodMs;
  }

  /**
   * Generates a minute stamp key: e.g. "sched_123-20261008-0730"
   */
  public getMinuteKey(scheduleId: string, now: Date): string {
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${scheduleId}-${yyyy}${mm}${dd}-${hh}${min}`;
  }

  public hasAlreadyFired(scheduleId: string, now: Date): boolean {
    return this.firedMinuteKeys.has(this.getMinuteKey(scheduleId, now));
  }

  public markFired(scheduleId: string, now: Date): void {
    this.firedMinuteKeys.add(this.getMinuteKey(scheduleId, now));
    // Prune stale cache entries
    if (this.firedMinuteKeys.size > 200) {
      this.firedMinuteKeys.clear();
    }
  }

  /**
   * Filters the target devices for a schedule, omitting any that have an active manual override.
   */
  public filterEligibleDevices(
    devices: DeviceRecord[]
  ): { eligible: DeviceRecord[]; overridden: DeviceRecord[] } {
    const eligible: DeviceRecord[] = [];
    const overridden: DeviceRecord[] = [];

    for (const dev of devices) {
      if (this.isDeviceOverridden(dev.id)) {
        overridden.push(dev);
      } else {
        eligible.push(dev);
      }
    }

    return { eligible, overridden };
  }
}