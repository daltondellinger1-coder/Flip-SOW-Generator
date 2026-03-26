import React from 'react';
import { XIcon } from './icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-sm border border-base-300 transform transition-all scale-100 opacity-100">
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-lg">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <XIcon />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-300 text-base leading-relaxed">{message}</p>
        </div>
        <div className="p-4 border-t border-base-300 flex justify-end gap-3 bg-base-200 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-base-300 text-gray-300 hover:bg-base-100 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md text-white font-bold shadow-lg transition-transform active:scale-95 ${
              isDangerous 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-brand-primary hover:bg-brand-secondary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;