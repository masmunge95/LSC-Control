import React, { useState } from 'react';
import type { DeviceGroup, DeviceSchedule } from '../../types/device';
import { useDevices } from '../../context/DeviceContext';
import { GroupCard } from './GroupCard';
import { GroupModal } from './GroupModal';
import { ScheduleModal } from './ScheduleModal';
import { Button } from '../common/Button';
import { Plus, Layers, Clock, Trash2, Edit2 } from 'lucide-react';

const DAYS_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const GroupList: React.FC = () => {
  const { groups, devices, schedules, saveSchedule, deleteSchedule } = useDevices();
  const [activeSubTab, setActiveSubTab] = useState<'groups' | 'schedules'>('groups');
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DeviceGroup | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<DeviceSchedule | null>(null);

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (sched: DeviceSchedule) => {
    setEditingSchedule(sched);
    setIsScheduleModalOpen(true);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleEditGroup = (group: DeviceGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab Switcher: Groups vs Schedules */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
        <button
          onClick={() => setActiveSubTab('groups')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'groups'
              ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Synchronized Groups ({groups.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('schedules')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'schedules'
              ? 'bg-zinc-800 text-cyan-400 border border-zinc-700 shadow-md'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Power Schedules ({schedules.length})</span>
        </button>
      </div>

      {/* --- GROUPS VIEW --- */}
      {activeSubTab === 'groups' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-100 flex items-center gap-2.5">
                <span>Synchronized Groups</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Send commands in unison across multiple ELK and DMX strips simultaneously
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleCreateGroup}
              disabled={devices.length === 0}
              title={devices.length === 0 ? 'Pair devices first before creating groups' : 'Create Group'}
            >
              <span>Create Group</span>
            </Button>
          </div>

          {groups.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/20">
                <Layers className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-200">No synchronized groups yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5 mb-6 leading-relaxed">
                Group your ELK-BLEDOM and LEDDMX light strips together to control their power, brightness, and colors in unison.
              </p>
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={handleCreateGroup}
                disabled={devices.length === 0}
              >
                <span>Create First Group</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} onEdit={handleEditGroup} />
              ))}
            </div>
          )}
        </>
      )}

      {/* --- SCHEDULES VIEW --- */}
      {activeSubTab === 'schedules' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h2 className="text-xl font-extrabold text-zinc-100 flex items-center gap-2.5">
                <span>Automated Power Schedules</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Offline on/off timers triggered automatically based on time of day
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={handleCreateSchedule}
              disabled={devices.length === 0}
            >
              <span>New Schedule</span>
            </Button>
          </div>

          {schedules.length === 0 ? (
            <div className="text-center py-20 px-6 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/30 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-950/20">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-zinc-200">No power schedules yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1.5 mb-6 leading-relaxed">
                Set recurring wake-up or bedtime schedules to automatically turn your strips on or off.
              </p>
              <Button
                variant="primary"
                size="lg"
                icon={Plus}
                onClick={handleCreateSchedule}
                disabled={devices.length === 0}
              >
                <span>Create First Schedule</span>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedules.map((sched) => {
                const targetLabel =
                  sched.targetType === 'all'
                    ? 'All Strips'
                    : sched.targetType === 'group'
                    ? groups.find((g) => g.id === sched.targetId)?.name || 'Group'
                    : devices.find((d) => d.id === sched.targetId)?.name || 'Strip';

                return (
                  <div
                    key={sched.id}
                    className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl font-mono font-extrabold text-zinc-100">
                          {sched.time}
                        </span>
                        <span
                          className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                            sched.action === 'power_on'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {sched.action === 'power_on' ? 'TURN ON' : 'TURN OFF'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-zinc-200">{sched.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">Target: <span className="text-zinc-300 font-semibold">{targetLabel}</span></p>

                      {/* Day pills */}
                      <div className="flex gap-1 mt-3">
                        {DAYS_SHORT.map((label, idx) => {
                          const isDayActive = sched.days.includes(idx);
                          return (
                            <span
                              key={idx}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold font-mono ${
                                isDayActive
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : 'bg-zinc-800/40 text-zinc-600'
                              }`}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800/80">
                      {/* Enable/Disable switch */}
                      <button
                        onClick={() => saveSchedule({ ...sched, enabled: !sched.enabled })}
                        className={`text-xs font-semibold px-3 py-1 rounded-lg transition ${
                          sched.enabled
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/80'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}
                      >
                        {sched.enabled ? 'Active' : 'Paused'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="icon-sm"
                          icon={Edit2}
                          onClick={() => handleEditSchedule(sched)}
                          title="Edit schedule"
                        />
                        <Button
                          variant="danger"
                          size="icon-sm"
                          icon={Trash2}
                          onClick={() => deleteSchedule(sched.id)}
                          title="Delete schedule"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        groupToEdit={editingGroup}
      />
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        scheduleToEdit={editingSchedule}
      />
    </div>
  );
};