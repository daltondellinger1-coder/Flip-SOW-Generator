
import React, { useMemo, useState, useEffect } from 'react';
import { LineItem, TradeCategory, UnitPrice, RoomDimensions } from '../types';
import { DollarSignIcon, DownloadIcon, ExclamationTriangleIcon, CheckCircleIcon, CalculatorIcon, SparklesIcon, RefreshIcon } from './icons';
import { exportToCsv } from '../services/csvExporter';

interface SummaryViewProps {
  lineItems: LineItem[];
  unitPrices: UnitPrice[];
  costMultiplier: number;
  targetResellValue: number;
  contingencyPercentage: number;
  onUpdateMultiplier: (val: number) => void;
  onUpdateResellValue: (val: number) => void;
  onUpdateContingency: (val: number) => void;
  address: string;
  roomDimensions: Record<string, Omit<RoomDimensions, 'room'>>;
  onOpenPricing: () => void;
}

const SummaryView: React.FC<SummaryViewProps> = ({ 
    lineItems, 
    unitPrices, 
    costMultiplier, 
    targetResellValue,
    contingencyPercentage,
    onUpdateMultiplier, 
    onUpdateResellValue,
    onUpdateContingency,
    address, 
    roomDimensions, 
    onOpenPricing 
}) => {
  
  const [localResellValue, setLocalResellValue] = useState<string>(targetResellValue > 0 ? targetResellValue.toString() : '');
  const [localContingency, setLocalContingency] = useState<string>(contingencyPercentage > 0 ? contingencyPercentage.toString() : '');

  // Keep local state in sync with prop if updated elsewhere
  useEffect(() => {
    if (targetResellValue > 0) {
      setLocalResellValue(targetResellValue.toString());
    }
    setLocalContingency(contingencyPercentage > 0 ? contingencyPercentage.toString() : '');
  }, [targetResellValue, contingencyPercentage]);

  const priceMap = useMemo(() => new Map<string, number>(
      unitPrices.map(p => [`${p.item}-${p.unit}`, p.price] as [string, number])
  ), [unitPrices]);

  const stats = useMemo(() => {
      let aboveGrade = 0;
      let belowGrade = 0;
      const excludedRooms = ['Exterior', 'Garage', 'Attic', 'Other', 'Utility/Mechanical'];
      
      Object.entries(roomDimensions).forEach(([room, dims]) => {
          const d = dims as Omit<RoomDimensions, 'room'>;
          if (d.length && d.width) {
              const area = Number(d.length) * Number(d.width);
              if (room === 'Basement') {
                  belowGrade += area;
              } else if (!excludedRooms.includes(room)) {
                  aboveGrade += area;
              }
          }
      });
      return { aboveGrade, belowGrade, total: aboveGrade + belowGrade };
  }, [roomDimensions]);

  const recommendedMultiplier = useMemo(() => {
      if (targetResellValue <= 0) return 1.0;
      if (targetResellValue < 160000) return 0.8;
      if (targetResellValue <= 275000) return 1.0;
      return 1.2;
  }, [targetResellValue]);

  const processedData = useMemo(() => {
    const tradeGroups: Record<string, { items: LineItem[], totalCost: number }> = {};
    let subTotal = 0;
    let missingQtyCount = 0;
    let missingPriceCount = 0;

    const visibleItems = lineItems.filter(item => item.item !== 'General Room Photo');

    visibleItems.forEach(item => {
        let cost = 0;
        if (item.manualPrice !== undefined) {
            cost = item.manualPrice;
        } else {
            if (item.quantity === undefined || item.quantity === 0) missingQtyCount++;
            const basePrice = item.unitPrice !== undefined ? item.unitPrice : (priceMap.get(`${item.item}-${item.unit}`) || 0);
            if (basePrice === 0) missingPriceCount++;
            
            const scaledPrice = basePrice * costMultiplier;
            cost = (item.quantity || 0) * scaledPrice;
        }

        subTotal += cost;

        if (!tradeGroups[item.trade]) {
            tradeGroups[item.trade] = { items: [], totalCost: 0 };
        }
        tradeGroups[item.trade].items.push(item);
        tradeGroups[item.trade].totalCost += cost;
    });

    const contingencyValue = subTotal * (contingencyPercentage / 100);
    const grandTotal = subTotal + contingencyValue;

    return { tradeGroups, subTotal, contingencyValue, grandTotal, missingQtyCount, missingPriceCount };
  }, [lineItems, priceMap, costMultiplier, contingencyPercentage]);

  const { tradeGroups, subTotal, contingencyValue, grandTotal, missingQtyCount, missingPriceCount } = processedData;
  const sortedTrades = Object.entries(tradeGroups).sort(([tradeA], [tradeB]) => tradeA.localeCompare(tradeB));
  const hasErrors = missingQtyCount > 0 || (missingPriceCount > 0 && subTotal > 0);

  const handleExport = () => {
      exportToCsv(lineItems.filter(i => i.item !== 'General Room Photo'), unitPrices, address);
  };

  const handleResellChange = (val: string) => {
      setLocalResellValue(val);
      const num = val === '' ? 0 : parseFloat(val);
      if (!isNaN(num)) {
          onUpdateResellValue(num);
          if (num > 0) {
              if (num < 160000) onUpdateMultiplier(0.8);
              else if (num <= 275000) onUpdateMultiplier(1.0);
              else onUpdateMultiplier(1.2);
          }
      }
  };

  const handleContingencyChange = (val: string) => {
      setLocalContingency(val);
      const num = val === '' ? 0 : parseFloat(val);
      if (!isNaN(num)) {
          onUpdateContingency(num);
      }
  };

  return (
    <div className="p-4 md:p-6 bg-base-100 text-white min-h-screen pb-24 print:bg-white print:text-black print:pb-0">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:mb-4">
            <div className="print:w-full">
              <h1 className="text-3xl font-bold text-brand-primary print:text-black">Project Budget & Scope</h1>
              <p className="text-lg text-gray-300 print:text-gray-600 print:text-sm">{address}</p>
            </div>
            <button
                onClick={onOpenPricing}
                className="flex items-center gap-2 bg-base-200 hover:bg-base-300 text-brand-primary px-4 py-2 rounded-md font-semibold text-sm border border-brand-primary/30 transition-colors shadow-sm no-print"
            >
                <DollarSignIcon /> 
                Manage Project Defaults
            </button>
        </div>

        {/* RENOVATION GRADE & CONTINGENCY CONTROL */}
        <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8 border-l-4 border-brand-primary no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* COLUMN 1: ARV & Contingency */}
                <div className="space-y-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSignIcon />
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Market Goal</h2>
                        </div>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary font-black text-xl">$</span>
                            <input 
                                type="number"
                                placeholder="Target Resell Value"
                                value={localResellValue}
                                onChange={(e) => handleResellChange(e.target.value)}
                                className="w-full bg-base-100 border border-brand-primary/30 rounded-lg p-4 pl-10 text-brand-primary font-mono font-black text-2xl outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                            <div className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Target Resell Value (ARV)</div>
                        </div>
                    </div>

                    <div className="pt-2">
                        <div className="flex items-center gap-2 mb-2">
                            <CalculatorIcon />
                            <h2 className="text-lg font-bold text-white uppercase tracking-tight">Repair Contingency</h2>
                        </div>
                        <div className="relative">
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">%</span>
                            <input 
                                type="number"
                                placeholder="0"
                                value={localContingency}
                                onChange={(e) => handleContingencyChange(e.target.value)}
                                className="w-full bg-base-100 border border-base-300 rounded-lg p-4 pr-10 text-white font-mono font-black text-2xl outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                            <div className="mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest pl-1">Safety Buffer added to total</div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Tier Visual */}
                <div className="flex flex-col justify-center items-center md:items-end border-t md:border-t-0 md:border-l border-base-300 pt-4 md:pt-0 md:pl-8">
                    <div className="flex flex-col items-center md:items-end">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black mb-1">Renovation Multiplier</span>
                        <div className="text-brand-primary font-black text-5xl font-mono leading-none">
                            {(costMultiplier * 100).toFixed(0)}%
                        </div>
                        <div className="mt-2">
                            {costMultiplier === recommendedMultiplier && targetResellValue > 0 ? (
                                <span className="bg-green-900/30 text-green-500 text-[9px] px-2 py-1 rounded font-black uppercase tracking-tighter flex items-center gap-1">
                                    <CheckCircleIcon /> Target Optimized
                                </span>
                            ) : targetResellValue > 0 ? (
                                <button 
                                    onClick={() => onUpdateMultiplier(recommendedMultiplier)}
                                    className="bg-brand-primary text-white text-[9px] px-2 py-1 rounded font-black uppercase tracking-tighter flex items-center gap-1 hover:bg-brand-secondary transition-all"
                                >
                                    <RefreshIcon /> Reset to Recommended ({(recommendedMultiplier * 100).toFixed(0)}%)
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 space-y-6 pt-6 border-t border-base-300">
                {/* PRESETS */}
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => onUpdateMultiplier(0.8)}
                        className={`p-3 rounded-lg border flex flex-col items-center transition-all ${costMultiplier === 0.8 ? 'bg-brand-primary border-brand-primary text-white shadow-lg scale-105' : 'bg-base-300 border-transparent text-gray-400 hover:bg-base-100'}`}
                    >
                        <span className="font-bold text-xs">Builder Grade</span>
                        <span className="text-[10px] opacity-70">Resell {"<"} $160k</span>
                    </button>
                    <button 
                        onClick={() => onUpdateMultiplier(1.0)}
                        className={`p-3 rounded-lg border flex flex-col items-center transition-all ${costMultiplier === 1.0 ? 'bg-brand-primary border-brand-primary text-white shadow-lg scale-105' : 'bg-base-300 border-transparent text-gray-400 hover:bg-base-100'}`}
                    >
                        <span className="font-bold text-xs">Standard</span>
                        <span className="text-[10px] opacity-70">$160k - $275k</span>
                    </button>
                    <button 
                        onClick={() => onUpdateMultiplier(1.2)}
                        className={`p-3 rounded-lg border flex flex-col items-center transition-all ${costMultiplier === 1.2 ? 'bg-brand-primary border-brand-primary text-white shadow-lg scale-105' : 'bg-base-300 border-transparent text-gray-400 hover:bg-base-100'}`}
                    >
                        <span className="font-bold text-xs">High End</span>
                        <span className="text-[10px] opacity-70">Resell {">"} $275k</span>
                    </button>
                </div>

                {/* SLIDER */}
                <div className="relative pt-4">
                    <input 
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.01"
                        value={costMultiplier}
                        onChange={(e) => onUpdateMultiplier(parseFloat(e.target.value))}
                        className="w-full h-2 bg-base-300 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                        <span>Min (0.5x)</span>
                        <span>Fine-Tune Multiplier</span>
                        <span>Max (1.5x)</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-base-200 p-6 rounded-lg shadow-lg mb-8 border-l-4 border-brand-primary print:bg-white print:border print:shadow-none print:p-4">
            <div className="flex items-center gap-2 mb-4">
                <CalculatorIcon />
                <h2 className="text-xl font-bold text-white print:text-black">House Statistics</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
                <div className="bg-base-300/50 p-4 rounded-lg border border-base-300 print:bg-gray-50 print:border-gray-200">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 print:text-gray-600">Gross Living Area</p>
                    <p className="text-2xl font-mono font-bold text-white print:text-black">
                        {stats.aboveGrade.toLocaleString()} <span className="text-sm text-brand-primary print:text-black">SF</span>
                    </p>
                </div>
                <div className="bg-base-300/50 p-4 rounded-lg border border-base-300 print:bg-gray-50 print:border-gray-200">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 print:text-gray-600">Basement</p>
                    <p className="text-2xl font-mono font-bold text-white print:text-black">
                        {stats.belowGrade.toLocaleString()} <span className="text-sm text-brand-primary print:text-black">SF</span>
                    </p>
                </div>
                <div className="bg-base-300/50 p-4 rounded-lg border border-base-300 print:bg-gray-50 print:border-gray-200">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 print:text-gray-600">Total Calculated Area</p>
                    <p className="text-2xl font-mono font-bold text-brand-primary print:text-black">
                        {stats.total.toLocaleString()} <span className="text-sm">SF</span>
                    </p>
                </div>
            </div>
        </div>

        <div className={`bg-base-200 p-6 rounded-lg shadow-lg mb-8 border-l-4 ${hasErrors ? 'border-yellow-500' : 'border-green-500'} print:bg-white print:border print:shadow-none print:p-4`}>
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2 print:text-black">
                    {hasErrors ? <ExclamationTriangleIcon /> : <CheckCircleIcon />}
                    Estimated Project Cost
                </h2>
                <p className="text-sm text-gray-400 mt-1 no-print">
                    {hasErrors ? "Missing some quantities or prices." : "Your budget data looks complete."}
                </p>
             </div>
             <div className="text-right">
                 <p className="text-sm text-gray-400 print:text-gray-600 font-bold uppercase text-[10px]">Adjusted Total</p>
                 <p className="text-3xl font-mono font-black text-brand-primary print:text-black">${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                 {contingencyPercentage > 0 && (
                     <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                        Includes {contingencyPercentage}% Contingency
                     </p>
                 )}
             </div>
          </div>
          <button 
            onClick={handleExport}
            className="w-full mt-6 bg-brand-primary text-white py-3 px-4 rounded-md font-bold hover:bg-brand-secondary flex items-center justify-center gap-2 shadow-lg no-print transition-all"
          >
            <DownloadIcon />
            Download FlipperForce CSV
          </button>
        </div>

        {sortedTrades.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter print:text-black">Cost Breakdown</h2>
            {sortedTrades.map(([trade, data]: [string, { items: LineItem[], totalCost: number }]) => (
              <div key={trade} className="bg-base-200 rounded-lg shadow-md overflow-hidden print:bg-white print:shadow-none print:break-inside-avoid border border-base-300">
                <div className="bg-base-300 p-4 flex justify-between items-center print:bg-gray-100 print:border-b print:border-gray-300 border-b border-base-300">
                    <h3 className="text-lg font-bold text-white print:text-black">{trade}</h3>
                    <span className="font-mono font-bold text-brand-primary print:text-black">${data.totalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400 print:text-black">
                        <thead className="text-xs text-gray-300 uppercase bg-base-200 border-b border-base-300 print:bg-white print:text-black print:border-gray-300 font-bold">
                            <tr>
                                <th className="px-4 py-3">Item / Action</th>
                                <th className="px-4 py-3 text-center">Details</th>
                                <th className="px-4 py-3 text-right">Base Pricing</th>
                                <th className="px-4 py-3 text-right">Scaled Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.items.map(item => {
                                const isLumpSum = item.manualPrice !== undefined;
                                const unitPrice = item.unitPrice !== undefined ? item.unitPrice : (priceMap.get(`${item.item}-${item.unit}`) || 0);
                                
                                const scaledPrice = isLumpSum ? unitPrice : (unitPrice * costMultiplier);
                                const total = isLumpSum ? item.manualPrice! : (item.quantity || 0) * scaledPrice;

                                return (
                                    <tr key={item.id} className="border-b border-base-300 hover:bg-base-300/30 transition-colors print:border-gray-200">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-white print:text-black">{item.item}</div>
                                            <div className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">{item.action} • {item.room}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-xs">
                                            {isLumpSum ? (
                                                <span className="bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-black text-[9px] uppercase">Lump Sum</span>
                                            ) : (
                                                `${item.quantity || 0} ${item.unit}`
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-xs">
                                            {isLumpSum ? '-' : `$${unitPrice.toFixed(2)}`}
                                        </td>
                                        <td className={`px-4 py-3 text-right font-mono font-bold ${isLumpSum ? 'text-brand-primary' : 'text-white'} print:text-black`}>
                                            ${total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </div>
            ))}
            {contingencyPercentage > 0 && (
                <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-lg flex justify-between items-center print:text-black print:border-gray-300">
                    <span className="font-bold uppercase tracking-widest text-xs text-brand-primary">Project Buffer ({contingencyPercentage}%)</span>
                    <span className="font-mono font-bold text-brand-primary">${contingencyValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryView;
