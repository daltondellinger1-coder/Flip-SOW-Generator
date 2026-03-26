
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LineItem, UnitPrice, TradeCategory } from '../types';
import { XIcon, DollarSignIcon, DownloadIcon, UploadIcon } from './icons';
import { TRADE_MAP } from '../constants';
import { exportUnitPricesToCsv, parseUnitPricesFromCsv } from '../services/csvExporter';

interface UnitPricingModalProps {
  onClose: () => void;
  lineItems: LineItem[];
  savedPrices: UnitPrice[];
  onSave: (prices: UnitPrice[]) => void;
  onSaveAsDefault: (prices: UnitPrice[]) => void;
}

const UnitPricingModal: React.FC<UnitPricingModalProps> = ({ onClose, lineItems, savedPrices, onSave, onSaveAsDefault }) => {
  // Use number | string to handle empty inputs gracefully while typing
  const [prices, setPrices] = useState<Record<string, number | string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initialPrices = savedPrices.reduce((acc, p) => {
      acc[p.id] = p.price;
      return acc;
    }, {} as Record<string, number | string>);
    setPrices(initialPrices);
  }, [savedPrices]);

  // Fix: Explicitly type `groupedItems` to prevent type inference issues with `useMemo`.
  const groupedItems: Record<string, { item: string; unit: string }[]> = useMemo(() => {
    const groups: Record<string, { item: string; unit: string }[]> = {};

    Object.entries(TRADE_MAP).forEach(([item, tradeDetails]) => {
      const { trade, defaultUnit } = tradeDetails;
      if (!item || !defaultUnit) return;

      if (!groups[trade]) {
        groups[trade] = [];
      }
      
      const key = `${item}-${defaultUnit}`;
      if (!groups[trade].some(i => `${i.item}-${i.unit}` === key)) {
          groups[trade].push({ item, unit: defaultUnit });
      }
    });

    for (const trade in groups) {
      groups[trade as TradeCategory].sort((a, b) => a.item.localeCompare(b.item));
    }

    return groups;
  }, []);

  const handlePriceChange = (key: string, value: string) => {
    if (value === '') {
        // Allow empty string for UX
        setPrices(prev => ({ ...prev, [key]: '' }));
    } else {
        const numericValue = parseFloat(value);
        // Store as number if valid
        if (!isNaN(numericValue)) {
            setPrices(prev => ({ ...prev, [key]: numericValue }));
        }
    }
  };

  const getFormattedPrices = (): UnitPrice[] => {
    const formatted: UnitPrice[] = [];

    // Iterate over all available items in the system (TRADE_MAP) via groupedItems
    Object.values(groupedItems).forEach(items => {
        items.forEach(({ item, unit }) => {
            const key = `${item}-${unit}`;
            const rawPrice = prices[key];
            
            // Treat empty string or undefined as 0
            let price = 0;
            if (typeof rawPrice === 'number') {
                price = rawPrice;
            } else if (typeof rawPrice === 'string' && rawPrice !== '') {
                price = parseFloat(rawPrice) || 0;
            }

            // CRITICAL FIX: Save the price even if it is 0. 
            // This ensures that if a user explicitly sets a price to 0 (or clears it), 
            // it is saved to the DB as 0, which overrides any hardcoded defaults (e.g. $300) 
            // during the app's loadData merge strategy.
            formatted.push({
                id: key,
                item,
                unit,
                price
            });
        });
    });
    
    return formatted;
  };

  const handleSave = () => {
    onSave(getFormattedPrices());
    onClose();
  };

  const handleSaveAsDefault = () => {
    // Updates both project and global defaults
    onSaveAsDefault(getFormattedPrices());
    onClose();
  };

  const handleExportCsv = () => {
    exportUnitPricesToCsv(getFormattedPrices());
  };

  const handleImportCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
        const importedPrices = await parseUnitPricesFromCsv(file);
        const newPricesMap = { ...prices };
        let count = 0;

        importedPrices.forEach(p => {
            // Only update if valid number
            if (!isNaN(p.price)) {
                newPricesMap[p.id] = p.price;
                count++;
            }
        });

        setPrices(newPricesMap);
        alert(`Successfully updated ${count} unit prices from CSV.`);
    } catch (error) {
        console.error(error);
        alert("Failed to parse CSV file. Please check the format.");
    } finally {
        setIsProcessing(false);
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSignIcon/>
            Unit Pricing
          </h2>
          <div className="flex items-center gap-2">
             <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="text-gray-400 hover:text-brand-primary p-2 rounded hover:bg-base-200 transition-colors"
                title="Import Prices from CSV"
             >
                <UploadIcon />
             </button>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportCsv} 
                className="hidden" 
                accept=".csv"
             />
             
             <button 
                onClick={handleExportCsv}
                className="text-gray-400 hover:text-brand-primary p-2 rounded hover:bg-base-200 transition-colors"
                title="Export Prices to CSV"
             >
                <DownloadIcon />
             </button>
             <div className="h-6 w-px bg-base-300 mx-1"></div>
             <button onClick={onClose} className="text-content hover:text-white p-2">
                <XIcon />
             </button>
          </div>
        </div>
        <div className="p-4 md:p-6 space-y-4 overflow-y-auto">
          {Object.entries(groupedItems).length > 0 ? (
            Object.entries(groupedItems)
              .sort(([tradeA], [tradeB]) => tradeA.localeCompare(tradeB))
              .map(([trade, items]) => (
                <div key={trade}>
                  <h3 className="text-lg font-semibold text-brand-primary border-b border-base-300 pb-2 mb-3 sticky top-0 bg-base-100">{trade}</h3>
                  <div className="space-y-3">
                    {items.map(({ item, unit }) => {
                      const key = `${item}-${unit}`;
                      const val = prices[key];
                      return (
                        <div key={key} className="grid grid-cols-3 gap-4 items-center">
                          <div className="col-span-2">
                            <label htmlFor={key} className="block text-sm font-medium text-white">
                              {item}
                            </label>
                            <span className="text-xs text-gray-400">Unit: {unit}</span>
                          </div>
                          <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                              type="number"
                              id={key}
                              value={val !== undefined ? val : ''}
                              onChange={(e) => handlePriceChange(key, e.target.value)}
                              className="w-full bg-base-200 border border-base-300 rounded-md p-2 pl-7 focus:ring-brand-primary focus:border-brand-primary text-white"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-400">No items available to price.</p>
          )}
        </div>
        <div className="p-4 border-t border-base-300 mt-auto flex flex-col gap-3">
           <div className="text-xs text-gray-400 mb-2 text-center">
              <strong>Save for This Project:</strong> Updates prices only for the current address.<br/>
              <strong>Apply & Save as Default:</strong> Saves these prices as your new global defaults for all future projects.
           </div>
           <div className="flex flex-col md:flex-row gap-3">
            <button onClick={handleSaveAsDefault} className="w-full md:w-1/2 bg-transparent border border-brand-primary text-brand-primary px-6 py-3 rounded-md hover:bg-brand-primary hover:text-white font-semibold transition-colors">
                Apply & Save as Default
            </button>
            <button onClick={handleSave} className="w-full md:w-1/2 bg-brand-primary text-white px-6 py-3 rounded-md hover:bg-brand-secondary font-semibold">
                Save for This Project
            </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default UnitPricingModal;
