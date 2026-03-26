
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XIcon, ChevronRightIcon, ChevronLeftIcon, SparklesIcon, ClipboardIcon, FolderIcon, LocationMarkerIcon, DocumentTextIcon } from './icons';

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const steps: Step[] = [
  {
    title: "Welcome to SOW Generator",
    description: "The fastest way to generate professional Statements of Work for your real estate projects. Let's show you around.",
    icon: <ClipboardIcon className="w-12 h-12" />,
    color: "bg-brand-primary"
  },
  {
    title: "Project Dashboard",
    description: "Start by creating a new project or importing an existing one. Your dashboard keeps all your flips organized and synced across devices.",
    icon: <FolderIcon className="w-12 h-12" />,
    color: "bg-blue-500"
  },
  {
    title: "Room-by-Room Walkthrough",
    description: "Add items as you walk through the property. Organize by room and trade to ensure nothing gets missed during the inspection.",
    icon: <LocationMarkerIcon className="w-12 h-12" />,
    color: "bg-emerald-500"
  },
  {
    title: "AI Smart Entry",
    description: "Don't like typing? Use Smart Entry to describe tasks in plain English. Our AI will automatically categorize the trade, action, and quantity.",
    icon: <SparklesIcon className="w-12 h-12" />,
    color: "bg-purple-500"
  },
  {
    title: "Professional Exports",
    description: "When you're done, export a FlipperForce-ready CSV or a professional PDF to share with contractors and lenders.",
    icon: <DocumentTextIcon className="w-12 h-12" />,
    color: "bg-orange-500"
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
}

const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = steps[currentStep];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-base-100 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-base-300 relative"
      >
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10"
        >
          <XIcon />
        </button>

        <div className="h-2 bg-base-300 w-full">
          <motion.div 
            className="h-full bg-brand-primary"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <div className={`p-6 rounded-2xl ${step.color} text-white mb-6 shadow-lg`}>
                {step.icon}
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">{step.title}</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between w-full items-center mt-auto">
            <button 
              onClick={prev}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white hover:bg-base-200'}`}
            >
              <ChevronLeftIcon /> Back
            </button>

            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-brand-primary' : 'w-1.5 bg-base-300'}`}
                />
              ))}
            </div>

            <button 
              onClick={next}
              className="flex items-center gap-2 px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-lg font-bold transition-all shadow-lg active:scale-95"
            >
              {currentStep === steps.length - 1 ? "Get Started" : "Next"} <ChevronRightIcon />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingTutorial;
