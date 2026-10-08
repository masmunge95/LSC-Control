import React, { useState, useEffect, useCallback } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import {
  Bluetooth,
  BluetoothOff,
  Trash2,
  RefreshCw,
  X,
  CheckCircle2,
  HelpCircle,
  Unlink,
} from 'lucide-react';

interface PairedDevicesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface BrowserDeviceItem {
  id: string;
  name?: string;
  connected: boolean;
  inDatabase: boolean;
  protocol?: string;
}

export const PairedDevicesModal: React.FC<PairedDevicesModalProps> = ({ isOpen, onClose }) => {
  const {
    devices,
    connectionMap,
    unpairDevice,
    unpairAllDevices,
    getBrowserGrantedDevices,
  } = useDevices();

  const [browserDevices, setBrowserDevices] = useState<BrowserDeviceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unpairingId, setUnpairingId] = useState<string | null>(null);
  const [isUnpairingAll, setIsUnpairingAll] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      const granted = await getBrowserGrantedDevices();
      const dbDeviceMap = new Map(devices.map((d) => [d.id, d]));

      const combined: BrowserDeviceItem[] = [];
      const seenIds = new Set<string>();

      // Add devices from browser permissions
      for (const dev of granted) {
        seenIds.add(dev.id);
        const dbDev = dbDeviceMap.get(dev.id);
        combined.push({
          id: dev.id,
          name: dev.name || dbDev?.name || 'Unnamed Peripheral',
          connected: !!dev.gatt?.connected,
          inDatabase: !!dbDev,
          protocol: dbDev?.protocol,
        });
      }

      // Add any devices in IndexedDB that weren't returned by getDevices()
      for (const dbDev of devices) {
        if (!seenIds.has(dbDev.id)) {
          combined.push({
            id: dbDev.id,
            name: dbDev.name,
            connected: connectionMap[dbDev.id]?.status === 'connected',
            inDatabase: true,
            protocol: dbDev.protocol,
          });
        }
      }

      setBrowserDevices(combined);
    } catch (err) {
      console.warn('Failed to query browser devices:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getBrowserGrantedDevices, devices, connectionMap]);

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setActionMessage(null);
    }
  }, [isOpen, refreshList]);

  if (!isOpen) return null;

  const handleUnpairSingle = async (deviceId: string, name?: string) => {
    setUnpairingId(deviceId);
    setActionMessage(null);
    try {
      await unpairDevice(deviceId);
      setActionMessage(`Revoked permissions for "${name || deviceId}". Fresh scan ready.`);
      await refreshList();
    } catch (err) {
      console.error('Failed to unpair:', err);
      setActionMessage(`Failed to unpair device.`);
    } finally {
      setUnpairingId(null);
    }
  };

  const handleUnpairAll = async () => {
    if (!confirm('Are you sure you want to unpair ALL light strips? This revokes all browser authorizations and removes saved devices.')) {
      return;
    }
    setIsUnpairingAll(true);
    setActionMessage(null);
    try {
      await unpairAllDevices();
      setActionMessage('All device permissions revoked and local caches reset.');
      await refreshList();
    } catch (err) {
      console.error('Failed to unpair all:', err);
      setActionMessage('Failed to reset all devices.');
    } finally {
      setIsUnpairingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative text-zinc-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100"
        />

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-950/60 border border-cyan-400/30">
            <Unlink className="w-6 h-6 text-zinc-950 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-100">
              Paired Hardware & Bluetooth Permissions
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage devices granted access by Chrome and purge stale GATT links
            </p>
          </div>
        </div>

        {/* Action message banner */}
        {actionMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 shrink-0 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Scrollable Device List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-[140px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-zinc-500 text-xs gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span>Querying browser Bluetooth authorizations...</span>
            </div>
          ) : browserDevices.length === 0 ? (
            <div className="py-10 px-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center flex flex-col items-center justify-center gap-2">
              <Bluetooth className="w-8 h-8 text-zinc-600 mb-1" />
              <p className="text-sm font-semibold text-zinc-300">No Paired Devices Found</p>
              <p className="text-xs text-zinc-500 max-w-sm">
                No Bluetooth devices currently have origin permissions cached in this browser session.
              </p>
            </div>
          ) : (
            browserDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/80 transition flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      dev.connected
                        ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {dev.connected ? (
                      <Bluetooth className="w-4 h-4 animate-pulse" />
                    ) : (
                      <BluetoothOff className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-200 truncate">
                        {dev.name}
                      </span>
                      {dev.protocol && (
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {dev.protocol}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono mt-0.5">
                      <span className="truncate max-w-[140px] sm:max-w-[200px]" title={dev.id}>
                        ID: {dev.id}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          dev.connected
                            ? 'text-emerald-400 font-semibold'
                            : 'text-zinc-500'
                        }
                      >
                        {dev.connected ? 'Active Link' : 'Idle Permission'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    isLoading={unpairingId === dev.id}
                    onClick={() => handleUnpairSingle(dev.id, dev.name)}
                    title="Revoke browser permissions and disconnect strip"
                  >
                    <span className="hidden sm:inline">Unpair</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Windows BLE Connection Troubleshooting Advice */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-3 shrink-0 text-xs">
          <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 font-bold">
              <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Troubleshooting "No Writable Characteristic" on Windows</span>
            </div>
            <ul className="text-zinc-400 space-y-1.5 list-disc list-inside text-[11px] leading-relaxed">
              <li>
                <strong className="text-zinc-300">Single-Master Lock:</strong> ELK-BLEDOM and LEDDMX chips reject PC connections if an app on your phone (e.g. <em>Lotus Lantern</em>, <em>duoCo Strip</em>, <em>LED LAMP</em>) is running in the background. Close it or turn off phone Bluetooth.
              </li>
              <li>
                <strong className="text-zinc-300">Controller Reboot:</strong> Unplug the strip's 5V/12V USB power cable for 3 seconds and plug it back in to reboot its BLE radio.
              </li>
              <li>
                <strong className="text-zinc-300">Revoke to Force Fresh Scan:</strong> Click <strong>"Unpair"</strong> above. This clears Chrome's cached GATT services so the next <em>"Add Strip"</em> prompt discovers clean characteristics.
              </li>
            </ul>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={isLoading}
              onClick={refreshList}
            >
              <span>Refresh List</span>
            </Button>

            <div className="flex items-center gap-2">
              {browserDevices.length > 0 && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  isLoading={isUnpairingAll}
                  onClick={handleUnpairAll}
                  title="Revoke all Bluetooth permissions and reset database"
                >
                  <span>Unpair All</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <span>Close</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
