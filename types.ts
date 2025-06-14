
export enum ItemCategory {
  OPERATION_THEATRE = "Operation Theatre",
  ENDOSCOPY = "Endoscopy",
  GENERAL_SUPPLIES = "General Supplies",
  PHARMACEUTICALS = "Pharmaceuticals",
  CONSUMABLES = "Consumables",
  INSTRUMENTS = "Instruments",
}

export interface Batch {
  id: string; // Unique ID for the batch (e.g., auto-generated or from supplier)
  quantity: number;
  expiryDate?: string; // ISO date string (YYYY-MM-DD)
  supplier?: string;
  dateAdded: string; // ISO date string (when this batch was added/received)
  notes?: string; // Notes specific to this batch (e.g., lot number, PO)
}

export interface StockItem {
  id: string;
  name: string;
  category: ItemCategory;
  unit: string;
  minThreshold: number;
  batches: Batch[];
  lastUpdated: string; // ISO date string (for item definition changes or batch modifications)
  notes?: string; // General notes for the item
  originCountry?: string;
}

// Helper function to get total quantity from batches
export const getTotalQuantity = (item: StockItem): number => {
  return item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
};

// Helper function to get the soonest expiry date from active batches
export const getSoonestExpiryDate = (item: StockItem): string | undefined => {
  const today = new Date().toISOString().split('T')[0];
  return item.batches
    .filter(batch => batch.quantity > 0 && batch.expiryDate && batch.expiryDate >= today)
    .map(batch => batch.expiryDate!)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
};


export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: string;
  message: string;
  type: NotificationType;
}

export type ReleaseStrategy = 'FEFO' | 'FIFO';
