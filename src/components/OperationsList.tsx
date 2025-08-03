import React, { useState } from 'react';
import { Trash2, Edit3, Copy, RefreshCw, Split, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Operation, BOMItem } from '../types';

interface OperationsListProps {
  operations: Operation[];
  bomItems: BOMItem[];
  onUpdateOperation: (id: string, updates: Partial<Operation>) => void;
  onRemoveOperation: (id: string) => void;
  onDuplicateOperation: (operation: Operation) => void;
  onRecalculateQuantities: () => void;
  onSplitOperationsByBOM: () => void;
  onClearAllOperations: () => void;
}

export const OperationsList: React.FC<OperationsListProps> = ({
  operations,
  bomItems,
  onUpdateOperation,
  onRemoveOperation,
  onDuplicateOperation,
  onRecalculateQuantities,
  onSplitOperationsByBOM,
  onClearAllOperations
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper function to calculate suggested quantity from BOM
  const getSuggestedQuantityFromBOM = (operation: Operation): number => {
    if (!operation.bomCategory || bomItems.length === 0) {
      return operation.quantity || 1;
    }

    if (operation.bomCategory === 'All') {
      return bomItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    // For specific categories, sum quantities of matching items
    const categoryItems = bomItems.filter(item => item.category === operation.bomCategory);
    if (categoryItems.length === 0) {
      return operation.quantity || 1;
    }

    return categoryItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Helper function to get BOM items that would be created for an operation
  const getBOMItemsForOperation = (operation: Operation): BOMItem[] => {
    if (!operation.bomCategory || bomItems.length === 0) {
      return [];
    }

    if (operation.bomCategory === 'All') {
      return bomItems;
    }

    return bomItems.filter(item => item.category === operation.bomCategory);
  };

  if (operations.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Selected Operations</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>No operations selected yet.</p>
          <p className="text-sm">Use the operation selector above to add manufacturing operations.</p>
        </div>
      </div>
    );
  }

  const groupedOperations = operations.reduce((groups, operation) => {
    const category = operation.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(operation);
    return groups;
  }, {} as Record<string, Operation[]>);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Pre-Production': return '🔧';
      case 'Assembly': return '🛠';
      case 'Testing': return '🧪';
      case 'Finishing': return '📦';
      default: return '⚙️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pre-Production': return 'border-l-blue-500 bg-blue-50';
      case 'Assembly': return 'border-l-green-500 bg-green-50';
      case 'Testing': return 'border-l-yellow-500 bg-yellow-50';
      case 'Finishing': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getBomCategoryColor = (bomCategory: string) => {
    switch (bomCategory) {
      case 'Wire': return 'bg-blue-100 text-blue-800';
      case 'Connector': return 'bg-green-100 text-green-800';
      case 'Terminal': return 'bg-yellow-100 text-yellow-800';
      case 'Protection': return 'bg-purple-100 text-purple-800';
      case 'Hardware': return 'bg-gray-100 text-gray-800';
      case 'Other': return 'bg-red-100 text-red-800';
      case 'All': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate how many operations would be created if split by BOM
  const calculateSplitPreview = () => {
    let totalNewOperations = 0;
    const preview: { operation: string; currentCount: number; newCount: number; bomItems: BOMItem[] }[] = [];

    operations.forEach(operation => {
      const bomItemsForOp = getBOMItemsForOperation(operation);
      if (bomItemsForOp.length > 1) {
        totalNewOperations += bomItemsForOp.length;
        preview.push({
          operation: operation.name,
          currentCount: 1,
          newCount: bomItemsForOp.length,
          bomItems: bomItemsForOp
        });
      } else {
        totalNewOperations += 1;
      }
    });

    return { totalNewOperations, preview };
  };

  const splitPreview = calculateSplitPreview();
  const canSplitOperations = bomItems.length > 0 && splitPreview.totalNewOperations > operations.length;

  const getTotalQuantity = () => operations.reduce((total, op) => total + (op.quantity || 1), 0);
  const getUniqueCategories = () => [...new Set(operations.map(op => op.category))];

  const handleDeleteAll = () => {
    if (confirm(`Are you sure you want to delete all ${operations.length} operations? This action cannot be undone.`)) {
      onClearAllOperations();
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <h3 className="text-lg font-semibold text-gray-900">
            Selected Operations ({operations.length})
          </h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-4">
          {isCollapsed && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">
                {operations.length} operations
              </span>
              <span>{getTotalQuantity()} total qty</span>
              <span>{getUniqueCategories().length} categories</span>
            </div>
          )}
          {!isCollapsed && (
            <div className="flex gap-2">
              {bomItems.length > 0 && (
                <>
                  <button
                    onClick={onRecalculateQuantities}
                    className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    title="Update quantities to match BOM totals"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Sync Quantities
                  </button>
                  {canSplitOperations && (
                    <button
                      onClick={onSplitOperationsByBOM}
                      className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      title={`Split operations by individual BOM items (will create ${splitPreview.totalNewOperations} operations)`}
                    >
                      <Split className="w-4 h-4" />
                      Split by BOM Items
                    </button>
                  )}
                </>
              )}
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Delete all operations"
              >
                <X className="w-4 h-4" />
                Delete All
              </button>
            </div>
          )}
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-6">
          {Object.entries(groupedOperations).map(([category, categoryOperations]) => (
            <div key={category} className={`border-l-4 pl-4 ${getCategoryColor(category)}`}>
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <span>{getCategoryIcon(category)}</span>
                {category} ({categoryOperations.length})
              </h4>
              
              <div className="space-y-3">
                {categoryOperations.map((operation) => {
                  const suggestedQuantity = getSuggestedQuantityFromBOM(operation);
                  const hasQuantityMismatch = bomItems.length > 0 && operation.quantity !== suggestedQuantity;
                  const bomItemsForOp = getBOMItemsForOperation(operation);
                  
                  return (
                    <div key={operation.id} className="bg-white p-4 rounded-lg border">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Operation Name</label>
                          <input
                            type="text"
                            value={operation.name}
                            onChange={(e) => onUpdateOperation(operation.id, { name: e.target.value })}
                            className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Setup (min)</label>
                          <input
                            type="number"
                            value={operation.setupMinutes}
                            onChange={(e) => onUpdateOperation(operation.id, { setupMinutes: Number(e.target.value) })}
                            className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Labor (min)</label>
                          <input
                            type="number"
                            value={operation.laborMinutes}
                            onChange={(e) => onUpdateOperation(operation.id, { laborMinutes: Number(e.target.value) })}
                            className="w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500"
                            min="0"
                            step="0.1"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={operation.quantity || 1}
                            onChange={(e) => onUpdateOperation(operation.id, { quantity: Number(e.target.value) })}
                            className={`w-full p-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 ${
                              hasQuantityMismatch ? 'border-orange-300 bg-orange-50' : ''
                            }`}
                            min="1"
                          />
                        </div>
                        
                        <div className="flex items-end gap-1">
                          <button
                            onClick={() => onDuplicateOperation(operation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemoveOperation(operation.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-xs">
                        <span className={`px-2 py-1 rounded ${operation.isManual ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                          {operation.isManual ? 'Manual' : 'Automated'}
                        </span>
                        <span className={`px-2 py-1 rounded font-medium ${getBomCategoryColor(operation.bomCategory || 'Other')}`}>
                          {operation.bomCategory || 'Other'}
                        </span>
                        <span className="text-gray-500">Complexity Factor: {operation.complexityFactor}x</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};