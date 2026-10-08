import React, { useState, useEffect } from 'react';
import { useDevices } from '../../context/DeviceContext';
import { Button } from '../common/Button';
import {
  Settings,
  BookOpen,
  X,
  Trash2,
  ChevronDown,
  Palette,
} from 'lucide-react';
import { ConfirmModal } from '../common/ConfirmModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTutorial: () => void;
  currentTheme?: 'zinc' | 'cyber' | 'oled';
  onThemeChange?: (theme: 'zinc' | 'cyber' | 'oled') => void;
}

const FAQS = [
  {
    q: 'Why does my LEDDMX strip show different colors than my ELK-BLEDOM strip?',
    a: 'Hardware manufacturers trace diode pins differently! LEDDMX hardware typically uses GRB sequence, while ELK uses RGB. On the strip card in the "Strips" tab, tap "GRB" to calibrate colors instantly.',
  },
  {
    q: 'Why does Android require Location permission to scan for LED strips?',
    a: 'Google Android OS requires Location / Nearby Devices permissions for all Bluetooth Low Energy (BLE) scanning to prevent unauthorized beacon fingerprinting. LSC Studio never tracks or uses your location.',
  },
  {
    q: 'Why is a strip not being detected or responding?',
    a: 'Bluetooth strips can only connect to one app at a time. Ensure competing apps (such as Lotus Lantern, Magic Lantern, or DuoCo Strip) are closed completely in Android multitasking. If still unresponsive, briefly unplug power to the strip.',
  },
  {
    q: 'Do I need an internet connection or an online account?',
    a: 'Never! LSC Studio is 100% offline-first. All pairings, groups, and schedules are stored securely on your device using IndexedDB with zero cloud telemetry.',
  },
  {
    q: 'How do Automated Schedules work?',
    a: 'Schedules run locally within the application and trigger power commands at designated hours and days. Strips must be within Bluetooth range of your device to receive scheduled commands.',
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenTutorial,
  currentTheme = 'zinc',
  onThemeChange,
}) => {
  const { devices, unpairAllDevices } = useDevices();
  const [activeTab, setActiveTab] = useState<'general' | 'faq' | 'about'>('general');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [themeMode, setThemeMode] = useState<'zinc' | 'cyber' | 'oled'>(currentTheme);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    setThemeMode(currentTheme);
  }, [currentTheme]);

  if (!isOpen) return null;

  const handleThemeChange = (mode: 'zinc' | 'cyber' | 'oled') => {
    setThemeMode(mode);
    localStorage.setItem('lsc_theme', mode);
    if (onThemeChange) {
      onThemeChange(mode);
    }
  };

const executeReset = async () => {
    await unpairAllDevices();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-zinc-100 max-h-[90vh] flex flex-col overflow-hidden">
        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100"
        />

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-3 bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-800/80 rounded-2xl text-cyan-300">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Settings & Diagnostics</h2>
            <p className="text-xs text-zinc-400">Application preferences, FAQ, and hardware help</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 rounded-2xl border border-zinc-800 mb-5">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'general' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Preferences
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'faq' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            FAQ & Help
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition ${
              activeTab === 'about' ? 'bg-zinc-800 text-cyan-400 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            About
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Tutorial Launcher */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" /> Interactive Tutorial
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Relaunch the guided walkthrough for pairing and calibration
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenTutorial();
                  }}
                >
                  <span>Launch</span>
                </Button>
              </div>

              {/* Theme Selector */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2.5">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-purple-400" /> Interface Appearance
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'zinc', label: 'Dark Zinc' },
                    { id: 'cyber', label: 'Cyber Neon' },
                    { id: 'oled', label: 'OLED Black' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleThemeChange(t.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                        themeMode === t.id
                          ? 'bg-zinc-800 text-cyan-400 border-cyan-500/50 shadow-md'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset Data */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-900/40 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Data Management</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Unpair all {devices.length} strips and clear local database
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => setIsResetConfirmOpen(true)}
                >
                  <span>Reset App</span>
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-2.5">
              {FAQS.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left flex items-center justify-between text-xs font-bold text-zinc-200 hover:bg-white/5 transition"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 shrink-0 ml-2 transition-transform ${
                          isOpen ? 'rotate-180 text-cyan-400' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-3.5 pb-3.5 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/60 pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Application</span>
                <span className="font-bold text-zinc-200">LSC Studio v1.0.0</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Architecture</span>
                <span className="font-bold text-cyan-400 font-mono">Offline-First Native Android</span>
              </div>
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">Supported Protocols</span>
                <span className="font-bold text-zinc-300 font-mono text-[11px]">ELK-BLEDOM (0x7E) • LEDDMX (0x7B)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Local Persistence</span>
                <span className="font-bold text-emerald-400">IndexedDB Local DB</span>
              </div>
            </div>
          )}
        </div>
      <ConfirmModal
          isOpen={isResetConfirmOpen}
          title="Reset Application"
          message="Are you sure you want to unpair all Bluetooth strips and clear stored data? This will restart the app."
          confirmText="Reset All"
          variant="danger"
          onConfirm={executeReset}
          onCancel={() => setIsResetConfirmOpen(false)}
        />
      </div>
    </div>
  );
};