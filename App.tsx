import React, { useState } from 'react';
import { StockItem, Batch, ItemCategory } from './types'; // Batch might be needed for types in handleFormSubmit
import { 
    useStockManagement, 
    AddBatchDetails, // Renamed from AddStockDetails
    StockOutDetails, 
    StockTakeEntry, 
    StockReleaseDetails,
    ProcessBulkStockReleasePayload,
    ProcessedBulkReleaseResult,
    ProcessBulkAddStockPayload
} from './hooks/useStockManagement'; 
import Header from './components/Header';
import Controls from './components/Controls';
import ItemList from './components/ItemList';
import ItemFormModal from './components/ItemFormModal';
import ConfirmationModal from './components/ConfirmationModal';
import NotificationArea from './components/NotificationArea';
import Sidebar from './components/Sidebar';
import AddStockModal from './components/AddStockModal';
import StockOutModal from './components/StockOutModal'; 
import FullInventoryModal from './components/FullInventoryModal'; 
import StockReleaseModal from './components/StockReleaseModal'; 
import BulkStockReleaseModal from './components/BulkStockReleaseModal';
import PrintableReleaseFormModal from './components/PrintableReleaseFormModal';
import BulkAddStockModal from './components/BulkAddStockModal';
import StockAnalysisView from './components/StockAnalysisView'; // New import


declare var XLSX: any;

export type AppView = 'itemList' | 'stockAnalysis';

const App: React.FC = () => {
  const {
    displayedItems, // This is for item list view
    allItems,      
    allItemsCount,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    addItem,
    updateItemDefinition, // Renamed from updateItem
    deleteItem,
    addStockBatchToItem, // Renamed from addStockToExistingItem
    recordStockOut, 
    recordStockRelease, 
    performStockTake, 
    processBulkStockRelease,
    processBulkAddStock,
    notifications,
    addNotification,
    removeNotification,
  } = useStockManagement();

  const [currentView, setCurrentView] = useState<AppView>('itemList');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [itemForAddingStock, setItemForAddingStock] = useState<StockItem | null>(null);

  const [isStockOutModalOpen, setIsStockOutModalOpen] = useState(false);
  const [itemForStockingOut, setItemForStockingOut] = useState<StockItem | null>(null);

  const [isStockReleaseModalOpen, setIsStockReleaseModalOpen] = useState(false);
  const [itemForReleasingStock, setItemForReleasingStock] = useState<StockItem | null>(null);

  const [isFullInventoryModalOpen, setIsFullInventoryModalOpen] = useState(false);
  const [isSubmittingInventory, setIsSubmittingInventory] = useState(false);

  const [isBulkStockReleaseModalOpen, setIsBulkStockReleaseModalOpen] = useState(false);
  const [isSubmittingBulkRelease, setIsSubmittingBulkRelease] = useState(false);
  const [isPrintableReleaseFormModalOpen, setIsPrintableReleaseFormModalOpen] = useState(false);
  const [currentProcessedBulkReleaseData, setCurrentProcessedBulkReleaseData] = useState<ProcessedBulkReleaseResult | null>(null);

  const [isBulkAddStockModalOpen, setIsBulkAddStockModalOpen] = useState(false);
  const [isSubmittingBulkAddStock, setIsSubmittingBulkAddStock] = useState(false);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    if (view === 'itemList' && categoryFilter !== '') { // If navigating to item list and a filter is set, keep it
        // No need to reset categoryFilter here unless specifically desired
    } else if (view === 'itemList') {
        // setCategoryFilter(''); // Optionally reset filter when explicitly navigating to "View All Stock"
    }
  };
  
  const handleCategoryFilterChange = (category: ItemCategory | '') => {
      setCurrentView('itemList'); // Ensure view is itemList when a category filter is applied
      setCategoryFilter(category);
  };


  const handleOpenFormModal = (item?: StockItem) => {
    if (currentView === 'stockAnalysis') setCurrentView('itemList'); // Switch to item list if on analysis view
    setEditingItem(item || null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingItem(null);
  };

  // Updated parameter type to match ItemFormModal's onSubmit
  const handleFormSubmit = async (itemData: (Omit<StockItem, 'id' | 'lastUpdated' | 'batches'> & { firstBatch: Omit<Batch, 'id' | 'dateAdded'> }) | Pick<StockItem, 'id' | 'name' | 'category' | 'unit' | 'minThreshold' | 'notes' | 'originCountry'>) => {
    if ('firstBatch' in itemData) { // Adding new item
      await addItem(itemData);
    } else { // Editing existing item definition
      await updateItemDefinition(itemData as Pick<StockItem, 'id' | 'name' | 'category' | 'unit' | 'minThreshold' | 'notes' | 'originCountry'>);
    }
  };
  
  const handleDeleteRequest = (id: string) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (itemToDeleteId) {
      await deleteItem(itemToDeleteId);
      setIsConfirmModalOpen(false);
      setItemToDeleteId(null);
    }
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setItemToDeleteId(null);
  };

  const handleOpenAddStockModal = (item: StockItem) => {
    setItemForAddingStock(item);
    setIsAddStockModalOpen(true);
  };

  const handleCloseAddStockModal = () => {
    setIsAddStockModalOpen(false);
    setItemForAddingStock(null);
  };

  // Changed details type to AddBatchDetails
  const handleAddStockSubmit = async (itemId: string, details: AddBatchDetails) => {
    await addStockBatchToItem(itemId, details);
  };

  const handleOpenStockOutModal = (item: StockItem) => {
    setItemForStockingOut(item);
    setIsStockOutModalOpen(true);
  };

  const handleCloseStockOutModal = () => {
    setIsStockOutModalOpen(false);
    setItemForStockingOut(null);
  };

  const handleStockOutSubmit = async (itemId: string, details: StockOutDetails) => {
    await recordStockOut(itemId, details);
  };

  const handleOpenStockReleaseModal = (item: StockItem) => {
    setItemForReleasingStock(item);
    setIsStockReleaseModalOpen(true);
  };

  const handleCloseStockReleaseModal = () => {
    setIsStockReleaseModalOpen(false);
    setItemForReleasingStock(null);
  };

  const handleStockReleaseSubmit = async (itemId: string, details: StockReleaseDetails) => {
    await recordStockRelease(itemId, details);
  };

  const handleOpenFullInventoryModal = () => {
    setIsFullInventoryModalOpen(true);
  };

  const handleCloseFullInventoryModal = () => {
    setIsFullInventoryModalOpen(false);
  };

  const handleFullInventorySubmit = async (entries: StockTakeEntry[]) => {
    setIsSubmittingInventory(true);
    try {
      await performStockTake(entries);
      // Decide whether to close modal here or based on hook's success
      // setIsFullInventoryModalOpen(false); 
    } catch (err) {
      console.error("Error during full inventory submission in App.tsx:", err)
    } finally {
      setIsSubmittingInventory(false);
    }
  };

  const handleOpenBulkStockReleaseModal = () => {
    setIsBulkStockReleaseModalOpen(true);
  };

  const handleCloseBulkStockReleaseModal = () => {
    setIsBulkStockReleaseModalOpen(false);
  };

  const handleSubmitBulkStockRelease = async (payload: ProcessBulkStockReleasePayload) => {
    setIsSubmittingBulkRelease(true);
    try {
      const result = await processBulkStockRelease(payload);
      if (result.processedItems.length > 0 || result.errors.length > 0) {
        setCurrentProcessedBulkReleaseData(result);
        setIsPrintableReleaseFormModalOpen(true);
      }
      setIsBulkStockReleaseModalOpen(false); 
    } catch (err) {
      console.error("Error during bulk stock release submission in App.tsx:", err);
    } finally {
      setIsSubmittingBulkRelease(false);
    }
  };

  const handleClosePrintableReleaseFormModal = () => {
    setIsPrintableReleaseFormModalOpen(false);
    setCurrentProcessedBulkReleaseData(null);
  };

  const handleOpenBulkAddStockModal = () => {
    setIsBulkAddStockModalOpen(true);
  };

  const handleCloseBulkAddStockModal = () => {
    setIsBulkAddStockModalOpen(false);
  };

  const handleSubmitBulkAddStock = async (payload: ProcessBulkAddStockPayload) => {
    setIsSubmittingBulkAddStock(true);
    try {
      await processBulkAddStock(payload); 
      setIsBulkAddStockModalOpen(false);
    } catch (err) {
      console.error("Error during bulk add stock submission in App.tsx:", err);
    } finally {
      setIsSubmittingBulkAddStock(false);
    }
  };


  const handleExportToExcel = () => {
    if (typeof XLSX === 'undefined') { /* ... */ return; }
    if (displayedItems.length === 0 && currentView === 'itemList') { /* ... */ return; }
    // Note: Export for analysis view might be different or disabled. For now, it uses displayedItems.
    // Consider context for export if analysis view has its own data structure.

    try {
      const itemsToExport = displayedItems.map(item => ({
        'Name': item.name,
        'Category': item.category,
        'Total Quantity': item.computedTotalQuantity, 
        'Unit': item.unit,
        'Low Stock Threshold': item.minThreshold,
        'Origin Country': item.originCountry || '',
        'Last Updated': item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : '',
        'Soonest Expiry': item.computedSoonestExpiry ? new Date(item.computedSoonestExpiry).toLocaleDateString() : 'N/A',
        'General Notes': item.notes || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(itemsToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock Report");

      const colWidths = Object.keys(itemsToExport[0] || {}).map(key => {
        let maxLen = key.length;
        itemsToExport.forEach(row => {
          const val = (row as any)[key];
          const valLen = val ? String(val).length : 0;
          if (valLen > maxLen) maxLen = valLen;
        });
        return { wch: maxLen + 2 }; 
      });
      worksheet["!cols"] = colWidths;
      
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const fileName = `stock_report_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      addNotification(`Successfully exported ${displayedItems.length} items to ${fileName}.`, 'success');
    } catch (e) {
      console.error("Error exporting to Excel:", e);
      addNotification('Failed to export data to Excel.', 'error');
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header onAddItemClick={() => handleOpenFormModal()} /> 
      
      <div className="flex">
        <Sidebar 
          allItems={allItems} 
          onCategoryFilter={handleCategoryFilterChange} // Use updated handler
          activeCategoryFilter={categoryFilter}
          onStartBulkReleaseClick={handleOpenBulkStockReleaseModal}
          onStartBulkAddStockClick={handleOpenBulkAddStockModal}
          onNavigate={handleNavigate}
          currentView={currentView}
        />
        <main className="flex-1 container mx-auto px-4 py-8">
          {currentView === 'itemList' && (
            <>
              <Controls
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={handleCategoryFilterChange} // Use updated handler
                itemCount={displayedItems.length}
                onExportClick={handleExportToExcel}
                onStartStockTakeClick={handleOpenFullInventoryModal} 
              />
              <ItemList
                items={displayedItems} 
                isLoading={isLoading && allItemsCount === 0 && currentView === 'itemList'} 
                error={error}
                onEdit={handleOpenFormModal}
                onDelete={handleDeleteRequest}
                onAddStockClick={handleOpenAddStockModal}
                onStockOutClick={handleOpenStockOutModal} 
                onStockReleaseClick={handleOpenStockReleaseModal} 
              />
            </>
          )}
          {currentView === 'stockAnalysis' && (
            <StockAnalysisView allItems={allItems} isLoading={isLoading && allItemsCount === 0} />
          )}
        </main>
      </div>

      <ItemFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        isLoading={isLoading}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={handleCloseAddStockModal}
        onSubmitStock={handleAddStockSubmit}
        item={itemForAddingStock}
        isLoading={isLoading}
      />

      <StockOutModal
        isOpen={isStockOutModalOpen}
        onClose={handleCloseStockOutModal}
        onSubmitStockOut={handleStockOutSubmit}
        item={itemForStockingOut}
        isLoading={isLoading}
      />

      <StockReleaseModal
        isOpen={isStockReleaseModalOpen}
        onClose={handleCloseStockReleaseModal}
        onSubmitStockRelease={handleStockReleaseSubmit}
        item={itemForReleasingStock}
        isLoading={isLoading}
      />

      <FullInventoryModal
        isOpen={isFullInventoryModalOpen}
        onClose={handleCloseFullInventoryModal}
        onSubmit={handleFullInventorySubmit}
        allItems={allItems}
        isLoading={isLoading} 
        isSubmitting={isSubmittingInventory} 
      />

      <BulkStockReleaseModal
        isOpen={isBulkStockReleaseModalOpen}
        onClose={handleCloseBulkStockReleaseModal}
        onSubmit={handleSubmitBulkStockRelease}
        allItems={allItems}
        isLoading={isLoading}
        isSubmitting={isSubmittingBulkRelease}
      />

      <PrintableReleaseFormModal
        isOpen={isPrintableReleaseFormModalOpen}
        onClose={handleClosePrintableReleaseFormModal}
        releaseData={currentProcessedBulkReleaseData}
      />

      <BulkAddStockModal
        isOpen={isBulkAddStockModalOpen}
        onClose={handleCloseBulkAddStockModal}
        onSubmit={handleSubmitBulkAddStock}
        allItems={allItems}
        isLoading={isLoading}
        isSubmitting={isSubmittingBulkAddStock}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this item? This action cannot be undone.`}
        confirmButtonText="Delete"
        isLoading={isLoading}
      />

      <NotificationArea notifications={notifications} onRemoveNotification={removeNotification} />

      <footer className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-auto print:hidden">
        © {new Date().getFullYear()} OT & Endo Stock Manager. All rights reserved.
      </footer>
    </div>
  );
};

export default App;