import React, { useState, useEffect } from 'react';
import { DeviceProvider, useDevices } from './context/DeviceContext';
import { DeviceList } from './components/devices/DeviceList';
import { GroupList } from './components/groups/GroupList';
import { ControlDeck } from './components/control/ControlDeck';
import { CollapsibleSidebar } from './components/layout/CollapsibleSidebar';
import { BottomNav, type MainNavTab } from './components/layout/BottomNav';
import { Button } from './components/common/Button';
import {
  Sliders,
  Layers,
  Bluetooth,
  Database,
  Radio,
  AlertTriangle,
  Zap,
  PanelLeft,
  Sparkles,
} from 'lucide-react';
import { SettingsModal } from './components/settings/SettingsModal';
import { TutorialModal } from './components/onboarding/TutorialModal';
import { Settings } from 'lucide-react';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('control-colors');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { devices, connectionMap, isBluetoothSupported } = useDevices();

  const connectedCount = devices.filter(
    (d) => connectionMap[d.id]?.status === 'connected'
  ).length;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [theme, setTheme] = useState<'zinc' | 'cyber' | 'oled'>(
    () => (localStorage.getItem('lsc_theme') as any) || 'zinc'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'oled') {
      document.body.style.backgroundColor = '#000000';
    } else if (theme === 'cyber') {
      document.body.style.backgroundColor = '#060611';
    } else {
      document.body.style.backgroundColor = '#09090b';
    }
  }, [theme]);

  // Automatically prompt first-run tutorial for new users
  useEffect(() => {
    const hasSeen = localStorage.getItem('lsc_onboarding_completed');
    if (!hasSeen) {
      setIsTutorialOpen(true);
    }
  }, []);

  return (
    <div
      style={{ backgroundColor: 'var(--bg-app)' }}
      className="min-h-screen text-zinc-100 flex flex-col font-sans transition-colors duration-300"
    >
      {/* Top Navigation & Status Bar */}
      <header
        style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)' }}
        className="sticky top-0 z-40 backdrop-blur-xl border-b transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="icon-sm"
              icon={PanelLeft}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setIsMobileSidebarOpen(true);
                } else {
                  setIsSidebarOpen((prev) => !prev);
                }
              }}
              title="Toggle Hardware Hub Menu"
            />

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-950/80 border border-cyan-400/30">
                <Zap className="w-5 h-5 text-zinc-950 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
                  LSC Studio
                </h1>
                <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 font-mono">
                  <span className="text-cyan-400 font-semibold">ELK-BLEDOM</span>
                  <span>•</span>
                  <span className="text-blue-400 font-semibold">LEDDMX</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-inner gap-1">
            <Button
              variant="tab"
              size="sm"
              icon={Sliders}
              isActive={activeTab === 'control-colors'}
              onClick={() => setActiveTab('control-colors')}
            >
              <span>Color Controls</span>
            </Button>
            <Button
              variant="tab"
              size="sm"
              icon={Sparkles}
              isActive={activeTab === 'control-effects'}
              onClick={() => setActiveTab('control-effects')}
            >
              <span>Patterns & Effects</span>
            </Button>
            <Button
              variant="tab"
              size="sm"
              icon={Layers}
              isActive={activeTab === 'groups'}
              onClick={() => setActiveTab('groups')}
            >
              <span>Groups</span>
            </Button>
            <Button
              variant="tab"
              size="sm"
              icon={Bluetooth}
              isActive={activeTab === 'devices'}
              onClick={() => setActiveTab('devices')}
            >
              <span>Strips</span>
            </Button>
          </nav>

          {/* Right Status Indicators */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Storage indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-400 shadow-sm">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-semibold">Offline DB</span>
            </div>

            {/* Settings & Help Button */}
            <Button
              variant="secondary"
              size="icon-sm"
              icon={Settings}
              onClick={() => setIsSettingsOpen(true)}
              title="Settings, Diagnostics & FAQ"
            />

            {/* Hardware connection indicator */}
            <div
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-zinc-300 shadow-sm cursor-pointer lg:cursor-default hover:border-zinc-700 transition"
              title="Click to view connected hardware"
            >
              <Radio
                className={`w-3.5 h-3.5 ${
                  connectedCount > 0 ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'
                }`}
              />
              <span className="font-mono text-[11px] font-bold">
                {connectedCount}/{devices.length} Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Web Bluetooth Alert if Unsupported */}
      {!isBluetoothSupported && (
        <div className="bg-amber-950/90 border-b border-amber-800/80 px-4 py-2.5 text-xs text-amber-200 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Web Bluetooth is not supported in this browser. To send GATT packets to physical light strips, open this web app in Google Chrome, Microsoft Edge, or Opera.
          </span>
        </div>
      )}

      {/* Split Layout Container */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Collapsible Sidebar */}
        <CollapsibleSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen((prev) => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />

        {/* Dashboard Body */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 pb-24 lg:pb-10 max-w-full overflow-x-hidden">
          {activeTab === 'control-colors' && <ControlDeck initialSubTab="colors" />}
          {activeTab === 'control-effects' && <ControlDeck initialSubTab="effects" />}
          {activeTab === 'groups' && <GroupList />}
          {activeTab === 'devices' && <DeviceList />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenHubDrawer={() => setIsMobileSidebarOpen(true)}
        connectedCount={connectedCount}
        totalDevices={devices.length}
      />

      {/* Footer on Large Screens */}
      <footer className="hidden lg:block border-t border-zinc-800/80 py-5 bg-zinc-950/80 text-center text-xs text-zinc-500">
        <p className="flex items-center justify-center gap-2">
          <span>LSC Strip Studio</span>
          <span>•</span>
          <span className="text-zinc-400">Web Bluetooth Low Energy GATT</span>
          <span>•</span>
          <span>IndexedDB Local Persistence</span>
        </p>
      </footer>

      {/* Settings & Help Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        currentTheme={theme}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />

      {/* Guided Setup Walkthrough */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <DeviceProvider>
      <MainLayout />
    </DeviceProvider>
  );
}
