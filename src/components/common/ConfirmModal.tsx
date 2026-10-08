import React from 'react';
import { Button } from './Button';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const IconComponent = variant === 'danger' ? Trash2 : AlertTriangle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-zinc-100 flex flex-col items-center text-center">
        <Button
          variant="ghost"
          size="icon-sm"
          icon={X}
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100"
        />

        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
            variant === 'danger'
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
              : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/80'
          }`}
        >
          <IconComponent className="w-7 h-7" />
        </div>

        {/* Title & Message */}
        <h3 className="text-base font-bold text-zinc-100 mb-1.5">{title}</h3>
        <p className="text-xs text-zinc-400 leading-relaxed mb-6 px-2">{message}</p>

        {/* Buttons */}
        <div className="flex items-center gap-3 w-full">
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            <span>{cancelText}</span>
          </Button>
          <Button
            variant={variant}
            size="md"
            onClick={onConfirm}
            className="flex-1"
          >
            <span>{confirmText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};