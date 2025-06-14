
import React from 'react';
import { ProcessedBulkReleaseResult } from '../hooks/useStockManagement';
import { Batch, StockItem } from '../types'; // Correctly import StockItem from ../types
import Modal from './Modal';
import { DocumentDuplicateIcon, CheckCircleIcon, AlertTriangleIcon } from './icons';

interface PrintableReleaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseData: ProcessedBulkReleaseResult | null;
}

const PrintableReleaseFormModal: React.FC<PrintableReleaseFormModalProps> = ({ isOpen, onClose, releaseData }) => {
  if (!isOpen || !releaseData) return null;

  const { commonDetails, processedItems, errors, voucherId, success } = releaseData;

  const handlePrint = () => {
    window.print();
  };
  
  const issueDate = commonDetails.releaseDate ? new Date(commonDetails.releaseDate).toLocaleDateString() : new Date().toLocaleDateString();

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Release Voucher Preview" size="2xl"> {/* Increased size for better batch display */}
      <div className="printable-area space-y-6" id="stockReleaseVoucher">
        <div className="text-center mb-6 print:mt-2"> {/* Changed print:mt-8 to print:mt-2 */}
          <DocumentDuplicateIcon className="w-12 h-12 mx-auto text-primary-600 print:text-black" />
          <h2 className="text-2xl font-bold text-gray-800 mt-2 print:text-black">Stock Release Voucher</h2>
          <p className="text-sm text-gray-500 print:text-black">Voucher ID: {voucherId}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm border border-gray-200 p-4 rounded-md print:border-black">
          <div><strong>Date of Issue:</strong> {issueDate}</div>
          <div><strong>Released To:</strong> {commonDetails.releasedTo}</div>
          {commonDetails.reason && (
            <div className="md:col-span-2"><strong>Reason for Release:</strong> {commonDetails.reason}</div>
          )}
        </div>

        {processedItems.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2 print:text-black">Released Items:</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-md print:border-black">
              <table className="min-w-full divide-y divide-gray-200 print:divide-black">
                <thead className="bg-gray-50 print:bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">S.No.</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Item Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Unit</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Total Qty Released</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider print:text-black">Affected Batches (ID - Qty - Exp.)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 print:divide-black">
                  {processedItems.map((entry, index) => {
                    const itemFullDetails: StockItem = entry.item; // entry.item is StockItem
                    return (
                      <tr key={entry.item.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 print:text-black">{index + 1}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 print:text-black">{entry.item.name}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 print:text-black">{entry.item.unit}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-700 print:text-black text-right">{entry.quantityReleased}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 print:text-black">
                          {entry.affectedBatches && entry.affectedBatches.length > 0 ? (
                            <ul className="list-none p-0 m-0">
                              {entry.affectedBatches.map(ab => {
                                const batchDetail = itemFullDetails.batches.find(b => b.id === ab.batchId);
                                return (
                                  <li key={ab.batchId}>
                                    {ab.batchId.substring(0,5)}... ({ab.releasedQuantity})
                                    {batchDetail?.expiryDate ? ` - Exp: ${formatDate(batchDetail.expiryDate)}` : ''}
                                  </li>
                                );
                              })}
                            </ul>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {errors.length > 0 && ( 
            <div className="mt-4">
                <h3 className="text-md font-semibold text-danger-700 mb-2 flex items-center print:text-black">
                <AlertTriangleIcon className="w-5 h-5 mr-2 text-danger-600 print:text-black" /> Errors Encountered:
                </h3>
                <ul className="list-disc list-inside text-sm text-danger-600 bg-danger-50 p-3 rounded-md print:bg-transparent print:text-black">
                {errors.map((err, idx) => (
                    <li key={idx}><strong>{err.name || `Item ID ${err.itemId}`}:</strong> {err.error}</li>
                ))}
                </ul>
            </div>
        )}
        
         <div className={`mt-4 p-3 rounded-md print:hidden ${success && errors.length === 0 ? 'bg-success-50 text-success-700' : errors.length > 0 && processedItems.length > 0 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'}`}>
            {success && errors.length === 0 && <p className='flex items-center'><CheckCircleIcon className="w-5 h-5 mr-2"/>All selected items processed successfully.</p>}
            {errors.length > 0 && processedItems.length > 0 && <p className='flex items-center'><AlertTriangleIcon className="w-5 h-5 mr-2"/>Some items processed successfully, but {errors.length} item(s) had errors.</p>}
            {errors.length > 0 && processedItems.length === 0 && <p className='flex items-center'><AlertTriangleIcon className="w-5 h-5 mr-2"/>Bulk release failed. All items had errors.</p>}
        </div>

        <div className="pt-8 mt-8 border-t border-dashed border-gray-300 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm print:border-black print:mt-4"> {/* Changed print:mt-12 to print:mt-4 */}
          <div>
            <p className="font-semibold">Prepared By:</p>
            <div className="mt-10 border-b border-gray-400 print:border-black"></div>
            <p className="mt-1">Name & Signature</p>
          </div>
          <div>
            <p className="font-semibold">Approved By:</p>
            <div className="mt-10 border-b border-gray-400 print:border-black"></div>
            <p className="mt-1">Name & Signature</p>
          </div>
          <div>
            <p className="font-semibold">Received By:</p>
            <div className="mt-10 border-b border-gray-400 print:border-black"></div>
            <p className="mt-1">Name & Signature</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-3 print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Close
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={processedItems.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Print Voucher
        </button>
      </div>
      
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-area, .printable-area * { visibility: visible; }
          .printable-area { position: absolute; left: 0; top: 0; width: 100%; font-size: 9pt; } /* Adjusted font size */
          .print\\:text-black { color: black !important; }
          .print\\:border-black { border-color: black !important; }
          .print\\:bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:bg-transparent { background-color: transparent !important; }
          .print\\:hidden { display: none !important; }
          .print\\:mt-2 { margin-top: 0.5rem !important; } /* Adjusted margin */
          .print\\:mt-4 { margin-top: 1rem !important; } /* Adjusted margin */
          table, th, td { border: 1px solid black !important; border-collapse: collapse !important; padding: 4px 6px; } /* Added padding */
          thead { display: table-header-group; }
          h2 { font-size: 1.25rem !important; } /* Adjusted heading size */
          h3 { font-size: 1rem !important; }   /* Adjusted heading size */
        }
      `}</style>
    </Modal>
  );
};

export default PrintableReleaseFormModal;
