
import React from 'react';
import { XIcon, PrinterIcon, DownloadIcon } from './icons';

interface ExportModalProps {
  onClose: () => void;
  onPrintSOW: () => void;
  onExportCSV: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({ onClose, onPrintSOW, onExportCSV }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-sm border border-base-300 transform transition-all scale-100 opacity-100">
        
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-200 rounded-t-lg">
          <h3 className="text-lg font-bold text-white">Reports & Export</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <XIcon />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Print Section */}
          <div className="space-y-3">
             <h4 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Professional PDF (Contractor Version)</h4>
             <button
                onClick={() => {
                    onPrintSOW();
                    onClose();
                }}
                className="w-full flex items-center gap-3 p-4 bg-brand-primary/10 border border-brand-primary/30 hover:bg-brand-primary/20 rounded-lg transition-colors text-white group"
             >
                <div className="p-2 bg-brand-primary rounded-full text-white shadow-md">
                    <PrinterIcon />
                </div>
                <div className="text-left">
                    <div className="font-bold text-brand-primary">Generate Numbered PDF</div>
                    <div className="text-xs text-gray-400">Formal SOW with reference numbers for bidding and invoices.</div>
                </div>
             </button>
          </div>

          <div className="border-t border-base-300 pt-4 space-y-3">
             <h4 className="text-xs uppercase text-gray-400 font-bold tracking-wider">Spreadsheet Data (CSV)</h4>
             
             <button
                onClick={() => {
                    onExportCSV();
                    onClose();
                }}
                className="w-full flex items-center gap-3 p-3 bg-base-200 hover:bg-base-300 rounded-lg transition-colors text-white group"
             >
                <div className="p-2 bg-blue-500/20 rounded-full text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <DownloadIcon />
                </div>
                <div className="text-left">
                    <div className="font-bold">Export Items by Room</div>
                    <div className="text-xs text-gray-400">Standard CSV sorted by room for spreadsheet use.</div>
                </div>
             </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ExportModal;
