import React, { useState } from 'react';
import { StockItem, ItemCategory, getTotalQuantity, getSoonestExpiryDate } from '../types';
import { CATEGORY_OPTIONS } from '../constants';
import { AlertTriangleIcon, FilterIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpTrayIcon, InboxStackIcon, ChartPieIcon } from './icons';


interface SidebarProps {
  allItems: StockItem[];
  onCategoryFilter: (category: ItemCategory | '') => void;
  activeCategoryFilter: ItemCategory | '';
  onStartBulkReleaseClick: () => void;
  onStartBulkAddStockClick: () => void;
  onNavigate: (view: 'itemList' | 'stockAnalysis') => void; // New prop for navigation
  currentView: 'itemList' | 'stockAnalysis'; // New prop to indicate current view
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString();
};

const Sidebar: React.FC<SidebarProps> = ({ 
    allItems, 
    onCategoryFilter, 
    activeCategoryFilter, 
    onStartBulkReleaseClick,
    onStartBulkAddStockClick,
    onNavigate,
    currentView,
}) => {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

  const toggleCategory = (categoryValue: ItemCategory) => {
    setOpenCategories(prev => ({ ...prev, [categoryValue]: !prev[categoryValue] }));
  };
  
  const itemsByCategory = CATEGORY_OPTIONS.map(categoryOpt => {
    const items = allItems.filter(item => item.category === categoryOpt.value);
    return { ...categoryOpt, items, count: items.length };
  });

  const nearExpiryItems = allItems.map(item => ({
      ...item,
      soonestExpiry: getSoonestExpiryDate(item), // Get soonest expiry from batches
      totalQuantity: getTotalQuantity(item)
    }))
    .filter(item => {
      if (!item.soonestExpiry || item.totalQuantity === 0) return false;
      const expiry = new Date(item.soonestExpiry);
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);
      return expiry >= today && expiry <= thirtyDaysFromNow;
    }).sort((a,b) => new Date(a.soonestExpiry!).getTime() - new Date(b.soonestExpiry!).getTime());

  const handleCategoryFilterClick = (category: ItemCategory | '') => {
    onNavigate('itemList'); // Switch to item list view
    onCategoryFilter(category); // Then apply filter
  };

  return (
    <aside className="w-72 bg-gray-50 p-4 space-y-6 border-r border-gray-200 h-screen sticky top-0 overflow-y-auto print:hidden">
      <div>
        <h2 className="text-lg font-semibold text-primary-700 mb-3 flex items-center">
          Navigation
        </h2>
        <ul className="space-y-1">
          <li>
            <button
                onClick={() => onNavigate('itemList')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex justify-between items-center
                            ${currentView === 'itemList' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
            >
              View All Stock
              <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full">{allItems.length}</span>
            </button>
          </li>
           <li>
            <button
              onClick={() => onNavigate('stockAnalysis')}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex items-center
                          ${currentView === 'stockAnalysis' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
            >
              <ChartPieIcon className="w-5 h-5 mr-2" />
              Stock Analysis
            </button>
          </li>
        </ul>
      </div>
      
      {currentView === 'itemList' && (
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-primary-700 mb-3 flex items-center">
            <FilterIcon className="w-5 h-5 mr-2 text-primary-600" />
            Filter by Category
          </h2>
          <ul className="space-y-1">
            <li>
                <button
                  onClick={() => handleCategoryFilterClick('')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex justify-between items-center
                              ${activeCategoryFilter === '' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  All Categories
                  <span className="text-xs bg-gray-300 text-gray-700 px-1.5 py-0.5 rounded-full">{allItems.length}</span>
                </button>
              </li>
            {itemsByCategory.map(category => (
              <li key={category.value}>
                <button
                  onClick={() => handleCategoryFilterClick(category.value)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium flex justify-between items-center
                              ${activeCategoryFilter === category.value ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'}`}
                >
                  <span>{category.label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeCategoryFilter === category.value ? 'bg-primary-500 text-white' : 'bg-gray-300 text-gray-700'}`}>
                    {category.count}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}


      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
          Actions
        </h2>
        <div className="space-y-2">
            <button
              onClick={onStartBulkAddStockClick}
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-md text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 transition-colors"
              title="Add stock for multiple items (new batches)"
            >
              <InboxStackIcon className="w-5 h-5 mr-2" />
              Bulk Add Stock
            </button>
            <button
              onClick={onStartBulkReleaseClick}
              className="w-full flex items-center justify-center px-3 py-2.5 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              title="Release multiple stock items (FEFO)"
            >
              <ArrowUpTrayIcon className="w-5 h-5 mr-2" />
              Bulk Stock Release
            </button>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-200">
        <h2 className="text-lg font-semibold text-warning-700 mb-3 flex items-center">
            <AlertTriangleIcon className="w-5 h-5 mr-2 text-warning-600" />
            Near Expiry (Soonest Batch)
        </h2>
        {nearExpiryItems.length > 0 ? (
          <ul className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {nearExpiryItems.map(item => (
              <li key={item.id} className="p-2 bg-warning-50 border border-warning-200 rounded-md">
                <p className="font-medium text-warning-800">{item.name}</p>
                <p className="text-xs text-warning-700">
                  Expires: {formatDate(item.soonestExpiry)} (Total: {item.totalQuantity} {item.unit})
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No items with soon-expiring batches in the next 30 days.</p>
        )}
      </div>

      {currentView === 'itemList' && (
        <div className="pt-4 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Items Overview</h2>
          {itemsByCategory.map(category => (
            category.items.length > 0 && (
              <div key={category.value + "-details"} className="mb-3">
                <button
                  onClick={() => toggleCategory(category.value)}
                  className="w-full flex justify-between items-center py-2 text-left text-md font-medium text-gray-600 hover:text-primary-600"
                  aria-expanded={!!openCategories[category.value]}
                  aria-controls={`category-items-${category.value}`}
                >
                  {category.label} ({category.count})
                  {openCategories[category.value] ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
                {openCategories[category.value] && (
                  <ul id={`category-items-${category.value}`} className="mt-1 pl-2 space-y-1 border-l-2 border-primary-200 max-h-40 overflow-y-auto">
                    {category.items.slice(0, 10).map(item => ( 
                      <li key={item.id} className="text-xs text-gray-500 py-0.5">
                        {item.name} ({getTotalQuantity(item)} {item.unit})
                      </li>
                    ))}
                    {category.items.length > 10 && (
                      <li className="text-xs text-gray-400 italic py-0.5">...and {category.items.length - 10} more.</li>
                    )}
                  </ul>
                )}
              </div>
            )
          ))}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;