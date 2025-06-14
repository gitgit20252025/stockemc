
import React, { useMemo, useState } from 'react';
import { StockItem, getTotalQuantity } from '../types'; 
import { AlertTriangleIcon, CheckCircleIcon, XCircleIcon, InfoCircleIcon, SpinnerIcon, CalendarDaysIcon, TrendingUpIcon, TrendingDownIcon, ChevronUpIcon, ChevronDownIcon } from './icons';

interface StockAnalysisViewProps {
  allItems: StockItem[];
  isLoading: boolean;
}

interface LowStockInfo {
  id: string;
  name: string;
  currentQuantity: number;
  minThreshold: number;
  unit: string;
  difference: number;
}

interface BatchInfo {
  itemId: string;
  itemName: string;
  itemUnit: string;
  batchId: string;
  quantity: number;
  expiryDate?: string;
  supplier?: string;
  dateAdded: string;
}

// For per-item breakdown in stock movement analysis
interface ItemMovementDetails {
  itemId: string;
  itemName: string;
  itemUnit: string;
  quantityIn: number;
  quantityOut: number;
  netChange: number;
}

// For overall summary in stock movement analysis
interface StockMovementOverallSummary {
  totalStockInQuantity: number;
  totalStockOutQuantity: number;
  stockInTransactions: number;
  stockOutTransactions: number;
  netChange: number;
}

// Combined result for stock movement analysis
interface StockMovementAnalysisResult {
  overallSummary: StockMovementOverallSummary;
  itemsBreakdown: ItemMovementDetails[];
}

type SortableMovementKeys = keyof ItemMovementDetails;

interface SortConfigMovementTable {
  key: SortableMovementKeys;
  direction: 'ascending' | 'descending';
}


const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';
const getYYYYMMDD = (date: Date = new Date()): string => date.toISOString().split('T')[0];


const StockAnalysisView: React.FC<StockAnalysisViewProps> = ({ allItems, isLoading }) => {
  const [startDate, setStartDate] = useState<string>(getYYYYMMDD(new Date(new Date().setMonth(new Date().getMonth() - 1))));
  const [endDate, setEndDate] = useState<string>(getYYYYMMDD());
  const [stockMovementAnalysis, setStockMovementAnalysis] = useState<StockMovementAnalysisResult | null>(null);
  const [isAnalyzingMovement, setIsAnalyzingMovement] = useState<boolean>(false);
  const [sortConfigMovementTable, setSortConfigMovementTable] = useState<SortConfigMovementTable | null>({ key: 'itemName', direction: 'ascending' });


  const overallInitialAnalysisData = useMemo(() => {
    if (!allItems || allItems.length === 0) {
      return {
        totalUniqueItems: 0,
        totalQuantityAllItems: 0,
        lowStockItems: [],
        outOfStockItemsCount: 0,
        soonExpiringBatches: [],
        expiredBatches: [],
      };
    }

    const totalUniqueItems = allItems.length;
    const totalQuantityAllItems = allItems.reduce((sum, item) => sum + getTotalQuantity(item), 0);

    const lowStockItems: LowStockInfo[] = [];
    let outOfStockItemsCount = 0;

    allItems.forEach(item => {
      const totalQty = getTotalQuantity(item);
      if (totalQty === 0) {
        outOfStockItemsCount++;
      }
      if (totalQty > 0 && totalQty <= item.minThreshold) {
        lowStockItems.push({
          id: item.id,
          name: item.name,
          currentQuantity: totalQty,
          minThreshold: item.minThreshold,
          unit: item.unit,
          difference: item.minThreshold - totalQty,
        });
      }
    });
    lowStockItems.sort((a, b) => a.name.localeCompare(b.name));

    const soonExpiringBatches: BatchInfo[] = [];
    const expiredBatches: BatchInfo[] = [];
    const today = new Date();
    today.setHours(0,0,0,0); 
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    allItems.forEach(item => {
      item.batches.forEach(batch => {
        if (batch.quantity > 0 && batch.expiryDate) {
          const expiry = new Date(batch.expiryDate);
          if (expiry < today) {
            expiredBatches.push({
              itemId: item.id, itemName: item.name, itemUnit: item.unit, batchId: batch.id,
              quantity: batch.quantity, expiryDate: batch.expiryDate, supplier: batch.supplier, dateAdded: batch.dateAdded,
            });
          } else if (expiry >= today && expiry <= thirtyDaysFromNow) {
            soonExpiringBatches.push({
              itemId: item.id, itemName: item.name, itemUnit: item.unit, batchId: batch.id,
              quantity: batch.quantity, expiryDate: batch.expiryDate, supplier: batch.supplier, dateAdded: batch.dateAdded,
            });
          }
        }
      });
    });
    soonExpiringBatches.sort((a,b) => (a.expiryDate && b.expiryDate) ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime() : 0);
    expiredBatches.sort((a,b) => (a.expiryDate && b.expiryDate) ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime() : 0);

    return {
      totalUniqueItems, totalQuantityAllItems, lowStockItems, outOfStockItemsCount, soonExpiringBatches, expiredBatches,
    };
  }, [allItems]);

  const handleAnalyzeStockMovement = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    setIsAnalyzingMovement(true);
    setStockMovementAnalysis(null); // Reset previous results

    const startDateObj = new Date(startDate);
    startDateObj.setHours(0,0,0,0);
    const endDateObj = new Date(endDate);
    endDateObj.setHours(23,59,59,999);

    let overallStockInQuantity = 0;
    let overallStockOutQuantity = 0;
    let overallStockInTransactions = 0;
    let overallStockOutTransactions = 0;

    const itemMovementsData = new Map<string, { itemId: string, itemName: string, itemUnit: string, quantityIn: number, quantityOut: number }>();

    const dateRegexPart = "(\\d{4}-\\d{2}-\\d{2})";
    const initialStockRegex = new RegExp(`\\[Initial Stock - ${dateRegexPart}\\]: Added (\\d+)`, "i");
    const stockAdditionRegex = new RegExp(`\\[Stock Addition - ${dateRegexPart}\\]: Added (\\d+)`, "i");
    const bulkStockAddRegex = new RegExp(`\\[Bulk Add Stock - ${dateRegexPart}\\]: Added (\\d+)`, "i");
    const stockOutRegex = new RegExp(`\\[Stock Out - ${dateRegexPart}\\]: Consumed (\\d+)`, "i");
    const stockReleaseRegex = new RegExp(`\\[Stock Release - ${dateRegexPart}\\]: Released (\\d+)`, "i");
    const bulkStockReleaseRegex = new RegExp(`\\[Bulk Stock Release - ${dateRegexPart}.*?\\]: Released (\\d+)`, "i");

    allItems.forEach(item => {
      item.batches.forEach(batch => {
        if (batch.notes) {
          const notesArray = batch.notes.split('\n');
          notesArray.forEach(noteLine => {
            let match;
            const itemId = item.id;
            const itemName = item.name;
            const itemUnit = item.unit;

            // Stock In
            match = noteLine.match(initialStockRegex) || noteLine.match(stockAdditionRegex) || noteLine.match(bulkStockAddRegex);
            if (match) {
              const noteDate = new Date(match[1]);
              const quantity = parseInt(match[2], 10);
              if (noteDate >= startDateObj && noteDate <= endDateObj) {
                overallStockInQuantity += quantity;
                overallStockInTransactions++;
                if (!itemMovementsData.has(itemId)) {
                  itemMovementsData.set(itemId, { itemId, itemName, itemUnit, quantityIn: 0, quantityOut: 0 });
                }
                itemMovementsData.get(itemId)!.quantityIn += quantity;
              }
              return; 
            }

            // Stock Out
            match = noteLine.match(stockOutRegex) || noteLine.match(stockReleaseRegex) || noteLine.match(bulkStockReleaseRegex);
            if (match) {
              const noteDate = new Date(match[1]);
              const quantity = parseInt(match[2], 10);
               if (noteDate >= startDateObj && noteDate <= endDateObj) {
                overallStockOutQuantity += quantity;
                overallStockOutTransactions++;
                if (!itemMovementsData.has(itemId)) {
                  itemMovementsData.set(itemId, { itemId, itemName, itemUnit, quantityIn: 0, quantityOut: 0 });
                }
                itemMovementsData.get(itemId)!.quantityOut += quantity;
              }
            }
          });
        }
      });
    });
    
    const itemsBreakdownArray: ItemMovementDetails[] = Array.from(itemMovementsData.values())
      .map(data => ({
        ...data,
        netChange: data.quantityIn - data.quantityOut,
      }));
    // Default sort for initial analysis result (can be overridden by user clicks later)
    // itemsBreakdownArray.sort((a, b) => a.itemName.localeCompare(b.itemName));
    
    setStockMovementAnalysis({
      overallSummary: {
        totalStockInQuantity: overallStockInQuantity,
        totalStockOutQuantity: overallStockOutQuantity,
        stockInTransactions: overallStockInTransactions,
        stockOutTransactions: overallStockOutTransactions,
        netChange: overallStockInQuantity - overallStockOutQuantity,
      },
      itemsBreakdown: itemsBreakdownArray,
    });
    // Reset sort config to default when new analysis is run
    setSortConfigMovementTable({ key: 'itemName', direction: 'ascending' });
    setIsAnalyzingMovement(false);
  };

  const requestSortMovementTable = (key: SortableMovementKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfigMovementTable && sortConfigMovementTable.key === key && sortConfigMovementTable.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfigMovementTable({ key, direction });
  };

  const sortedMovementItems = useMemo(() => {
    if (!stockMovementAnalysis || !stockMovementAnalysis.itemsBreakdown) return [];
    let sortableItems = [...stockMovementAnalysis.itemsBreakdown];
    if (sortConfigMovementTable !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfigMovementTable.key];
        const bValue = b[sortConfigMovementTable.key];

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfigMovementTable.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfigMovementTable.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return sortableItems;
  }, [stockMovementAnalysis, sortConfigMovementTable]);


  if (isLoading && (!allItems || allItems.length === 0) ) {
    return (
      <div className="flex justify-center items-center h-64">
        <SpinnerIcon className="w-12 h-12 text-primary-600" />
        <p className="ml-3 text-lg text-gray-600">Loading analysis data...</p>
      </div>
    );
  }
  
  if (!allItems || allItems.length === 0 && !isLoading) {
     return <div className="text-center text-gray-500 p-8 text-lg bg-gray-50 rounded-lg shadow">No stock data available to analyze. Add items to get started.</div>;
  }

  const renderBatchTable = (title: string, batches: BatchInfo[], icon: React.ReactNode, accentColor: string) => (
    <div className="bg-white shadow-lg rounded-xl p-6">
      <h3 className={`text-xl font-semibold text-gray-700 mb-4 flex items-center border-b pb-2 ${accentColor}`}>
        {icon}
        {title} ({batches.length})
      </h3>
      {batches.length > 0 ? (
        <div className="overflow-x-auto max-h-96">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Item Name</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Batch ID</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Supplier</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Expiry Date</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Quantity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map(batch => (
                <tr key={batch.batchId}>
                  <td className="px-4 py-2 whitespace-nowrap">{batch.itemName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600" title={batch.batchId}>{batch.batchId.substring(0,8)}...</td>
                  <td className="px-4 py-2 whitespace-nowrap">{batch.supplier || 'N/A'}</td>
                  <td className={`px-4 py-2 whitespace-nowrap ${accentColor === 'text-danger-600' ? 'font-bold' : ''}`}>{formatDate(batch.expiryDate)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">{batch.quantity} {batch.itemUnit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No batches in this category.</p>
      )}
    </div>
  );

  const renderSortIcon = (key: SortableMovementKeys) => {
    if (!sortConfigMovementTable || sortConfigMovementTable.key !== key) {
      return <ChevronDownIcon className="w-4 h-4 ml-1 opacity-30" />; // Default placeholder or invisible
    }
    return sortConfigMovementTable.direction === 'ascending' ? <ChevronUpIcon className="w-4 h-4 ml-1" /> : <ChevronDownIcon className="w-4 h-4 ml-1" />;
  };


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-primary-700 tracking-tight">Stock Data Analysis</h1>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4">
          <InfoCircleIcon className="w-10 h-10 text-primary-500" />
          <div>
            <p className="text-sm text-gray-500">Total Unique Items</p>
            <p className="text-2xl font-semibold text-gray-800">{overallInitialAnalysisData.totalUniqueItems}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4">
          <InfoCircleIcon className="w-10 h-10 text-primary-500" />
          <div>
            <p className="text-sm text-gray-500">Total Quantity (All Items)</p>
            <p className="text-2xl font-semibold text-gray-800">{overallInitialAnalysisData.totalQuantityAllItems}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4">
          <AlertTriangleIcon className="w-10 h-10 text-warning-500" />
          <div>
            <p className="text-sm text-gray-500">Items Below Threshold</p>
            <p className="text-2xl font-semibold text-gray-800">{overallInitialAnalysisData.lowStockItems.length}</p>
          </div>
        </div>
         <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4">
          <XCircleIcon className="w-10 h-10 text-gray-500" />
          <div>
            <p className="text-sm text-gray-500">Items Out of Stock</p>
            <p className="text-2xl font-semibold text-gray-800">{overallInitialAnalysisData.outOfStockItemsCount}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4">
          <AlertTriangleIcon className="w-10 h-10 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Soon Expiring Batches (30 days)</p>
            <p className="text-2xl font-semibold text-gray-800">{overallInitialAnalysisData.soonExpiringBatches.length}</p>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 flex items-center space-x-4">
          <XCircleIcon className="w-10 h-10 text-danger-500" />
          <div>
            <p className="text-sm text-gray-500">Expired Batches (Active Qty)</p>
            <p className="text-2xl font-semibold text-gray-800">{overallInitialAnalysisData.expiredBatches.length}</p>
          </div>
        </div>
      </div>

      {/* Stock Movement Analysis Section */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center border-b pb-2 text-primary-600">
          <TrendingUpIcon className="w-6 h-6 mr-2" /> Stock Movement Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="startDate" name="startDate" value={startDate} onChange={e => setStartDate(e.target.value)}
                   className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-black"/>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="endDate" name="endDate" value={endDate} onChange={e => setEndDate(e.target.value)}
                   min={startDate}
                   className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-black"/>
          </div>
          <button
            onClick={handleAnalyzeStockMovement}
            disabled={isAnalyzingMovement}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-md flex items-center justify-center transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzingMovement ? <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> : <CalendarDaysIcon className="w-5 h-5 mr-2" />}
            {isAnalyzingMovement ? 'Analyzing...' : 'Analyze Movements'}
          </button>
        </div>

        {isAnalyzingMovement && (
            <div className="flex justify-center items-center py-6">
                <SpinnerIcon className="w-8 h-8 text-primary-600" />
                <p className="ml-2 text-gray-500">Calculating movements...</p>
            </div>
        )}

        {stockMovementAnalysis && !isAnalyzingMovement && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700 font-medium">Total Stock In</p>
                <p className="text-2xl font-bold text-green-600">{stockMovementAnalysis.overallSummary.totalStockInQuantity} units</p>
                <p className="text-xs text-green-500">({stockMovementAnalysis.overallSummary.stockInTransactions} transactions)</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-700 font-medium">Total Stock Out</p>
                <p className="text-2xl font-bold text-red-600">{stockMovementAnalysis.overallSummary.totalStockOutQuantity} units</p>
                <p className="text-xs text-red-500">({stockMovementAnalysis.overallSummary.stockOutTransactions} transactions)</p>
              </div>
              <div className={`${stockMovementAnalysis.overallSummary.netChange >= 0 ? 'bg-blue-50' : 'bg-yellow-50'} p-4 rounded-lg`}>
                <p className={`text-sm ${stockMovementAnalysis.overallSummary.netChange >= 0 ? 'text-blue-700' : 'text-yellow-700'} font-medium`}>Net Stock Change</p>
                <p className={`text-2xl font-bold ${stockMovementAnalysis.overallSummary.netChange >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                  {stockMovementAnalysis.overallSummary.netChange >= 0 ? '+' : ''}{stockMovementAnalysis.overallSummary.netChange} units
                </p>
              </div>
            </div>

            <div className="mt-8">
                <h4 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
                    <TrendingDownIcon className="w-5 h-5 mr-2 text-gray-600" />
                    Item-Specific Movement ({startDate} to {endDate})
                </h4>
                {sortedMovementItems.length > 0 ? (
                    <div className="overflow-x-auto max-h-96 border border-gray-200 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">
                                      <button onClick={() => requestSortMovementTable('itemName')} className="flex items-center hover:text-primary-600">
                                        Item Name {renderSortIcon('itemName')}
                                      </button>
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-500">
                                       <button onClick={() => requestSortMovementTable('itemUnit')} className="flex items-center hover:text-primary-600">
                                        Unit {renderSortIcon('itemUnit')}
                                      </button>
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500">
                                      <button onClick={() => requestSortMovementTable('quantityIn')} className="flex items-center w-full justify-end hover:text-primary-600">
                                        Quantity In {renderSortIcon('quantityIn')}
                                      </button>
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500">
                                       <button onClick={() => requestSortMovementTable('quantityOut')} className="flex items-center w-full justify-end hover:text-primary-600">
                                        Quantity Out {renderSortIcon('quantityOut')}
                                      </button>
                                    </th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-500">
                                      <button onClick={() => requestSortMovementTable('netChange')} className="flex items-center w-full justify-end hover:text-primary-600">
                                        Net Change {renderSortIcon('netChange')}
                                      </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {sortedMovementItems.map(item => (
                                    <tr key={item.itemId}>
                                        <td className="px-4 py-2 whitespace-nowrap text-black">{item.itemName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-black">{item.itemUnit}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-green-600">{item.quantityIn > 0 ? `+${item.quantityIn}` : item.quantityIn}</td>
                                        <td className="px-4 py-2 whitespace-nowrap text-right text-red-600">{item.quantityOut > 0 ? `-${item.quantityOut}` : item.quantityOut}</td>
                                        <td className={`px-4 py-2 whitespace-nowrap text-right font-semibold ${item.netChange > 0 ? 'text-blue-600' : item.netChange < 0 ? 'text-yellow-700' : 'text-gray-600'}`}>
                                            {item.netChange > 0 ? `+${item.netChange}` : item.netChange}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No specific item movements recorded in the selected period.</p>
                )}
            </div>
          </>
        )}
      </div>


      {/* Low Stock Items Table */}
      <div className="bg-white shadow-lg rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center border-b pb-2 text-warning-600">
          <AlertTriangleIcon className="w-6 h-6 mr-2" />
          Low Stock Items ({overallInitialAnalysisData.lowStockItems.length})
        </h3>
        {overallInitialAnalysisData.lowStockItems.length > 0 ? (
           <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Item Name</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Current Qty</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Min. Threshold</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Difference</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Unit</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {overallInitialAnalysisData.lowStockItems.map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 whitespace-nowrap">{item.name}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right font-semibold text-warning-700">{item.currentQuantity}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">{item.minThreshold}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">{item.difference}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 flex items-center">
            <CheckCircleIcon className="w-5 h-5 mr-2 text-success-500"/> All items are above their minimum stock threshold.
          </p>
        )}
      </div>
      
      {renderBatchTable(
        "Soon Expiring Batches (Next 30 Days)", 
        overallInitialAnalysisData.soonExpiringBatches, 
        <AlertTriangleIcon className="w-6 h-6 mr-2" />, 
        "text-yellow-600"
      )}

      {renderBatchTable(
        "Expired Batches (with Active Quantity)", 
        overallInitialAnalysisData.expiredBatches, 
        <XCircleIcon className="w-6 h-6 mr-2" />, 
        "text-danger-600"
      )}

    </div>
  );
};

export default StockAnalysisView;
