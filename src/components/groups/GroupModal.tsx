import React, { useState, useEffect } from 'react';
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
  X,
  Check,
  Layers,
} from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupToEdit?: DeviceGroup | null;
}

const ICONS: Array<{ id: DeviceGroup['icon']; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'sparkles', label: 'Magic', icon: Sparkles },
  { id: 'monitor', label: 'Desk', icon: Monitor },
  { id: 'bed', label: 'Bedroom', icon: Bed },
  { id: 'tv', label: 'Media', icon: Tv },
  { id: 'sofa', label: 'Living', icon: Armchair },
  { id: 'sun', label: 'Ambient', icon: Sun },
];

export const GroupModal: React.FC<GroupModalProps> = ({ isOpen, onClose, groupToEdit }) => {
  const { devices, createGroup, updateGroup } = useDevices();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<DeviceGroup['icon']>('sparkles');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);

  useEffect(() => {
    if (groupToEdit) {
      setName(groupToEdit.name);
      setSelectedIcon(groupToEdit.icon);
      setSelectedDeviceIds([...groupToEdit.deviceIds]);
    } else {
      setName('');
      setSelectedIcon('sparkles');
      setSelectedDeviceIds([]);
    }
  }, [groupToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (groupToEdit) {
      await updateGroup({
        ...groupToEdit,
        name: name.trim(),
        icon: selectedIcon,
        deviceIds: selectedDeviceIds,
      });
    } else {
      await createGroup(name.trim(), selectedDeviceIds, selectedIcon);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-zinc-100 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100 z-20"
        />

        <div className="flex items-center gap-3.5 mb-6 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-800/80 rounded-2xl text-cyan-300 shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {groupToEdit ? 'Edit Light Group' : 'Create New Group'}
            </h2>
            <p className="text-xs text-zinc-400">
              Synchronize multiple ELK-BLEDOM and LEDDMX strips in unison
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden space-y-5 relative z-10">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">
              Group Name
            </label>
            <input
              type="text"
              placeholder="e.g. Living Room, Studio Desk"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
              autoFocus
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">
              Group Icon
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((item) => {
                const IconComp = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)] scale-105'
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                    title={item.label}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member Strips Checklist */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Select Member Strips ({selectedDeviceIds.length} selected)
              </label>
              {devices.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedDeviceIds.length === devices.length) {
                      setSelectedDeviceIds([]);
                    } else {
                      setSelectedDeviceIds(devices.map((d) => d.id));
                    }
                  }}
                  className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition"
                >
                  {selectedDeviceIds.length === devices.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 border border-zinc-800 rounded-2xl p-3 bg-zinc-950/80 max-h-48 scrollbar-thin">
              {devices.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">
                  No devices paired yet. Pair devices first to add them to groups.
                </p>
              ) : (
                devices.map((dev) => {
                  const isChecked = selectedDeviceIds.includes(dev.id);
                  return (
                    <div
                      key={dev.id}
                      onClick={() => toggleDeviceSelection(dev.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                        isChecked
                          ? 'bg-zinc-900 border-cyan-400/80 text-zinc-100 shadow-sm'
                          : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-md border flex items-center justify-center transition ${
                            isChecked
                              ? 'bg-cyan-500 border-cyan-500 text-zinc-950'
                              : 'border-zinc-700 bg-zinc-950'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-zinc-200">{dev.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{dev.originalName}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                          dev.protocol === 'elk-bledom'
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                        }`}
                      >
                        {dev.protocol === 'elk-bledom' ? 'ELK' : 'DMX'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
            >
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!name.trim()}
            >
              <span>{groupToEdit ? 'Save Changes' : 'Create Group'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
