import React from 'react';
import { LineItem, UnitPrice } from '../types';
import { DollarSignIcon, CalculatorIcon } from './icons';

interface ProjectTotalsProps {
  lineItems: LineItem[];
  unitPrices: UnitPrice[];
  costMultiplier?: number;
  contingencyPercentage?: number;
  onOpenPricing?: () => void;
}

const ProjectTotals: React.FC<ProjectTotalsProps> = ({ 
    lineItems, 
    unitPrices, 
    costMultiplier = 1.0, 
    contingencyPercentage = 0,
    onOpenPricing 
}) => {
  const priceMap = new Map<string, number>(
      unitPrices.map(p => [`${p.item}-${p.unit.toLowerCase()}`, p.price] as [string, number])
  );

  const totals: Record<string, number> = lineItems
    .filter(item => item.item !== 'General Room Photo')
    .reduce((acc, item) => {
    let itemTotal = 0;
    
    if (item.manualPrice !== undefined) {
        itemTotal = item.manualPrice;
    } else {
        const basePrice = item.unitPrice !== undefined ? item.unitPrice : (priceMap.get(`${item.item}-${(item.unit || '').toLowerCase()}`) || 0);
        const scaledPrice = basePrice * costMultiplier;
        itemTotal = (item.quantity || 0) * scaledPrice;
    }
    
    acc[item.trade] = (acc[item.trade] || 0) + itemTotal;
    
    return acc;
  }, {} as Record<string, number>);

  const subTotal = Object.values(totals).reduce((sum, total) => sum + total, 0);
  const contingencyValue = subTotal * (contingencyPercentage / 100);
  const grandTotal = subTotal + contingencyValue;

  if (lineItems.length === 0) return null;

  return (
    <div className="bg-base-200 m-4 rounded-xl shadow-2xl border-l-4 border-brand-primary overflow-hidden">
      {/* Header Section */}
      <div className="p-5 border-b border-base-300 bg-base-100/30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Project Budget</h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
                <div className="flex items-center gap-1.5 bg-base-300/50 px-2 py-1 rounded-md border border-base-300">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Grade</span>
                    <span className={`text-[10px] font-black ${costMultiplier === 1.0 ? 'text-gray-300' : 'text-brand-primary'}`}>
                        {(costMultiplier * 100).toFixed(0)}%
                    </span>
                </div>
                {contingencyPercentage > 0 && (
                    <div className="flex items-center gap-1.5 bg-blue-900/20 px-2 py-1 rounded-md border border-blue-900/30">
                        <span className="text-[10px] text-blue-400 uppercase tracking-widest font-black">Safety</span>
                        <span className="text-[10px] font-black text-blue-300">
                            +{contingencyPercentage}%
                        </span>
                    </div>
                )}
                {onOpenPricing && (
                    <button 
                        onClick={onOpenPricing}
                        className="text-[10px] text-brand-primary hover:text-white font-black uppercase tracking-widest underline decoration-brand-primary/50 ml-1"
                    >
                        Edit Base Rates
                    </button>
                )}
            </div>
          </div>
          
          <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
              <div className="bg-base-100 px-4 py-2 rounded-lg border border-brand-primary/20 shadow-inner w-full sm:w-auto flex flex-col items-center sm:items-end">
                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.2em] mb-0.5">Estimated Total</span>
                <span className="font-mono text-brand-primary text-3xl sm:text-4xl font-black leading-none py-1">
                    ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
          </div>
        </div>
      </div>

      {/* Trade Breakdown */}
      <div className="p-5 bg-base-200/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
            {Object.entries(totals).sort(([tradeA], [tradeB]) => tradeA.localeCompare(tradeB)).map(([trade, total]) => (
            total > 0 && (
                <div key={trade} className="flex justify-between items-end gap-2 group">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide truncate group-hover:text-white transition-colors">{trade}</span>
                    <div className="flex-grow border-b border-base-300 border-dotted mb-1 opacity-50"></div>
                    <span className="font-mono text-white font-bold text-sm bg-base-100/50 px-2 py-0.5 rounded border border-base-300/30 min-w-[80px] text-right">
                        ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                </div>
            )
            ))}
        </div>
      </div>
      
      {grandTotal === 0 && (
         <div className="p-6 text-center">
            <div className="inline-flex items-center gap-2 bg-yellow-900/20 text-yellow-500 px-4 py-2 rounded-full border border-yellow-900/30 text-xs font-bold uppercase tracking-widest">
                <CalculatorIcon /> No costs calculated yet
            </div>
         </div>
      )}
    </div>
  );
};

export default ProjectTotals;