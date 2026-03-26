import React, { useState } from 'react';
import { getAddressFromCoords } from '../services/geolocationService';
import { XIcon, LocationMarkerIcon } from './icons';

interface AddressModalProps {
  onClose: () => void;
  onSave: (address: string) => void;
  currentAddress: string;
}

const AddressModal: React.FC<AddressModalProps> = ({ onClose, onSave, currentAddress }) => {
  const [address, setAddress] = useState(currentAddress);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (address.trim()) {
      onSave(address);
      onClose();
    } else {
        setError('Address cannot be empty.');
    }
  };

  const handleLocate = async () => {
    setIsLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLocating(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const fetchedAddress = await getAddressFromCoords(position.coords.latitude, position.coords.longitude);
        setAddress(fetchedAddress);
      } catch (e: any) {
        setError(e.message || "Could not fetch address. Check API key and permissions.");
      } finally {
        setIsLocating(false);
      }
    }, () => {
      setError("Unable to retrieve your location. Please ensure location services are enabled.");
      setIsLocating(false);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Project Address</h2>
          <button onClick={onClose} className="text-content hover:text-white">
            <XIcon />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="address" className="block text-sm font-medium mb-1">Enter Property Address</label>
            <textarea
              id="address"
              rows={3}
              className="w-full bg-base-200 border border-base-300 rounded-md p-2 focus:ring-brand-primary focus:border-brand-primary"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Anytown, USA"
            />
          </div>
          <button
            onClick={handleLocate}
            disabled={isLocating}
            className="w-full flex items-center justify-center gap-2 bg-base-200 text-white px-4 py-2 rounded-md hover:bg-base-300 disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Locating...</span>
              </>
            ) : (
              <>
                <LocationMarkerIcon />
                <span>Use Current Location</span>
              </>
            )}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
        <div className="p-4 bg-base-200 rounded-b-lg">
          <button onClick={handleSave} className="w-full bg-brand-primary text-white px-6 py-2 rounded-md hover:bg-brand-secondary font-semibold">
            Save Address
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
