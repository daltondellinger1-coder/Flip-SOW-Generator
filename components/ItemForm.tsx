
// Fix for SpeechRecognition API not being in standard TS DOM types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LineItem, Action, TradeCategory, MaterialsProvidedBy, RoomDimensions, UnitPrice, Photo } from '../types';
import { ROOMS, ACTIONS, ITEMS, TRADE_MAP, UNITS, MATERIALS_PROVIDED_BY } from '../constants';
import { compressImage } from '../services/imageUtils'; 
import { CameraIcon, XIcon, DollarSignIcon, CalculatorIcon, PhotographIcon } from './icons';
import { calculateDimensionBasedQuantity } from '../services/calculationUtils';

interface ItemFormProps {
  onAddItems: (items: Omit<LineItem, 'id'>[]) => void;
  onUpdateDimensions: (dimensions: RoomDimensions[]) => void;
  onClose: () => void;
  initialRoom?: string;
  isOnline: boolean;
  allRoomDimensions: Record<string, Omit<RoomDimensions, 'room'>>;
  initialItemData?: LineItem | null;
  unitPrices: UnitPrice[]; 
}

const ItemForm: React.FC<ItemFormProps> = ({ 
    onAddItems, 
    onUpdateDimensions, 
    onClose, 
    initialRoom, 
    isOnline, 
    allRoomDimensions,
    initialItemData,
    unitPrices
}) => {
  const [room, setRoom] = useState<string>(initialItemData?.room || initialRoom || ROOMS[0]);
  
  // selectedTrade acts as the primary filter
  const [selectedTrade, setSelectedTrade] = useState<TradeCategory | 'All'>(initialItemData?.trade || 'All');

  // Derive unique trades available for the current room
  const tradesForRoom = useMemo(() => {
    const trades = new Set<TradeCategory>();
    ITEMS.forEach(itemKey => {
        const map = TRADE_MAP[itemKey];
        if (room === 'Other' || map.validRooms?.includes(room)) {
            trades.add(map.trade);
        }
    });
    return Array.from(trades).sort();
  }, [room]);

  // Available items filtered by Room AND currently selected Trade
  const availableItems = useMemo(() => {
    let filtered = ITEMS;
    if (room !== 'Other') {
        filtered = filtered.filter(itemKey => TRADE_MAP[itemKey].validRooms?.includes(room));
    }
    if (selectedTrade !== 'All') {
        filtered = filtered.filter(itemKey => TRADE_MAP[itemKey].trade === selectedTrade);
    }
    return filtered.sort((a, b) => {
        if (selectedTrade === 'All') {
            const tradeA = TRADE_MAP[a].trade;
            const tradeB = TRADE_MAP[b].trade;
            if (tradeA !== tradeB) return tradeA.localeCompare(tradeB);
        }
        return a.localeCompare(b);
    });
  }, [room, selectedTrade]);

  const [item, setItem] = useState<string>(initialItemData?.item || '');
  const [description, setDescription] = useState(initialItemData?.notes || '');
  const [specs, setSpecs] = useState(initialItemData?.specs || '');
  const [action, setAction] = useState<Action>(initialItemData?.action || ACTIONS[0]);
  const [trade, setTrade] = useState<TradeCategory>(initialItemData?.trade || 'Misc');
  const [quantity, setQuantity] = useState<number | undefined>(initialItemData?.quantity);
  const [unit, setUnit] = useState<string>(initialItemData?.unit || UNITS[0]);
  const [manualPrice, setManualPrice] = useState<number | undefined>(initialItemData?.manualPrice);
  const [photos, setPhotos] = useState<Photo[]>(initialItemData?.photos || (initialItemData?.photo ? [initialItemData.photo] : []));
  const [materialsNeeded, setMaterialsNeeded] = useState(initialItemData?.materialsNeeded || '');
  const [materialsProvidedBy, setMaterialsProvidedBy] = useState<MaterialsProvidedBy>(initialItemData?.materialsProvidedBy || 'Contractor');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [needsVerification, setNeedsVerification] = useState(initialItemData?.needsVerification || false);
  const [applyToAllRooms, setApplyToAllRooms] = useState(false);
  
  const userEditedQuantity = useRef(!!initialItemData);
  const prevItem = useRef<string>(initialItemData?.item || '');

  const systemPrice = useMemo(() => {
    if (!item || !unit) return 0;
    const key = `${item}-${unit}`;
    return unitPrices.find(p => p.id === key)?.price || 0;
  }, [item, unit, unitPrices]);

  useEffect(() => {
    if (!initialItemData) {
        setSelectedTrade('All');
        setItem('');
    }
  }, [room, initialItemData]);

  useEffect(() => {
    if (!item) return;
    const mapEntry = TRADE_MAP[item];
    if (mapEntry) {
      setTrade(mapEntry.trade);
      const isChange = prevItem.current !== item;
      if (isChange) {
         setUnit(mapEntry.defaultUnit);
         setAction(mapEntry.defaultAction);
         if (!userEditedQuantity.current) {
            setQuantity(calculateDimensionBasedQuantity(item, allRoomDimensions[room]));
         }
         prevItem.current = item;
      }
    }
  }, [item, room, allRoomDimensions]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    setUploadProgress({ current: 0, total: files.length });
    const newPhotos: Photo[] = [];
    for (let i = 0; i < files.length; i++) {
        try {
            const base64 = await compressImage(files[i]);
            newPhotos.push({ base64, name: files[i].name });
            setUploadProgress(prev => prev ? { ...prev, current: i + 1 } : null);
        } catch (error) { console.error("Upload failed", error); }
    }
    setPhotos(prev => [...prev, ...newPhotos]);
    setUploadProgress(null);
    e.target.value = '';
  };

  const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return alert("Please select a work item.");
    const baseItem: Omit<LineItem, 'id'> = {
      room, item, action, trade, quantity, unit,
      notes: description, specs, photos, materialsNeeded, materialsProvidedBy, manualPrice,
      needsVerification
    };
    onAddItems([baseItem]);
    onClose();
  };

  const groupedItems = useMemo<Record<string, string[]>>(() => {
      const groups: Record<string, string[]> = {};
      availableItems.forEach(itemKey => {
          const t = TRADE_MAP[itemKey].trade;
          if (!groups[t]) groups[t] = [];
          groups[t].push(itemKey);
      });
      return groups;
  }, [availableItems]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto border border-base-300">
        <div className="p-4 border-b border-base-300 flex justify-between items-center sticky top-0 bg-base-100 z-10">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">{initialItemData ? 'Edit Details' : 'Add Line Item'}</h2>
          <button onClick={onClose} className="text-content hover:text-white p-2 transition-colors"><XIcon /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">Room / Area</label>
              <select className="w-full bg-base-200 border border-base-300 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all" value={room} onChange={(e) => setRoom(e.target.value)}>
                {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest font-black text-brand-primary ml-1">Trade Category (Filter)</label>
              <select 
                className="w-full bg-brand-primary/10 border border-brand-primary/30 rounded-xl p-4 text-brand-primary font-black focus:ring-2 focus:ring-brand-primary outline-none transition-all" 
                value={selectedTrade} 
                onChange={(e) => setSelectedTrade(e.target.value as TradeCategory | 'All')}
              >
                <option value="All">All Trade Categories</option>
                {tradesForRoom.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">Select Work Item</label>
            <select 
              className="w-full bg-base-100 border border-base-300 rounded-xl p-4 text-white text-lg font-bold focus:ring-2 focus:ring-brand-primary outline-none transition-all shadow-inner" 
              value={item} 
              onChange={(e) => setItem(e.target.value)}
              required
            >
              <option value="">-- Select Description of Work --</option>
              {selectedTrade === 'All' ? (
                  Object.entries(groupedItems).sort(([a],[b]) => a.localeCompare(b)).map(([tradeName, items]: [string, string[]]) => (
                      <optgroup key={tradeName} label={tradeName.toUpperCase()} className="bg-base-300 text-brand-primary font-black">
                          {items.map(i => <option key={i} value={i} className="bg-base-100 text-white font-medium">{i}</option>)}
                      </optgroup>
                  ))
              ) : (
                  availableItems.map(i => <option key={i} value={i}>{i}</option>)
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">Action</label>
              <select className="w-full bg-base-200 border border-base-300 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-brand-primary outline-none" value={action} onChange={(e) => setAction(e.target.value as Action)}>
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">Material Source</label>
                <select className="w-full bg-base-200 border border-base-300 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-brand-primary outline-none" value={materialsProvidedBy} onChange={(e) => setMaterialsProvidedBy(e.target.value as MaterialsProvidedBy)}>
                    {MATERIALS_PROVIDED_BY.map(p => <option key={p} value={p}>{p} Provided</option>)}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">Qty</label>
              <input type="number" className="w-full bg-base-200 border border-base-300 rounded-xl p-4 text-white font-mono text-xl focus:ring-2 focus:ring-brand-primary outline-none" value={quantity ?? ''} onChange={(e) => {
                    setQuantity(e.target.value === '' ? undefined : parseFloat(e.target.value));
                    userEditedQuantity.current = true;
                }} 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 ml-1">Unit</label>
              <select className="w-full bg-base-200 border border-base-300 rounded-xl p-4 text-white font-black uppercase text-xs focus:ring-2 focus:ring-brand-primary outline-none" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
                <div className="flex justify-between items-center ml-1">
                    <label className="block text-[10px] uppercase tracking-widest font-black text-gray-500 flex items-center gap-1">
                        <DollarSignIcon /> Total Price ($)
                    </label>
                    {systemPrice > 0 && (
                        <div className="text-[10px] font-black text-brand-primary uppercase">
                            Avg: ${systemPrice.toFixed(2)} / {unit}
                        </div>
                    )}
                </div>
                <input type="number" placeholder="Enter quote total" className="w-full bg-brand-primary/5 border border-brand-primary/30 rounded-xl p-4 text-brand-primary font-mono font-black text-xl outline-none focus:ring-2 focus:ring-brand-primary shadow-inner" value={manualPrice ?? ''} onChange={(e) => setManualPrice(e.target.value === '' ? undefined : parseFloat(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-base-300">
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex justify-between ml-1">
                <span>Task Attachments ({photos.length})</span>
                {uploadProgress && <span className="text-brand-primary animate-pulse font-black">Processing Media...</span>}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {photos.map((p, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-24 h-24 bg-black rounded-xl overflow-hidden border border-base-300 group shadow-md">
                        <img src={p.base64} alt="Thumb" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><XIcon /></button>
                    </div>
                ))}
                <label className="flex-shrink-0 w-24 h-24 flex flex-col items-center justify-center bg-base-200 border-2 border-dashed border-base-300 rounded-xl cursor-pointer hover:bg-base-300 hover:border-brand-primary transition-all group shadow-sm active:scale-95">
                    <CameraIcon />
                    <span className="text-[10px] font-black uppercase mt-1 text-gray-500 group-hover:text-brand-primary">Snap</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={!!uploadProgress} />
                </label>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-base-300">
            <button type="button" onClick={onClose} className="flex-1 bg-base-200 text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-base-300 transition-colors shadow-lg active:scale-95">Cancel</button>
            <button type="submit" disabled={!!uploadProgress} className="flex-1 bg-brand-primary text-white font-black uppercase tracking-widest py-4 rounded-xl hover:bg-brand-secondary transition-all shadow-xl active:scale-95 disabled:opacity-50">
                {initialItemData ? 'Update Scope' : 'Add to Scope'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
