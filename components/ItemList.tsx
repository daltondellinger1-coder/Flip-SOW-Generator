import React, { useState, useMemo } from 'react';
import { LineItem, UnitPrice, MaterialsProvidedBy } from '../types';
import { TrashIcon, CameraIcon, PencilIcon, DuplicateIcon, DollarSignIcon, CubeIcon } from './icons';
import { MATERIALS_PROVIDED_BY } from '../constants';

interface ItemListProps {
  lineItems: LineItem[];
  onDeleteItem: (id: number) => void;
  setEditingItem: (item: LineItem) => void;
  onUpdateItem: (item: LineItem) => void; 
  onAddItem?: () => void;
  onDuplicateItem?: (item: LineItem) => void;
  unitPrices: UnitPrice[];
}

const ItemList: React.FC<ItemListProps> = ({ lineItems, onDeleteItem, setEditingItem, onUpdateItem, onAddItem, onDuplicateItem, unitPrices }) => {
  const [localPrices, setLocalPrices] = useState<Record<number, string>>({});
  const [localQuantities, setLocalQuantities] = useState<Record<number, string>>({});

  const priceMap = useMemo(() => new Map<string, number>(
    unitPrices.map(p => [`${p.item}-${p.unit.toLowerCase()}`, p.price])
  ), [unitPrices]);

  const handleManualPriceChange = (item: LineItem, value: string) => {
    setLocalPrices(prev => ({ ...prev, [item.id]: value }));
  };

  const handleManualPriceBlur = (item: LineItem) => {
    const val = localPrices[item.id];
    if (val === undefined) return;

    const numericValue = val === '' ? undefined : parseFloat(val);
    if (numericValue !== item.manualPrice) {
        onUpdateItem({ ...item, manualPrice: numericValue });
    }
  };

  const handleQuantityChange = (item: LineItem, value: string) => {
    setLocalQuantities(prev => ({ ...prev, [item.id]: value }));
  };

  const handleQuantityBlur = (item: LineItem) => {
    const val = localQuantities[item.id];
    if (val === undefined) return;

    const numericValue = val === '' ? 0 : parseFloat(val);
    if (numericValue !== item.quantity) {
        onUpdateItem({ ...item, quantity: numericValue });
    }
  };

  const handleMaterialProviderChange = (item: LineItem, provider: MaterialsProvidedBy) => {
      onUpdateItem({ ...item, materialsProvidedBy: provider });
  };

  if (lineItems.length === 0) {
    return (
      <div className="text-center p-10 text-gray-400 flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-2">No work items yet</h2>
        <p className="mb-4">Use the AI Wand or Add Item manually.</p>
      </div>
    );
  }

  return (
    <div className="bg-base-200 rounded-lg shadow-md overflow-hidden">
      <ul className="divide-y divide-base-300">
        {lineItems.sort((a,b) => a.id - b.id).map(item => {
          const displayPrice = localPrices[item.id] !== undefined ? localPrices[item.id] : (item.manualPrice?.toString() || '');
          const displayQty = localQuantities[item.id] !== undefined ? localQuantities[item.id] : (item.quantity?.toString() || '0');
          const isLumpSum = item.manualPrice !== undefined;
          
          const systemUnitPrice = priceMap.get(`${item.item}-${(item.unit || '').toLowerCase()}`) || 0;

          return (
            <li key={item.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-base-300/50 transition-colors">
              <div className="flex-1 min-w-0 flex items-start gap-4">
                {/* Small Thumbnail Indicator */}
                {item.photo && (
                    <div className="w-12 h-12 bg-black rounded overflow-hidden flex-shrink-0 border border-brand-primary/30 mt-1 shadow-sm">
                        <img src={item.photo.base64} alt="Task" className="w-full h-full object-cover" />
                    </div>
                )}
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                        <p className="font-bold text-white text-lg leading-tight truncate max-w-[200px]">{item.item}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-wider ${
                            item.action === 'REPLACE' ? 'bg-red-900/40 text-red-400' :
                            item.action === 'PAINT' ? 'bg-blue-900/40 text-blue-400' :
                            item.action === 'CLEAN' ? 'bg-green-900/40 text-green-400' :
                            'bg-brand-primary text-white'
                        }`}>
                            {item.action}
                        </span>
                        {item.specs && (
                            <span className="text-xs font-medium text-gray-400 border border-base-300 px-2 py-0.5 rounded">
                                {item.specs}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mt-1">
                        {/* Inline Quantity Input */}
                        <div className="flex items-center gap-2">
                             <input 
                                type="number"
                                value={displayQty}
                                onChange={(e) => handleQuantityChange(item, e.target.value)}
                                onBlur={() => handleQuantityBlur(item)}
                                className="w-20 bg-base-100 border border-base-300 rounded px-2 py-1 text-sm font-mono text-white focus:ring-1 focus:ring-brand-primary outline-none"
                             />
                             <span className="text-xs font-bold text-gray-500 uppercase">{item.unit}</span>
                             <span className="text-[10px] text-gray-500 italic">({item.trade})</span>
                        </div>

                        {/* Inline Material Provider Dropdown */}
                        <div className="flex items-center gap-1.5 bg-base-100/50 px-2 py-1 rounded-md border border-base-300/50">
                            <span className="text-[10px] text-gray-500 uppercase font-black"><CubeIcon /> Materials:</span>
                            <select 
                                className={`text-[10px] font-black uppercase tracking-widest bg-transparent outline-none cursor-pointer ${
                                    item.materialsProvidedBy === 'Owner' ? 'text-brand-primary' : 'text-gray-400'
                                }`}
                                value={item.materialsProvidedBy || 'Contractor'}
                                onChange={(e) => handleMaterialProviderChange(item, e.target.value as MaterialsProvidedBy)}
                            >
                                {MATERIALS_PROVIDED_BY.map(p => <option key={p} value={p} className="bg-base-100">{p}</option>)}
                            </select>
                        </div>
                    </div>
                    {item.notes && <p className="text-xs text-gray-400 italic mt-2 border-l-2 border-base-300 pl-2">"{item.notes}"</p>}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Inline Quick-Price Input */}
                <div className="relative group/input flex flex-col items-end">
                    <span className="text-[10px] text-gray-500 uppercase font-bold mb-1 mr-1">Quote Price</span>
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within/input:text-brand-primary transition-colors">
                            <span className="text-sm font-bold">$</span>
                        </div>
                        <input 
                            type="number"
                            placeholder={systemUnitPrice > 0 ? systemUnitPrice.toFixed(2) : "0.00"}
                            value={displayPrice}
                            onChange={(e) => handleManualPriceChange(item, e.target.value)}
                            onBlur={() => handleManualPriceBlur(item)}
                            className={`w-32 bg-base-100 border rounded-md py-2 pl-7 pr-2 text-sm font-mono focus:ring-2 focus:ring-brand-primary outline-none transition-all ${
                                isLumpSum 
                                ? 'border-brand-primary text-brand-primary font-bold bg-brand-primary/5 shadow-inner' 
                                : 'border-base-300 text-gray-400 hover:border-gray-500'
                            }`}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 mt-4 sm:mt-0">
                  <button 
                    onClick={(e) => { e.stopPropagation(); if (onDuplicateItem) onDuplicateItem(item); }} 
                    className="p-2 text-gray-400 hover:text-brand-primary"
                    title="Duplicate"
                  >
                    <DuplicateIcon />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} 
                    className="p-2 text-gray-400 hover:text-white"
                    title="Edit Details"
                  >
                    <PencilIcon />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); }} 
                    className="p-2 text-red-500 hover:text-red-400"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ItemList;