
export type Action = 'PAINT' | 'REPAIR' | 'REPLACE' | 'CLEAN' | '— (Inspector Only)';

export type MaterialsProvidedBy = 'Contractor' | 'Owner';

export type TradeCategory =
  | 'Siding'
  | 'Roofing'
  | 'Exterior Painting'
  | 'Exterior Doors'
  | 'Windows'
  | 'Garage'
  | 'Deck'
  | 'Landscaping'
  | 'Fencing'
  | 'Concrete & Masonry'
  | 'Foundation'
  | 'Demolition & Clean Out'
  | 'Permits & Fees'
  | 'Framing'
  | 'Insulation'
  | 'Drywall'
  | 'Plumbing - Rough-In'
  | 'Plumbing - Finish'
  | 'HVAC - Rough-In'
  | 'HVAC - Finish'
  | 'Electrical - Rough-In'
  | 'Electrical - Finish'
  | 'Cabinetry'
  | 'Interior Doors'
  | 'Interior Woodwork'
  | 'Interior Painting'
  | 'Flooring'
  | 'Tiling'
  | 'Appliances'
  | 'Misc';

export interface Photo {
  base64: string;
  name: string;
}

export interface LineItem {
  id: number;
  projectId?: number;
  room: string;
  item: string;
  action: Action;
  trade: TradeCategory;
  quantity?: number;
  unit?: string;
  unitPrice?: number; 
  manualPrice?: number; 
  notes?: string;
  specs?: string; 
  photo?: Photo; // Legacy support
  photos?: Photo[]; // New: Support for multiple photos per task
  materialsNeeded?: string;
  materialsProvidedBy?: MaterialsProvidedBy;
  needsVerification?: boolean;
}

export interface TradeMapEntry {
  trade: TradeCategory;
  defaultUnit: string;
  defaultAction: Action;
  validRooms: string[];
}

export interface SubArea {
  name: string; 
  length: number;
  width: number;
}

export interface RoomDimensions {
  room: string;
  length: number;
  width: number;
  sidingHeight?: number;
  roofPitch?: number;
  subAreas?: SubArea[]; 
}

export interface UnitPrice {
    id: string; 
    item: string;
    unit: string;
    price: number;
}

export interface Project {
  id?: number;
  name: string;
  address: string;
  ownerEmail: string;
  sharedWith: string[]; 
  created: string;
  updated: string;
}

export interface UserProfile {
  name: string;
  role: 'Acquisitions Manager' | 'Project Manager';
  email: string;
  token?: string;
}

export type View = 'list' | 'sow' | 'materials' | 'summary' | 'gallery' | 'dimensions';

export interface RoomTemplate {
  name: string;
  items: string[];
}
