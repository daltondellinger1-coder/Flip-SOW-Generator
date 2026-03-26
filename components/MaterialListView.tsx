import React, { useMemo } from 'react';
import { LineItem, RoomDimensions, TradeCategory } from '../types';
import { MATERIALS_MAP } from '../constants';

interface MaterialGroup {
  item: string;
  unit: string;
  netQuantity: number; // Base quantity (e.g. SF)
  wastePct: number;    // 0, 0.10, 0.15
  conversionFactor?: number; // Multiplier to convert Net Qty to Target Unit (e.g., SF -> Pieces)
  targetUnit?: string; // Unit to display for Order Qty (e.g. "Pieces")
  specs: string;
  rooms: string[];
}

// Added MaterialListViewProps interface
interface MaterialListViewProps {
  lineItems: LineItem[];
  roomDimensions: Record<string, Omit<RoomDimensions, 'room'>>;
  address: string;
}

const MaterialListView: React.FC<MaterialListViewProps> = ({ lineItems, roomDimensions, address }) => {
  
  // --- Group Materials & Calculate Waste ---
  const groupedMaterials = useMemo(() => {
    const groups: Record<string, MaterialGroup[]> = {};
    let hasBacksplash = false; // Track if we need to add backsplash extras

    lineItems.forEach(item => {
      // 1. SKIP items with no quantity or photo placeholders
      if (!item.quantity || item.quantity <= 0 || item.item === 'General Room Photo') return;

      // 2. FILTER by Material Provider: Remove items supplied by the Contractor
      // This turns the tab into an "Owner Shopping List"
      if (item.materialsProvidedBy === 'Contractor') return;

      // 3. SKIP Labor-Only / Service Tasks
      // We exclude items where the action is 'CLEAN' or 'Inspector Only' 
      // or if they belong to pure service trades.
      const isCleaningAction = item.action === 'CLEAN';
      const isInspectorAction = item.action === '— (Inspector Only)';
      const isServiceTrade = ['Demolition & Clean Out', 'Permits & Fees', 'Misc'].includes(item.trade);
      
      const itemLower = item.item.toLowerCase();
      const isLaborOnlyName = 
          itemLower.includes('powerwash') || 
          itemLower.includes('trash out') || 
          itemLower.includes('cleaning') || 
          itemLower.includes('removal') || 
          itemLower.includes('general labor') ||
          itemLower.includes('selective demolition') ||
          itemLower.includes('broom clean');

      // If it's a cleaning action or a known labor-only task name, skip it on the materials list.
      if (isCleaningAction || isInspectorAction || (isServiceTrade && isLaborOnlyName)) return;

      const specKey = item.specs ? item.specs.trim().toLowerCase() : '';
      
      // Transform Task Name to Material Name
      // 1. Try the explicit map from constants
      let materialName = MATERIALS_MAP[item.item];
      
      // 2. If not mapped, try basic heuristic cleanup (remove "Install ", "Replace ", etc.)
      if (!materialName) {
          materialName = item.item
            .replace(/^(Install|Replace|Repair|Apply|Powerwash|Refinish)\s+/i, '')
            .trim();
      }

      if (!groups[item.trade]) {
        groups[item.trade] = [];
      }

      const existingItem = groups[item.trade].find(g => {
          const gSpecKey = g.specs ? g.specs.trim().toLowerCase() : '';
          return g.item === materialName && g.unit === item.unit && gSpecKey === specKey;
      });

      if (existingItem) {
        existingItem.netQuantity += item.quantity;
        if (!existingItem.rooms.includes(item.room)) {
            existingItem.rooms.push(item.room);
        }
      } else {
        // Determine waste factor & special handling
        let waste = 0;
        let conversionFactor = 1;
        let targetUnit = item.unit;
        
        // Special: 3x6 Subway Tile (Backsplash)
        if (materialName === '3x6 Subway Tile') {
            hasBacksplash = true;
            waste = 0.15; // 15% waste for tile
            conversionFactor = 8; // 8 tiles per SF (3x6 = 18 sq in. 144/18 = 8)
            targetUnit = 'Pieces';
        }
        // 15% Waste for other Tile (Breakage/Cuts)
        else if (item.trade === 'Tiling') {
            waste = 0.15;
        } 
        // 10% Waste for standard cut materials
        else if (['Flooring', 'Roofing', 'Siding', 'Framing', 'Deck'].includes(item.trade)) {
            waste = 0.10;
        }
        // Catch-all for Drywall/Insulation if not categorized in above trades
        else if (item.item.includes('Drywall') || item.item.includes('Insulation')) {
            waste = 0.10;
        }

        groups[item.trade].push({
          item: materialName,
          unit: item.unit || 'EA',
          netQuantity: item.quantity,
          wastePct: waste,
          conversionFactor,
          targetUnit: targetUnit || 'EA',
          specs: item.specs || '',
          rooms: [item.room]
        });
      }
    });

    // --- Inject Automatic Extras ---
    if (hasBacksplash) {
        const tilingGroup = groups['Tiling'] || [];
        
        // Add Charcoal Gray Grout (10lb Bag)
        tilingGroup.push({
            item: 'Charcoal Gray Grout (10lb Bag)',
            unit: 'EA',
            netQuantity: 1, 
            wastePct: 0,
            specs: 'For Backsplash',
            rooms: ['Kitchen']
        });

        // Add Musselbound Membrane (Roll)
        tilingGroup.push({
            item: 'Musselbound Membrane (Roll)',
            unit: 'EA',
            netQuantity: 4, 
            wastePct: 0,
            specs: 'For Backsplash',
            rooms: ['Kitchen']
        });
        
        groups['Tiling'] = tilingGroup;
    }

    // Sort items within trades
    Object.keys(groups).forEach(trade => {
        groups[trade].sort((a, b) => a.item.localeCompare(b.item));
    });

    return groups;
  }, [lineItems]);

  const sortedTrades = Object.keys(groupedMaterials).sort();

  return (
    <div className="p-4 md:p-6 bg-base-100 text-white min-h-screen pb-24 print:bg-white print:text-black print:pb-0">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-primary print:text-black">Owner Shopping List</h1>
          <p className="text-lg text-gray-300 print:text-gray-600">Materials & Supplies to be Provided by Owner</p>
          <p className="text-sm text-gray-400 mt-2 print:text-gray-500">{address}</p>
        </header>

        {sortedTrades.length === 0 ? (
          <div className="text-center p-20 bg-base-200 rounded-xl border border-dashed border-base-300 text-gray-400">
             <p className="text-lg font-bold">No materials to buy.</p>
             <p className="text-sm">Currently, all materials are marked as "Contractor Provided" or no material-intensive tasks have been added.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedTrades.map(trade => (
              <div key={trade} className="bg-base-200 rounded-lg shadow-md overflow-hidden print:bg-white print:shadow-none print:border print:border-gray-300 print:break-inside-avoid">
                <h2 className="bg-base-300 p-4 text-xl font-semibold text-brand-primary print:bg-gray-100 print:text-black print:border-b print:border-gray-300">{trade}</h2>
                <div className="overflow-x-auto print:overflow-visible">
                    <table className="w-full text-sm text-left text-gray-400 print:text-black">
                        <thead className="text-xs text-gray-300 uppercase bg-base-200 border-b border-base-300 print:bg-white print:text-black print:border-gray-300">
                            <tr>
                                <th className="px-4 py-3 w-1/3">Material to Order</th>
                                <th className="px-4 py-3 text-center">Net Qty</th>
                                <th className="px-4 py-3 text-center">Waste</th>
                                <th className="px-4 py-3 text-center bg-base-300/50 font-bold text-white print:bg-gray-100 print:text-black">Order Qty</th>
                                <th className="px-4 py-3 text-right hidden md:table-cell print:table-cell">Locations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupedMaterials[trade].map((mat, idx) => {
                                const netWithWaste = mat.netQuantity * (1 + mat.wastePct);
                                const factor = mat.conversionFactor || 1;
                                const orderQuantity = Math.ceil(netWithWaste * factor);
                                const hasWaste = mat.wastePct > 0;
                                const wasteLabel = mat.wastePct === 0.15 ? '+15%' : '+10%';
                                const wasteAmount = Math.ceil(mat.netQuantity * mat.wastePct);

                                return (
                                    <tr key={`${trade}-${idx}`} className="border-b border-base-300 hover:bg-base-300/50 print:border-gray-200">
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-white text-base print:text-black">
                                                {mat.specs ? (
                                                    <>
                                                        <span className="text-brand-primary font-bold print:text-black">{mat.specs}</span> {mat.item}
                                                    </>
                                                ) : (
                                                    mat.item
                                                )}
                                            </div>
                                            <div className="md:hidden text-xs text-gray-500 mt-1 truncate print:hidden">
                                                {mat.rooms.join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-300 print:text-black">
                                            {mat.netQuantity} {mat.unit}
                                        </td>
                                        <td className="px-4 py-3 text-center text-gray-400 print:text-black">
                                            {hasWaste ? (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-xs font-semibold text-brand-primary print:text-black">{wasteLabel}</span>
                                                    <span>+{wasteAmount}</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-center bg-base-300/30 print:bg-gray-50">
                                            <span className="font-bold text-brand-primary text-lg print:text-black">{orderQuantity}</span>
                                            <span className="text-xs text-gray-500 ml-1 print:text-black">{mat.targetUnit || mat.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500 text-xs hidden md:table-cell max-w-xs truncate print:table-cell print:text-black">
                                            {mat.rooms.join(', ')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MaterialListView;