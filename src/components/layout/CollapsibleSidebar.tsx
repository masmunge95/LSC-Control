import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import {
  Bluetooth,
  BluetoothOff,
  Layers,
  Plus,
  RefreshCw,
  Power,
  ChevronLeft,
  ChevronRight,
  Radio,
  Sparkles,
  Monitor,
  Bed,
  Tv,
  Armchair,
  Sun,
  X,
  Unlink,
} from 'lucide-react';
import { AddDeviceModal } from '../devices/AddDeviceModal';
import { GroupModal } from '../groups/GroupModal';
import { PairedDevicesModal } from '../devices/PairedDevicesModal';

const ICON_MAP = {
  monitor: Monitor,
  bed: Bed,
  tv: Tv,
  sofa: Armchair,
  sparkles: Sparkles,
  sun: Sun,
};

interface CollapsibleSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const CollapsibleSidebar: React.FC<CollapsibleSidebarProps> = ({
  isOpen,
  onToggle,
  isMobileOpen,
  onMobileClose,
}) => {
  const {
    devices,
    groups,
    connectionMap,
    selectedTarget,
    setSelectedTarget,
    connectDevice,
    disconnectDevice,
    toggleDevicePower,
    toggleGroupPower,
  } = useDevices();

  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [isPairedDevicesOpen, setIsPairedDevicesOpen] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const connectedCount = devices.filter(
    (d) => connectionMap[d.id]?.status === 'connected'
  ).length;

  const handleReconnectAll = async () => {
    setIsReconnecting(true);
    try {
      const disconnected = devices.filter(
        (d) => connectionMap[d.id]?.status !== 'connected'
      );
      await Promise.allSettled(disconnected.map((d) => connectDevice(d.id)));
    } finally {
      setIsReconnecting(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full text-zinc-100 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shadow-sm">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Hardware Hub</h2>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectedCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                }`}
              />
              <span>{connectedCount}/{devices.length} Online</span>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={onMobileClose}
          className="lg:hidden"
        />

        {/* Desktop collapse button */}
        <Button
          variant="ghost"
          size="icon-sm"
          icon={ChevronLeft}
          onClick={onToggle}
          title={isOpen ? 'Collapse panel' : 'Expand panel'}
          className="hidden lg:flex"
        />
      </div>

      {/* Connection Tools Bar */}
      <div className="p-3.5 border-b border-zinc-800/80 flex items-center gap-2 bg-zinc-950/50">
        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsAddDeviceOpen(true)}
          className="flex-1"
        >
          <span>Add Strip</span>
        </Button>

        <Button
          variant="secondary"
          size="icon-sm"
          icon={Unlink}
          onClick={() => setIsPairedDevicesOpen(true)}
          title="Manage Paired Hardware & Bluetooth Permissions"
        />

        <Button
          variant="secondary"
          size="icon-sm"
          icon={RefreshCw}
          isLoading={isReconnecting}
          disabled={devices.length === 0}
          onClick={handleReconnectAll}
          title="Reconnect All offline strips"
        />
      </div>

      {/* Scrollable Groups & Devices Lists */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-6 scrollbar-thin">
        {/* GROUPS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" /> Groups ({groups.length})
            </span>
            <Button
              variant="ghost"
              size="xs"
              icon={Plus}
              onClick={() => setIsAddGroupOpen(true)}
              className="text-cyan-400 hover:text-cyan-300"
            >
              <span>New</span>
            </Button>
          </div>

          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-xs text-zinc-500 italic px-3 py-3.5 bg-zinc-950/40 rounded-2xl border border-zinc-900 text-center">
                No groups created yet
              </p>
            ) : (
              groups.map((grp) => {
                const IconComponent = ICON_MAP[grp.icon] || Sparkles;
                const isSelected = selectedTarget.type === 'group' && selectedTarget.id === grp.id;
                const memberDevs = devices.filter((d) => grp.deviceIds.includes(d.id));
                const onlineMembers = memberDevs.filter(
                  (d) => connectionMap[d.id]?.status === 'connected'
                ).length;
                const isAnyOn = memberDevs.some((d) => d.lastKnownState.power);

                return (
                  <div
                    key={grp.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-zinc-800/90 border-cyan-400 shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setSelectedTarget({ type: 'group', id: grp.id });
                        onMobileClose();
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-cyan-400">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200 truncate">{grp.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {onlineMembers}/{memberDevs.length} online
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="power"
                      size="icon-sm"
                      icon={Power}
                      isActive={isAnyOn}
                      disabled={onlineMembers === 0}
                      onClick={() => toggleGroupPower(grp.id)}
                      title="Toggle group power"
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* PAIRED STRIPS SECTION */}
        <div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bluetooth className="w-3.5 h-3.5 text-cyan-400" /> Strips ({devices.length})
            </span>
            <button
              onClick={() => setSelectedTarget({ type: 'all' })}
              className={`text-[11px] font-bold transition ${
                selectedTarget.type === 'all' ? 'text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Select All
            </button>
          </div>

          <div className="space-y-2">
            {devices.length === 0 ? (
              <p className="text-xs text-zinc-500 italic px-3 py-3.5 bg-zinc-950/40 rounded-2xl border border-zinc-900 text-center">
                No strips paired yet
              </p>
            ) : (
              devices.map((dev) => {
                const isSelected = selectedTarget.type === 'device' && selectedTarget.id === dev.id;
                const isConnected = connectionMap[dev.id]?.status === 'connected';
                const isConnecting = connectionMap[dev.id]?.status === 'connecting';

                return (
                  <div
                    key={dev.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-zinc-800/90 border-cyan-400 shadow-sm'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div
                      onClick={() => {
                        setSelectedTarget({ type: 'device', id: dev.id });
                        onMobileClose();
                      }}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isConnected
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                            : isConnecting
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200 truncate">{dev.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono uppercase">
                          {dev.protocol === 'elk-bledom' ? 'ELK' : 'DMX'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="power"
                        size="icon-sm"
                        icon={Power}
                        isActive={dev.lastKnownState.power}
                        disabled={!isConnected}
                        onClick={() => toggleDevicePower(dev.id)}
                        title="Toggle power"
                      />

                      <Button
                        variant={isConnected ? 'secondary' : isConnecting ? 'danger' : 'primary'}
                        size="icon-sm"
                        icon={isConnected ? BluetoothOff : Bluetooth}
                        onClick={() =>
                          isConnected || isConnecting ? disconnectDevice(dev.id) : connectDevice(dev.id)
                        }
                        title={isConnected ? 'Disconnect' : isConnecting ? 'Cancel Connecting' : 'Connect'}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
      />
      <GroupModal
        isOpen={isAddGroupOpen}
        onClose={() => setIsAddGroupOpen(false)}
      />
      <PairedDevicesModal
        isOpen={isPairedDevicesOpen}
        onClose={() => setIsPairedDevicesOpen(false)}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Panel */}
      <aside
        className={`hidden lg:block glass-panel border-r border-zinc-800/80 transition-all duration-300 relative z-30 shrink-0 ${
          isOpen ? 'w-80' : 'w-0 overflow-hidden border-r-0'
        }`}
      >
        <div className="w-80 h-full">{content}</div>
      </aside>

      {/* Desktop Expand Toggle when collapsed */}
      {!isOpen && (
        <Button
          variant="secondary"
          size="icon-md"
          icon={ChevronRight}
          onClick={onToggle}
          className="hidden lg:flex fixed left-0 top-24 z-30 rounded-l-none rounded-r-2xl border-l-0 text-cyan-400 shadow-2xl"
          title="Expand Hardware Hub"
        />
      )}

      {/* Mobile Drawer (backdrop + sliding panel) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          <div className="relative w-80 max-w-[85vw] h-full glass-panel border-r border-white/10 shadow-2xl z-10 flex flex-col">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
