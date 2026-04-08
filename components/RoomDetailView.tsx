
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { LineItem, RoomDimensions, UnitPrice, SubArea, RoomTemplate, Photo } from '../types';
import { ROOM_TEMPLATES, ROOMS } from '../constants';
import ItemList from './ItemList';
import { CalculatorIcon, PlusIcon, TrashIcon, CameraIcon, PhotographIcon, XIcon, SparklesIcon } from './icons';
import { compressImage } from '../services/imageUtils';
import PhotoEditorModal from './PhotoEditorModal';

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

interface RoomDetailViewProps {
  roomName: string;
  itemsInRoom: LineItem[];
  dimensions?: Omit<RoomDimensions, 'room'>;
  onUpdateDimensions: (updatedValues: Partial<Omit<RoomDimensions, 'room'>>) => void;
  onGoBack: () => void;
  onAddItem: () => void;
  onDeleteItem: (id: number) => void;
  setEditingItem: (item: LineItem) => void;
  onAutoCalculate: () => void;
  onAddTemplate?: (items: string[]) => void;
  onDeleteAllItems?: () => void;
  unitPrices: UnitPrice[]; 
  onDuplicateItem: (item: LineItem) => void; 
  onSwitchRoom: (room: string) => void; 
  onDirectAdd: (item: Omit<LineItem, 'id'>) => void;
  onUpdateItem: (item: LineItem) => void;
}

const RoomDetailView: React.FC<RoomDetailViewProps> = ({ 
    roomName, 
    itemsInRoom, 
    dimensions, 
    onUpdateDimensions, 
    onGoBack, 
    onAddItem, 
    onDeleteItem, 
    setEditingItem,
    onAutoCalculate,
    onAddTemplate,
    onDeleteAllItems,
    unitPrices,
    onDuplicateItem,
    onSwitchRoom,
    onDirectAdd,
    onUpdateItem
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [editingPhotoItem, setEditingPhotoItem] = useState<LineItem | null>(null);
  
  const [showAddSubArea, setShowAddSubArea] = useState(false);
  const [newSubAreaName, setNewSubAreaName] = useState('Closet');
  const [newSubAreaL, setNewSubAreaL] = useState('');
  const [newSubAreaW, setNewSubAreaW] = useState('');

  useEffect(() => {
    if (scrollRef.current) {
        const activeBtn = scrollRef.current.querySelector('[data-active="true"]');
        if (activeBtn) activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [roomName]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setUploadProgress({ current: 0, total: files.length });

    for (let i = 0; i < files.length; i++) {
        try {
            const base64 = await compressImage(files[i]);
            const newItem: Omit<LineItem, 'id'> = {
                room: roomName,
                item: 'General Room Photo',
                trade: 'Misc',
                action: '— (Inspector Only)',
                quantity: 1,
                unit: 'EA',
                notes: 'Quick photo added from room view',
                photos: [{ base64, name: files[i].name }],
                materialsProvidedBy: 'Contractor'
            };
            onDirectAdd(newItem);
            setUploadProgress(prev => prev ? { ...prev, current: i + 1 } : null);
        } catch (error) {
            console.error("Batch photo add failed", error);
        }
    }

    setUploadProgress(null);
    e.target.value = '';
  };

  const handleSaveEditedPhoto = (newBase64: string) => {
    if (editingPhotoItem && editingPhotoItem.photos) {
      const updatedPhotos = [...editingPhotoItem.photos];
      updatedPhotos[0] = { ...updatedPhotos[0], base64: newBase64 };
      onUpdateItem({ ...editingPhotoItem, photos: updatedPhotos });
      setEditingPhotoItem(null);
    }
  };

  const { tasks, generalPhotos } = useMemo(() => {
    const tasks: LineItem[] = [];
    const generalPhotos: LineItem[] = [];
    itemsInRoom.forEach(item => {
        if (item.item === 'General Room Photo') generalPhotos.push(item);
        else tasks.push(item);
    });
    return { tasks, generalPhotos };
  }, [itemsInRoom]);

  const roomTotalCost = useMemo(() => {
    const priceMap = new Map<string, number>(unitPrices.map(p => [`${p.item}-${p.unit.toLowerCase()}`, p.price]));
    return tasks.reduce((sum, item) => {
        if (item.manualPrice != null) return sum + item.manualPrice;
        const price = item.unitPrice !== undefined ? item.unitPrice : (priceMap.get(`${item.item}-${(item.unit || '').toLowerCase()}`) || 0);
        return sum + (item.quantity || 0) * price;
    }, 0);
  }, [tasks, unitPrices]);

  const currentTemplates = useMemo(() => {
      const generic = ROOM_TEMPLATES['General'] || [];
      const specificKey = Object.keys(ROOM_TEMPLATES).find(k => roomName.toLowerCase().includes(k.toLowerCase()));
      const specific = specificKey ? ROOM_TEMPLATES[specificKey] : [];
      return [...generic, ...specific];
  }, [roomName]);

  return (
    <div className="pb-24 print:pb-0 print:p-0 relative bg-base-100 min-h-screen">
      {/* Dynamic Sub-nav - Quick switcher for adjacent rooms */}
      <div 
        ref={scrollRef}
        className="w-full bg-base-200 border-b border-base-300 py-2 px-4 flex gap-2 overflow-x-auto no-scrollbar no-print sticky top-0 z-20 shadow-sm"
      >
          {ROOMS.map(room => (
            <button
                key={room}
                data-active={room === roomName}
                onClick={() => onSwitchRoom(room)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                    room === roomName 
                        ? 'bg-brand-primary border-brand-primary text-white shadow-lg' 
                        : 'bg-base-100 text-gray-500 border-base-300 hover:bg-base-300 hover:text-white'
                }`}
            >
                {room}
            </button>
          ))}
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
        
        {/* Modern Header Layout */}
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <button onClick={onGoBack} className="p-3 text-content hover:text-white no-print bg-base-200 rounded-xl transition-all active:scale-95 shadow-sm border border-base-300">
                    <ArrowLeftIcon />
                </button>
                <div className="bg-brand-primary/10 px-4 py-2 rounded-xl border border-brand-primary/20 flex flex-col items-center justify-center min-w-[140px] shadow-sm print:bg-white print:border-gray-300">
                    <span className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-black mb-0.5">Room Budget</span>
                    <span className="font-mono font-black text-2xl text-brand-primary print:text-black leading-none py-1">
                        ${roomTotalCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </span>
                </div>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter print:text-black leading-tight">{roomName}</h1>
        </div>

        {/* Quick Templates - Horizontal Scroll Tray */}
        {currentTemplates.length > 0 && (
            <div className="space-y-2 no-print">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 pl-1">
                    <SparklesIcon /> Quick Add Templates
                </div>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                    {currentTemplates.map((t, idx) => (
                        <button 
                            key={idx}
                            onClick={() => onAddTemplate && onAddTemplate(t.items)}
                            className="flex-shrink-0 bg-base-200 border border-base-300 p-4 rounded-xl hover:border-brand-primary hover:bg-base-300 transition-all text-left w-44 shadow-sm active:scale-95 group"
                        >
                            <span className="block text-sm font-bold text-white mb-1 group-hover:text-brand-primary transition-colors">{t.name}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tight">{t.items.length} Work Items</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Dimension & Templates sections */}
        <div className="bg-base-200 p-6 rounded-2xl shadow-xl print:bg-white print:shadow-none border border-base-300 space-y-6 relative overflow-hidden group">
            {/* Subtle corner accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full pointer-events-none transition-all group-focus-within:bg-brand-primary/10"></div>
            
            <div className="flex justify-between items-center relative z-10">
                <h2 className="text-xs font-black text-gray-500 flex items-center gap-2 uppercase tracking-[0.2em]">
                    <CalculatorIcon /> Physical Footprint
                </h2>
                <button onClick={onAutoCalculate} className="text-[9px] uppercase tracking-widest bg-brand-primary text-white px-4 py-2 rounded-lg font-black shadow-lg hover:bg-brand-secondary transition-all active:scale-95">Auto-Calc Quantities</button>
            </div>
            
            <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Length (Ft)</label>
                    <input type="number" value={dimensions?.length || ''} onChange={(e) => onUpdateDimensions({ length: parseFloat(e.target.value) })} className="w-full bg-base-100 border border-base-300 p-4 rounded-xl text-white font-mono text-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all shadow-inner" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Width (Ft)</label>
                    <input type="number" value={dimensions?.width || ''} onChange={(e) => onUpdateDimensions({ width: parseFloat(e.target.value) })} className="w-full bg-base-100 border border-base-300 p-4 rounded-xl text-white font-mono text-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all shadow-inner" placeholder="0" />
                </div>
            </div>
        </div>

        {uploadProgress && (
            <div className="bg-brand-primary/10 border border-brand-primary/30 p-4 rounded-2xl animate-pulse flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-brand-primary tracking-widest">
                    <span>Compressing Media...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                </div>
                <div className="w-full bg-base-300 h-2 rounded-full overflow-hidden">
                    <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }} />
                </div>
            </div>
        )}

        {generalPhotos.length > 0 && (
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2 pl-1">
                    <PhotographIcon /> Room Reference Media ({generalPhotos.length})
                </h3>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                    {generalPhotos.map(photoItem => (
                        <div 
                            key={photoItem.id} 
                            className="relative flex-shrink-0 w-32 aspect-square bg-black rounded-xl overflow-hidden border-2 border-base-300 cursor-pointer hover:border-brand-primary transition-all group shadow-md"
                            onClick={() => setEditingPhotoItem(photoItem)}
                        >
                             {(photoItem.photos?.[0] || photoItem.photo) && (
                                <img src={(photoItem.photos?.[0]?.base64 || photoItem.photo?.base64)} alt="Room" className="w-full h-full object-cover" />
                             )}
                             <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm("Delete photo?")) onDeleteItem(photoItem.id);
                                }}
                                className="absolute top-1 right-1 bg-black/60 text-white p-1.5 rounded-lg hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                             >
                                 <TrashIcon />
                             </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Task List Header */}
        <div className="space-y-4 pt-4">
            <div className="flex justify-between items-end border-b border-base-300 pb-3 pl-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Scope Items</h2>
                <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 px-4 py-2.5 cursor-pointer bg-base-200 border border-base-300 rounded-xl hover:bg-base-300 text-gray-400 transition-all shadow-sm active:scale-95">
                         <CameraIcon />
                         <span className="text-[10px] font-black uppercase tracking-widest">Snap</span>
                         <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={!!uploadProgress} />
                    </label>
                    <button onClick={onAddItem} className="bg-brand-primary text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-brand-secondary transition-all active:scale-95">Add Work</button>
                </div>
            </div>
            
            <div className="space-y-4">
                <ItemList lineItems={tasks} onDeleteItem={onDeleteItem} setEditingItem={setEditingItem} onUpdateItem={onUpdateItem} onAddItem={onAddItem} onDuplicateItem={onDuplicateItem} unitPrices={unitPrices} />
            </div>
        </div>
      </div>

      {editingPhotoItem && (editingPhotoItem.photos?.[0] || editingPhotoItem.photo) && (
        <PhotoEditorModal
          isOpen={true}
          imageSrc={editingPhotoItem.photos?.[0]?.base64 || editingPhotoItem.photo!.base64}
          onClose={() => setEditingPhotoItem(null)}
          onSave={handleSaveEditedPhoto}
          onDelete={() => { if (window.confirm("Delete photo?")) { onDeleteItem(editingPhotoItem.id); setEditingPhotoItem(null); } }}
        />
      )}
    </div>
  );
};

export default RoomDetailView;
