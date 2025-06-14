
import React, { useState, useEffect } from 'react';
import { StockItem, getTotalQuantity } from '../types';
import Modal from './Modal';
import { StockOutDetails } from '../hooks/useStockManagement';

interface StockOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitStockOut: (itemId: string, details: StockOutDetails) => Promise<void>;
  item: StockItem | null;
  isLoading: boolean;
}

const StockOutModal: React.FC<StockOutModalProps> = ({ isOpen, onClose, onSubmitStockOut, item, isLoading }) => {
  const [quantityConsumed, setQuantityConsumed] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [consumptionDate, setConsumptionDate] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const totalItemQuantity = item ? getTotalQuantity(item) : 0;

  useEffect(() => {
    if (isOpen && item) {
      setQuantityConsumed(1);
      setReason('');
      setConsumptionDate(new Date().toISOString().split('T')[0]); 
      setFormError(null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isLoading || !item) return;

    if (quantityConsumed <= 0) {
      setFormError('Quantity consumed must be greater than zero.');
      return;
    }
    if (quantityConsumed > totalItemQuantity) {
      setFormError(`Cannot consume more than available quantity (${totalItemQuantity} ${item.unit}).`);
      return;
    }
    if (!reason.trim()) {
      setFormError('Reason for stock out is required.');
      return;
    }

    try {
      await onSubmitStockOut(item.id, {
        quantityConsumed,
        reason: reason.trim(),
        consumptionDate: consumptionDate || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Stock out submission error:", error);
      // setFormError((error as Error).message || 'Failed to record stock out.');
    }
  };

  if (!item) return null;

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Record Stock Out: ${item.name} (${item.unit})`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p className="text-sm text-gray-600 mb-2">
            Total Available Quantity: <span className="font-semibold">{totalItemQuantity} {item.unit}</span>
          </p>
          <label htmlFor="quantityConsumed" className="block text-sm font-medium text-gray-700">
            Quantity Consumed ({item.unit}) <span className="text-danger-500">*</span>
          </label>
          <input
            type="number"
            name="quantityConsumed"
            id="quantityConsumed"
            value={quantityConsumed}
            onChange={(e) => setQuantityConsumed(parseInt(e.target.value, 10) || 0)}
            required
            min="1"
            max={totalItemQuantity}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Reason for Stock Out <span className="text-danger-500">*</span>
          </label>
          <textarea
            name="reason"
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            rows={3}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
            placeholder="e.g., Used in OR Case #123, Expired, Damaged"
          />
        </div>
        
        <div>
          <label htmlFor="consumptionDate" className="block text-sm font-medium text-gray-700">
            Date of Consumption (Optional)
          </label>
          <input
            type="date"
            name="consumptionDate"
            id="consumptionDate"
            value={consumptionDate}
            onChange={(e) => setConsumptionDate(e.target.value)}
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
            disabled={isLoading || quantityConsumed <= 0 || quantityConsumed > totalItemQuantity || !reason.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-warning-600 hover:bg-warning-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-warning-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Record Stock Out'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockOutModal;
