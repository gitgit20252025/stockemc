
import React from 'react';
import { ItemCategory } from '../types';
import { CATEGORY_OPTIONS } from '../constants';
import { SearchIcon, FilterIcon, DownloadIcon, ClipboardListIcon } from './icons'; // Added ClipboardListIcon

interface ControlsProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  categoryFilter: ItemCategory | '';
  onCategoryFilterChange: (category: ItemCategory | '') => void;
  itemCount: number;
  onExportClick: () => void;
  onStartStockTakeClick: () => void; // New prop for stock take
}

const Controls: React.FC<ControlsProps> = ({
  searchTerm,
  onSearchTermChange,
  categoryFilter,
  onCategoryFilterChange,
  itemCount,
  onExportClick,
  onStartStockTakeClick, // New prop
}) => {
  return (
    <div className="my-6 p-4 bg-gray-50 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Items
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="Search by name..."
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm bg-white text-black border-gray-300 rounded-md p-2.5"
            />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Category
          </label>
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FilterIcon className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="category"
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value as ItemCategory | '')}
              className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm bg-white text-black border-gray-300 rounded-md p-2.5"
            >
              <option value="">All Categories</option>
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600">Displaying {itemCount} item(s).</p>
        <div className="flex space-x-2">
           <button
            onClick={onStartStockTakeClick}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center transition-colors duration-150 text-sm"
            title="Perform Full Inventory / Stock Take"
          >
            <ClipboardListIcon className="w-4 h-4 mr-2" />
            Stock Take
          </button>
          <button
            onClick={onExportClick}
            disabled={itemCount === 0}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg shadow-md flex items-center transition-colors duration-150 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export current view to Excel"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Export Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
