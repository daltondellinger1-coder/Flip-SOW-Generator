
import { Action, TradeCategory, TradeMapEntry, MaterialsProvidedBy, UnitPrice, RoomTemplate } from './types';

export const ROOMS: string[] = [
  'Exterior',
  'Entry',
  'Living Room',
  'Dining Room',
  'Kitchen',
  'Hallway',
  'Bathroom 1',
  'Bathroom 2',
  'Master Bedroom',
  'Bedroom 1',
  'Bedroom 2',
  'Bedroom 3',
  'Laundry',
  'Basement',
  'Attic',
  'Garage',
  'Utility/Mechanical',
  'Other',
];

// --- Room Groups for mapping (not exported) ---
const ALL_ROOMS = [...ROOMS];
const EXTERIOR_ROOMS = ['Exterior'];
const GARAGE_ROOMS = ['Garage'];
const INTERIOR_ROOMS = ALL_ROOMS.filter(r => r !== 'Exterior');
const BATHROOMS = ['Bathroom 1', 'Bathroom 2'];
const KITCHENS = ['Kitchen'];
// Fixed: Added BEDROOMS constant to resolve compilation error on line 123
const BEDROOMS = ['Master Bedroom', 'Bedroom 1', 'Bedroom 2', 'Bedroom 3'];
const WET_AREAS = [...BATHROOMS, ...KITCHENS, 'Laundry', 'Utility/Mechanical'];
const WET_AREAS_WITH_CABINETS = [...BATHROOMS, ...KITCHENS, 'Laundry'];
const INTERIOR_LIVING_SPACES = INTERIOR_ROOMS.filter(r => !['Garage', 'Attic', 'Utility/Mechanical'].includes(r));

export const ACTIONS: Action[] = ['PAINT', 'REPAIR', 'REPLACE', 'CLEAN', '— (Inspector Only)'];

export const UNITS: string[] = ['each', 'square', 'sf', 'lf', 'lump sum', 'hours', 'room', 'sheet'];

export const MATERIALS_PROVIDED_BY: MaterialsProvidedBy[] = ['Contractor', 'Owner'];

export const TRADE_MAP: Record<string, TradeMapEntry> = {
  // ===================================
  // ROOFING & EXTERIORS (From FlipperForce Screenshots)
  // ===================================
  'Asphalt roofing, architectural, L+M': { trade: 'Roofing', defaultUnit: 'square', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Asphalt roofing, 3 tab, L+M': { trade: 'Roofing', defaultUnit: 'square', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Remove existing roofing, L+M': { trade: 'Roofing', defaultUnit: 'each', defaultAction: 'REPAIR', validRooms: EXTERIOR_ROOMS },
  'Roofing Bid Allowance': { trade: 'Roofing', defaultUnit: 'lump sum', defaultAction: 'REPAIR', validRooms: EXTERIOR_ROOMS },
  'Metal roofing, L+M': { trade: 'Roofing', defaultUnit: 'square', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Gutters & downspouts, L+M': { trade: 'Roofing', defaultUnit: 'lf', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Fascia board, L+M': { trade: 'Roofing', defaultUnit: 'lf', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  '12" Soffit board, L+M': { trade: 'Roofing', defaultUnit: 'lf', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Soffit/Fascia Repairs': { trade: 'Roofing', defaultUnit: 'each', defaultAction: 'REPAIR', validRooms: EXTERIOR_ROOMS },
  'Plywood roof sheathing, L+M': { trade: 'Roofing', defaultUnit: 'sheet', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },

  // ===================================
  // SIDING & EXTERIOR TRIM
  // ===================================
  'Vinyl siding, L+M': { trade: 'Siding', defaultUnit: 'square', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Wood lap siding, L+M': { trade: 'Siding', defaultUnit: 'square', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },
  'Siding, maintenance, L+M': { trade: 'Siding', defaultUnit: 'each', defaultAction: 'REPAIR', validRooms: EXTERIOR_ROOMS },
  'Door trim, L+M': { trade: 'Siding', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Window trim, L+M': { trade: 'Siding', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'House wrap, whole house': { trade: 'Siding', defaultUnit: 'lump sum', defaultAction: 'REPLACE', validRooms: EXTERIOR_ROOMS },

  // ===================================
  // EXTERIOR PAINTING
  // ===================================
  'Powerwash, scrape, clean & prep, L+M': { trade: 'Exterior Painting', defaultUnit: 'sf', defaultAction: 'CLEAN', validRooms: EXTERIOR_ROOMS },
  'Paint exterior doors, L+M': { trade: 'Exterior Painting', defaultUnit: 'each', defaultAction: 'PAINT', validRooms: ALL_ROOMS },
  'Paint exterior trim boards, L+M': { trade: 'Exterior Painting', defaultUnit: 'lf', defaultAction: 'PAINT', validRooms: EXTERIOR_ROOMS },
  'Paint/stain fencing, L+M': { trade: 'Exterior Painting', defaultUnit: 'square', defaultAction: 'PAINT', validRooms: EXTERIOR_ROOMS },

  // ===================================
  // DOORS & GARAGE
  // ===================================
  'Exterior glass storm door': { trade: 'Exterior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Exterior steel entry door': { trade: 'Exterior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Exterior Door Electronic Deadbolt': { trade: 'Exterior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Exterior Door Electronic Keypad with lever': { trade: 'Exterior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Garage door, single, manual operated': { trade: 'Garage', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: GARAGE_ROOMS },
  'Garage door operator': { trade: 'Garage', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: GARAGE_ROOMS },

  // ===================================
  // KITCHEN (Detailed FlipperForce)
  // ===================================
  'Kitchen base cabinetry, per LF': { trade: 'Cabinetry', defaultUnit: 'lf', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Kitchen upper cabinetry, per LF': { trade: 'Cabinetry', defaultUnit: 'lf', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Plastic laminate countertops, L+M': { trade: 'Cabinetry', defaultUnit: 'sf', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Kitchen backsplash tile': { trade: 'Tiling', defaultUnit: 'sf', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Refrigerator': { trade: 'Appliances', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Gas Range': { trade: 'Appliances', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Dishwasher': { trade: 'Appliances', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Microwave': { trade: 'Appliances', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Kitchen stainless steel sink bowl': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Kitchen faucet fixture': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Garbage disposal': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Hookup/install dishwasher': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'New GFCI outlets in kitchen': { trade: 'Electrical - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'New recessed lights new locations': { trade: 'Electrical - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Wafer Lights (12 Pack)': { trade: 'Electrical - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },

  // ===================================
  // BATHROOM (Detailed FlipperForce)
  // ===================================
  'Vanity cabinet, per Each': { trade: 'Cabinetry', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Medicine Cabinet': { trade: 'Cabinetry', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Bathroom faucet fixture': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Showerhead/tub kit': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Fiberglass tub': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Fiberglass tub/shower surround': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Toilets': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'PVC Overflow Kit': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Replace GFCI (20A)': { trade: 'Electrical - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Exhaust fan': { trade: 'Electrical - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },
  'Bathroom Hardware (TP Holder, Towel Bars, Etc.)': { trade: 'Plumbing - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: BATHROOMS },

  // ===================================
  // INTERIOR FINISHES
  // ===================================
  'Install Vinyl Plank Flooring Standard Grade': { trade: 'Flooring', defaultUnit: 'sf', defaultAction: 'REPLACE', validRooms: INTERIOR_ROOMS },
  'Carpet & Padding (L&M)': { trade: 'Flooring', defaultUnit: 'sf', defaultAction: 'REPLACE', validRooms: BEDROOMS },
  'Paint Interior Walls/Ceilings/ Trim & Doors': { trade: 'Interior Painting', defaultUnit: 'sf', defaultAction: 'PAINT', validRooms: INTERIOR_ROOMS },
  'PVC Baseboard': { trade: 'Interior Woodwork', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Wood base 40 lf': { trade: 'Interior Woodwork', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Bi-fold Closest Door 36 inch': { trade: 'Interior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Slab Door 2 Panel 30 inch': { trade: 'Interior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Door Hardware Privacy 4 pack': { trade: 'Interior Doors', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },

  // ===================================
  // DEMOLITION & MISC
  // ===================================
  'Room demolition, typical room': { trade: 'Demolition & Clean Out', defaultUnit: 'room', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Room demolition, kitchen': { trade: 'Demolition & Clean Out', defaultUnit: 'room', defaultAction: 'REPLACE', validRooms: KITCHENS },
  'Dumpster Rental': { trade: 'Demolition & Clean Out', defaultUnit: 'each', defaultAction: 'CLEAN', validRooms: ALL_ROOMS },
  'Demolition permit cost': { trade: 'Demolition & Clean Out', defaultUnit: 'each', defaultAction: 'REPAIR', validRooms: ALL_ROOMS },
  'Gas hot water heater': { trade: 'Plumbing - Rough-In', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Gas fired furnace, 1000sf 60-80K btus, L+M': { trade: 'HVAC - Rough-In', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Programmable thermostat': { trade: 'HVAC - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'Replace floor registers 4 x 14': { trade: 'HVAC - Finish', defaultUnit: 'each', defaultAction: 'REPLACE', validRooms: ALL_ROOMS },
  'General Labor': { trade: 'Misc', defaultUnit: 'hours', defaultAction: 'REPAIR', validRooms: ALL_ROOMS },
};

export const ITEMS = Object.keys(TRADE_MAP);

// Default Unit Prices (Aggregated from FlipperForce Screenshots & Material List PDF)
const BASE_DEFAULTS: UnitPrice[] = [
    // Roofing
    { id: 'Asphalt roofing, architectural, L+M-square', item: 'Asphalt roofing, architectural, L+M', unit: 'square', price: 400.00 },
    { id: 'Remove existing roofing, L+M-each', item: 'Remove existing roofing, L+M', unit: 'each', price: 30.00 },
    { id: 'Soffit/Fascia Repairs-each', item: 'Soffit/Fascia Repairs', unit: 'each', price: 500.00 },
    { id: 'Gutters & downspouts, L+M-lf', item: 'Gutters & downspouts, L+M', unit: 'lf', price: 8.00 },
    { id: 'Fascia board, L+M-lf', item: 'Fascia board, L+M', unit: 'lf', price: 5.00 },
    
    // Siding
    { id: 'Siding, maintenance, L+M-each', item: 'Siding, maintenance, L+M', unit: 'each', price: 250.00 },
    { id: 'Door trim, L+M-each', item: 'Door trim, L+M', unit: 'each', price: 100.00 },
    
    // Painting
    { id: 'Powerwash, scrape, clean & prep, L+M-sf', item: 'Powerwash, scrape, clean & prep, L+M', unit: 'sf', price: 0.50 },
    { id: 'Paint exterior doors, L+M-each', item: 'Paint exterior doors, L+M', unit: 'each', price: 75.00 },
    { id: 'Paint Window Trim, L&M-each', item: 'Paint Window Trim, L&M', unit: 'each', price: 50.00 },
    
    // Interior
    { id: 'Paint Interior Walls/Ceilings/ Trim & Doors-sf', item: 'Paint Interior Walls/Ceilings/ Trim & Doors', unit: 'sf', price: 4.50 },
    { id: 'Install Vinyl Plank Flooring Standard Grade-each', item: 'Install Vinyl Plank Flooring Standard Grade', unit: 'each', price: 3.50 }, // Combined L+M
    { id: 'Carpet & Padding (L&M)-sf', item: 'Carpet & Padding (L&M)', unit: 'sf', price: 2.55 },
    
    // Kitchen Detailed
    { id: 'Kitchen base cabinetry, per LF-lf', item: 'Kitchen base cabinetry, per LF', unit: 'lf', price: 190.00 }, // 40 labor + 150 mat
    { id: 'Kitchen upper cabinetry, per LF-lf', item: 'Kitchen upper cabinetry, per LF', unit: 'lf', price: 50.00 },
    { id: 'Refrigerator-each', item: 'Refrigerator', unit: 'each', price: 1199.00 },
    { id: 'Gas Range-each', item: 'Gas Range', unit: 'each', price: 899.00 },
    { id: 'Dishwasher-each', item: 'Dishwasher', unit: 'each', price: 649.00 },
    { id: 'Microwave-each', item: 'Microwave', unit: 'each', price: 289.00 },
    
    // Plumbing/HVAC
    { id: 'Gas hot water heater-each', item: 'Gas hot water heater', unit: 'each', price: 1000.00 },
    { id: 'Gas fired furnace, 1000sf 60-80K btus, L+M-each', item: 'Gas fired furnace, 1000sf 60-80K btus, L+M', unit: 'each', price: 4000.00 },
];

export const DEFAULT_UNIT_PRICES: UnitPrice[] = ITEMS.map(item => {
    const entry = TRADE_MAP[item];
    const id = `${item}-${entry.defaultUnit}`;
    const basePrice = BASE_DEFAULTS.find(p => p.id === id);
    return basePrice || { id, item, unit: entry.defaultUnit, price: 0 };
});

export const ROOM_TEMPLATES: Record<string, RoomTemplate[]> = {
    'Kitchen': [
        { 
            name: 'Standard Kitchen', 
            items: [
                'Room demolition, kitchen', 'Kitchen base cabinetry, per LF', 'Kitchen upper cabinetry, per LF', 
                'Plastic laminate countertops, L+M', 'Kitchen backsplash tile', 'Refrigerator', 'Gas Range', 
                'Dishwasher', 'Microwave', 'Kitchen stainless steel sink bowl', 'Kitchen faucet fixture', 
                'Garbage disposal', 'Hookup/install dishwasher', 'New GFCI outlets in kitchen'
            ] 
        }
    ],
    'Bathroom': [
        { 
            name: 'Standard Bathroom Refresh', 
            items: [
                'Vanity cabinet, per Each', 'Medicine Cabinet', 'Bathroom faucet fixture', 
                'Showerhead/tub kit', 'Fiberglass tub', 'Fiberglass tub/shower surround', 
                'Toilets', 'Exhaust fan', 'Bathroom Hardware (TP Holder, Towel Bars, Etc.)'
            ] 
        }
    ],
    'Exterior': [
        {
            name: 'Standard Roof Replacement',
            items: ['Asphalt roofing, architectural, L+M', 'Remove existing roofing, L+M', 'Gutters & downspouts, L+M']
        }
    ]
};

export const MATERIALS_MAP: Record<string, string> = {
  'Asphalt roofing, architectural, L+M': 'Roof Shingles',
  'Kitchen backsplash tile': '3x6 Subway Tile',
  'Vanity cabinet, per Each': 'Vanity Cabinet',
  'Refrigerator': 'Samsung 27.4-cu ft Side-by-Side',
  'Gas Range': 'Samsung 30-in 5 burners',
  'Dishwasher': 'Samsung 24-in Top Control',
};
