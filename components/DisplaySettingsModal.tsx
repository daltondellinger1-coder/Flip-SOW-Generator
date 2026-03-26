
import React from 'react';
import { XIcon, CheckCircleIcon } from './icons';

interface DisplaySettingsModalProps {
  currentScale: number;
  onSetScale: (scale: number) => void;
  onClose: () => void;
}

const DisplaySettingsModal: React.FC<DisplaySettingsModalProps> = ({ currentScale, onSetScale, onClose }) => {
  const options = [
    { label: 'Small', scale: 0.85, description: 'Fits more content' },
    { label: 'Standard', scale: 1.0, description: 'Default size' },
    { label: 'Large', scale: 1.25, description: 'Better for field use' },
    { label: 'Extra Large', scale: 1.5, description: 'Maximum legibility' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-sm border border-base-300 flex flex-col max-h-[90vh]">
        {/* Fixed Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-lg flex-shrink-0">
          <h3 className="text-lg font-bold text-white">Display Size</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <XIcon />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-grow">
          <p className="text-sm text-gray-400 mb-2">Adjust font and button sizes for better visibility in the field.</p>
          
          <div className="space-y-3">
            {options.map((option) => (
              <button
                key={option.label}
                onClick={() => onSetScale(option.scale)}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  currentScale === option.scale
                    ? 'border-brand-primary bg-brand-primary/10'
                    : 'border-base-300 bg-base-200 hover:bg-base-300'
                }`}
              >
                <div className="text-left">
                  <span 
                    className="block font-bold text-white" 
                    style={{ fontSize: `${option.scale * 100}%` }}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500">{option.description}</span>
                </div>
                {currentScale === option.scale && (
                  <div className="text-brand-primary">
                    <CheckCircleIcon />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/30 mt-6">
            <p className="text-xs text-blue-200 leading-relaxed italic">
              "This setting zooms all text, buttons, and spacing proportionally across the entire app."
            </p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 bg-base-200 rounded-b-lg border-t border-base-300 flex-shrink-0">
            <button 
                onClick={onClose} 
                className="w-full bg-brand-primary text-white font-bold py-3 rounded-md hover:bg-brand-secondary transition-all shadow-lg active:scale-95"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default DisplaySettingsModal;
