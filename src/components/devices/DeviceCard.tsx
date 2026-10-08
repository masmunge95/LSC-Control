import React, { useState } from 'react';
import type { DeviceRecord } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import {
  Power,
  Bluetooth,
  BluetoothOff,
  Sparkles,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface DeviceCardProps {
  device: DeviceRecord;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device }) => {
  const {
    connectionMap,
    connectDevice,
    disconnectDevice,
    toggleDevicePower,
    setDeviceBrightness,
    identifyDevice,
    updateDevice,
    deleteDevice,
  } = useDevices();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(device.name);
  const [isBusy, setIsBusy] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const connectionInfo = connectionMap[device.id] || { status: 'disconnected' };
  const isConnected = connectionInfo.status === 'connected';
  const isConnecting = connectionInfo.status === 'connecting';

  const handleTogglePower = async () => {
    try {
      await toggleDevicePower(device.id);
    } catch (err) {
      console.error('Error toggling power:', err);
    }
  };

  const handleConnectToggle = async () => {
    setIsBusy(true);
    try {
      if (isConnected || isConnecting) {
        disconnectDevice(device.id);
      } else {
        await connectDevice(device.id);
      }
    } catch (err) {
      console.error('Failed to toggle connection:', err);
    } finally {
      setIsBusy(false);
    }
  };

  const [isIdentifying, setIsIdentifying] = useState(false);

  const handleIdentify = async () => {
    setIsIdentifying(true);
    try {
      await identifyDevice(device.id);
    } catch (err) {
      console.error('Identify failed:', err);
    } finally {
      setIsIdentifying(false);
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    await updateDevice({ ...device, name: editName.trim() });
    setIsEditing(false);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setDeviceBrightness(device.id, val);
  };

  const toHex = (c: { r: number; g: number; b: number }) => {
    const h = (n: number) => n.toString(16).padStart(2, '0');
    return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
  };

  const currentColorHex = toHex(device.lastKnownState.color);

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group">
      {/* Dynamic ambient color glow */}
      {isConnected && device.lastKnownState.power && (
        <div
          className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-2xl opacity-25 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: currentColorHex }}
        />
      )}

      {/* Header: Name, Protocol Tag, Status */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:border-cyan-400 w-full"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon-sm"
                icon={Check}
                onClick={handleSaveName}
                title="Save name"
                className="text-emerald-400 hover:text-emerald-300"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                icon={X}
                onClick={() => {
                  setEditName(device.name);
                  setIsEditing(false);
                }}
                title="Cancel"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-zinc-100 text-base truncate">{device.name}</h3>
              <Button
                variant="ghost"
                size="icon-sm"
                icon={Edit2}
                onClick={() => setIsEditing(true)}
                title="Rename device"
                className="opacity-50 group-hover:opacity-100 p-1"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                device.protocol === 'elk-bledom'
                  ? 'bg-purple-950/80 text-purple-300 border border-purple-800/70 shadow-[0_0_10px_rgba(168,85,247,0.15)]'
                  : 'bg-blue-950/80 text-blue-300 border border-blue-800/70 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
              }`}
            >
              {device.protocol === 'elk-bledom' ? 'ELK-BLEDOM' : 'LEDDMX'}
            </span>
            <span className="text-[11px] text-zinc-500 truncate font-mono">
              {device.originalName}
            </span>
            {isConnected && (
              <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded-md bg-cyan-950/60 border border-cyan-800/50">
                GATT Linked
              </span>
            )}
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950/80 border border-zinc-800 text-xs shrink-0 shadow-inner">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : isConnecting
                ? 'bg-amber-400 animate-ping'
                : 'bg-zinc-600'
            }`}
          />
          <span className="text-zinc-300 font-semibold capitalize text-[11px]">
            {isConnecting ? 'Connecting' : isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Dimmer Slider */}
      <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 relative z-10">
        <div className="flex justify-between items-center text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-bold">
            <Sliders className="w-3.5 h-3.5 text-zinc-500" /> Brightness
          </span>
          <span className="font-mono text-zinc-200 font-bold">{device.lastKnownState.brightness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={device.lastKnownState.brightness}
          onChange={handleBrightnessChange}
          disabled={!isConnected}
          className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-full cursor-pointer disabled:opacity-40"
        />
      </div>

      <div className="flex items-center gap-1.5 mt-2 bg-zinc-900/60 p-1.5 rounded-xl border border-white/5">
        <span className="text-[10px] text-zinc-400 font-mono px-1">PIN ORDER:</span>
        {(['RGB', 'GRB', 'BRG'] as const).map((order) => (
          <button
            key={order}
            onClick={() => updateDevice({ ...device, colorOrder: order })}
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg transition-colors ${
              (device.colorOrder || 'RGB') === order
                ? 'bg-blue-600 text-white'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
            }`}
          >
            {order}
          </button>
        ))}
      </div>

      {/* Bottom Button Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 relative z-10 gap-2">
        <div className="flex items-center gap-2">
          {/* Power Toggle Button */}
          <Button
            variant="power"
            size="sm"
            icon={Power}
            isActive={device.lastKnownState.power}
            onClick={handleTogglePower}
            disabled={!isConnected}
            title={device.lastKnownState.power ? 'Turn Off' : 'Turn On'}
          >
            <span>{device.lastKnownState.power ? 'ON' : 'OFF'}</span>
          </Button>

          {/* Flash / Identify Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={Sparkles}
            onClick={handleIdentify}
            disabled={!isConnected || isIdentifying}
            title="Identify this physical strip by flashing bright white"
          >
            <span>{isIdentifying ? 'Flashing...' : 'Identify'}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Connect / Disconnect / Cancel Button */}
          <Button
            variant={isConnected ? 'secondary' : isConnecting ? 'danger' : 'primary'}
            size="sm"
            icon={isConnected ? BluetoothOff : Bluetooth}
            isLoading={isBusy}
            onClick={handleConnectToggle}
            title={isConnected ? 'Disconnect' : isConnecting ? 'Cancel Connecting' : 'Connect'}
          >
            <span>{isConnected ? 'Disconnect' : isConnecting ? 'Cancel' : 'Connect'}</span>
          </Button>

          {/* Forget / Delete Button */}
          <Button
            variant="danger"
            size="icon-sm"
            icon={Trash2}
            onClick={() => setIsDeleteModalOpen(true)}
            title="Forget device"
          />
        </div>
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Remove Device"
        message={`Are you sure you want to remove "${device.name}" from your stored devices?`}
        confirmText="Remove"
        variant="danger"
        onConfirm={() => {
          deleteDevice(device.id);
          setIsDeleteModalOpen(false);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
