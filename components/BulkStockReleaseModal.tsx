
import React, { useState, useEffect } from 'react';
import { StockItem, getTotalQuantity } from '../types'; // Import getTotalQuantity
import { BulkReleaseItemEntry, BulkReleaseCommonDetails, ProcessBulkStockReleasePayload } from '../hooks/useStockManagement';
import Modal from './Modal';
import { UsersIcon, CalendarDaysIcon, SearchIcon, XMarkIcon, PlusIcon, SpinnerIcon } from './icons';

interface BulkStockReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: ProcessBulkStockReleasePayload) => Promise<void>;
  allItems: StockItem[];
  isLoading: boolean; 
  isSubmitting: boolean;
}

interface ReleaseListItem {
  itemId: string;
  name: string;
  unit: string;
  currentSystemTotalQuantity: number; // Represents total quantity from all batches
  quantityToRelease: string; 
  error?: string;
}

const BulkStockReleaseModal: React.FC<BulkStockReleaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allItems,
  isLoading,
  isSubmitting,
}) => {
  const [commonDetails, setCommonDetails] = useState<BulkReleaseCommonDetails>({
    releasedTo: '',
    reason: '',
    releaseDate: new Date().toISOString().split('T')[0],
  });
  const [itemsInReleaseList, setItemsInReleaseList] = useState<ReleaseListItem[]>([]);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCommonDetails({
        releasedTo: '',
        reason: '',
        releaseDate: new Date().toISOString().split('T')[0],
      });
      setItemsInReleaseList([]);
      setItemSearchTerm('');
      setFormError(null);
    }
  }, [isOpen]);

  const handleCommonDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCommonDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItemToReleaseList = (item: StockItem) => {
    if (itemsInReleaseList.find(i => i.itemId === item.id)) return; 
    
    const totalQty = getTotalQuantity(item);
    if (totalQty === 0) return; // Cannot add item with 0 total quantity

    setItemsInReleaseList(prev => [
      ...prev,
      {
        itemId: item.id,
        name: item.name,
        unit: item.unit,
        currentSystemTotalQuantity: totalQty,
        quantityToRelease: '1', 
        error: undefined,
      },
    ]);
    setItemSearchTerm(''); 
  };

  const handleRemoveItemFromList = (itemId: string) => {
    setItemsInReleaseList(prev => prev.filter(item => item.itemId !== itemId));
  };

  const handleQuantityToReleaseChange = (itemId: string, value: string) => {
    setItemsInReleaseList(prev =>
      prev.map(item => {
        if (item.itemId === itemId) {
          const numValue = parseInt(value, 10);
          let error;
          if (value === '' || isNaN(numValue) || numValue <= 0) {
            error = 'Qty must be > 0';
          } else if (numValue > item.currentSystemTotalQuantity) {
            error = `Max: ${item.currentSystemTotalQuantity}`;
          }
          return { ...item, quantityToRelease: value, error };
        }
        return item;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (isSubmitting) return;

    if (!commonDetails.releasedTo.trim()) {
      setFormError('"Released To" field is required.');
      return;
    }
    if (itemsInReleaseList.length === 0) {
      setFormError('Please add at least one item to release.');
      return;
    }

    const itemsToRelease: BulkReleaseItemEntry[] = [];
    let hasInputErrors = false;
    for (const listItem of itemsInReleaseList) {
      const qty = parseInt(listItem.quantityToRelease, 10);
      if (isNaN(qty) || qty <= 0 || qty > listItem.currentSystemTotalQuantity) {
        handleQuantityToReleaseChange(listItem.itemId, listItem.quantityToRelease); 
        hasInputErrors = true;
        continue;
      }
      itemsToRelease.push({ itemId: listItem.itemId, quantityReleased: qty });
    }

    if (hasInputErrors) {
      setFormError('Please correct errors in the item list.');
      return;
    }
    if (itemsToRelease.length === 0 && itemsInReleaseList.length > 0) {
        setFormError('No valid items to release after validation. Please check quantities.');
        return;
    }
     if (itemsToRelease.length === 0) {
        setFormError('Please add items with valid quantities to release.');
        return;
    }

    const payload: ProcessBulkStockReleasePayload = {
      commonDetails,
      itemsToRelease,
    };

    try {
      await onSubmit(payload);
    } catch (error) {
      console.error("Bulk stock release submission error in modal:", error);
      setFormError((error as Error).message || 'Failed to submit bulk release.');
    }
  };

  const availableItemsToAdd = allItems
    .filter(item => item.name.toLowerCase().includes(itemSearchTerm.toLowerCase()))
    .filter(item => !itemsInReleaseList.find(i => i.itemId === item.id)) 
    .filter(item => getTotalQuantity(item) > 0); 

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Stock Release Form (FEFO)" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-md font-semibold text-gray-700 px-2">Release Details</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label htmlFor="releasedTo" className="block text-sm font-medium text-gray-700">
                Released To <span className="text-danger-500">*</span>
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UsersIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="releasedTo"
                  id="releasedTo"
                  value={commonDetails.releasedTo}
                  onChange={handleCommonDetailChange}
                  required
                  className="block w-full pl-10 bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2.5"
                  placeholder="e.g., Patient ID, Department"
                />
              </div>
            </div>
            <div>
              <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-700">Date of Release</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="date"
                  name="releaseDate"
                  id="releaseDate"
                  value={commonDetails.releaseDate}
                  onChange={handleCommonDetailChange}
                  max={todayISO}
                  className="block w-full pl-10 bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2.5"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Release (Optional)</label>
            <textarea
              name="reason"
              id="reason"
              value={commonDetails.reason}
              onChange={handleCommonDetailChange}
              rows={2}
              className="mt-1 block w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2.5"
              placeholder="e.g., Departmental restock"
            />
          </div>
        </fieldset>

        <fieldset className="border border-gray-300 p-4 rounded-md">
          <legend className="text-md font-semibold text-gray-700 px-2">Items to Release</legend>
          <div className="mt-2">
            <label htmlFor="itemSearch" className="block text-sm font-medium text-gray-700">Add Item to List</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="itemSearch"
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                placeholder="Search items by name..."
                className="block w-full pl-10 bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-2.5"
              />
            </div>
            {itemSearchTerm && (
              <ul className="mt-2 border border-gray-200 rounded-md max-h-40 overflow-y-auto bg-white shadow-lg z-10">
                {availableItemsToAdd.length > 0 ? (
                  availableItemsToAdd.map(item => (
                    <li key={item.id}
                        className="px-3 py-2 bg-white text-gray-900 hover:bg-primary-50 cursor-pointer flex justify-between items-center"
                        onClick={() => handleAddItemToReleaseList(item)}>
                      <span>{item.name} <span className="text-xs text-gray-500">(Available: {getTotalQuantity(item)} {item.unit})</span></span>
                      <PlusIcon className="w-5 h-5 text-success-500" />
                    </li>
                  ))
                ) : (
                  <li className="px-3 py-2 text-sm text-gray-500 bg-white">No matching items found or item already added/unavailable.</li>
                )}
              </ul>
            )}
          </div>

          <div className="mt-4 max-h-[30vh] overflow-y-auto">
            {itemsInReleaseList.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-5">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Available</th>
                    <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Release Qty</th>
                    <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {itemsInReleaseList.map(item => (
                    <tr key={item.itemId}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                      <td className="px-2 py-2 whitespace-nowrap text-sm text-gray-500">{item.currentSystemTotalQuantity} {item.unit}</td>
                      <td className="px-2 py-2 text-sm">
                        <input
                          type="number"
                          value={item.quantityToRelease}
                          onChange={(e) => handleQuantityToReleaseChange(item.itemId, e.target.value)}
                          min="1"
                          max={item.currentSystemTotalQuantity}
                          required
                          className={`w-24 border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5 bg-white text-black ${item.error ? 'border-danger-500' : 'border-gray-300'}`}
                          aria-describedby={item.error ? `${item.itemId}-error` : undefined}
                        />
                        {item.error && <p id={`${item.itemId}-error`} className="text-xs text-danger-500 mt-0.5">{item.error}</p>}
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button type="button" onClick={() => handleRemoveItemFromList(item.itemId)}
                                className="text-danger-600 hover:text-danger-800 p-1 rounded-md hover:bg-danger-100"
                                title="Remove item from list">
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No items added to the release list yet. Stock will be released using FEFO strategy.</p>
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
            disabled={isSubmitting || isLoading || itemsInReleaseList.length === 0 || itemsInReleaseList.some(item => !!item.error || parseInt(item.quantityToRelease, 10) <= 0)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : 'Process Bulk Release'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BulkStockReleaseModal;
