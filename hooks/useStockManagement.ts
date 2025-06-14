
import { useState, useEffect, useCallback } from 'react';
import { StockItem, ItemCategory, AppNotification, NotificationType, Batch, getTotalQuantity, getSoonestExpiryDate } from '../types';
import { stockService } from '../services/stockService';

// Helper to get current date as YYYY-MM-DD
const getFormattedDate = (date: Date = new Date()): string => date.toISOString().split('T')[0];

// Details for adding a new batch to an existing item
export interface AddBatchDetails {
  quantityAdded: number;
  expiryDate?: string;
  supplier?: string;
  batchNotes?: string;
}

export interface StockOutDetails {
  quantityConsumed: number;
  reason: string;
  consumptionDate?: string;
}

export interface StockTakeEntry {
  itemId: string;
  batchId: string; 
  countedQuantity: number;
  reason?: string;
}

export interface StockReleaseDetails {
  quantityReleased: number;
  releasedTo: string;
  reason?: string;
  releaseDate?: string;
}

export interface BulkReleaseItemEntry {
  itemId: string;
  quantityReleased: number;
}

export interface BulkReleaseCommonDetails {
  releasedTo: string;
  reason?: string;
  releaseDate?: string;
}

export interface ProcessBulkStockReleasePayload {
  commonDetails: BulkReleaseCommonDetails;
  itemsToRelease: BulkReleaseItemEntry[];
}

export interface ProcessedBulkReleaseResult {
  success: boolean;
  processedItems: Array<{ item: StockItem; quantityReleased: number; affectedBatches: Array<{batchId: string, releasedQuantity: number}> }>;
  errors: Array<{ itemId: string; name?: string; error: string }>;
  commonDetails: BulkReleaseCommonDetails;
  voucherId: string;
}

export interface BulkAddItemEntry {
  itemId: string;
  quantityAdded: number;
  expiryDate?: string;
  supplier?: string;
  batchNotes?: string;
}

export interface ProcessBulkAddStockPayload {
  itemsToAddStock: BulkAddItemEntry[]; 
}

export interface ProcessedBulkAddStockResult {
  success: boolean;
  processedItems: StockItem[];
  errors: Array<{ itemId: string; name?: string; error: string }>;
}


export const useStockManagement = () => {
  const [allItemsState, setAllItemsState] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | ''>('');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string, type: NotificationType) => {
    const newNotification: AppNotification = { id: Date.now().toString(), message, type };
    setNotifications(prev => [newNotification, ...prev.slice(0, 2)]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  }, []);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await stockService.getAllItems();
      setAllItemsState(data);
      setError(null);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to fetch items: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = useCallback(async (itemData: Omit<StockItem, 'id' | 'lastUpdated' | 'batches'> & { firstBatch: Omit<Batch, 'id'|'dateAdded'> }) => {
    setIsLoading(true);
    try {
      const newItem = await stockService.addItem(itemData);
      setAllItemsState(prevItems => [...prevItems, newItem]);
      addNotification(`Item "${newItem.name}" added successfully with initial batch.`, 'success');
      setError(null);
      return newItem;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to add item: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);
  
  const updateItemDefinition = useCallback(async (itemData: Pick<StockItem, 'id' | 'name' | 'category' | 'unit' | 'minThreshold' | 'notes' | 'originCountry'>) => {
    setIsLoading(true);
    try {
      const updatedItem = await stockService.updateItem(itemData);
      setAllItemsState(prevItems => prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      addNotification(`Item "${updatedItem.name}" definition updated successfully.`, 'success');
      setError(null);
      return updatedItem;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to update item definition: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);


  const deleteItem = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const itemToDelete = allItemsState.find(item => item.id === id);
      await stockService.deleteItem(id);
      setAllItemsState(prevItems => prevItems.filter(item => item.id !== id));
      if (itemToDelete) {
        addNotification(`Item "${itemToDelete.name}" deleted successfully.`, 'success');
      }
      setError(null);
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to delete item: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, allItemsState]);

  const addStockBatchToItem = useCallback(async (itemId: string, batchDetails: AddBatchDetails): Promise<StockItem> => {
    setIsLoading(true);
    const currentItem = allItemsState.find(item => item.id === itemId);
    if (!currentItem) {
      const errorMsg = 'Item not found to add stock batch.';
      addNotification(errorMsg, 'error');
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }

    try {
      const newBatchData: Omit<Batch, 'id' | 'dateAdded'> = {
        quantity: batchDetails.quantityAdded,
        expiryDate: batchDetails.expiryDate,
        supplier: batchDetails.supplier,
        notes: batchDetails.batchNotes, // Service will prepend system note if this is not already a system note
      };
      // Pass currentItem.unit to the service method
      const updatedItem = await stockService.addBatchToItem(itemId, newBatchData, currentItem.unit);
      setAllItemsState(prevItems => prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      addNotification(`${batchDetails.quantityAdded} ${updatedItem.unit}(s) of "${updatedItem.name}" added as a new batch. Total quantity: ${getTotalQuantity(updatedItem)}.`, 'success');
      setError(null);
      return updatedItem;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to add stock batch: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, allItemsState]);
  
  const recordStockRelease = useCallback(async (itemId: string, details: StockReleaseDetails): Promise<StockItem> => {
    setIsLoading(true);
    const currentItem = allItemsState.find(item => item.id === itemId);

    if (!currentItem) { throw new Error('Item not found'); }
    if (details.quantityReleased <= 0) { throw new Error('Quantity must be > 0'); }
    if (details.quantityReleased > getTotalQuantity(currentItem)) { throw new Error('Not enough stock'); }

    try {
      const releaseOperationNotes = (batch: Batch, qtyReleasedFromBatch: number, itemUnit: string) => {
          const releaseDateStr = details.releaseDate ? getFormattedDate(new Date(details.releaseDate)) : getFormattedDate();
          let note = `[Stock Release - ${releaseDateStr}]: Released ${qtyReleasedFromBatch} ${itemUnit} to "${details.releasedTo}" from batch ID ${batch.id}.`;
          if (details.reason) note += ` Reason: ${details.reason}.`;
          return note;
      };

      const { updatedItem } = await stockService.modifyItemBatchesForRelease(itemId, details.quantityReleased, releaseOperationNotes);
      
      setAllItemsState(prevItems => prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      addNotification(`${details.quantityReleased} ${updatedItem.unit}(s) of "${updatedItem.name}" released to ${details.releasedTo}. New total quantity: ${getTotalQuantity(updatedItem)}.`, 'success');
      setError(null);
      return updatedItem;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to record stock release: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, allItemsState]);


  const recordStockOut = useCallback(async (itemId: string, details: StockOutDetails): Promise<StockItem> => {
    setIsLoading(true);
    const currentItem = allItemsState.find(item => item.id === itemId);

    if (!currentItem) { throw new Error('Item not found'); }
    if (details.quantityConsumed <= 0) { throw new Error('Quantity must be > 0'); }
    if (details.quantityConsumed > getTotalQuantity(currentItem)) { throw new Error('Not enough stock'); }
    
    try {
      const consumptionOperationNotes = (batch: Batch, qtyConsumedFromBatch: number, itemUnit: string) => {
          const consumptionDateStr = details.consumptionDate ? getFormattedDate(new Date(details.consumptionDate)) : getFormattedDate();
          return `[Stock Out - ${consumptionDateStr}]: Consumed ${qtyConsumedFromBatch} ${itemUnit} from batch ID ${batch.id}. Reason: ${details.reason}.`;
      };

      const { updatedItem } = await stockService.modifyItemBatchesForRelease(itemId, details.quantityConsumed, consumptionOperationNotes);
      
      setAllItemsState(prevItems => prevItems.map(item => (item.id === updatedItem.id ? updatedItem : item)));
      addNotification(`${details.quantityConsumed} ${updatedItem.unit}(s) of "${updatedItem.name}" consumed. New total quantity: ${getTotalQuantity(updatedItem)}.`, 'success');
      setError(null);
      return updatedItem;
    } catch (e) {
      const err = e as Error;
      setError(err.message);
      addNotification(`Failed to record stock out: ${err.message}`, 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [addNotification, allItemsState]);

  const performStockTake = useCallback(async (entries: StockTakeEntry[]): Promise<void> => {
    setIsLoading(true);
    addNotification('Stock take per batch is a complex operation and needs further implementation.', 'warning');
    console.warn('performStockTake needs full rework for batch system', entries);
    setIsLoading(false);
    if (entries.length > 0 && allItemsState.length > 0) {
        const entry = entries[0];
        const itemToUpdate = allItemsState.find(i => i.id === entry.itemId);
        if (itemToUpdate) {
            const batchToUpdate = itemToUpdate.batches.find(b => b.id === entry.batchId);
            if (batchToUpdate) {
                const currentDateFormatted = getFormattedDate();
                batchToUpdate.quantity = entry.countedQuantity;
                batchToUpdate.notes = `${batchToUpdate.notes || ''}\n[Stock Take - ${currentDateFormatted}]: Counted ${entry.countedQuantity}. ${entry.reason || ''}`.trim();
                itemToUpdate.lastUpdated = currentDateFormatted;
                setAllItemsState([...allItemsState]);
                addNotification(`Stock take for ${itemToUpdate.name}, batch ${batchToUpdate.id} (simulated) updated to ${entry.countedQuantity}.`, 'info');
            }
        }
    }
  }, [addNotification, allItemsState]);

  const processBulkStockRelease = useCallback(async (payload: ProcessBulkStockReleasePayload): Promise<ProcessedBulkReleaseResult> => {
    setIsLoading(true);
    const { commonDetails, itemsToRelease } = payload;
    const result: ProcessedBulkReleaseResult = {
      success: false,
      processedItems: [],
      errors: [],
      commonDetails,
      voucherId: `VOUCHER-${Date.now()}`
    };
    let overallSuccess = true;
    
    const updatedItemsBuffer: StockItem[] = [];

    for (const entry of itemsToRelease) {
      const currentItem = allItemsState.find(item => item.id === entry.itemId);
      if (!currentItem) {
        result.errors.push({ itemId: entry.itemId, name: 'Unknown Item', error: 'Item not found.' });
        overallSuccess = false;
        continue;
      }
      if (entry.quantityReleased <= 0) {
        result.errors.push({ itemId: entry.itemId, name: currentItem.name, error: 'Quantity must be > 0.' });
        overallSuccess = false;
        continue;
      }
      if (entry.quantityReleased > getTotalQuantity(currentItem)) {
        result.errors.push({ itemId: entry.itemId, name: currentItem.name, error: `Not enough stock. Available: ${getTotalQuantity(currentItem)}` });
        overallSuccess = false;
        continue;
      }

      try {
        const releaseOpNotes = (batch: Batch, qtyReleasedFromBatch: number, itemUnit: string) => {
            const releaseDateStr = commonDetails.releaseDate ? getFormattedDate(new Date(commonDetails.releaseDate)) : getFormattedDate();
            let note = `[Bulk Stock Release - ${releaseDateStr} | Voucher: ${result.voucherId}]: Released ${qtyReleasedFromBatch} ${itemUnit} to "${commonDetails.releasedTo}" from batch ID ${batch.id}.`;
            if (commonDetails.reason) note += ` Reason: ${commonDetails.reason}.`;
            return note;
        };
        const { updatedItem, affectedBatches } = await stockService.modifyItemBatchesForRelease(entry.itemId, entry.quantityReleased, releaseOpNotes);
        result.processedItems.push({ item: updatedItem, quantityReleased: entry.quantityReleased, affectedBatches });
        updatedItemsBuffer.push(updatedItem);
      } catch (e) {
        const err = e as Error;
        result.errors.push({ itemId: entry.itemId, name: currentItem.name, error: `API Error: ${err.message}` });
        overallSuccess = false;
      }
    }
    
    if (updatedItemsBuffer.length > 0) {
        setAllItemsState(prevItems => {
            const bufferMap = new Map(updatedItemsBuffer.map(item => [item.id, item]));
            return prevItems.map(item => bufferMap.get(item.id) || item);
        });
    }

    result.success = overallSuccess && result.processedItems.length > 0;
    if (result.processedItems.length > 0) {
        addNotification(`${result.processedItems.length} item(s) processed for bulk release.`, result.success ? 'success' : 'warning');
    } else if (result.errors.length > 0) {
        addNotification(`Bulk release failed. ${result.errors.length} error(s).`, 'error');
    } else {
        addNotification('No items were eligible for bulk release.', 'info');
    }
    
    setError(null);
    setIsLoading(false);
    return result;
  }, [addNotification, allItemsState]);

  const processBulkAddStock = useCallback(async (payload: ProcessBulkAddStockPayload): Promise<ProcessedBulkAddStockResult> => {
    setIsLoading(true);
    const { itemsToAddStock } = payload;
    const result: ProcessedBulkAddStockResult = { success: false, processedItems: [], errors: [] };
    let overallSuccess = true;
    const updatedItemsBuffer: StockItem[] = [];
    const currentDateFormatted = getFormattedDate();

    for (const entry of itemsToAddStock) {
      const currentItem = allItemsState.find(item => item.id === entry.itemId);
      if (!currentItem) {
        result.errors.push({ itemId: entry.itemId, name: `Item ID ${entry.itemId}`, error: 'Item not found.' });
        overallSuccess = false;
        continue;
      }
      if (entry.quantityAdded <= 0) {
        result.errors.push({ itemId: entry.itemId, name: currentItem.name, error: 'Quantity added must be > 0.' });
        overallSuccess = false;
        continue;
      }

      try {
        // Construct the full system note here including quantity and unit
        const systemNote = `[Bulk Add Stock - ${currentDateFormatted}]: Added ${entry.quantityAdded} ${currentItem.unit}.`;
        const finalBatchNotes = `${systemNote} ${entry.batchNotes || ''}`.trim();

        const newBatchData: Omit<Batch, 'id' | 'dateAdded'> = {
            quantity: entry.quantityAdded,
            expiryDate: entry.expiryDate,
            supplier: entry.supplier,
            notes: finalBatchNotes, // Pass the fully formed note
        };
        // Pass currentItem.unit to the service, though it's now also in the note
        const updatedItem = await stockService.addBatchToItem(entry.itemId, newBatchData, currentItem.unit);
        result.processedItems.push(updatedItem);
        updatedItemsBuffer.push(updatedItem);
      } catch (e) {
        const err = e as Error;
        result.errors.push({ itemId: entry.itemId, name: currentItem.name, error: `API Error: ${err.message}` });
        overallSuccess = false;
      }
    }

    if (updatedItemsBuffer.length > 0) {
        setAllItemsState(prevItems => {
            const bufferMap = new Map(updatedItemsBuffer.map(item => [item.id, item]));
            return prevItems.map(item => bufferMap.get(item.id) || item);
        });
    }
    result.success = overallSuccess && result.processedItems.length > 0;
     if (result.processedItems.length > 0) {
        addNotification(`${result.processedItems.length} item(s) processed for bulk stock addition.`, result.success ? 'success' : 'warning');
    } else if (result.errors.length > 0) {
        addNotification(`Bulk stock addition failed. ${result.errors.length} error(s).`, 'error');
    } else {
        addNotification('No items were eligible for bulk stock addition.', 'info');
    }

    setError(null);
    setIsLoading(false);
    return result;
  }, [addNotification, allItemsState]);


  const displayedItems = allItemsState
    .map(item => ({
      ...item,
      computedTotalQuantity: getTotalQuantity(item),
      computedSoonestExpiry: getSoonestExpiryDate(item),
    }))
    .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(item => categoryFilter === '' || item.category === categoryFilter)
    .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  return {
    displayedItems,
    allItems: allItemsState,
    allItemsCount: allItemsState.length,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    addItem,
    updateItemDefinition,
    deleteItem,
    addStockBatchToItem, 
    recordStockOut,
    recordStockRelease,
    performStockTake,
    processBulkStockRelease,
    processBulkAddStock,
    fetchItems,
    notifications,
    addNotification,
    removeNotification: (id: string) => setNotifications(prev => prev.filter(n => n.id !== id)),
  };
};
