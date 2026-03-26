
import { LineItem, UnitPrice } from '../types';

export const exportToCsv = (lineItems: LineItem[], unitPrices: UnitPrice[], address: string, fileName: string = 'SOW_Export.csv', sortBy: 'room' | 'trade' = 'trade') => {
  if (lineItems.length === 0) {
    alert('No items to export.');
    return;
  }

  // Create a map for quick price lookup
  const priceMap = new Map(unitPrices.map(p => [`${p.item}-${p.unit}`, p.price]));

  // Prepend address to the CSV content
  let csvContent = `Property Address,"${address.replace(/"/g, '""')}"\n\n`;

  // Standard headers
  const headers = [
    'Trade Category', 
    'Room', 
    'Item', 
    'Dimensions/Specs',
    'Action', 
    'Quantity', 
    'Unit', 
    'Unit Price', 
    'Total Cost', 
    'Notes', 
    'Materials Needed', 
    'Materials Provided By', 
    'Photo Attached'
  ];

  // Sort items by Room, then Trade, then Item
  const sortedItems = [...lineItems].sort((a, b) => {
      const roomDiff = a.room.localeCompare(b.room);
      if (roomDiff !== 0) return roomDiff;
      const tradeDiff = a.trade.localeCompare(b.trade);
      if (tradeDiff !== 0) return tradeDiff;
      return a.item.localeCompare(b.item);
  });

  const rows: string[][] = [];
  let lastGroupKey: string | null = null;
  const emptyRow = new Array(headers.length).fill('');

  sortedItems.forEach(item => {
    // If the room changes (and it's not the first item), insert a blank separator row
    if (lastGroupKey !== null && item.room !== lastGroupKey) {
        rows.push([...emptyRow]);
    }
    
    lastGroupKey = item.room;

    const price = priceMap.get(`${item.item}-${item.unit}`) || 0;
    const quantity = item.quantity || 0;
    const total = quantity * price;

    rows.push([
      `"${item.trade}"`,
      `"${item.room}"`,
      `"${item.item.replace(/"/g, '""')}"`, // Escape double quotes
      `"${(item.specs || '').replace(/"/g, '""')}"`, // Specs
      `"${item.action}"`,
      `"${quantity}"`,
      `"${item.unit || ''}"`,
      `"${price.toFixed(2)}"`,
      `"${total.toFixed(2)}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      `"${(item.materialsNeeded || '').replace(/"/g, '""')}"`,
      `"${item.materialsProvidedBy}"`,
      `"${item.photo ? 'Yes' : 'No'}"`,
    ]);
  });

  csvContent += [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportUnitPricesToCsv = (unitPrices: UnitPrice[], fileName: string = 'Unit_Prices.csv') => {
  const headers = ['Item', 'Unit', 'Price'];
  // Sort for readability
  const sortedPrices = [...unitPrices].sort((a, b) => a.item.localeCompare(b.item));
  
  const rows = sortedPrices.map(p => [
    `"${p.item.replace(/"/g, '""')}"`,
    `"${p.unit}"`,
    `${p.price}`
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Helper to robustly parse CSV lines handling quotes
const parseCsvLine = (line: string): string[] => {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
            // Check for escaped quotes ("")
            if (j + 1 < line.length && line[j+1] === '"') {
                current += '"';
                j++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);
    return parts;
};

export const parseUnitPricesFromCsv = (file: File): Promise<UnitPrice[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            if (!text) return resolve([]);
            
            const lines = text.split('\n');
            const prices: UnitPrice[] = [];
            
            // Skip header if detected
            const startIndex = lines[0].toLowerCase().includes('item') && lines[0].toLowerCase().includes('price') ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const parts = parseCsvLine(line);

                if (parts.length >= 3) {
                    const item = parts[0].trim();
                    const unit = parts[1].trim();
                    const priceString = parts[2].trim();
                    const price = parseFloat(priceString);
                    
                    if (item && unit && !isNaN(price)) {
                        prices.push({
                            id: `${item}-${unit}`,
                            item,
                            unit,
                            price
                        });
                    }
                }
            }
            resolve(prices);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
    });
};

export const parseLineItemsFromCsv = (file: File): Promise<Omit<LineItem, 'id' | 'projectId'>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return resolve([]);
      
      const lines = text.split('\n');
      const items: Omit<LineItem, 'id' | 'projectId'>[] = [];

      // Find header row
      let headerIndex = -1;
      let headers: string[] = [];
      
      // Check first 10 lines for a header row
      for(let i=0; i<Math.min(10, lines.length); i++) {
          const lineParts = parseCsvLine(lines[i]);
          // Check for key columns
          if (lineParts.some(p => p.toLowerCase().includes('item') && p.toLowerCase().includes('room'))) {
              headerIndex = i;
              headers = lineParts.map(h => h.toLowerCase().trim().replace(/"/g, ''));
              break;
          }
      }

      if (headerIndex === -1) {
          return reject(new Error("Could not find CSV headers. File must contain 'Room' and 'Item' columns."));
      }

      // Helper to find column index flexibly
      const getIndex = (searchTerms: string[]) => headers.findIndex(h => searchTerms.some(t => h.includes(t)));

      const idxRoom = getIndex(['room']);
      const idxItem = getIndex(['item']);
      const idxSpecs = getIndex(['specs', 'dimensions', 'details']); // New column mapping
      const idxTrade = getIndex(['trade', 'category']);
      const idxAction = getIndex(['action']);
      const idxQty = getIndex(['quantity', 'qty']);
      const idxUnit = getIndex(['unit']);
      const idxNotes = getIndex(['notes', 'description']);
      const idxMatNeeded = getIndex(['materials needed', 'material']);
      const idxMatProv = getIndex(['materials provided', 'provided by']);

      if (idxRoom === -1 || idxItem === -1) {
          return reject(new Error("CSV must contain at least 'Room' and 'Item' columns."));
      }

      for (let i = headerIndex + 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const parts = parseCsvLine(line);
          
          // Basic validation
          if (parts.length < 2) continue;

          const room = parts[idxRoom]?.replace(/^"|"$/g, '').trim() || 'Other';
          const item = parts[idxItem]?.replace(/^"|"$/g, '').trim() || 'Unknown Item';
          
          if (!item) continue; // Skip empty items

          const specs = idxSpecs > -1 ? parts[idxSpecs]?.replace(/^"|"$/g, '').trim() : '';
          const trade = idxTrade > -1 ? parts[idxTrade]?.replace(/^"|"$/g, '').trim() : 'Misc';
          const action = idxAction > -1 ? parts[idxAction]?.replace(/^"|"$/g, '').trim() : 'REPAIR';
          const quantityStr = idxQty > -1 ? parts[idxQty]?.replace(/^"|"$/g, '').trim() : '0';
          const unit = idxUnit > -1 ? parts[idxUnit]?.replace(/^"|"$/g, '').trim() : 'EA';
          const notes = idxNotes > -1 ? parts[idxNotes]?.replace(/^"|"$/g, '').trim() : '';
          const materialsNeeded = idxMatNeeded > -1 ? parts[idxMatNeeded]?.replace(/^"|"$/g, '').trim() : '';
          const materialsProvidedBy = idxMatProv > -1 ? parts[idxMatProv]?.replace(/^"|"$/g, '').trim() : 'Contractor';

          items.push({
              room,
              item,
              trade: trade as any, // loose casting to TradeCategory
              action: action as any, // loose casting to Action
              quantity: parseFloat(quantityStr) || 0,
              unit,
              specs,
              notes,
              materialsNeeded,
              materialsProvidedBy: materialsProvidedBy as any
          });
      }
      
      resolve(items);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
};
