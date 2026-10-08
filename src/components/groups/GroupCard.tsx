import React, { useState } from 'react';
import type { DeviceGroup } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import {
  Monitor,
  Bed,
  Tv,
  Armchair,
  Sparkles,
  Sun,
  Power,
  Sliders,
  Settings2,
  Trash2,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface GroupCardProps {
  group: DeviceGroup;
  onEdit: (group: DeviceGroup) => void;
}

const ICON_MAP = {
  monitor: Monitor,
  bed: Bed,
  tv: Tv,
  sofa: Armchair,
  sparkles: Sparkles,
  sun: Sun,
};

export const GroupCard: React.FC<GroupCardProps> = ({ group, onEdit }) => {
  const {
    devices,
    connectionMap,
    toggleGroupPower,
    setGroupBrightness,
    deleteGroup,
  } = useDevices();

  const IconComponent = ICON_MAP[group.icon] || Sparkles;

  // Filter devices belonging to this group
  const memberDevices = devices.filter((d) => group.deviceIds.includes(d.id));
  const connectedCount = memberDevices.filter(
    (d) => connectionMap[d.id]?.status === 'connected'
  ).length;

  const isAnyOn = memberDevices.some((d) => d.lastKnownState.power);

  // Compute average brightness
  const avgBrightness =
    memberDevices.length > 0
      ? Math.round(
          memberDevices.reduce((acc, d) => acc + d.lastKnownState.brightness, 0) /
            memberDevices.length
        )
      : 100;

  const handleTogglePower = () => {
    toggleGroupPower(group.id);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setGroupBrightness(group.id, val);
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-6 shadow-xl flex flex-col justify-between gap-5 relative overflow-hidden group">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-700/60 text-cyan-300 shadow-md">
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">{group.name}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {memberDevices.length} {memberDevices.length === 1 ? 'strip' : 'strips'}{' '}
              <span className="text-zinc-500">•</span>{' '}
              <span className={connectedCount > 0 ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}>
                {connectedCount} online
              </span>
            </p>
          </div>
        </div>

        {/* Master Group Power Toggle */}
        <Button
          variant="power"
          size="sm"
          icon={Power}
          isActive={isAnyOn}
          onClick={handleTogglePower}
          disabled={connectedCount === 0}
          title={isAnyOn ? 'Turn group off' : 'Turn group on'}
        >
          <span>{isAnyOn ? 'ON' : 'OFF'}</span>
        </Button>
      </div>

      {/* Member Strips Tags */}
      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center relative z-10">
        {memberDevices.length === 0 ? (
          <span className="text-xs text-zinc-500 italic">No strips assigned yet</span>
        ) : (
          memberDevices.map((dev) => (
            <span
              key={dev.id}
              className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl bg-zinc-950/80 border border-zinc-800 text-zinc-300 shadow-sm"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  connectionMap[dev.id]?.status === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                    : 'bg-zinc-600'
                }`}
              />
              <span className="truncate max-w-[110px] font-semibold">{dev.name}</span>
              <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                {dev.protocol === 'elk-bledom' ? 'ELK' : 'DMX'}
              </span>
            </span>
          ))
        )}
      </div>

      {/* Master Brightness Slider */}
      <div className="bg-zinc-950/70 border border-zinc-800/90 rounded-2xl p-4 space-y-2.5 relative z-10">
        <div className="flex justify-between items-center text-xs text-zinc-400">
          <span className="flex items-center gap-1.5 font-bold">
            <Sliders className="w-3.5 h-3.5 text-zinc-500" /> Group Brightness
          </span>
          <span className="font-mono text-zinc-200 font-bold">{avgBrightness}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={avgBrightness}
          onChange={handleBrightnessChange}
          disabled={connectedCount === 0}
          className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-full cursor-pointer disabled:opacity-40"
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 relative z-10">
        <Button
          variant="secondary"
          size="sm"
          icon={Settings2}
          onClick={() => onEdit(group)}
        >
          <span>Manage Members</span>
        </Button>

        <Button
          variant="danger"
          size="icon-sm"
          icon={Trash2}
          onClick={() => setIsDeleteModalOpen(true)}
          title="Delete group"
        />
      </div>
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Group"
        message={`Are you sure you want to delete the group "${group.name}"?`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          deleteGroup(group.id);
          setIsDeleteModalOpen(false);
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
