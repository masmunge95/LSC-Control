import React, { useState, useEffect } from 'react';
import type { DeviceSchedule } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import { Clock, X, Check } from 'lucide-react';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleToEdit?: DeviceSchedule | null;
}

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ isOpen, onClose, scheduleToEdit }) => {
  const { devices, groups, saveSchedule } = useDevices();
  const [name, setName] = useState('');
  const [time, setTime] = useState('07:30');
  const [action, setAction] = useState<'power_on' | 'power_off'>('power_on');
  const [targetType, setTargetType] = useState<'all' | 'group' | 'device'>('all');
  const [targetId, setTargetId] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  useEffect(() => {
    if (scheduleToEdit) {
      setName(scheduleToEdit.name);
      setTime(scheduleToEdit.time);
      setAction(scheduleToEdit.action);
      setTargetType(scheduleToEdit.targetType);
      setTargetId(scheduleToEdit.targetId || '');
      setSelectedDays([...scheduleToEdit.days]);
    } else {
      setName('');
      setTime('07:30');
      setAction('power_on');
      setTargetType('all');
      setTargetId('');
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
    }
  }, [scheduleToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const scheduleToSave: DeviceSchedule = {
      id: scheduleToEdit ? scheduleToEdit.id : `sched_${Date.now()}`,
      name: name.trim(),
      time,
      action,
      targetType,
      targetId: targetType === 'all' ? undefined : targetId,
      days: selectedDays.sort((a, b) => a - b),
      enabled: scheduleToEdit ? scheduleToEdit.enabled : true,
    };

    await saveSchedule(scheduleToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-zinc-100 max-h-[90vh] flex flex-col overflow-y-auto">
        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100"
        />

        <div className="flex items-center gap-3.5 mb-6">
          <div className="p-3 bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-800/80 rounded-2xl text-cyan-300">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">
              {scheduleToEdit ? 'Edit Power Schedule' : 'New Power Schedule'}
            </h2>
            <p className="text-xs text-zinc-400">Automate power on/off times for strips and groups</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Schedule Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Schedule Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning Sunrise, Bedtime Off"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500 text-zinc-100"
              required
            />
          </div>

          {/* Time Picker & Action */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Action
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAction('power_on')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    action === 'power_on'
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Turn ON
                </button>
                <button
                  type="button"
                  onClick={() => setAction('power_off')}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    action === 'power_off'
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Turn OFF
                </button>
              </div>
            </div>
          </div>

          {/* Target Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Apply To
            </label>
            <div className="flex gap-2 mb-2">
              {(['all', 'group', 'device'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTargetType(t);
                    if (t === 'group' && groups.length > 0) setTargetId(groups[0].id);
                    if (t === 'device' && devices.length > 0) setTargetId(devices[0].id);
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg capitalize transition ${
                    targetType === t
                      ? 'bg-zinc-800 text-cyan-400 border border-cyan-500/30'
                      : 'bg-zinc-900/60 text-zinc-400 border border-zinc-800'
                  }`}
                >
                  {t === 'all' ? 'All Strips' : t === 'group' ? 'A Group' : 'Single Strip'}
                </button>
              ))}
            </div>

            {targetType === 'group' && (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}

            {targetType === 'device' && (
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-200"
              >
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Days Repeat */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Repeat Days
              </label>
              <button
                type="button"
                onClick={() => setSelectedDays([0, 1, 2, 3, 4, 5, 6])}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                All Days
              </button>
            </div>
            <div className="flex justify-between gap-1">
              {DAYS_OF_WEEK.map((day) => {
                const active = selectedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                      active
                        ? 'bg-cyan-500 text-zinc-950 shadow-md shadow-cyan-950/50'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={Check}
            disabled={!name.trim() || selectedDays.length === 0}
            className="w-full mt-4"
          >
            {scheduleToEdit ? 'Save Changes' : 'Save Schedule'}
          </Button>
        </form>
      </div>
    </div>
  );
};