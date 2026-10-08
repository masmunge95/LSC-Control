import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { DeviceCard } from './DeviceCard';
import { AddDeviceModal } from './AddDeviceModal';
import { PairedDevicesModal } from './PairedDevicesModal';
import { Button } from '../common/Button';
import { Plus, Bluetooth, RefreshCw, Unlink } from 'lucide-react';

export const DeviceList: React.FC = () => {
  const { devices, connectionMap, connectDevice } = useDevices();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPairedModalOpen, setIsPairedModalOpen] = useState(false);
  const [isReconnectingAll, setIsReconnectingAll] = useState(false);

  const connectedCount = devices.filter(
    (d) => connectionMap[d.id]?.status === 'connected'
  ).length;

  const handleReconnectAll = async () => {
    setIsReconnectingAll(true);
    try {
      const disconnectedDevices = devices.filter(
        (d) => connectionMap[d.id]?.status !== 'connected'
      );
      await Promise.allSettled(
        disconnectedDevices.map((d) => connectDevice(d.id))
      );
    } finally {
      setIsReconnectingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-850">
        <div>
          <h2 className="text-xl font-extrabold text-zinc-100 flex items-center gap-2.5">
            <span>Paired RGB Strips</span>
            <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              {connectedCount}/{devices.length} Online
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your ELK-BLEDOM and LEDDMX controllers individually with real-time GATT control
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Unlink}
            onClick={() => setIsPairedModalOpen(true)}
            title="Inspect devices authorized in Chrome and revoke permissions"
          >
            <span className="hidden sm:inline">Bluetooth Cache</span>
          </Button>

          {devices.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              isLoading={isReconnectingAll}
              onClick={handleReconnectAll}
              title="Attempt to reconnect to all offline devices"
            >
              <span>Reconnect All</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            onClick={() => setIsAddModalOpen(true)}
          >
            <span>Add RGB Strip</span>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {devices.length === 0 ? (
        <div className="text-center py-20 px-6 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 max-w-xl mx-auto">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/20">
            <Bluetooth className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-zinc-200">No RGB strips added yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5 mb-6 leading-relaxed">
            Connect your first ELK-BLEDOM or LEDDMX light strip via Web Bluetooth to start controlling colors and effects.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              icon={Plus}
              onClick={() => setIsAddModalOpen(true)}
            >
              <span>Scan for Strip</span>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              icon={Unlink}
              onClick={() => setIsPairedModalOpen(true)}
            >
              <span>Check Paired Cache</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Device Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <DeviceCard key={device.id} device={device} />
          ))}
        </div>
      )}

      {/* Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Paired Devices & Permission Manager Modal */}
      <PairedDevicesModal
        isOpen={isPairedModalOpen}
        onClose={() => setIsPairedModalOpen(false)}
      />
    </div>
  );
};
