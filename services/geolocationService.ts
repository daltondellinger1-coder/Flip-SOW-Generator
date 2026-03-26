import { GOOGLE_API_KEY } from '../googleConfig';

export const getAddressFromCoords = async (lat: number, lon: number): Promise<string> => {
  if (!GOOGLE_API_KEY) {
    console.error("Google API Key is not available. It should be provided by the environment.");
    throw new Error("API key not configured.");
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Google Geocoding API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      if (data.error_message?.includes('API project is not authorized to use this API')) {
          throw new Error(`Geocoding failed: The provided API key is not enabled for the Geocoding API. Please enable it in the Google Cloud Console.`);
      }
      throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'No results found.'}`);
    }
    return data.results[0].formatted_address;
  } catch (error) {
    console.error("Error in getAddressFromCoords:", error);
    throw error;
  }
};