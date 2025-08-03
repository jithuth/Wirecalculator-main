import React, { useState } from 'react';
import { Plus, Settings, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { operationTemplates } from '../data/operationTemplates';
import { Operation, BOMItem } from '../types';

interface OperationSelectorProps {
  onAddOperation: (operation: Omit<Operation, 'id'>) => void;
  bomItems?: BOMItem[];
}

export const OperationSelector: React.FC<OperationSelectorProps> = ({ onAddOperation, bomItems = [] }) => {
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [bomCategoryFilter, setBomCategoryFilter] = useState<string>('All');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const categories = [...new Set(operationTemplates.map(op => op.category))];
  
  // Get unique categories from BOM items and combine with default categories
  const bomCategories = ['All', 'Wire', 'Connector', 'Terminal', 'Protection', 'Hardware', 'Other'];
  const customBomCategories = [...new Set(bomItems.map(item => item.category))].filter(cat => !bomCategories.includes(cat));
  const allBomCategories = [...bomCategories, ...customBomCategories];

  const filteredOperations = operationTemplates.filter(op => 
    bomCategoryFilter === 'All' || op.bomCategory === bomCategoryFilter || op.bomCategory === 'All'
  );

  const handleAddCustomOperation = (operation: Omit<Operation, 'id'>) => {
    onAddOperation(operation);
    setShowCustomForm(false);
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
      default: return 'bg-indigo-100 text-indigo-800'; // Custom categories
    }
  };

  const getOperationCount = () => {
    return filteredOperations.length;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Plus className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Add Manufacturing Operations</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-4">
          {isCollapsed && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {getOperationCount()} operations available
              </span>
              <span>Filter: {bomCategoryFilter}</span>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={bomCategoryFilter}
                onChange={(e) => setBomCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {allBomCategories.map(category => (
                  <option key={category} value={category}>
                    {category === 'All' ? 'All Components' : category}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowCustomForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Create Custom Operation
            </button>
          </div>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          {categories.map(category => {
            const categoryOperations = filteredOperations.filter(op => op.category === category);
            
            if (categoryOperations.length === 0) return null;
            
            return (
              <div key={category} className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-3 border-b pb-2">
                  {category === 'Pre-Production' && '🔧 Pre-Production and Preparation'}
                  {category === 'Assembly' && '🛠 Assembly Operations'}
                  {category === 'Testing' && '🧪 Testing and Quality Control'}
                  {category === 'Finishing' && '📦 Finishing and Logistics'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categoryOperations.map((operation, index) => (
                    <button
                      key={`${category}-${index}`}
                      onClick={() => onAddOperation(operation)}
                      className="flex items-start gap-2 p-3 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{operation.name}</div>
                        <div className="text-xs text-gray-500 mb-1">
                          Setup: {operation.setupMinutes}min | Labor: {operation.laborMinutes}min
                          {operation.isManual ? ' (Manual)' : ' (Auto)'}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getBomCategoryColor(operation.bomCategory || 'Other')}`}>
                            {operation.bomCategory || 'Other'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Custom Operation Modal */}
      {showCustomForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Create Custom Operation</h4>
            <CustomOperationForm
              availableBomCategories={allBomCategories}
              onSave={handleAddCustomOperation}
              onCancel={() => setShowCustomForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface CustomOperationFormProps {
  availableBomCategories: string[];
  onSave: (operation: Omit<Operation, 'id'>) => void;
  onCancel: () => void;
}

const CustomOperationForm: React.FC<CustomOperationFormProps> = ({ availableBomCategories, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Assembly' as Operation['category'],
    setupMinutes: 0,
    laborMinutes: 0,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'All' as Operation['bomCategory']
  });

  const categories = ['Pre-Production', 'Assembly', 'Testing', 'Finishing'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Operation Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Custom Wire Processing"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Process Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as Operation['category'] })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">BOM Component</label>
          <select
            value={formData.bomCategory}
            onChange={(e) => setFormData({ ...formData, bomCategory: e.target.value as Operation['bomCategory'] })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {availableBomCategories.map(category => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Components' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Setup Time (min)</label>
          <input
            type="number"
            value={formData.setupMinutes}
            onChange={(e) => setFormData({ ...formData, setupMinutes: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Labor Time (min)</label>
          <input
            type="number"
            value={formData.laborMinutes}
            onChange={(e) => setFormData({ ...formData, laborMinutes: parseFloat(e.target.value) || 0 })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.1"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
          <select
            value={formData.isManual ? 'manual' : 'automated'}
            onChange={(e) => setFormData({ ...formData, isManual: e.target.value === 'manual' })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="manual">Manual</option>
            <option value="automated">Automated</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Complexity Factor</label>
          <input
            type="number"
            value={formData.complexityFactor}
            onChange={(e) => setFormData({ ...formData, complexityFactor: parseFloat(e.target.value) || 1.0 })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            min="0.1"
            max="3.0"
            step="0.1"
          />
          <p className="text-xs text-gray-500 mt-1">1.0 = normal, &gt;1.0 = more complex</p>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Operation
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};