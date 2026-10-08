import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import {
  Sparkles,
  Gauge,
  Activity,
  Play,
} from 'lucide-react';

interface EffectDefinition {
  id: number;
  name: string;
  category: 'ambient' | 'party' | 'fade';
  description: string;
  previewGradient: string;
  animationClass: string;
}

const EFFECTS: EffectDefinition[] = [
  {
    id: 0x90, // 144
    name: 'Rainbow Cycle',
    category: 'fade',
    description: 'Smooth gradient rotation through full RGB spectrum',
    previewGradient: 'linear-gradient(90deg, #ff0055, #ffcc00, #00ff66, #00ffff, #0066ff, #cc00ff, #ff0055)',
    animationClass: 'animate-gradient-x',
  },
  {
    id: 0x89, // 137
    name: 'Breathing Pulse',
    category: 'ambient',
    description: 'Gentle fade in and fade out breathing rhythm',
    previewGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    animationClass: 'animate-pulse',
  },
  {
    id: 0x88, // 136
    name: '7-Color Jump',
    category: 'party',
    description: 'Sharp, vibrant color snaps across 7 primaries',
    previewGradient: 'linear-gradient(90deg, #ef4444 14%, #f97316 28%, #eab308 42%, #22c55e 56%, #06b6d4 70%, #3b82f6 84%, #a855f7 100%)',
    animationClass: 'animate-pulse',
  },
  {
    id: 0x87, // 135
    name: 'RGB Tri-Jump',
    category: 'party',
    description: 'Rhythmic switching between Red, Green, and Blue',
    previewGradient: 'linear-gradient(90deg, #ef4444 33%, #22c55e 66%, #3b82f6 100%)',
    animationClass: 'animate-pulse',
  },
  {
    id: 0x8b, // 139
    name: 'Strobe Flash',
    category: 'party',
    description: 'High frequency rapid flash sequence',
    previewGradient: 'linear-gradient(135deg, #ffffff, #64748b)',
    animationClass: 'animate-ping',
  },
  {
    id: 0x91, // 145
    name: 'Sunset Fade',
    category: 'fade',
    description: 'Calming transition across warm gold, amber, and crimson',
    previewGradient: 'linear-gradient(90deg, #f59e0b, #ea580c, #dc2626)',
    animationClass: 'animate-pulse',
  },
];

export const EffectsPanel: React.FC = () => {
  const {
    devices,
    groups,
    connectionMap,
    selectedTarget,
    setDeviceEffect,
    setGroupEffect,
  } = useDevices();

  const [activeEffectId, setActiveEffectId] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number>(80);
  const [activeCategory, setActiveCategory] = useState<'all' | 'ambient' | 'party' | 'fade'>('all');

  const activeDevices = devices.filter((d) => {
    if (selectedTarget.type === 'all') return true;
    if (selectedTarget.type === 'device') return d.id === selectedTarget.id;
    if (selectedTarget.type === 'group') {
      const grp = groups.find((g) => g.id === selectedTarget.id);
      return grp ? grp.deviceIds.includes(d.id) : false;
    }
    return false;
  });

  const connectedCount = activeDevices.filter(
    (d) => connectionMap[d.id]?.status === 'connected'
  ).length;

  const handleApplyEffect = async (effectId: number) => {
    setActiveEffectId(effectId);

    if (selectedTarget.type === 'device' && selectedTarget.id) {
      await setDeviceEffect(selectedTarget.id, effectId, speed);
    } else if (selectedTarget.type === 'group' && selectedTarget.id) {
      await setGroupEffect(selectedTarget.id, effectId, speed);
    } else if (selectedTarget.type === 'all') {
      for (const d of activeDevices) {
        if (connectionMap[d.id]?.status === 'connected') {
          setDeviceEffect(d.id, effectId, speed);
        }
      }
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = Number(e.target.value);
    setSpeed(newSpeed);

    if (activeEffectId !== null) {
      if (selectedTarget.type === 'device' && selectedTarget.id) {
        setDeviceEffect(selectedTarget.id, activeEffectId, newSpeed);
      } else if (selectedTarget.type === 'group' && selectedTarget.id) {
        setGroupEffect(selectedTarget.id, activeEffectId, newSpeed);
      } else if (selectedTarget.type === 'all') {
        for (const d of activeDevices) {
          if (connectionMap[d.id]?.status === 'connected') {
            setDeviceEffect(d.id, activeEffectId, newSpeed);
          }
        }
      }
    }
  };

  const filteredEffects = EFFECTS.filter((eff) =>
    activeCategory === 'all' ? true : eff.category === activeCategory
  );

  const selectedEffect = EFFECTS.find((e) => e.id === activeEffectId);

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Dynamic Patterns & Effects</h3>
            <p className="text-xs text-zinc-400">
              Built-in micro-controller lighting sequences
            </p>
          </div>
        </div>

        {/* Filter categories */}
        <div className="flex items-center gap-1 bg-zinc-950/90 p-1.5 rounded-2xl border border-zinc-800 self-start sm:self-auto shadow-inner">
          {(['all', 'ambient', 'fade', 'party'] as const).map((cat) => (
            <Button
              key={cat}
              variant="tab"
              size="xs"
              isActive={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className="capitalize"
            >
              <span>{cat}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Live Animated Pattern Display */}
      {selectedEffect ? (
        <div
          className="h-24 rounded-2xl border border-white/10 relative overflow-hidden flex items-center justify-between px-6 shadow-2xl transition-all duration-500"
          style={{ background: selectedEffect.previewGradient }}
        >
          <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-zinc-100 shadow-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 animate-spin" />
              <span className="font-bold text-sm tracking-wide">{selectedEffect.name}</span>
            </div>
            <p className="text-[11px] text-zinc-300 mt-0.5">{selectedEffect.description}</p>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs font-mono font-bold text-cyan-300">
            <Gauge className="w-3.5 h-3.5" />
            <span>Speed: {speed}%</span>
          </div>
        </div>
      ) : (
        <div className="h-20 rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/60 flex items-center justify-center text-xs text-zinc-500 gap-2">
          <Play className="w-4 h-4 text-zinc-600" />
          <span>Select any lighting pattern below to activate</span>
        </div>
      )}

      {/* Speed Slider */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-2.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-zinc-300 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-cyan-400" /> Animation Velocity / Speed
          </span>
          <span className="font-mono text-cyan-400 font-bold">{speed}%</span>
        </div>
        <input
          type="range"
          min="1"
          max="100"
          value={speed}
          onChange={handleSpeedChange}
          disabled={connectedCount === 0}
          className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-full cursor-pointer disabled:opacity-40"
        />
        <div className="flex justify-between text-[11px] text-zinc-500 font-mono">
          <span>Smooth & Slow</span>
          <span>Balanced</span>
          <span>Fast / Dynamic</span>
        </div>
      </div>

      {/* Effects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredEffects.map((eff) => {
          const isActive = activeEffectId === eff.id;

          return (
            <button
              key={eff.id}
              onClick={() => handleApplyEffect(eff.id)}
              disabled={connectedCount === 0}
              className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group flex flex-col justify-between gap-3 ${
                isActive
                  ? 'bg-zinc-800/90 border-cyan-400 shadow-lg shadow-cyan-950/60 scale-[1.02]'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {/* Pattern Color Strip Bar */}
              <div
                className="h-2 w-full rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                style={{ background: eff.previewGradient }}
              />

              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-zinc-200 group-hover:text-zinc-100">
                    {eff.name}
                  </h4>
                  {isActive && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                  {eff.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

