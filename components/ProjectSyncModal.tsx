
import React, { useState, useEffect } from 'react';
import { XIcon, DownloadIcon, UploadIcon, ShareIcon, GlobeIcon } from './icons';
import { exportProjectFile, importProjectFile, shareFile, downloadFile } from '../services/projectImportExport';
import { parseLineItemsFromCsv } from '../services/csvExporter';
import { addBulkLineItems } from '../services/db';

interface ProjectSyncModalProps {
  onClose: () => void;
  onImportComplete: () => void;
  onReturnToDashboard: () => void;
  currentAddress: string;
  projectId: number;
  ownerEmail: string;
}

const ProjectSyncModal: React.FC<ProjectSyncModalProps> = ({ onClose, onImportComplete, onReturnToDashboard, currentAddress, projectId, ownerEmail }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isCsvImporting, setIsCsvImporting] = useState(false);
  const [error, setError] = useState('');
  
  // Pre-load file state
  const [preparedFile, setPreparedFile] = useState<File | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);

  // Pre-load the file when modal opens so share button is synchronous
  useEffect(() => {
    let active = true;
    setIsPreparing(true);
    exportProjectFile(projectId)
      .then(file => {
        if (active) {
          setPreparedFile(file);
          setIsPreparing(false);
        }
      })
      .catch(err => {
        console.error("Failed to prepare file for sharing", err);
        if (active) setIsPreparing(false);
      });
    return () => { active = false; };
  }, [projectId]);

  const handleShare = async () => {
    if (preparedFile) {
        await shareFile(preparedFile);
    } else if (!isPreparing) {
        alert("File preparation failed. Please try downloading instead.");
    }
  };

  const handleDownload = () => {
      if (preparedFile) {
          downloadFile(preparedFile);
      } else {
          // Fallback if preparation failed or still loading
          exportProjectFile(projectId).then(downloadFile);
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    setError('');

    try {
      await importProjectFile(file, ownerEmail);
      alert("Project imported as a NEW project. You will be redirected to the projects list.");
      onReturnToDashboard(); // Navigate back to dashboard to see new project
    } catch (err: any) {
      setError(err.message || "Failed to import project file.");
      setIsImporting(false);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCsvImporting(true);
    setError('');

    try {
        const items = await parseLineItemsFromCsv(file);
        if (items.length === 0) throw new Error("No valid items found in CSV.");
        
        await addBulkLineItems(projectId, items);
        
        alert(`Successfully added ${items.length} items to the project.`);
        onImportComplete(); // Refresh
    } catch (err: any) {
        setError(err.message || "Failed to import CSV.");
    } finally {
        setIsCsvImporting(false);
    }
  };

  const canShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GlobeIcon />
              Project Transfer
          </h2>
          <button onClick={onClose} className="text-content hover:text-white">
            <XIcon />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          
          {/* Handover Section */}
          <div className="space-y-4">
            <div className="bg-blue-900/20 border border-blue-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-bold text-white mb-2">1. Handover to Desktop</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Moving from Phone to Computer?
                </p>
                <div className="flex gap-2">
                    {canShare && (
                        <button 
                        onClick={handleShare}
                        disabled={isPreparing || !preparedFile}
                        className="flex-1 flex items-center justify-center gap-2 bg-brand-primary text-white px-4 py-3 rounded-md hover:bg-brand-secondary font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                        {isPreparing ? (
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                        ) : (
                            <ShareIcon />
                        )}
                        <span>Email / Send Copy</span>
                        </button>
                    )}
                    <button 
                        onClick={handleDownload}
                        disabled={!canShare && (isPreparing || !preparedFile)}
                        className={`flex items-center justify-center gap-2 bg-base-200 text-white px-4 py-3 rounded-md hover:bg-base-300 font-bold transition-colors border border-base-300 ${!canShare ? 'flex-1' : ''}`}
                        title="Download File"
                    >
                        <DownloadIcon />
                        {!canShare && <span>{isPreparing ? 'Preparing...' : 'Download File'}</span>}
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Tip: Email this file to yourself, then open this app on your computer to import it.
                </p>
            </div>
          </div>

          <div className="border-t border-base-300"></div>

          {/* Import Project Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-brand-primary">2. Import Project File</h3>
            <p className="text-sm text-gray-400">
              Are you on the desktop now? Select the <strong>.json</strong> file you sent from your phone.
            </p>
            
            <label className="w-full flex flex-col items-center justify-center px-4 py-6 bg-base-200 text-brand-primary rounded-lg shadow-lg tracking-wide uppercase border border-brand-primary/30 cursor-pointer hover:bg-base-300 hover:text-white transition-colors">
                <UploadIcon />
                <span className="mt-2 text-base leading-normal">{isImporting ? 'Importing...' : 'Select Project File (.json)'}</span>
                <input type='file' className="hidden" accept=".json" onChange={handleFileChange} disabled={isImporting} />
            </label>
          </div>

          <div className="border-t border-base-300"></div>

          {/* CSV Import Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-white">3. Import Line Items (CSV)</h3>
            <p className="text-sm text-gray-400">
              Add bulk items from a spreadsheet.
            </p>
            
            <label className="w-full flex flex-col items-center justify-center px-4 py-4 bg-base-200 text-gray-400 rounded-lg border border-dashed border-gray-600 cursor-pointer hover:bg-base-300 hover:text-white transition-colors">
                <span className="text-sm font-bold">{isCsvImporting ? 'Processing...' : 'Select Spreadsheet (.csv)'}</span>
                <input type='file' className="hidden" accept=".csv" onChange={handleCsvImport} disabled={isCsvImporting} />
            </label>
          </div>

          {error && <div className="bg-red-900/50 text-red-200 p-3 rounded text-sm border border-red-800 mt-4">{error}</div>}

        </div>
      </div>
    </div>
  );
};

export default ProjectSyncModal;
