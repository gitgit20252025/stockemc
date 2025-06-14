
import React, { useState, useEffect } from 'react';
import { StockItem, getTotalQuantity } from '../types'; // Import getTotalQuantity
import { BulkAddItemEntry, ProcessBulkAddStockPayload } from '../hooks/useStockManagement';
import Modal from './Modal';
import { SearchIcon, XMarkIcon, PlusIcon, SpinnerIcon, CalendarDaysIcon } from './icons';

interface BulkAddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ProcessBulkAddStockPayload) => Promise<void>;
  allItems: StockItem[];
  isLoading: boolean; 
  isSubmitting: boolean;
}

// This interface is for items displayed in the modal's list BEFORE submission.
// It aligns with BulkAddItemEntry but includes full item details for display.
interface ModalAddListItem {
  itemId: string;
  name: string;
  unit: string;
  currentSystemQuantity: number; // Display current total
  // Batch specific details for this addition
  quantityToAdd: string; 
  expiryDate: string;
  supplier: string;
  batchNotes: string;
  error?: string; 
}

const BulkAddStockModal: React.FC<BulkAddStockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allItems,
  isLoading,
  isSubmitting,
}) => {
  const [itemsInAddList, setItemsInAddList] = useState<ModalAddListItem[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setItemsInAddList([]);
      setItemSearchTerm('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleAddItemToList = (item: StockItem) => {
    // A single item can be added multiple times if user wants to record multiple distinct batches for it
    // So, we don't check if item.id is already in list, instead each click adds a new row for a new batch.
    
    setItemsInAddList(prev => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        currentSystemQuantity: getTotalQuantity(item), // Display current total
        quantityToAdd: '1', 
        expiryDate: '', // Default to empty for new batch
        supplier: '',   // Default to empty
        batchNotes: '',
        error: undefined,
      },
    ]);
    setItemSearchTerm(''); 
  };

  // Uses index because multiple entries for the same item ID are possible (for different batches)
  const handleRemoveItemFromList = (index: number) => {
    setItemsInAddList(prev => prev.filter((_, i) => i !== index));
  };

  const handleListItemChange = (index: number, field: keyof ModalAddListItem, value: string) => {
    setItemsInAddList(prev =>
      prev.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantityToAdd') {
            const numValue = parseInt(value, 10);
            if (value === '' || isNaN(numValue) || numValue <= 0) {
              updatedItem.error = 'Qty must be > 0';
            } else {
              updatedItem.error = undefined;
            }
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isSubmitting) return;

    if (itemsInAddList.length === 0) {
      setFormError('Please add at least one item to receive stock.');
      return;
    }

    const itemsToSubmit: BulkAddItemEntry[] = [];
    let hasInputErrors = false;
    for (const listItem of itemsInAddList) {
      const qty = parseInt(listItem.quantityToAdd, 10);
      if (isNaN(qty) || qty <= 0) {
        // Find the specific item in the list to update its error state (if not already handled by handleListItemChange)
        // This is a bit redundant if handleListItemChange covers it, but good for direct submit validation.
        setItemsInAddList(prev => prev.map(li => li.itemId === listItem.itemId && li.quantityToAdd === listItem.quantityToAdd ? {...li, error: 'Qty must be > 0'} : li))
        hasInputErrors = true;
        continue;
      }
      itemsToSubmit.push({
        itemId: listItem.itemId,
        quantityAdded: qty,
        expiryDate: listItem.expiryDate || undefined,
        supplier: listItem.supplier || undefined,
        batchNotes: listItem.batchNotes || undefined,
      });
    }

    if (hasInputErrors) {
      setFormError('Please correct errors in the item list.');
      return;
    }
    if (itemsToSubmit.length === 0) { // Should not happen if previous checks pass
        setFormError('No valid items to process.');
        return;
    }

    const payload: ProcessBulkAddStockPayload = { itemsToAddStock: itemsToSubmit };

    try {
      await onSubmit(payload);
    } catch (error) {
      console.error("Bulk add stock submission error in modal:", error);
      setFormError((error as Error).message || 'Failed to submit bulk stock addition.');
    }
  };

  const availableItemsToSearch = allItems
    .filter(item => item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()));

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Add Stock (New Batches)" size="5xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-md font-semibold text-gray-700 px-2">Add Items to Receive Stock</legend>
          <div className="mt-2">
            <label htmlFor="bulkAddItemSearch" className="block text-sm font-medium text-gray-700">Search & Add Item for New Batch</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="bulkAddItemSearch"
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                placeholder="Search items by name..."
                className="block w-full pl-10 bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2.5"
              />
            </div>
            {itemSearchTerm && (
              <ul className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                {availableItemsToSearch.length > 0 ? (
                  availableItemsToSearch.map(item => (
                    <li key={item.id} // Key is still item.id, list handles multiple instances
                        className="px-3 py-2 bg-white text-gray-900 hover:bg-primary-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddItemToList(item)}
                        title="Add as new batch entry">
                      <span>{item.name} <span className="text-xs text-gray-500">(Current Total: {getTotalQuantity(item)} {item.unit})</span></span>
                      <PlusIcon className="w-5 h-5 text-success-500" />
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-gray-500 bg-white">No matching items found.</li>
                )}
              </ul>
            )}
          </div>

          <div className="mt-4 max-h-[50vh] overflow-y-auto">
            {itemsInAddList.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 sticky top-0 z-5">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Item (New Batch)</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Qty to Add</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">Batch Notes</th>
                    <th className="px-2 py-2 text-center font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemsInAddList.map((item, index) => (
                    <tr key={index}> {/* Use index as key since same item can appear multiple times for different batches */}
                      <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900">
                        {item.name}
                        <div className="text-xs text-gray-500">Current Total: {item.currentSystemQuantity} {item.unit}</div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantityToAdd}
                          onChange={(e) => handleListItemChange(index, 'quantityToAdd', e.target.value)}
                          min="1"
                          required
                          className={`w-24 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5 bg-white text-black ${item.error ? 'border-danger-500' : 'border-gray-300'}`}
                        />
                        {item.error && <p className="text-xs text-danger-500 mt-0.5">{item.error}</p>}
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <CalendarDaysIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="date"
                                value={item.expiryDate}
                                onChange={(e) => handleListItemChange(index, 'expiryDate', e.target.value)}
                                min={todayISO}
                                className="w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5 pl-7"
                            />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.supplier}
                          onChange={(e) => handleListItemChange(index, 'supplier', e.target.value)}
                          placeholder="Batch supplier"
                          className="w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={item.batchNotes}
                          onChange={(e) => handleListItemChange(index, 'batchNotes', e.target.value)}
                          placeholder="e.g., PO #, Lot ID"
                          className="w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5"
                        />
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => handleRemoveItemFromList(index)}
                                className="text-danger-600 hover:text-danger-800 p-1 rounded-md hover:bg-danger-100"
                                title="Remove this batch entry">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No items added yet. Search and add items to create new batches.</p>
            )}
          </div>
        </fieldset>

        {formError && (
          <p className="text-sm text-danger-600 bg-danger-50 p-3 rounded-md text-center">{formError}</p>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading || itemsInAddList.length === 0 || itemsInAddList.some(item => !!item.error || parseInt(item.quantityToAdd, 10) <= 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : 'Process Bulk Stock Add'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkAddStockModal;
