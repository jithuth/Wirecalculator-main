import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Trash2, Plus, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { BOMItem } from '../types';

interface BOMUploaderProps {
  bomItems: BOMItem[];
  onBOMChange: (items: BOMItem[]) => void;
}

export const BOMUploader: React.FC<BOMUploaderProps> = ({ bomItems, onBOMChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingItem, setEditingItem] = useState<BOMItem | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultCategories = ['Wire', 'Connector', 'Terminal', 'Protection', 'Hardware', 'Other'];
  const allCategories = [...defaultCategories, ...customCategories];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
      const index = headers.findIndex(header => 
        header.toLowerCase().includes(name.toLowerCase()) ||
        header.toLowerCase().replace(/\s+/g, '').includes(name.toLowerCase().replace(/\s+/g, ''))
      );
      if (index !== -1) return index;
    }
    return -1;
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        alert('CSV file must contain at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // More comprehensive column mapping
      const partNumberIndex = findColumnIndex(headers, ['part number', 'partnumber', 'part_number', 'partno', 'part no', 'item', 'component']);
      const descriptionIndex = findColumnIndex(headers, ['description', 'desc', 'name', 'component name', 'item description']);
      const quantityIndex = findColumnIndex(headers, ['quantity', 'qty', 'count', 'amount']);
      const categoryIndex = findColumnIndex(headers, ['category', 'type', 'class', 'group']);
      const lengthIndex = findColumnIndex(headers, ['length', 'len', 'size']);
      const gaugeIndex = findColumnIndex(headers, ['gauge', 'wire gauge', 'awg', 'size']);

      console.log('Column mapping:', {
        partNumber: partNumberIndex,
        description: descriptionIndex,
        quantity: quantityIndex,
        category: categoryIndex,
        length: lengthIndex,
        gauge: gaugeIndex
      });

      const newItems: BOMItem[] = [];
      const newCategories = new Set(customCategories);
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // Skip empty rows
        if (values.every(v => !v)) continue;
        
        const partNumber = partNumberIndex >= 0 ? values[partNumberIndex] || `AUTO-${i}` : `AUTO-${i}`;
        const description = descriptionIndex >= 0 ? values[descriptionIndex] || 'Unknown Component' : 'Unknown Component';
        const quantity = quantityIndex >= 0 ? parseInt(values[quantityIndex]) || 1 : 1;
        
        let category: string;
        if (categoryIndex >= 0 && values[categoryIndex]) {
          category = values[categoryIndex];
        } else {
          category = categorizeItem(description);
        }
        
        // Add new category if it doesn't exist
        if (category && !allCategories.includes(category)) {
          newCategories.add(category);
        }
        
        const item: BOMItem = {
          id: `bom-${Date.now()}-${i}`,
          partNumber: partNumber,
          description: description,
          quantity: quantity,
          category: category as BOMItem['category'],
          length: lengthIndex >= 0 && values[lengthIndex] ? parseFloat(values[lengthIndex]) : undefined,
          wireGauge: gaugeIndex >= 0 && values[gaugeIndex] ? values[gaugeIndex] : undefined
        };
        
        newItems.push(item);
      }
      
      // Update custom categories
      if (newCategories.size > 0) {
        setCustomCategories([...customCategories, ...Array.from(newCategories)]);
      }
      
      console.log('Parsed items:', newItems);
      onBOMChange([...bomItems, ...newItems]);
    };
    reader.readAsText(file);
  };

  const categorizeItem = (description: string): BOMItem['category'] => {
    const desc = description.toLowerCase();
    if (desc.includes('wire') || desc.includes('cable')) return 'Wire';
    if (desc.includes('connector') || desc.includes('plug') || desc.includes('socket')) return 'Connector';
    if (desc.includes('terminal') || desc.includes('crimp')) return 'Terminal';
    if (desc.includes('tube') || desc.includes('sleeve') || desc.includes('tape') || desc.includes('wrap')) return 'Protection';
    if (desc.includes('clip') || desc.includes('tie') || desc.includes('bracket')) return 'Hardware';
    return 'Other';
  };

  const addCustomCategory = (categoryName: string) => {
    const trimmedName = categoryName.trim();
    if (trimmedName && !allCategories.includes(trimmedName)) {
      setCustomCategories([...customCategories, trimmedName]);
    }
  };

  const addManualItem = (item: Omit<BOMItem, 'id'>) => {
    const newItem: BOMItem = {
      ...item,
      id: `bom-manual-${Date.now()}`
    };
    onBOMChange([...bomItems, newItem]);
    setShowManualEntry(false);
  };

  const updateItem = (updatedItem: BOMItem) => {
    onBOMChange(bomItems.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
  };

  const removeItem = (id: string) => {
    onBOMChange(bomItems.filter(item => item.id !== id));
  };

  const downloadTemplate = () => {
    const csvContent = "Part Number,Description,Quantity,Category,Length,Wire Gauge\n" +
      "WIRE-001,18AWG Red Wire,100,Wire,500,18AWG\n" +
      "CONN-001,4-Pin Connector,10,Connector,,\n" +
      "TERM-001,Ring Terminal,20,Terminal,,\n" +
      "CUSTOM-001,Custom Component,5,Custom Category,,";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BOM_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Wire': return 'bg-blue-100 text-blue-800';
      case 'Connector': return 'bg-green-100 text-green-800';
      case 'Terminal': return 'bg-yellow-100 text-yellow-800';
      case 'Protection': return 'bg-purple-100 text-purple-800';
      case 'Hardware': return 'bg-gray-100 text-gray-800';
      case 'Other': return 'bg-red-100 text-red-800';
      default: return 'bg-indigo-100 text-indigo-800'; // Custom categories
    }
  };

  const getTotalItems = () => bomItems.reduce((total, item) => total + item.quantity, 0);
  const getUniqueCategories = () => [...new Set(bomItems.map(item => item.category))];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-green-600 hover:text-green-800 transition-colors"
        >
          <FileText className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Bill of Materials (BOM)</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-4">
          {isCollapsed && bomItems.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                {bomItems.length} items
              </span>
              <span>{getTotalItems()} total qty</span>
              <span>{getUniqueCategories().length} categories</span>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <Download className="w-4 h-4" />
              Template
            </button>
            <button
              onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Custom Categories Display */}
          {customCategories.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Custom Categories:</h4>
              <div className="flex flex-wrap gap-2">
                {customCategories.map((category, index) => (
                  <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium">
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Upload BOM File</p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Supported columns: Part Number, Description, Quantity, Category, Length, Wire Gauge
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* BOM Items Table */}
          {bomItems.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">BOM Items ({bomItems.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Part Number</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Category</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Length</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Gauge</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-2 text-sm font-medium">{item.partNumber}</td>
                        <td className="px-4 py-2 text-sm">{item.description}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm">{item.length ? `${item.length}mm` : '-'}</td>
                        <td className="px-4 py-2 text-sm">{item.wireGauge || '-'}</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex gap-1">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Manual Entry Modal */}
      {(showManualEntry || editingItem) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">
              {editingItem ? 'Edit BOM Item' : 'Add BOM Item'}
            </h4>
            <BOMItemForm
              item={editingItem}
              availableCategories={allCategories}
              onSave={editingItem ? updateItem : addManualItem}
              onAddCustomCategory={addCustomCategory}
              onCancel={() => {
                setShowManualEntry(false);
                setEditingItem(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

interface BOMItemFormProps {
  item?: BOMItem | null;
  availableCategories: string[];
  onSave: (item: BOMItem | Omit<BOMItem, 'id'>) => void;
  onAddCustomCategory: (category: string) => void;
  onCancel: () => void;
}

const BOMItemForm: React.FC<BOMItemFormProps> = ({ 
  item, 
  availableCategories, 
  onSave, 
  onAddCustomCategory, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    partNumber: item?.partNumber || '',
    description: item?.description || '',
    quantity: item?.quantity || 1,
    category: item?.category || 'Other',
    length: item?.length || '',
    wireGauge: item?.wireGauge || ''
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemData = {
      ...formData,
      length: formData.length ? parseFloat(formData.length.toString()) : undefined,
      wireGauge: formData.wireGauge || undefined
    };
    
    if (item) {
      onSave({ ...item, ...itemData });
    } else {
      onSave(itemData);
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategoryName.trim()) {
      onAddCustomCategory(customCategoryName.trim());
      setFormData({ ...formData, category: customCategoryName.trim() });
      setCustomCategoryName('');
      setShowCustomCategory(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
        <input
          type="text"
          value={formData.partNumber}
          onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <div className="space-y-2">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
            >
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowCustomCategory(!showCustomCategory)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + Add Custom Category
            </button>
            {showCustomCategory && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  placeholder="Category name"
                  className="flex-1 p-1 text-xs border rounded focus:ring-1 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomCategory}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
            min="1"
            required
          />
        </div>
      </div>
      
      {formData.category === 'Wire' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
            <input
              type="number"
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
              step="0.1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wire Gauge</label>
            <input
              type="text"
              value={formData.wireGauge}
              onChange={(e) => setFormData({ ...formData, wireGauge: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 18AWG"
            />
          </div>
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {item ? 'Update' : 'Add'} Item
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