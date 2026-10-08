import React, { useState } from 'react';
import { useDevices } from '../../context/DeviceContext';
import type { ProtocolType } from '../../types/device';
import { Button } from '../common/Button';
import { Bluetooth, X, AlertCircle, Sparkles, Cpu } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({ isOpen, onClose }) => {
  const { pairDevice, cancelPairing } = useDevices();
  const [name, setName] = useState('');
  const [protocol, setProtocol] = useState<ProtocolType | 'auto'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = () => {
    if (isLoading) {
      cancelPairing();
      setIsLoading(false);
      setErrorMsg('Pairing aborted by user.');
    } else {
      onClose();
    }
  };

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const selectedProtocol = protocol === 'auto' ? undefined : protocol;
      await pairDevice(name, selectedProtocol);
      setName('');
      setProtocol('auto');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'NotFoundError') {
          setErrorMsg('No device selected or scan cancelled.');
        } else {
          setErrorMsg(err.message || 'Bluetooth connection failed.');
        }
      } else {
        setErrorMsg('An unexpected error occurred during pairing.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-zinc-100 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl pointer-events-none" />

        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={handleCancel}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100"
        />

        <div className="flex items-center gap-3.5 mb-6 relative z-10">
          <div className="p-3.5 bg-gradient-to-br from-cyan-950 to-blue-950 border border-cyan-800/80 rounded-2xl text-cyan-300 shadow-md">
            <Bluetooth className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Pair RGB Light Strip</h2>
            <p className="text-xs text-zinc-400">Scan for ELK-BLEDOM or LEDDMX Bluetooth controllers</p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-950/70 border border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePair} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider">
              Strip Label / Custom Name
            </label>
            <input
              type="text"
              placeholder="e.g. Desk Backlight, Bed Frame"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950/90 border border-zinc-800 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-2 uppercase tracking-wider flex items-center justify-between">
              <span>Hardware Protocol</span>
              <span className="text-[11px] text-zinc-500 font-normal">Auto-detect recommended</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <Button
                type="button"
                variant={protocol === 'auto' ? 'primary' : 'secondary'}
                size="sm"
                icon={Sparkles}
                onClick={() => setProtocol('auto')}
                className="w-full"
              >
                <span>Auto</span>
              </Button>
              <Button
                type="button"
                variant={protocol === 'elk-bledom' ? 'primary' : 'secondary'}
                size="sm"
                icon={Cpu}
                onClick={() => setProtocol('elk-bledom')}
                className="w-full"
              >
                <span>ELK</span>
              </Button>
              <Button
                type="button"
                variant={protocol === 'leddmx' ? 'primary' : 'secondary'}
                size="sm"
                icon={Cpu}
                onClick={() => setProtocol('leddmx')}
                className="w-full"
              >
                <span>DMX</span>
              </Button>
            </div>
          </div>

          <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 text-xs text-zinc-400 space-y-1.5">
            <p className="font-bold text-zinc-300">Quick Pairing Checklist:</p>
            <p className="text-[11px] leading-relaxed">
              1. Ensure the strip is powered and within Bluetooth range.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. Disconnect any competing mobile apps (Lotus Lantern, duoCo Strip) so GATT channels are free.
            </p>
          </div>

          {isLoading && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Connecting to strip... Click <strong>Abort</strong> if Windows BLE does not respond.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-850">
            <Button
              type="button"
              variant={isLoading ? 'danger' : 'ghost'}
              size="md"
              onClick={handleCancel}
            >
              <span>{isLoading ? 'Abort Pairing' : 'Cancel'}</span>
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Bluetooth}
              isLoading={isLoading}
            >
              <span>Scan & Connect</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
