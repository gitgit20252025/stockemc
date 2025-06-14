
import { ItemCategory } from './types';

export const APP_TITLE = "OT & Endo Stock Manager";

export const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: ItemCategory.OPERATION_THEATRE, label: "Operation Theatre" },
  { value: ItemCategory.ENDOSCOPY, label: "Endoscopy" },
  { value: ItemCategory.GENERAL_SUPPLIES, label: "General Supplies" },
  { value: ItemCategory.PHARMACEUTICALS, label: "Pharmaceuticals" },
  { value: ItemCategory.CONSUMABLES, label: "Consumables" },
  { value: ItemCategory.INSTRUMENTS, label: "Instruments" },
];

export const UNIT_OPTIONS: string[] = ['pieces', 'box', 'ml', 'mg', 'L', 'kit', 'set', 'roll', 'pair'];

export const INITIAL_ITEMS_KEY = 'stockAppInitialItemsLoaded';
export const STOCK_ITEMS_KEY = 'stockAppItems';
