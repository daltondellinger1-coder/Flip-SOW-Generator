
import React, { useState } from 'react';
import { XIcon, DocumentTextIcon, UserIcon, GlobeIcon, CubeIcon } from './icons';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'am' | 'pm' | 'faq'>('basics');

  const tabs = [
    { id: 'basics', label: 'Getting Started', icon: <CubeIcon /> },
    { id: 'am', label: 'Acquisitions (Phone)', icon: <UserIcon /> },
    { id: 'pm', label: 'Projects (Desktop)', icon: <DocumentTextIcon /> },
    { id: 'faq', label: 'FAQs', icon: <GlobeIcon /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-base-300">
        
        {/* Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-lg">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            App Guide & Tutorials
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <XIcon />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-col md:flex-row flex-grow overflow-hidden h-full">
            
            {/* Sidebar Tabs */}
            <div className="bg-base-200 md:w-64 flex-shrink-0 border-r border-base-300 overflow-y-auto">
                <nav className="p-2 space-y-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                                activeTab === tab.id 
                                ? 'bg-brand-primary text-white shadow-md' 
                                : 'text-gray-400 hover:bg-base-300 hover:text-white'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto bg-base-100">
                
                {activeTab === 'basics' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-brand-secondary">How this App Works</h3>
                        <p className="text-gray-300">
                            This is a <strong>mobile-first tool</strong> designed to help house flippers generate accurate Scopes of Work (SOW) quickly while walking a property.
                        </p>
                        
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-base-200 p-4 rounded-lg border border-base-300">
                                <div className="bg-brand-primary/20 text-brand-primary w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3">1</div>
                                <h4 className="font-bold text-white mb-2">Create Project</h4>
                                <p className="text-sm text-gray-400">Start a new project for the property address.</p>
                            </div>
                            <div className="bg-base-200 p-4 rounded-lg border border-base-300">
                                <div className="bg-brand-primary/20 text-brand-primary w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3">2</div>
                                <h4 className="font-bold text-white mb-2">Walk & Talk</h4>
                                <p className="text-sm text-gray-400">Use the AI Wand to speak your notes. "Kitchen is 10x10. Replace cabinets."</p>
                            </div>
                            <div className="bg-base-200 p-4 rounded-lg border border-base-300">
                                <div className="bg-brand-primary/20 text-brand-primary w-10 h-10 rounded-full flex items-center justify-center font-bold mb-3">3</div>
                                <h4 className="font-bold text-white mb-2">Export Data</h4>
                                <p className="text-sm text-gray-400">Generate a CSV for FlipperForce or a PDF for your contractors.</p>
                            </div>
                        </div>

                        <div className="bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded">
                            <h4 className="font-bold text-yellow-500 text-sm uppercase">Important: Data Storage</h4>
                            <p className="text-sm text-gray-300 mt-1">
                                This app stores data <strong>on your device</strong> for speed and offline reliability. 
                                It does not automatically sync to the cloud. To move data between phone and computer, use the <strong>Sync/Transfer</strong> button.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'am' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-brand-secondary">For Acquisitions Managers</h3>
                        
                        <div className="space-y-4">
                            <div className="bg-base-200 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">🚀 Speed is Key</h4>
                                <ul className="list-disc list-inside text-gray-400 space-y-2">
                                    <li>Don't type! Use the <strong>AI Wand</strong> button (bottom right) to record audio.</li>
                                    <li>Walk into a room, tap the wand, and say: <em>"Living Room dimensions are 15 by 20. Remove carpet, install LVP flooring, paint walls Agreeable Gray."</em></li>
                                    <li>The AI will automatically categorize items and calculate quantities.</li>
                                </ul>
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">📸 Quick Photos</h4>
                                <p className="text-gray-400 mb-2">
                                    Use the camera icon inside each room to snap "Before" photos. These are saved to the project but kept separate from the line items so your SOW stays clean.
                                </p>
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">➡️ Handoff</h4>
                                <p className="text-gray-400">
                                    When you're back in the truck, tap the <strong>Sync Icon</strong> in the header and choose <strong>"Email Copy"</strong> to send the project file to your Project Manager (or yourself).
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pm' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-brand-secondary">For Project Managers</h3>
                        
                        <div className="space-y-4">
                            <div className="bg-base-200 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">💻 Desktop Workflow</h4>
                                <ol className="list-decimal list-inside text-gray-400 space-y-2">
                                    <li>Open this app on your laptop/desktop.</li>
                                    <li>Download the <code>.json</code> file the AM emailed you.</li>
                                    <li>Click <strong>"Import Project File"</strong> on the dashboard.</li>
                                    <li>Review the Scope of Work, refine the specs, and adjust pricing.</li>
                                </ol>
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">💲 Managing Costs</h4>
                                <p className="text-gray-400 mb-2">
                                    Click <strong>"Manage Unit Prices"</strong> on the Review tab. You can set prices for this specific project or save them as <strong>Global Defaults</strong> so future projects auto-populate with your current rates.
                                </p>
                            </div>

                            <div className="bg-base-200 p-4 rounded-lg">
                                <h4 className="font-bold text-white mb-2">📄 FlipperForce Export</h4>
                                <p className="text-gray-400">
                                    Go to the <strong>Review</strong> tab and click <strong>"Download FlipperForce CSV"</strong>. This file is formatted to upload directly into the FlipperForce SOW estimator.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'faq' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-brand-secondary">Frequently Asked Questions</h3>
                        
                        <div className="space-y-4">
                            <div className="border-b border-base-300 pb-4">
                                <h4 className="font-bold text-white">How do I access my project on my computer?</h4>
                                <p className="text-gray-400 mt-1">
                                    Because this app is secure and offline-first, data stays on your phone. To move it:
                                    <br/>1. On your phone, tap the Sync icon (top right).
                                    <br/>2. Tap "Email / Send Copy".
                                    <br/>3. Send the file to your email.
                                    <br/>4. On your computer, download that file and use "Import Project" on the dashboard.
                                </p>
                            </div>

                            <div className="border-b border-base-300 pb-4">
                                <h4 className="font-bold text-white">Why isn't the AI calculating quantities?</h4>
                                <p className="text-gray-400 mt-1">
                                    The AI needs <strong>Room Dimensions</strong> to do math. Make sure you say "Living room is 12 by 14" or manually enter dimensions in the room view. Once dimensions are there, items like flooring and paint calculate automatically.
                                </p>
                            </div>

                            <div className="border-b border-base-300 pb-4">
                                <h4 className="font-bold text-white">Can I use this without internet?</h4>
                                <p className="text-gray-400 mt-1">
                                    Yes! You can create projects, add items, and take photos offline. However, the <strong>AI Voice Features</strong> require an internet connection to process your speech.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
