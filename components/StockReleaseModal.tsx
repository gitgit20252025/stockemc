
import React, { useState, useEffect } from 'react';
import { StockItem, getTotalQuantity } from '../types';
import Modal from './Modal';
import { StockReleaseDetails } from '../hooks/useStockManagement';

interface StockReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitStockRelease: (itemId: string, details: StockReleaseDetails) => Promise<void>;
  item: StockItem | null;
  isLoading: boolean;
}

const StockReleaseModal: React.FC<StockReleaseModalProps> = ({ isOpen, onClose, onSubmitStockRelease, item, isLoading }) => {
  const [quantityReleased, setQuantityReleased] = useState<number>(1);
  const [releasedTo, setReleasedTo] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [releaseDate, setReleaseDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const totalItemQuantity = item ? getTotalQuantity(item) : 0;

  useEffect(() => {
    if (isOpen && item) {
      setQuantityReleased(1);
      setReleasedTo('');
      setReason('');
      setReleaseDate(new Date().toISOString().split('T')[0]); 
      setFormError(null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isLoading || !item) return;

    if (quantityReleased <= 0) {
      setFormError('Quantity released must be greater than zero.');
      return;
    }
    if (quantityReleased > totalItemQuantity) {
      setFormError(`Cannot release more than available quantity (${totalItemQuantity} ${item.unit}).`);
      return;
    }
    if (!releasedTo.trim()) {
      setFormError('"Released To" field is required.');
      return;
    }

    try {
      await onSubmitStockRelease(item.id, {
        quantityReleased,
        releasedTo: releasedTo.trim(),
        reason: reason.trim() || undefined,
        releaseDate: releaseDate || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Stock release submission error:", error);
    }
  };

  if (!item) return null;

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Release Stock: ${item.name} (${item.unit})`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Total Available Quantity: <span className="font-semibold">{totalItemQuantity} {item.unit}</span>
          </p>
          <label htmlFor="quantityReleased" className="block text-sm font-medium text-gray-700">
            Quantity to Release ({item.unit}) <span className="text-danger-500">*</span>
          </label>
          <input
            type="number"
            name="quantityReleased"
            id="quantityReleased"
            value={quantityReleased}
            onChange={(e) => setQuantityReleased(parseInt(e.target.value, 10) || 0)}
            required
            min="1"
            max={totalItemQuantity}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="releasedTo" className="block text-sm font-medium text-gray-700">
            Released To <span className="text-danger-500">*</span>
          </label>
          <input
            type="text"
            name="releasedTo"
            id="releasedTo"
            value={releasedTo}
            onChange={(e) => setReleasedTo(e.target.value)}
            required
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
            placeholder="e.g., Patient ID, Department, OR Suite"
          />
        </div>
        
        <div>
          <label htmlFor="releaseReason" className="block text-sm font-medium text-gray-700">
            Reason for Release (Optional)
          </label>
          <textarea
            name="releaseReason"
            id="releaseReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
            placeholder="e.g., Scheduled procedure, Emergency use"
          />
        </div>
        
        <div>
          <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700">
            Date of Release (Optional)
          </label>
          <input
            type="date"
            name="releaseDate"
            id="releaseDate"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            max={todayISO} 
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
          />
           <p className="text-xs text-gray-500 mt-1">Defaults to today if left blank.</p>
        </div>

        {formError && (
          <p className="text-sm text-danger-600 bg-danger-50 p-2 rounded-md">{formError}</p>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || quantityReleased <= 0 || quantityReleased > totalItemQuantity || !releasedTo.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Record Release'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockReleaseModal;
