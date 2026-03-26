
import { RoomDimensions } from '../types';
import { TRADE_MAP } from '../constants';

const INTERIOR_WALL_HEIGHT = 8; // Assume standard 8ft walls
const DEFAULT_EXTERIOR_WALL_HEIGHT = 18; // Assume average 1.5-2 story house wall height
const DEFAULT_ROOF_PITCH_MULTIPLIER = 1.2; // Assume a moderate roof pitch for area calculation

/**
 * Converts a roof pitch (e.g., 6 for 6/12) into a surface area multiplier.
 */
const getRoofPitchMultiplier = (pitch: number): number => {
  if (pitch <= 0) return 1;
  return Math.sqrt(Math.pow(pitch, 2) + 144) / 12;
};

/**
 * Attempts to parse dimensions (e.g., 10x8) from a text string.
 */
export const parseDimensionsFromText = (text: string): { length: number; width: number } | undefined => {
  if (!text) return undefined;
  
  // Patterns like: 10x8, 10 x 8, 10'x8', 10ft x 8ft, 10 by 8
  const regex = /(\d+(?:\.\d+)?)\s*(?:x|by|'|ft)?\s*(\d+(?:\.\d+)?)\s*(?:'|ft)?/i;
  const match = text.match(regex);
  
  if (match) {
    const length = parseFloat(match[1]);
    const width = parseFloat(match[2]);
    if (!isNaN(length) && !isNaN(width)) {
      return { length, width };
    }
  }
  return undefined;
};

/**
 * Calculates a default quantity for a line item based on room dimensions.
 * Returns undefined if no specific calculation logic exists for the item.
 */
export const calculateDimensionBasedQuantity = (
  item: string,
  dimensions: Omit<RoomDimensions, 'room'> | undefined
): number | undefined => {
  if (!dimensions) return undefined;

  const length = Number(dimensions.length);
  const width = Number(dimensions.width);
  const sidingHeight = Number(dimensions.sidingHeight);
  const roofPitch = Number(dimensions.roofPitch);

  if (!length || !width) {
    return undefined;
  }

  // Check the default unit for this item
  const mapEntry = TRADE_MAP[item];
  const unit = mapEntry?.defaultUnit;

  // RULE: If the item is a "LOT", it represents a single package/bid.
  // We do not scale LOTs by footage unless specifically overridden.
  if (unit === 'LOT') return 1;

  let totalFloorArea = length * width;
  let totalPerimeter = (length + width) * 2;
  
  const linearFootageOfCabinetry = length + width; 

  if (dimensions.subAreas && Array.isArray(dimensions.subAreas)) {
      dimensions.subAreas.forEach(sub => {
          const subL = Number(sub.length) || 0;
          const subW = Number(sub.width) || 0;
          
          if (subL > 0 && subW > 0) {
              totalFloorArea += (subL * subW);
              totalPerimeter += (subL + subW) * 2;
          }
      });
  }

  const itemName = item.trim();

  switch (itemName) {
    case 'Vinyl Plank':
    case 'Carpet':
    case 'Stair Carpeting':
    case 'Paint Walls':
    case 'Interior Painting Per Property SF':
      return Math.round(totalFloorArea);
    
    case 'Drywall Wallboard Taped & Finished':
      return Math.round(totalPerimeter * INTERIOR_WALL_HEIGHT);
      
    case 'Paint Doors And Door Trim':
      return Math.round(totalPerimeter);

    case 'New Kitchen':
      // If the user changed unit to LF, we scale. If it's still LOT (default), it's handled above.
      return Math.round(linearFootageOfCabinetry);

    case 'Kitchen Backsplash Tile':
      return Math.round(linearFootageOfCabinetry * 1.5);
      
    case 'Pressure-Treated Deck':
      return Math.round(totalFloorArea);

    case 'Powerwash Scrape Clean & Prep':
      const heightForSiding = sidingHeight && sidingHeight > 0 ? sidingHeight : DEFAULT_EXTERIOR_WALL_HEIGHT;
      return Math.round(totalPerimeter * heightForSiding);

    case 'Asphalt Roofing Architectural':
      const roofMultiplier = roofPitch && roofPitch > 0 ? getRoofPitchMultiplier(roofPitch) : DEFAULT_ROOF_PITCH_MULTIPLIER;
      return Math.round((totalFloorArea * roofMultiplier) / 100);
      
    default:
      return undefined;
  }
};
