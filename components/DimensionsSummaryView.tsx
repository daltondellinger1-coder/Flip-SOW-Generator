
import React, { useMemo } from 'react';
import { RoomDimensions } from '../types';
import { ROOMS } from '../constants';
import { CalculatorIcon } from './icons';

interface DimensionsSummaryViewProps {
  roomDimensions: Record<string, Omit<RoomDimensions, 'room'>>;
  address: string;
}

// Fixed: Moved RoomCard outside to avoid recreation on every render and fix typing issues with key prop by using React.FC
const RoomCard: React.FC<{ data: any }> = ({ data }) => (
  <div className="bg-base-200 border border-base-300 rounded-xl p-5 shadow-lg flex flex-col gap-3">
    <div className="flex justify-between items-start">
      <h3 className="text-xl font-black text-white uppercase tracking-tight">{data.roomName}</h3>
      {data.isBedroom && (
        <span className="bg-brand-primary/20 text-brand-primary text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
          Bedroom
        </span>
      )}
    </div>
    
    <div className="grid grid-cols-2 gap-4 border-t border-base-300 pt-3 mt-1">
      <div>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Footprint</p>
        <p className="text-2xl font-mono font-black text-white">
          {data.length}' × {data.width}'
        </p>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Calculated Area</p>
        <p className="text-2xl font-mono font-black text-brand-primary">
          {data.sf} <span className="text-xs uppercase">SF</span>
        </p>
      </div>
    </div>

    {data.subAreas.length > 0 && (
      <div className="mt-2 bg-base-100/50 p-2 rounded-lg border border-base-300/30">
        <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Includes Add-ons:</p>
        <div className="space-y-1">
          {data.subAreas.map((sub: any, idx: number) => (
            <div key={idx} className="flex justify-between text-xs text-gray-300">
              <span>{sub.name}</span>
              <span className="font-mono">{sub.length}' × {sub.width}'</span>
            </div>
          ))}
        </div>
      </div>
    )}
    
    <div className="flex justify-between items-center text-[10px] text-gray-500 font-black uppercase mt-1">
      <span>Perimeter: {data.lf} LF</span>
    </div>
  </div>
);

const DimensionsSummaryView: React.FC<DimensionsSummaryViewProps> = ({ roomDimensions, address }) => {
  const bedroomKeywords = ['Bedroom', 'Master'];

  const dimensionalData = useMemo(() => {
    return ROOMS.map(roomName => {
      const dims = roomDimensions[roomName];
      if (!dims || (!dims.length && !dims.width)) return null;

      let sf = (Number(dims.length) || 0) * (Number(dims.width) || 0);
      let lf = ((Number(dims.length) || 0) + (Number(dims.width) || 0)) * 2;
      
      if (dims.subAreas) {
        dims.subAreas.forEach(sub => {
          sf += (sub.length * sub.width);
          lf += (sub.length + sub.width) * 2;
        });
      }

      const isBedroom = bedroomKeywords.some(key => roomName.includes(key));

      return {
        roomName,
        isBedroom,
        length: dims.length,
        width: dims.width,
        sf: Math.round(sf),
        lf: Math.round(lf),
        subAreas: dims.subAreas || []
      };
    }).filter(d => d !== null);
  }, [roomDimensions]);

  const { bedrooms, otherRooms } = useMemo(() => {
    return {
      bedrooms: dimensionalData.filter(d => d!.isBedroom),
      otherRooms: dimensionalData.filter(d => !d!.isBedroom)
    };
  }, [dimensionalData]);

  if (dimensionalData.length === 0) {
    return (
      <div className="p-10 text-center text-gray-400">
        <h2 className="text-xl font-bold mb-2">No Dimensions Recorded</h2>
        <p>Enter room dimensions in the Rooms tab to see them summarized here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-base-100 min-h-screen pb-24">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Room Dimensions Reference</h1>
          <p className="text-brand-primary font-bold text-lg">{address}</p>
          <p className="text-xs text-gray-500 mt-4 uppercase tracking-widest font-black">Optimized for Reference & Screenshots</p>
        </header>

        {bedrooms.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <span className="h-px bg-base-300 flex-grow"></span>
              Bedrooms
              <span className="h-px bg-base-300 flex-grow"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bedrooms.map((data, idx) => <RoomCard key={idx} data={data} />)}
            </div>
          </div>
        )}

        {otherRooms.length > 0 && (
          <div>
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
              <span className="h-px bg-base-300 flex-grow"></span>
              Other Measured Areas
              <span className="h-px bg-base-300 flex-grow"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {otherRooms.map((data, idx) => <RoomCard key={idx} data={data} />)}
            </div>
          </div>
        )}
        
        <footer className="mt-20 border-t border-base-300 pt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-base-200 rounded-full border border-base-300">
                <CalculatorIcon />
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Generated by WFH SOW PRO • {new Date().toLocaleDateString()}
                </span>
            </div>
        </footer>
      </div>
    </div>
  );
};

export default DimensionsSummaryView;
