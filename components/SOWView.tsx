
import React, { useState } from 'react';
import { LineItem } from '../types';
import { CubeIcon, ListIcon, ExclamationTriangleIcon, SparklesIcon } from './icons';
import { generateProjectNarrative } from '../services/geminiService';

interface SOWViewProps {
  lineItems: LineItem[];
  address: string;
}

const SOWView: React.FC<SOWViewProps> = ({ lineItems, address }) => {
  const [groupBy, setGroupBy] = useState<'trade' | 'room'>('room');
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { groupedItems, verifyList } = React.useMemo(() => {
    const groups: Record<string, LineItem[]> = {};
    const verify: LineItem[] = [];
    const visibleItems = lineItems.filter(item => item.item !== 'General Room Photo');

    visibleItems.forEach(item => {
      const key = groupBy === 'trade' ? item.trade : item.room;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      if (item.needsVerification) verify.push(item);
    });

    return { groupedItems: groups, verifyList: verify };
  }, [lineItems, groupBy]);

  const handleGenerateNarrative = async () => {
    setIsGenerating(true);
    const result = await generateProjectNarrative(address, lineItems);
    setNarrative(result);
    setIsGenerating(false);
  };

  const sortedKeys = Object.keys(groupedItems).sort();

  return (
    <div className="p-4 md:p-8 bg-white text-black min-h-screen">
      <div className="max-w-4xl mx-auto border-t-8 border-black pt-8">
        <header className="mb-12 flex flex-col items-start">
          <div className="flex justify-between w-full items-start">
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">Clean Scope of Work</h1>
            <button 
                onClick={handleGenerateNarrative}
                disabled={isGenerating}
                className="no-print bg-black text-white px-4 py-2 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-all disabled:opacity-50"
            >
                {isGenerating ? (
                    <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                    <SparklesIcon />
                )}
                <span>AI Narrative</span>
            </button>
          </div>
          <p className="text-xl font-bold text-gray-900 border-l-4 border-black pl-4">Property: {address}</p>
        </header>

        {narrative && (
            <div className="mb-16 bg-gray-50 p-6 rounded-lg border-2 border-black border-dashed">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-gray-500">Project Narrative</h3>
                <p className="text-lg leading-relaxed text-gray-800 font-medium italic">"{narrative}"</p>
            </div>
        )}

        <div className="space-y-16">
          {sortedKeys.map((groupName, groupIdx) => (
            <section key={groupName} className="page-break-inside-avoid">
              <h2 className="text-4xl font-black mb-8 uppercase tracking-tight border-b-4 border-black pb-4">
                  <span className="text-gray-400 mr-2">{groupIdx + 1})</span>{groupName}
              </h2>
              
              <ul className="space-y-12">
                {groupedItems[groupName].map((item, itemIdx) => {
                  const itemPhotos = item.photos || (item.photo ? [item.photo] : []);
                  return (
                    <li key={item.id} className="page-break-inside-avoid">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="h-6 w-6 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-black flex-shrink-0">{itemIdx + 1}</div>
                        <div>
                          <span className="font-bold text-2xl text-gray-900">{item.item}</span>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs font-black bg-gray-900 text-white px-2 py-0.5 rounded uppercase">{item.action}</span>
                            {item.quantity && <span className="text-xs font-bold">{item.quantity} {item.unit}</span>}
                          </div>
                          {item.notes && <p className="mt-2 text-gray-600 italic border-l-2 pl-3">{item.notes}</p>}
                        </div>
                      </div>

                      {itemPhotos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10">
                          {itemPhotos.map((p, pIdx) => (
                            <div key={pIdx} className="border-4 border-gray-50 rounded-lg overflow-hidden">
                                <img src={p.base64} alt="Ref" className="w-full h-auto object-cover max-h-64" />
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SOWView;
