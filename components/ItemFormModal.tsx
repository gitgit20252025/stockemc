
import React, { useState, useEffect } from 'react';
import { StockItem, ItemCategory, Batch } from '../types';
import { CATEGORY_OPTIONS, UNIT_OPTIONS } from '../constants';
import Modal from './Modal';

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: (Omit<StockItem, 'id' | 'lastUpdated' | 'batches'> & { firstBatch: Omit<Batch, 'id' | 'dateAdded'> }) | Pick<StockItem, 'id' | 'name' | 'category' | 'unit' | 'minThreshold' | 'notes' | 'originCountry'>) => Promise<void>;
  initialData?: StockItem | null; // For editing item definition
  isLoading: boolean;
}

// Default state for a new item and its first batch
const getEmptyItemAndFirstBatch = () => ({
  name: '',
  category: CATEGORY_OPTIONS[0].value,
  unit: UNIT_OPTIONS[0],
  minThreshold: 10,
  notes: '', // General item notes
  originCountry: '',
  // First batch details
  firstBatchQuantity: 0,
  firstBatchExpiryDate: '',
  firstBatchSupplier: '',
  firstBatchNotes: '', // Notes for the first batch
});

type FormDataShape = ReturnType<typeof getEmptyItemAndFirstBatch> & { id?: string };


const ItemFormModal: React.FC<ItemFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const [formData, setFormData] = useState<FormDataShape>(getEmptyItemAndFirstBatch());

  useEffect(() => {
    if (isOpen) {
      if (initialData) { // Editing existing item definition
        setFormData({
          id: initialData.id,
          name: initialData.name || '',
          category: initialData.category || CATEGORY_OPTIONS[0].value,
          unit: initialData.unit || UNIT_OPTIONS[0],
          minThreshold: initialData.minThreshold || 0,
          notes: initialData.notes || '',
          originCountry: initialData.originCountry || '',
          // Batch fields are not directly edited here for existing items; set to defaults or leave empty
          firstBatchQuantity: 0, // Not applicable when editing item definition
          firstBatchExpiryDate: '',
          firstBatchSupplier: '',
          firstBatchNotes: '',
        });
      } else { // Adding new item
        setFormData(getEmptyItemAndFirstBatch());
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'minThreshold' || name === 'firstBatchQuantity') ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      if (initialData && formData.id) { // Editing existing item definition
        await onSubmit({
          id: formData.id,
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          minThreshold: formData.minThreshold,
          notes: formData.notes,
          originCountry: formData.originCountry,
        });
      } else { // Adding new item with its first batch
        await onSubmit({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          minThreshold: formData.minThreshold,
          notes: formData.notes,
          originCountry: formData.originCountry,
          firstBatch: {
            quantity: formData.firstBatchQuantity,
            expiryDate: formData.firstBatchExpiryDate || undefined,
            supplier: formData.firstBatchSupplier || undefined,
            notes: formData.firstBatchNotes || undefined,
          }
        });
      }
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };
  
  const today = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Stock Item Definition' : 'Add New Stock Item'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pb-2">Item Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Item Name <span className="text-danger-500">*</span></label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category <span className="text-danger-500">*</span></label>
            <select name="category" id="category" value={formData.category} onChange={handleChange} required className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2">
              {CATEGORY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div>
            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit <span className="text-danger-500">*</span></label>
            <select name="unit" id="unit" value={formData.unit} onChange={handleChange} required className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2">
              {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="minThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold <span className="text-danger-500">*</span></label>
            <input type="number" name="minThreshold" id="minThreshold" value={formData.minThreshold} onChange={handleChange} required min="0" className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
          </div>
        </div>
        
        <div>
          <label htmlFor="originCountry" className="block text-sm font-medium text-gray-700">Origin Country</label>
          <input type="text" name="originCountry" id="originCountry" value={formData.originCountry} onChange={handleChange} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">General Item Notes</label>
          <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={2} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" placeholder="General notes about the item itself"></textarea>
        </div>

        {!initialData && ( // Only show first batch fields when adding a new item
          <>
            <h3 className="text-lg font-medium leading-6 text-gray-900 border-b pt-4 pb-2">Initial Batch Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstBatchQuantity" className="block text-sm font-medium text-gray-700">Initial Quantity <span className="text-danger-500">*</span></label>
                <input type="number" name="firstBatchQuantity" id="firstBatchQuantity" value={formData.firstBatchQuantity} onChange={handleChange} required min="0" className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
              </div>
              <div>
                <label htmlFor="firstBatchExpiryDate" className="block text-sm font-medium text-gray-700">Batch Expiry Date</label>
                <input type="date" name="firstBatchExpiryDate" id="firstBatchExpiryDate" value={formData.firstBatchExpiryDate} onChange={handleChange} min={today} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
              </div>
            </div>
            <div>
              <label htmlFor="firstBatchSupplier" className="block text-sm font-medium text-gray-700">Batch Supplier</label>
              <input type="text" name="firstBatchSupplier" id="firstBatchSupplier" value={formData.firstBatchSupplier} onChange={handleChange} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" />
            </div>
            <div>
              <label htmlFor="firstBatchNotes" className="block text-sm font-medium text-gray-700">Batch Notes</label>
              <textarea name="firstBatchNotes" id="firstBatchNotes" value={formData.firstBatchNotes} onChange={handleChange} rows={2} className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2" placeholder="e.g., Lot number, PO reference for this batch"></textarea>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? 'Saving...' : (initialData ? 'Save Changes' : 'Add Item & Batch')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ItemFormModal;
