import React, { useState } from 'react';
import { Button } from '../common/Button';
import {
  Zap,
  Bluetooth,
  Sliders,
  Layers,
  Clock,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
} from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    icon: Zap,
    title: 'Welcome to LSC Studio',
    subtitle: 'Unified Hardware Control',
    description:
      'LSC Studio is an offline-first controller engineered to orchestrate disparate physical RGB LED strips (ELK-BLEDOM and LEDDMX-03) simultaneously from a single, unified interface.',
  },
  {
    icon: Bluetooth,
    title: 'Connecting Your Strips',
    subtitle: 'Nearby Bluetooth Discovery',
    description:
      'Ensure Bluetooth and Location are enabled on your device (required by Android for BLE beacon scanning). Go to the "Strips" tab, tap "+ Pair Strip", and select your detected hardware.',
  },
  {
    icon: Sliders,
    title: 'Pin Order Calibration',
    subtitle: 'RGB vs GRB Hardware Sequences',
    description:
      'Different manufacturers wire RGB pins differently! If your DMX strip turns green when selecting red, simply tap the "GRB" button on the device card to align its colors 1:1 with your other lights.',
  },
  {
    icon: Layers,
    title: 'Synchronized Groups',
    subtitle: 'Simultaneous Multi-Strip Commands',
    description:
      'Group your desk backlights, bed, and ambient lights together under the "Groups" tab. Commands sent to a group transmit to both ELK and DMX strips concurrently with zero latency.',
  },
  {
    icon: Clock,
    title: 'Automated Offline Schedules',
    subtitle: 'Autonomous On/Off Timers',
    description:
      'Under the "Groups" tab, open the "Power Schedules" section to set recurring wake-up or bedtime schedules that run completely offline without cloud accounts or external gateways.',
  },
];

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  const handleFinish = () => {
    localStorage.setItem('lsc_onboarding_completed', 'true');
    setCurrentStep(0);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-zinc-100 flex flex-col overflow-hidden">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={handleFinish}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-100"
        />

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5 mb-6">
          {STEPS.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-8 bg-cyan-400'
                  : idx < currentStep
                  ? 'w-2.5 bg-blue-600'
                  : 'w-2.5 bg-zinc-800'
              }`}
            />
          ))}
          <span className="text-[10px] font-mono text-zinc-500 ml-auto font-bold">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Step Graphic */}
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-indigo-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 mb-5 shadow-xl shadow-cyan-950/40">
            <StepIcon className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h3 className="text-xl font-extrabold text-zinc-100">{step.title}</h3>
          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mt-1 mb-3">
            {step.subtitle}
          </span>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
            {step.description}
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 mt-4 border-t border-zinc-800/80 gap-3">
          {currentStep > 0 ? (
            <Button
              variant="secondary"
              size="md"
              icon={ChevronLeft}
              onClick={() => setCurrentStep((prev) => prev - 1)}
            >
              <span>Back</span>
            </Button>
          ) : (
            <button
              onClick={handleFinish}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 px-3 py-2"
            >
              Skip Guide
            </button>
          )}

          {isLast ? (
            <Button
              variant="primary"
              size="md"
              icon={CheckCircle2}
              onClick={handleFinish}
              className="ml-auto"
            >
              <span>Get Started</span>
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              icon={ChevronRight}
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="ml-auto"
            >
              <span>Next</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};