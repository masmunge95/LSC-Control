import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';
import type { RGBColor } from '../../types/device';
import { EffectsPanel } from '../effects/EffectsPanel';
import { Button } from '../common/Button';
import {
  Sun,
  Power,
  Layers,
  Palette,
  Sparkles,
  Sliders,
  Check,
  Flame,
  Zap,
} from 'lucide-react';

const PRESET_COLORS: Array<{ name: string; rgb: RGBColor; hex: string; category: 'white' | 'color' }> = [
  // Whites & Ambient
  { name: 'Warm Cozy (2700K)', rgb: { r: 255, g: 180, b: 107 }, hex: '#ffb46b', category: 'white' },
  { name: 'Natural White (4000K)', rgb: { r: 255, g: 228, b: 205 }, hex: '#ffe4cd', category: 'white' },
  { name: 'Daylight Cool (6500K)', rgb: { r: 208, g: 232, b: 255 }, hex: '#d0e8ff', category: 'white' },
  { name: 'Sunset Glow', rgb: { r: 255, g: 110, b: 20 }, hex: '#ff6e14', category: 'color' },
  // Vibrant RGB
  { name: 'Cyber Red', rgb: { r: 255, g: 10, b: 50 }, hex: '#ff0a32', category: 'color' },
  { name: 'Matrix Green', rgb: { r: 10, g: 255, b: 90 }, hex: '#0aff5a', category: 'color' },
  { name: 'Neon Cyan', rgb: { r: 0, g: 235, b: 255 }, hex: '#00ebff', category: 'color' },
  { name: 'Deep Indigo', rgb: { r: 40, g: 70, b: 255 }, hex: '#2846ff', category: 'color' },
  { name: 'Ultraviolet', rgb: { r: 130, g: 0, b: 255 }, hex: '#8200ff', category: 'color' },
  { name: 'Vaporwave Pink', rgb: { r: 255, g: 20, b: 160 }, hex: '#ff14a0', category: 'color' },
];

interface ControlDeckProps {
  initialSubTab?: 'colors' | 'effects';
}

export const ControlDeck: React.FC<ControlDeckProps> = ({ initialSubTab = 'colors' }) => {
  const {
    devices,
    groups,
    connectionMap,
    selectedTarget,
    setSelectedTarget,
    toggleDevicePower,
    toggleGroupPower,
    setDeviceColor,
    setGroupColor,
    setDeviceBrightness,
    setGroupBrightness,
  } = useDevices();

  const [activeSubTab, setActiveSubTab] = useState<'colors' | 'effects'>(initialSubTab);
  const [currentColor, setCurrentColor] = useState<RGBColor>({ r: 0, g: 235, b: 255 });
  const [brightness, setBrightness] = useState<number>(100);
  const [hue, setHue] = useState<number>(185);
  const [colorMode, setColorMode] = useState<'slider' | 'wheel'>('slider');
  const [hexInput, setHexInput] = useState<string>('00EBFF');
  const wheelRef = React.useRef<HTMLDivElement>(null);

  // Active devices in current target
  const activeDevices = devices.filter((d) => {
    if (selectedTarget.type === 'all') return true;
    if (selectedTarget.type === 'device') return d.id === selectedTarget.id;
    if (selectedTarget.type === 'group') {
      const grp = groups.find((g) => g.id === selectedTarget.id);
      return grp ? grp.deviceIds.includes(d.id) : false;
    }
    return false;
  });

  const connectedActiveCount = activeDevices.filter(
    (d) => connectionMap[d.id]?.status === 'connected'
  ).length;

  const isAnyPowerOn = activeDevices.some((d) => d.lastKnownState.power);

  // Helpers
  const rgbToHex = (c: RGBColor) => {
    const toH = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toH(c.r)}${toH(c.g)}${toH(c.b)}`;
  };

  const hexToRgb = (hex: string): RGBColor => {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  };

  const hueToRgb = (h: number): RGBColor => {
    const s = 1.0;
    const v = 1.0;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = 0;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  // Color application
  const applyColor = async (color: RGBColor) => {
    setCurrentColor(color);
    setHexInput(rgbToHex(color).replace('#', '').toUpperCase());

    if (selectedTarget.type === 'device' && selectedTarget.id) {
      await setDeviceColor(selectedTarget.id, color);
    } else if (selectedTarget.type === 'group' && selectedTarget.id) {
      await setGroupColor(selectedTarget.id, color);
    } else if (selectedTarget.type === 'all') {
      for (const d of activeDevices) {
        if (connectionMap[d.id]?.status === 'connected') {
          setDeviceColor(d.id, color);
        }
      }
    }
  };

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace('#', '').trim();
    setHexInput(clean);
    if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      const rgb = hexToRgb('#' + clean);
      applyColor(rgb);
    }
  };

  const updateColorFromWheel = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    const newHue = Math.round(angle);
    setHue(newHue);
    applyColor(hueToRgb(newHue));
  };

  const handleWheelPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    updateColorFromWheel(e.clientX, e.clientY);
  };

  const handleWheelPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons > 0) {
      updateColorFromWheel(e.clientX, e.clientY);
    }
  };

  const handleHueSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHue = Number(e.target.value);
    setHue(newHue);
    const rgb = hueToRgb(newHue);
    applyColor(rgb);
  };

  // Brightness application
  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setBrightness(val);

    if (selectedTarget.type === 'device' && selectedTarget.id) {
      setDeviceBrightness(selectedTarget.id, val);
    } else if (selectedTarget.type === 'group' && selectedTarget.id) {
      setGroupBrightness(selectedTarget.id, val);
    } else if (selectedTarget.type === 'all') {
      for (const d of activeDevices) {
        if (connectionMap[d.id]?.status === 'connected') {
          setDeviceBrightness(d.id, val);
        }
      }
    }
  };

  // Power application
  const handleTogglePower = () => {
    if (selectedTarget.type === 'device' && selectedTarget.id) {
      toggleDevicePower(selectedTarget.id);
    } else if (selectedTarget.type === 'group' && selectedTarget.id) {
      toggleGroupPower(selectedTarget.id);
    } else if (selectedTarget.type === 'all') {
      for (const d of activeDevices) {
        toggleDevicePower(d.id);
      }
    }
  };

  const currentHex = rgbToHex(currentColor);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Target Destination & Mode Switcher Bar */}
      <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Ambient glow from active color */}
        <div
          className="absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{ backgroundColor: currentHex }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-sm">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Target Destination
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                {connectedActiveCount} of {activeDevices.length} Connected
              </span>
            </div>
          </div>

          {/* Sub-tab switcher: Color Settings vs Dynamic Patterns */}
          <div className="flex items-center bg-zinc-950/90 p-1.5 rounded-2xl border border-zinc-800 self-start sm:self-auto shadow-inner gap-1">
            <Button
              variant="tab"
              size="sm"
              icon={Palette}
              isActive={activeSubTab === 'colors'}
              onClick={() => setActiveSubTab('colors')}
            >
              <span>Color Settings</span>
            </Button>
            <Button
              variant="tab"
              size="sm"
              icon={Sparkles}
              isActive={activeSubTab === 'effects'}
              onClick={() => setActiveSubTab('effects')}
            >
              <span>Patterns & Effects</span>
            </Button>
          </div>
        </div>

        {/* Scrollable Target Selectors */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none relative z-10">
          <Button
            variant={selectedTarget.type === 'all' ? 'primary' : 'secondary'}
            size="sm"
            icon={Zap}
            onClick={() => setSelectedTarget({ type: 'all' })}
            className="whitespace-nowrap shrink-0"
          >
            <span>All Strips ({devices.length})</span>
          </Button>

          {groups.map((grp) => (
            <Button
              key={grp.id}
              variant={
                selectedTarget.type === 'group' && selectedTarget.id === grp.id
                  ? 'primary'
                  : 'secondary'
              }
              size="sm"
              icon={Layers}
              onClick={() => setSelectedTarget({ type: 'group', id: grp.id })}
              className="whitespace-nowrap shrink-0"
            >
              <span>Group: {grp.name}</span>
            </Button>
          ))}

          {devices.map((dev) => (
            <Button
              key={dev.id}
              variant={
                selectedTarget.type === 'device' && selectedTarget.id === dev.id
                  ? 'primary'
                  : 'secondary'
              }
              size="sm"
              onClick={() => setSelectedTarget({ type: 'device', id: dev.id })}
              className="whitespace-nowrap shrink-0"
            >
              <span
                className={`w-2 h-2 rounded-full -ml-0.5 mr-1 ${
                  connectionMap[dev.id]?.status === 'connected' ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />
              <span>{dev.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* DASHBOARD BODY CONTENT */}
      {activeSubTab === 'colors' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Visual Color Control & Palette (8 cols) */}
          <div className="lg:col-span-8 glass-panel rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-purple-950/70 text-purple-400 border border-purple-800/60 shadow-sm">
                  <Palette className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Color Spectrum Studio</h3>
                  <p className="text-xs text-zinc-400">Direct 24-bit RGB transmission</p>
                </div>
              </div>

              {/* Direct Hex Code Input & Native Picker */}
              <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-1.5 transition shadow-sm focus-within:border-cyan-500">
                <span className="text-xs font-mono font-bold text-zinc-500">#</span>
                <input
                  type="text"
                  maxLength={6}
                  value={hexInput}
                  onChange={handleHexInputChange}
                  placeholder="6400FF"
                  className="w-20 bg-transparent text-xs font-mono font-bold text-zinc-200 uppercase focus:outline-none"
                  title="Type any 6-digit hex code"
                />
                <input
                  id="custom-color"
                  type="color"
                  value={currentHex}
                  onChange={(e) => applyColor(hexToRgb(e.target.value))}
                  className="w-6 h-6 rounded border-0 bg-transparent cursor-pointer"
                  title="Open palette"
                />
              </div>
            </div>

            {/* Interactive Glow Preview Lamp */}
            <div
              className="h-28 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col items-center justify-center transition-all duration-500 shadow-2xl"
              style={{
                backgroundColor: currentHex,
                boxShadow: `0 0 50px ${currentHex}44, inset 0 0 40px rgba(0,0,0,0.3)`,
              }}
            >
              <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 flex items-center gap-3 shadow-lg">
                <span className="text-xs font-mono font-bold text-white tracking-wider">
                  {currentHex.toUpperCase()}
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  R:{currentColor.r} G:{currentColor.g} B:{currentColor.b}
                </span>
              </div>
            </div>

            {/* Color Mode Switcher & Picker (Slider vs Wheel) */}
            <div className="space-y-4 bg-zinc-900/90 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 shadow-inner">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" /> Spectrum Controls
                </span>

                <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 gap-1">
                  <button
                    type="button"
                    onClick={() => setColorMode('slider')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      colorMode === 'slider'
                        ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => setColorMode('wheel')}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                      colorMode === 'wheel'
                        ? 'bg-zinc-800 text-cyan-400 border border-zinc-700'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Color Wheel
                  </button>
                </div>
              </div>

              {colorMode === 'slider' ? (
                /* Continuous Slider */
                <div className="space-y-2 pt-1">
                  <div className="flex justify-end text-[11px] font-mono text-zinc-400 font-bold">
                    <span>{hue}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={hue}
                    onChange={handleHueSliderChange}
                    disabled={connectedActiveCount === 0}
                    className="w-full h-3 rounded-full cursor-pointer appearance-none transition-opacity disabled:opacity-40"
                    style={{
                      background:
                        'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                    }}
                  />
                </div>
              ) : (
                /* Interactive Color Wheel */
                <div className="py-2 flex flex-col items-center">
                  <div
                    ref={wheelRef}
                    onPointerDown={handleWheelPointerDown}
                    onPointerMove={handleWheelPointerMove}
                    className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full cursor-crosshair shadow-2xl border-4 border-zinc-800 touch-none select-none"
                    style={{
                      background:
                        'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
                    }}
                  >
                    {/* Radial shading */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.3) 100%)',
                      }}
                    />

                    {/* Center Core */}
                    <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700 shadow pointer-events-none" />

                    {/* Wheel Pointer Ring Indicator */}
                    {(() => {
                      const rad = ((hue - 90) * Math.PI) / 180;
                      const thumbX = 50 + 40 * Math.cos(rad);
                      const thumbY = 50 + 40 * Math.sin(rad);
                      return (
                        <div
                          className="absolute w-6 h-6 rounded-full border-2 border-white shadow-xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
                          style={{
                            left: `${thumbX}%`,
                            top: `${thumbY}%`,
                            backgroundColor: currentHex,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500 mt-2">
                    Drag or tap on the wheel to adjust hue ({hue}°)
                  </span>
                </div>
              )}
            </div>

            {/* Curated Swatch Palette */}
            <div>
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3.5">
                Lighting Presets
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PRESET_COLORS.map((preset) => {
                  const isSelected =
                    currentColor.r === preset.rgb.r &&
                    currentColor.g === preset.rgb.g &&
                    currentColor.b === preset.rgb.b;

                  return (
                    <button
                      key={preset.name}
                      onClick={() => applyColor(preset.rgb)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left ${
                        isSelected
                          ? 'bg-zinc-800/90 border-cyan-400 shadow-lg shadow-cyan-950/60 scale-[1.02]'
                          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/40'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-lg shrink-0 border border-white/20 flex items-center justify-center shadow-md transition-transform group-hover:scale-110"
                        style={{
                          backgroundColor: preset.hex,
                          boxShadow: `0 0 10px ${preset.hex}55`,
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                      </span>
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Master Power, Dimming, Quick Adjustment (4 cols) */}
          <div className="lg:col-span-4 glass-panel rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col justify-between gap-6">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-cyan-950/70 text-cyan-400 border border-cyan-800/60 shadow-sm">
                  <Sliders className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Live Adjustment</h3>
                  <p className="text-xs text-zinc-400">Power & Intensity</p>
                </div>
              </div>

              {/* Master Power Button Card */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-sm font-bold text-zinc-200">Power Circuit</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {isAnyPowerOn ? 'Circuit energized' : 'Circuit standby'}
                  </p>
                </div>

                <Button
                  variant="power"
                  size="md"
                  icon={Power}
                  isActive={isAnyPowerOn}
                  disabled={connectedActiveCount === 0}
                  onClick={handleTogglePower}
                >
                  <span>{isAnyPowerOn ? 'ON' : 'OFF'}</span>
                </Button>
              </div>

              {/* Master Dimming Slider */}
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <Sun className="w-4 h-4 text-amber-400" /> Master Brightness
                  </span>
                  <span className="font-mono text-sm font-bold text-cyan-400">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={brightness}
                  onChange={handleBrightnessChange}
                  disabled={connectedActiveCount === 0}
                  className="w-full accent-cyan-400 h-2 bg-zinc-800 rounded-full cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono font-medium">
                  <span>0% (Night)</span>
                  <span>50%</span>
                  <span>100% (Full)</span>
                </div>
              </div>
            </div>

            {/* Hardware Unison Badge */}
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-200/90 flex items-start gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
              <p className="leading-relaxed">
                Real-time synchronization active. Packets are automatically translated into 9-byte frames for ELK-BLEDOM and DMX characteristics for LEDDMX in parallel.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* DYNAMIC PATTERNS & EFFECTS VIEW */
        <EffectsPanel />
      )}
    </div>
  );
};
