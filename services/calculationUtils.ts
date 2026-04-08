
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

  const n = item.trim().toLowerCase();

  // Floor area items (SF)
  if (
    n.includes('vinyl plank') ||
    n.includes('carpet') ||
    n.includes('paint interior') ||
    n.includes('paint walls') ||
    n.includes('interior painting') ||
    n.includes('laminate countertop') ||
    n.includes('pressure-treated deck') ||
    n.includes('stair carpet')
  ) {
    return Math.round(totalFloorArea);
  }

  // Drywall (wall perimeter x height)
  if (n.includes('drywall') && (n.includes('tape') || n.includes('finish') || n.includes('wallboard'))) {
    return Math.round(totalPerimeter * INTERIOR_WALL_HEIGHT);
  }

  // Perimeter items (LF)
  if (n.includes('baseboard') || n.includes('base 40') || (n.includes('paint') && n.includes('door') && n.includes('trim'))) {
    return Math.round(totalPerimeter);
  }

  // Kitchen cabinetry (LF)
  if (n.includes('cabinetry') || n.includes('cabinet') && n.includes('per lf')) {
    return Math.round(linearFootageOfCabinetry);
  }

  // Kitchen backsplash
  if (n.includes('backsplash')) {
    return Math.round(linearFootageOfCabinetry * 1.5);
  }

  // Exterior painting / powerwash (perimeter x height)
  if (n.includes('powerwash') || (n.includes('scrape') && n.includes('prep'))) {
    const heightForSiding = sidingHeight && sidingHeight > 0 ? sidingHeight : DEFAULT_EXTERIOR_WALL_HEIGHT;
    return Math.round(totalPerimeter * heightForSiding);
  }

  // Roofing (squares)
  if (n.includes('roofing') && (n.includes('architectural') || n.includes('3 tab') || n.includes('asphalt'))) {
    const roofMultiplier = roofPitch && roofPitch > 0 ? getRoofPitchMultiplier(roofPitch) : DEFAULT_ROOF_PITCH_MULTIPLIER;
    return Math.round((totalFloorArea * roofMultiplier) / 100);
  }

  return undefined;
};
