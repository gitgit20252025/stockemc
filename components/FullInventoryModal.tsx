
import React, { useState, useEffect } from 'react';
import { StockItem, Batch, getTotalQuantity } from '../types'; // Import Batch and getTotalQuantity
import { StockTakeEntry } from '../hooks/useStockManagement';
import Modal from './Modal';
import { SpinnerIcon } from './icons';

interface InventoryCountRow {
  itemId: string;
  batchId: string; // Identify by batch
  name: string; // Item name for display
  batchIdentifier: string; // e.g., Batch ID + Expiry Date for display
  unit: string;
  currentSystemQuantity: number; // Batch quantity
  countedQuantity: string;
  reason: string;
}

interface FullInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (entries: StockTakeEntry[]) => Promise<void>;
  allItems: StockItem[];
  isLoading: boolean;
  isSubmitting: boolean;
}

const FullInventoryModal: React.FC<FullInventoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  allItems,
  isLoading, 
  isSubmitting,
}) => {
  const [inventoryRows, setInventoryRows] = useState<InventoryCountRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

  useEffect(() => {
    if (isOpen && allItems.length > 0) {
      const rows: InventoryCountRow[] = [];
      allItems.forEach(item => {
        item.batches.forEach(batch => {
          rows.push({
            itemId: item.id,
            batchId: batch.id,
            name: item.name,
            batchIdentifier: `Batch: ${batch.id.substring(0,5)}... (Exp: ${formatDate(batch.expiryDate)}, Sup: ${batch.supplier || 'N/A'})`,
            unit: item.unit,
            currentSystemQuantity: batch.quantity,
            countedQuantity: batch.quantity.toString(),
            reason: '',
          });
        });
      });
      setInventoryRows(rows);
      setSearchTerm('');
    }
  }, [isOpen, allItems]);

  const handleRowChange = (batchId: string, field: 'countedQuantity' | 'reason', value: string) => {
    setInventoryRows(prevRows =>
      prevRows.map(row =>
        row.batchId === batchId ? { ...row, [field]: value } : row
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const entriesToSubmit: StockTakeEntry[] = inventoryRows
      .map(row => {
        const countedQuantityNum = parseInt(row.countedQuantity, 10);
        if ((!isNaN(countedQuantityNum) && countedQuantityNum !== row.currentSystemQuantity) || row.reason.trim() !== '') {
          return {
            itemId: row.itemId,
            batchId: row.batchId,
            countedQuantity: isNaN(countedQuantityNum) ? row.currentSystemQuantity : countedQuantityNum,
            reason: row.reason.trim() || undefined,
          };
        }
        return null;
      })
      .filter(entry => entry !== null) as StockTakeEntry[];

    if (entriesToSubmit.length === 0) {
        onClose(); 
        return;
    }

    try {
      await onSubmit(entriesToSubmit);
      // onClose(); // onSubmit in hook should handle notifications, App.tsx might close
    } catch (error) {
      console.error("Full inventory submission error:", error);
    }
  };
  
  const filteredRows = inventoryRows.filter(row => 
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    row.batchIdentifier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Full Inventory / Stock Take (Per Batch)" size="2xl"> {/* Increased size */}
      {isLoading && inventoryRows.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <SpinnerIcon className="w-12 h-12 text-primary-600" />
          <p className="ml-3 text-lg text-gray-600">Loading items and batches...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="mb-4">
            <label htmlFor="inventorySearch" className="block text-sm font-medium text-gray-700">Search Item or Batch Details</label>
            <input
              type="text"
              id="inventorySearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type to filter items or batch details..."
              className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm bg-white text-black border-gray-300 rounded-md p-2.5"
            />
          </div>
          <p className="text-sm text-yellow-700 bg-yellow-50 p-3 rounded-md">
            <strong>Note:</strong> Stock take per batch is a complex feature. This modal allows counting per batch, but the backend update logic in `useStockManagement` is currently a placeholder and needs full implementation to correctly update individual batch quantities.
          </p>
          <div className="overflow-x-auto max-h-[60vh] border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Details</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">System Qty</th>
                  <th scope="col" className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Counted Qty <span className="text-danger-500">*</span></th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason for Diff.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.length > 0 ? filteredRows.map(row => (
                  <tr key={row.batchId}>
                    <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">{row.batchIdentifier}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500">{row.unit}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{row.currentSystemQuantity}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-sm">
                      <input
                        type="number"
                        value={row.countedQuantity}
                        onChange={(e) => handleRowChange(row.batchId, 'countedQuantity', e.target.value)}
                        min="0"
                        required
                        className="w-24 bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5"
                      />
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <input
                        type="text"
                        value={row.reason}
                        onChange={(e) => handleRowChange(row.batchId, 'reason', e.target.value)}
                        placeholder="Optional reason"
                        className="w-full bg-white text-black border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm p-1.5"
                      />
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">
                      {inventoryRows.length > 0 ? 'No items/batches match your search.' : 'No items to display.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500"><span className="text-danger-500">*</span> Counted Quantity is required. It defaults to the current system quantity for the batch. Only batches with a changed quantity or a provided reason will be updated.</p>
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
              disabled={isSubmitting || filteredRows.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <SpinnerIcon className="w-4 h-4 mr-2 inline animate-spin" />
                  Submitting...
                </>
              ) : 'Submit Stock Take'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default FullInventoryModal;
