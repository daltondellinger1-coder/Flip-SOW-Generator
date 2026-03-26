
import React, { useMemo, useState } from 'react';
import { LineItem } from '../types';
import { TrashIcon, PhotographIcon, CubeIcon } from './icons';

interface GalleryViewProps {
  lineItems: LineItem[];
  onRemovePhoto: (item: LineItem) => void;
  address: string;
}

const GalleryView: React.FC<GalleryViewProps> = ({ lineItems, onRemovePhoto, address }) => {
  const [selectedImage, setSelectedImage] = useState<{ src: string; item: string; notes?: string; action: string } | null>(null);

  const groupedPhotos = useMemo(() => {
    const groups: Record<string, LineItem[]> = {};
    
    lineItems.forEach(item => {
      if (item.photo) {
        if (!groups[item.room]) {
          groups[item.room] = [];
        }
        groups[item.room].push(item);
      }
    });

    return groups;
  }, [lineItems]);

  const sortedRooms = Object.keys(groupedPhotos).sort();

  if (sortedRooms.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center h-[60vh] text-gray-400">
        <div className="bg-base-200 p-6 rounded-full mb-4">
            <PhotographIcon />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">No Project Photos</h2>
        <p className="max-w-xs">Snap general room photos or attach photos to specific tasks to see them aggregated here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-base-100 min-h-screen pb-24">
      <header className="text-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-brand-primary">Project Media</h1>
        <p className="text-sm font-bold text-gray-400 mt-1 uppercase tracking-widest">{address}</p>
      </header>

      <div className="space-y-12 max-w-6xl mx-auto">
        {sortedRooms.map(room => (
          <div key={room} className="animate-fade-in">
             <div className="flex items-center gap-4 mb-6">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">{room}</h2>
                 <div className="h-px bg-base-300 flex-grow"></div>
                 <span className="text-xs font-bold text-gray-500 uppercase">{groupedPhotos[room].length} Photos</span>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedPhotos[room].map(item => {
                   const isTaskPhoto = item.item !== 'General Room Photo';
                   return (
                    <div key={item.id} className="relative group bg-base-200 rounded-xl overflow-hidden shadow-lg border border-base-300 hover:border-brand-primary transition-all">
                        {/* Image Container */}
                        <div 
                            className="aspect-[4/3] bg-black cursor-pointer overflow-hidden relative"
                            onClick={() => setSelectedImage({ 
                                src: item.photo!.base64, 
                                item: item.item, 
                                notes: item.notes,
                                action: item.action
                            })}
                        >
                            <img 
                                src={item.photo!.base64} 
                                alt={item.item} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            
                            {/* Task Indicator Badge */}
                            {isTaskPhoto && (
                                <div className="absolute top-2 left-2 bg-brand-primary text-white text-[9px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 uppercase tracking-tighter z-10">
                                    <CubeIcon /> Linked to Task
                                </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                        </div>
                        
                        {/* Remove Action */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm("Remove this photo? The task description will remain in your scope.")) {
                                    onRemovePhoto(item);
                                }
                            }}
                            className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-20"
                            title="Remove Photo"
                        >
                            <TrashIcon />
                        </button>

                        {/* Info Overlay / Caption */}
                        <div className="p-3 bg-base-200">
                            <p className={`font-bold text-sm truncate ${isTaskPhoto ? 'text-brand-primary' : 'text-white'}`}>
                                {isTaskPhoto ? item.item : 'General View'}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                {item.action}
                            </p>
                        </div>
                    </div>
                   );
                })}
             </div>
          </div>
        ))}
      </div>

      {/* Enhanced Lightbox */}
      {selectedImage && (
        <div 
            className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-4 md:p-10"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative max-w-5xl w-full flex flex-col items-center">
                 <button className="absolute -top-12 right-0 text-white hover:text-brand-primary transition-colors">
                    <TrashIcon /> {/* Hidden purely for layout, the tap-to-close handles actual exit */}
                 </button>
                 
                 <img 
                    src={selectedImage.src} 
                    alt={selectedImage.item} 
                    className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10"
                 />
                 
                 <div className="mt-6 text-center max-w-2xl bg-base-200/50 p-4 rounded-xl backdrop-blur-md border border-white/5">
                    <p className="text-[10px] text-brand-primary font-black uppercase tracking-[0.2em] mb-1">
                        {selectedImage.action}
                    </p>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter mb-2">
                        {selectedImage.item}
                    </h3>
                    {selectedImage.notes && (
                        <p className="text-gray-300 italic text-sm border-t border-white/10 pt-3 mt-2">
                            "{selectedImage.notes}"
                        </p>
                    )}
                    <p className="text-gray-500 mt-6 text-[10px] font-bold uppercase">Tap anywhere to close gallery view</p>
                 </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default GalleryView;
