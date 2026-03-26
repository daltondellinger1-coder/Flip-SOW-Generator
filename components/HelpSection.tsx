
import React from 'react';
import { motion } from 'motion/react';
import { XIcon, ClipboardIcon, SparklesIcon, DocumentTextIcon, PlayIcon, HelpCircleIcon } from './icons';

interface HelpSectionProps {
  onClose: () => void;
  onStartTutorial: () => void;
}

const HelpSection: React.FC<HelpSectionProps> = ({ onClose, onStartTutorial }) => {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-base-100 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-base-300"
      >
        <div className="p-6 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircleIcon className="text-brand-primary" />
            Help & Support
          </h2>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            <h3 className="font-bold text-brand-primary uppercase text-xs tracking-widest">Quick Start</h3>
            <button 
              onClick={onStartTutorial}
              className="w-full flex items-center gap-4 p-4 bg-base-200 hover:bg-base-300 rounded-xl transition-all border border-transparent hover:border-brand-primary group"
            >
              <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-colors">
                <PlayIcon />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Replay Tutorial</p>
                <p className="text-xs text-gray-400">Watch the step-by-step guide again.</p>
              </div>
            </button>

            <div className="p-4 bg-base-200 rounded-xl space-y-2">
              <p className="font-bold text-white text-sm">Smart Entry Tips</p>
              <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4">
                <li>"Paint the master bedroom walls"</li>
                <li>"Replace 10 windows in the whole house"</li>
                <li>"Repair the front porch concrete"</li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-brand-primary uppercase text-xs tracking-widest">Resources</h3>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              className="flex items-center gap-4 p-4 bg-base-200 hover:bg-base-300 rounded-xl transition-all border border-transparent hover:border-brand-primary group"
            >
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                <SparklesIcon />
              </div>
              <div className="text-left">
                <p className="font-bold text-white">Gemini API Docs</p>
                <p className="text-xs text-gray-400">Learn about the AI powering SOW.</p>
              </div>
            </a>

            <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-xl">
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="font-bold text-brand-primary">Pro Tip:</span> You can use your phone's voice-to-text feature in the Smart Entry box to dictate your walkthrough hands-free!
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-base-200 border-t border-base-300 flex justify-center">
          <p className="text-xs text-gray-500">SOW Generator v1.2.0 • Made for Real Estate Pros</p>
        </div>
      </motion.div>
    </div>
  );
};

export default HelpSection;
