
import { StockItem, ItemCategory, Batch, ReleaseStrategy } from '../types';
import { INITIAL_ITEMS_KEY, STOCK_ITEMS_KEY } from '../constants';

// Helper to generate unique IDs
const generateId = (): string => Math.random().toString(36).substr(2, 9);

// Helper to get current date as YYYY-MM-DD
const getFormattedDate = (date: Date = new Date()): string => date.toISOString().split('T')[0];

// Initial seed data
const getInitialSeedData = (): StockItem[] => {
  const today = new Date();
  const todayFormatted = getFormattedDate(today);
  const oneYearFromNow = getFormattedDate(new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()));
  const sixMonthsFromNow = getFormattedDate(new Date(today.getFullYear(), today.getMonth() + 6, today.getDate()));
  const tenDaysAgoFormatted = getFormattedDate(new Date(new Date().setDate(today.getDate() - 10)));
  const fiveDaysAgoFormatted = getFormattedDate(new Date(new Date().setDate(today.getDate() - 5)));
  const twentyDaysAgoFormatted = getFormattedDate(new Date(new Date().setDate(today.getDate() - 20)));
  const fifteenDaysAgoFormatted = getFormattedDate(new Date(new Date().setDate(today.getDate() - 15)));
  const twoYearsFromNow = getFormattedDate(new Date(Date.now() + 365 * 2 * 24 * 60 * 60 * 1000));


  return [
    {
      id: generateId(),
      name: 'Scalpel Blades #10',
      category: ItemCategory.OPERATION_THEATRE,
      unit: 'box',
      minThreshold: 10,
      batches: [
        { 
          id: generateId(), 
          quantity: 30, 
          supplier: 'MediSupply Co.', 
          dateAdded: tenDaysAgoFormatted, 
          expiryDate: oneYearFromNow, 
          notes: `[Initial Stock - ${tenDaysAgoFormatted}]: Added 30 box. Lot A123` 
        },
        { 
          id: generateId(), 
          quantity: 20, 
          supplier: 'MediSupply Co.', 
          dateAdded: fiveDaysAgoFormatted, 
          expiryDate: sixMonthsFromNow, 
          notes: `[Stock Addition - ${fiveDaysAgoFormatted}]: Added 20 box. Lot B456`
        }
      ],
      lastUpdated: todayFormatted,
      originCountry: 'Germany',
      notes: 'Standard surgical blades.'
    },
    {
      id: generateId(),
      name: 'EndoSheath Protective Cover',
      category: ItemCategory.ENDOSCOPY,
      unit: 'pieces',
      minThreshold: 5,
      batches: [
        { 
          id: generateId(), 
          quantity: 30, 
          dateAdded: todayFormatted, 
          expiryDate: oneYearFromNow, 
          supplier: 'EndoWorld', 
          notes: `[Initial Stock - ${todayFormatted}]: Added 30 pieces. For flexible endoscopes P/N 789`
        }
      ],
      lastUpdated: todayFormatted,
      originCountry: 'USA',
    },
    {
      id: generateId(),
      name: 'Gauze Swabs 4x4',
      category: ItemCategory.GENERAL_SUPPLIES,
      unit: 'packs',
      minThreshold: 50,
      batches: [
        { 
          id: generateId(), 
          quantity: 200, 
          dateAdded: todayFormatted, 
          expiryDate: undefined,
          notes: `[Initial Stock - ${todayFormatted}]: Added 200 packs.`
        } 
      ],
      lastUpdated: todayFormatted,
      originCountry: 'China',
    },
    {
      id: generateId(),
      name: 'Propofol 200mg/20ml',
      category: ItemCategory.PHARMACEUTICALS,
      unit: 'vials',
      minThreshold: 5,
      batches: [
        { 
          id: generateId(), 
          quantity: 10, 
          dateAdded: twentyDaysAgoFormatted, 
          expiryDate: sixMonthsFromNow, 
          supplier: 'PharmaDirect', 
          notes: `[Initial Stock - ${twentyDaysAgoFormatted}]: Added 10 vials. Batch PPL-001`
        },
        { 
          id: generateId(), 
          quantity: 10, 
          dateAdded: fifteenDaysAgoFormatted, 
          expiryDate: twoYearsFromNow,
          supplier: 'PharmaDirect', 
          notes: `[Stock Addition - ${fifteenDaysAgoFormatted}]: Added 10 vials. Batch PPL-002`
        } 
      ],
      lastUpdated: todayFormatted,
    },
  ];
};

const initializeLocalStorage = (): void => {
  const isInitialized = localStorage.getItem(INITIAL_ITEMS_KEY);
  if (!isInitialized) {
    localStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(getInitialSeedData()));
    localStorage.setItem(INITIAL_ITEMS_KEY, 'true');
  }
};

initializeLocalStorage();

const getItemsFromStorage = (): StockItem[] => {
  const itemsJson = localStorage.getItem(STOCK_ITEMS_KEY);
  if (!itemsJson) return [];
  const items = JSON.parse(itemsJson) as StockItem[];
  // Ensure all items have a batches array
  return items.map(item => ({ ...item, batches: item.batches || [] }));
};

const saveItemsToStorage = (items: StockItem[]): void => {
  localStorage.setItem(STOCK_ITEMS_KEY, JSON.stringify(items));
};

export const stockService = {
  getAllItems: async (): Promise<StockItem[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(getItemsFromStorage());
      }, 500);
    });
  },

  getItemById: async (id: string): Promise<StockItem | undefined> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = getItemsFromStorage();
        resolve(items.find(item => item.id === id));
      }, 300);
    });
  },

  addItem: async (itemData: Omit<StockItem, 'id' | 'lastUpdated' | 'batches'> & { firstBatch: Omit<Batch, 'id' | 'dateAdded'> }): Promise<StockItem> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const items = getItemsFromStorage();
        const { firstBatch, ...restOfItemData } = itemData;
        const currentDateFormatted = getFormattedDate();
        
        const newItem: StockItem = {
          ...restOfItemData,
          id: generateId(),
          batches: [], // Initialize batches, then add the first one
          lastUpdated: currentDateFormatted,
        };

        const newBatch: Batch = {
          ...firstBatch,
          id: generateId(),
          dateAdded: currentDateFormatted,
          notes: `[Initial Stock - ${currentDateFormatted}]: Added ${firstBatch.quantity} ${newItem.unit}. ${firstBatch.notes || ''}`.trim(),
        };
        newItem.batches.push(newBatch);

        const updatedItems = [...items, newItem];
        saveItemsToStorage(updatedItems);
        resolve(newItem);
      }, 500);
    });
  },

  updateItem: async (updatedItemData: Pick<StockItem, 'id' | 'name' | 'category' | 'unit' | 'minThreshold' | 'notes' | 'originCountry'>): Promise<StockItem> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let items = getItemsFromStorage();
        const itemIndex = items.findIndex(item => item.id === updatedItemData.id);
        if (itemIndex === -1) {
          reject(new Error('Item not found for update'));
          return;
        }
        const currentItem = items[itemIndex];
        const finalItem: StockItem = {
          ...currentItem,
          ...updatedItemData, 
          lastUpdated: getFormattedDate(),
        };
        items[itemIndex] = finalItem;
        saveItemsToStorage(items);
        resolve(finalItem);
      }, 500);
    });
  },
  
  addBatchToItem: async (itemId: string, batchData: Omit<Batch, 'id' | 'dateAdded'>, itemUnit: string): Promise<StockItem> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let items = getItemsFromStorage();
        const itemIndex = items.findIndex(item => item.id === itemId);
        if (itemIndex === -1) {
          reject(new Error('Item not found to add batch'));
          return;
        }
        const currentItem = items[itemIndex];
        const currentDateFormatted = getFormattedDate();

        // Check if notes already contain a system-generated stock addition message (e.g. from bulk add)
        const systemNotePrefix = batchData.notes && (batchData.notes.startsWith('[Bulk Add Stock') || batchData.notes.startsWith('[Stock Addition') || batchData.notes.startsWith('[Initial Stock')) 
            ? '' // If it's already a system note, don't add another prefix
            : `[Stock Addition - ${currentDateFormatted}]: Added ${batchData.quantity} ${itemUnit}. `;
            
        const newBatch: Batch = {
          ...batchData,
          id: generateId(),
          dateAdded: currentDateFormatted,
          notes: `${systemNotePrefix}${batchData.notes || ''}`.trim(),
        };
        currentItem.batches.push(newBatch);
        currentItem.lastUpdated = currentDateFormatted;
        saveItemsToStorage(items);
        resolve(currentItem);
      }, 300);
    });
  },

  modifyItemBatchesForRelease: async (
    itemId: string, 
    quantityToRelease: number, 
    operationNotesGenerator?: (batch: Batch, qtyReleasedFromBatch: number, currentItemUnit: string) => string, // Added currentItemUnit
    strategy: ReleaseStrategy = 'FEFO'
  ): Promise<{updatedItem: StockItem, affectedBatches: Array<{batchId: string, releasedQuantity: number}>}> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let items = getItemsFromStorage();
            const itemIndex = items.findIndex(item => item.id === itemId);
            if (itemIndex === -1) {
                reject(new Error('Item not found for release'));
                return;
            }
            const item = items[itemIndex];
            let remainingToRelease = quantityToRelease;
            const affectedBatchesReturn: Array<{batchId: string, releasedQuantity: number}> = [];

            let sortedBatches: Batch[];

            if (strategy === 'FIFO') {
              sortedBatches = [...item.batches]
                .filter(b => b.quantity > 0)
                .sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime());
            } else { 
              sortedBatches = [...item.batches]
                .filter(b => b.quantity > 0)
                .sort((a, b) => {
                  if (a.expiryDate && b.expiryDate) {
                    const expiryDiff = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
                    if (expiryDiff !== 0) return expiryDiff;
                    return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
                  }
                  if (a.expiryDate && !b.expiryDate) return -1; 
                  if (!a.expiryDate && b.expiryDate) return 1;  
                  return new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
                });
            }
            
            let totalAvailable = sortedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
            if (totalAvailable < quantityToRelease) {
                reject(new Error(`Not enough stock. Available: ${totalAvailable}, Requested: ${quantityToRelease}`));
                return;
            }

            for (const batch of sortedBatches) {
                if (remainingToRelease <= 0) break;

                const originalBatchRef = item.batches.find(b => b.id === batch.id); 
                if (!originalBatchRef) continue;

                const canReleaseFromBatch = Math.min(originalBatchRef.quantity, remainingToRelease);
                originalBatchRef.quantity -= canReleaseFromBatch;
                remainingToRelease -= canReleaseFromBatch;
                
                affectedBatchesReturn.push({batchId: batch.id, releasedQuantity: canReleaseFromBatch});

                if (operationNotesGenerator) {
                  const noteText = operationNotesGenerator(originalBatchRef, canReleaseFromBatch, item.unit); // Pass item.unit
                  originalBatchRef.notes = originalBatchRef.notes ? `${originalBatchRef.notes}\n${noteText}` : noteText;
                }
            }
            
            item.lastUpdated = getFormattedDate();
            saveItemsToStorage(items);
            resolve({updatedItem: item, affectedBatches: affectedBatchesReturn});
        }, 200);
    });
  },

  deleteItem: async (id: string): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let items = getItemsFromStorage();
        items = items.filter(item => item.id !== id);
        saveItemsToStorage(items);
        resolve();
      }, 500);
    });
  },
};
