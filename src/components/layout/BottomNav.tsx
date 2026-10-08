import React from 'react';
import {
  Palette,
  Sparkles,
  Radio,
  Layers,
  Bluetooth,
} from 'lucide-react';

export type MainNavTab = 'control-colors' | 'control-effects' | 'groups' | 'devices';

interface BottomNavProps {
  activeTab: MainNavTab;
  onSelectTab: (tab: MainNavTab) => void;
  onOpenHubDrawer: () => void;
  connectedCount: number;
  totalDevices: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenHubDrawer,
  connectedCount,
  totalDevices,
}) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 px-2 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
      {/* Tab: Colors */}
      <button
        onClick={() => onSelectTab('control-colors')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'control-colors'
            ? 'text-cyan-400 font-bold scale-105'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Palette className="w-5 h-5" />
        <span className="text-[10px]">Colors</span>
      </button>

      {/* Tab: Effects */}
      <button
        onClick={() => onSelectTab('control-effects')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'control-effects'
            ? 'text-cyan-400 font-bold scale-105'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px]">Effects</span>
      </button>

      {/* Center Action: Open Collapsible Hub Drawer */}
      <button
        onClick={onOpenHubDrawer}
        className="flex flex-col items-center -mt-5"
        title="Open Hardware Hub"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-zinc-950 shadow-lg shadow-cyan-950/80 border-2 border-zinc-950 active:scale-95 transition">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <span className="text-[10px] font-bold text-cyan-400 mt-1">
          Hub ({connectedCount}/{totalDevices})
        </span>
      </button>

      {/* Tab: Groups */}
      <button
        onClick={() => onSelectTab('groups')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'groups'
            ? 'text-cyan-400 font-bold scale-105'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span className="text-[10px]">Groups</span>
      </button>

      {/* Tab: Strips */}
      <button
        onClick={() => onSelectTab('devices')}
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
          activeTab === 'devices'
            ? 'text-cyan-400 font-bold scale-105'
            : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Bluetooth className="w-5 h-5" />
        <span className="text-[10px]">Strips</span>
      </button>
    </nav>
  );
};

