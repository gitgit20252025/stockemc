
import React from 'react';
import { StockItem } from '../types';
import ItemCard from './ItemCard';
import { SpinnerIcon } from './icons';

interface ItemListProps {
  items: StockItem[];
  isLoading: boolean;
  error: string | null;
  // onAdjustQuantity: (id: string, change: number) => Promise<StockItem>; // Removed
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
  onAddStockClick: (item: StockItem) => void;
  onStockOutClick: (item: StockItem) => void; 
  onStockReleaseClick: (item: StockItem) => void;
}

const ItemList: React.FC<ItemListProps> = ({ 
  items, 
  isLoading, 
  error, 
  // onAdjustQuantity, // Removed
  onEdit, 
  onDelete, 
  onAddStockClick, 
  onStockOutClick,
  onStockReleaseClick 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="w-12 h-12 text-primary-600" />
        <p className="ml-3 text-lg text-gray-600">Loading stock items...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-danger-600 bg-danger-100 p-4 rounded-md">Error: {error}</div>;
  }

  if (items.length === 0) {
    return <div className="text-center text-gray-500 p-8 text-lg bg-gray-50 rounded-lg shadow">No stock items found. Try adjusting your search or filters, or add a new item.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map(item => (
        <ItemCard
          key={item.id}
          item={item}
          // onAdjustQuantity={onAdjustQuantity} // Removed
          onEdit={onEdit}
          onDelete={onDelete}
          onAddStockClick={onAddStockClick}
          onStockOutClick={onStockOutClick}
          onStockReleaseClick={onStockReleaseClick}
        />
      ))}
    </div>
  );
};

export default ItemList;
