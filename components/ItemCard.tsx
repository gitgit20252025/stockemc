
import React from 'react';
import { StockItem, Batch, getTotalQuantity, getSoonestExpiryDate } from '../types';
import { EditIcon, TrashIcon, AlertTriangleIcon, CubePlusIcon, CubeMinusIcon, ArrowRightCircleIcon } from './icons';

interface ItemCardProps {
  item: StockItem;
  // onAdjustQuantity: (id: string, change: number) => Promise<StockItem>; // Removed due to batch complexity
  onEdit: (item: StockItem) => void; // For editing item definition
  onDelete: (id: string) => void;
  onAddStockClick: (item: StockItem) => void; // Opens modal to add a new batch
  onStockOutClick: (item: StockItem) => void;
  onStockReleaseClick: (item: StockItem) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onEdit, onDelete, onAddStockClick, onStockOutClick, onStockReleaseClick }) => {
  const totalQuantity = getTotalQuantity(item);
  const soonestExpiry = getSoonestExpiryDate(item);

  const isLowStock = totalQuantity <= item.minThreshold;
  
  // Expiry checks based on soonest expiry date
  const isNearExpiry = soonestExpiry && new Date(soonestExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && new Date(soonestExpiry) >= new Date();
  const isExpired = soonestExpiry && new Date(soonestExpiry) < new Date();

  let cardBorderColor = 'border-gray-200';
  if (isExpired) cardBorderColor = 'border-danger-500';
  else if (isLowStock) cardBorderColor = 'border-warning-500';
  else if (isNearExpiry) cardBorderColor = 'border-yellow-400';

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  const hasActiveBatches = item.batches.some(b => b.quantity > 0);


  return (
    <div className={`bg-white shadow-lg rounded-xl border-l-4 ${cardBorderColor} transition-shadow hover:shadow-xl overflow-hidden`}>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-semibold text-primary-700">{item.name}</h3>
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            isLowStock || isExpired ? 'bg-danger-100 text-danger-700' : isNearExpiry ? 'bg-warning-100 text-warning-700' : 'bg-success-100 text-success-700'
          }`}>
            {item.category}
          </span>
        </div>

        <div className="mb-3 space-y-1 text-sm text-gray-600">
          <p><strong>Total Quantity:</strong> 
            <span className={`${isLowStock || isExpired ? 'text-danger-600 font-bold' : 'text-gray-800'}`}>
              {totalQuantity} {item.unit}
            </span>
            {(isLowStock && !isExpired && hasActiveBatches) && <span className="ml-2 text-warning-600 font-semibold">(Low Stock!)</span>}
            {(isExpired && hasActiveBatches) && <span className="ml-2 text-danger-600 font-bold">(Expired!)</span>}
            {!hasActiveBatches && totalQuantity === 0 && <span className="ml-2 text-gray-500 font-semibold">(Out of Stock)</span>}
          </p>
          <p><strong>Threshold:</strong> {item.minThreshold} {item.unit}</p>
          {soonestExpiry && (
            <p className={`font-medium ${isExpired ? 'text-danger-600' : isNearExpiry ? 'text-warning-600' : 'text-gray-600'}`}>
              <strong>Soonest Expiry:</strong> {formatDate(soonestExpiry)}
              {isNearExpiry && !isExpired && <AlertTriangleIcon className="w-4 h-4 inline ml-1 text-warning-500" />}
              {isExpired && <AlertTriangleIcon className="w-4 h-4 inline ml-1 text-danger-500" />}
            </p>
          )}
          {!soonestExpiry && hasActiveBatches && <p><strong>Expiry:</strong> No expiring batches</p>}
          {item.originCountry && <p><strong>Origin:</strong> {item.originCountry}</p>}
          <p><strong>Last Updated:</strong> {formatDate(item.lastUpdated)}</p>
        </div>

        {item.batches && item.batches.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">Batches:</h4>
            <ul className="text-xs text-gray-600 bg-gray-50 p-2 rounded-md max-h-24 overflow-y-auto space-y-1">
              {item.batches.filter(b => b.quantity > 0).length > 0 ? (
                item.batches.filter(b => b.quantity > 0).sort((a,b) => (a.expiryDate && b.expiryDate) ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime() : (a.expiryDate ? -1 : 1)).map(batch => (
                  <li key={batch.id} className="border-b border-gray-200 pb-1 mb-1 last:border-b-0 last:pb-0 last:mb-0">
                    Qty: <span className="font-medium">{batch.quantity}</span>
                    {batch.expiryDate && `, Exp: ${formatDate(batch.expiryDate)}`}
                    {batch.supplier && `, Sup: ${batch.supplier}`}
                    {batch.notes && <span className="block italic text-gray-500 text-[0.7rem] truncate" title={batch.notes}>Notes: {batch.notes}</span>}
                  </li>
                ))
              ) : (
                <li className="italic">No active batches.</li>
              )}
            </ul>
          </div>
        )}
        
        {item.notes && (
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md mb-3 italic max-h-20 overflow-y-auto">
            <strong>Item Notes:</strong> <pre className="whitespace-pre-wrap font-sans">{item.notes}</pre>
          </div>
        )}


        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-2 pt-3 border-t border-gray-100">
          <div className="flex-grow">
            {/* Placeholder for future batch-specific quick actions or info */}
          </div>
          <div className="flex space-x-1">
             <button
              onClick={() => onAddStockClick(item)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-md transition-colors"
              aria-label="Add new stock batch"
              title="Add Stock Batch"
            >
              <CubePlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onStockOutClick(item)} 
              className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 rounded-md transition-colors"
              aria-label="Record stock out / consumption"
              title="Record Stock Out / Consumption"
              disabled={totalQuantity <=0} 
            >
              <CubeMinusIcon className="w-5 h-5" />
            </button>
             <button
              onClick={() => onStockReleaseClick(item)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
              aria-label="Release stock to patient/department"
              title="Release Stock"
              disabled={totalQuantity <=0}
            >
              <ArrowRightCircleIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-md transition-colors"
              aria-label="Edit item definition"
              title="Edit Item Definition"
            >
              <EditIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-100 rounded-md transition-colors"
              aria-label="Delete item"
              title="Delete Item"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
