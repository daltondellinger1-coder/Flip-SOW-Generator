import React, { useState, useEffect } from 'react';
import { XIcon, SparklesIcon, ClipboardIcon } from './icons';
import { parseSmartEntry } from '../services/geminiService';

interface BulkPasteModalProps {
  onClose: () => void;
  onComplete: (result: any) => Promise<void>;
  isProcessing: boolean;
}

const MESSAGES = [
  "Reading your notes...",
  "Categorizing trades based on FlipperForce standards...",
  "Identifying rooms and areas...",
  "Mapping to precise line items...",
  "Applying specific narrative notes...",
  "Calculating quantities based on Triple-Match logic...",
  "Finalizing import structure..."
];

const BulkPasteModal: React.FC<BulkPasteModalProps> = ({ onClose, onComplete, isProcessing: externalIsProcessing }) => {
  const [content, setContent] = useState('');
  const [messageIdx, setMessageIdx] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [internalIsProcessing, setInternalIsProcessing] = useState(false);

  useEffect(() => {
    let interval: any;
    if (internalIsProcessing || externalIsProcessing) {
      interval = setInterval(() => {
        setMessageIdx(prev => (prev + 1) % MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [internalIsProcessing, externalIsProcessing]);

  const handleProcess = async () => {
    if (!content.trim()) {
      alert("Please paste some text before processing.");
      return;
    }

    setInternalIsProcessing(true);
    try {
        const result = await parseSmartEntry(content.trim());
        if (result) {
            // Pass the structured result back to App.tsx
            await onComplete(result);
        } else {
            alert("AI processing failed. Please try a smaller snippet or check your connection.");
        }
    } catch (error) {
        console.error("Bulk paste error:", error);
        alert("An error occurred while parsing your notes.");
    } finally {
        setInternalIsProcessing(false);
    }
  };

  const isLoading = internalIsProcessing || externalIsProcessing;

  return (
    <div className="fixed inset-0 bg-base-100 flex flex-col z-50 p-4 h-full md:h-screen transition-all duration-300">
      {/* Header */}
      <div className={`flex justify-between items-center flex-shrink-0 transition-all duration-200 ${isFocused ? 'mb-2' : 'mb-4'}`}>
        {!isFocused && (
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tighter">
              <ClipboardIcon />
              Bulk Smart Paste
          </h2>
        )}
        {isFocused && (
          <div className="text-[10px] font-black text-brand-primary uppercase tracking-widest px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
            Editor Mode Active
          </div>
        )}
        <button 
          onClick={onClose} 
          className="text-content hover:text-white p-2 ml-auto transition-colors"
          disabled={isLoading}
        >
          <XIcon />
        </button>
      </div>
      
      {/* Body */}
      <div className="flex-grow flex flex-col min-h-0 overflow-hidden relative">
        {!isFocused && !isLoading && (
          <p className="text-xs md:text-sm text-gray-500 mb-6 flex-shrink-0 animate-fade-in font-medium leading-relaxed max-w-2xl">
            Paste text from your SOW documents, emails, or field notes. Our AI Logic Engine will automatically expand macros like <span className="text-brand-primary font-bold">"Standard Kitchen"</span> and match items to your official pricing list.
          </p>
        )}

        {isLoading ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-8 animate-fade-in">
                <div className="relative">
                    <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-brand-primary"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-brand-primary">
                        <SparklesIcon />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <p className="text-xl font-black text-white uppercase tracking-tight">{MESSAGES[messageIdx]}</p>
                    <p className="text-sm text-gray-500 italic font-medium">Gemini is matching your text to FlipperForce items...</p>
                </div>
            </div>
        ) : (
            <div className="flex-grow flex flex-col min-h-0">
                <textarea
                    className={`flex-grow bg-base-200 rounded-2xl p-6 mb-4 overflow-y-auto w-full border-2 border-base-300 focus:border-brand-primary font-sans transition-all duration-300 shadow-inner outline-none ${isFocused ? 'text-lg md:text-xl text-white' : 'text-base text-gray-300'}`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        // Small delay to allow the button click to register
                        setTimeout(() => setIsFocused(false), 200);
                    }}
                    placeholder={`Paste text here...\n\nExample:\n"Standard Kitchen Remodel. Measurements are 10x12."\n"Bathroom 1: Replace vanity and toilet."`}
                />
            </div>
        )}
      </div>

      {/* Footer */}
      {!isLoading && (
        <div className={`flex gap-4 flex-shrink-0 transition-all duration-300 ${isFocused ? 'pt-0' : 'pt-2'}`}>
            <button
                onClick={onClose}
                className="px-8 py-4 bg-base-300 text-white rounded-xl font-black uppercase tracking-widest hover:bg-base-200 transition-all text-sm hidden sm:block shadow-lg"
            >
                Cancel
            </button>
            <button
                onClick={handleProcess}
                onMouseDown={(e) => e.preventDefault()}
                disabled={!content.trim()}
                className={`flex-grow bg-brand-primary text-white font-black uppercase tracking-widest rounded-xl hover:bg-brand-secondary disabled:bg-base-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-[0.98] ${isFocused ? 'py-4 text-sm' : 'py-5 text-base md:text-lg'}`}
            >
                <SparklesIcon />
                <span>{isFocused ? 'Finish & Process with AI' : 'Analyze & Import Scope'}</span>
            </button>
        </div>
      )}
    </div>
  );
};

export default BulkPasteModal;