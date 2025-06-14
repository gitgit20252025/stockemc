
import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import Modal from './Modal';
import { AddBatchDetails } from '../hooks/useStockManagement';

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitStock: (itemId: string, batchDetails: AddBatchDetails) => Promise<void>; // Changed from AddStockDetails
  item: StockItem | null;
  isLoading: boolean;
}

const AddStockModal: React.FC<AddStockModalProps> = ({ isOpen, onClose, onSubmitStock, item, isLoading }) => {
  const [quantityAdded, setQuantityAdded] = useState<number>(1);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [supplier, setSupplier] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState<string>(''); // Renamed from notes

  useEffect(() => {
    if (isOpen && item) {
      setQuantityAdded(1);
      setExpiryDate(''); // New batch, so expiry should be new or blank
      setSupplier('');   // New batch, supplier might be different
      setBatchNotes(''); // Clear notes for new batch entry
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !item || quantityAdded <= 0) return;
    try {
      await onSubmitStock(item.id, { // Pass AddBatchDetails
        quantityAdded,
        expiryDate: expiryDate || undefined,
        supplier: supplier || undefined,
        batchNotes: batchNotes || undefined, // Pass renamed batchNotes
      });
      onClose();
    } catch (error) {
      console.error("Add stock batch submission error:", error);
    }
  };

  const todayISO = new Date().toISOString().split('T')[0];

  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add New Batch to: ${item.name} (${item.unit})`} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="quantityAdded" className="block text-sm font-medium text-gray-700">
            Quantity for this Batch ({item.unit}) <span className="text-danger-500">*</span>
          </label>
          <input
            type="number"
            name="quantityAdded"
            id="quantityAdded"
            value={quantityAdded}
            onChange={(e) => setQuantityAdded(parseInt(e.target.value, 10) || 0)}
            required
            min="1"
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
          />
        </div>

        <div>
          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700">
            Expiry Date (for this batch)
          </label>
          <input
            type="date"
            name="expiryDate"
            id="expiryDate"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            min={todayISO}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
          />
        </div>
        
        <div>
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700">
            Supplier (for this batch)
          </label>
          <input
            type="text"
            name="supplier"
            id="supplier"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <label htmlFor="batchNotes" className="block text-sm font-medium text-gray-700">
            Notes (for this batch)
          </label>
          <textarea
            name="batchNotes" // Changed from 'notes' to 'batchNotes' to match state
            id="batchNotes"
            value={batchNotes}
            onChange={(e) => setBatchNotes(e.target.value)}
            rows={2}
            className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2"
            placeholder="e.g., PO #123, Batch ID XYZ, Lot No."
          />
        </div>

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
            disabled={isLoading || quantityAdded <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Adding Batch...' : 'Add Batch'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddStockModal;
