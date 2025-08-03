import React, { useState, useRef } from 'react';
import { Upload, Scissors, Download, Trash2, Plus, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { WireCutItem } from '../types';

interface WireCutListUploaderProps {
  wireCutItems: WireCutItem[];
  onWireCutChange: (items: WireCutItem[]) => void;
}

export const WireCutListUploader: React.FC<WireCutListUploaderProps> = ({ 
  wireCutItems, 
  onWireCutChange 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [editingItem, setEditingItem] = useState<WireCutItem | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newItems: WireCutItem[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= 5) {
          const item: WireCutItem = {
            id: `wire-${Date.now()}-${i}`,
            wireId: values[headers.indexOf('wire id') || headers.indexOf('wireid') || 0]?.trim() || `W${i}`,
            fromPoint: values[headers.indexOf('from') || headers.indexOf('from point') || 1]?.trim() || '',
            toPoint: values[headers.indexOf('to') || headers.indexOf('to point') || 2]?.trim() || '',
            length: parseFloat(values[headers.indexOf('length') || 3]?.trim()) || 0,
            wireGauge: values[headers.indexOf('gauge') || headers.indexOf('wire gauge') || 4]?.trim() || '',
            color: values[headers.indexOf('color') || headers.indexOf('colour') || 5]?.trim() || '',
            quantity: parseInt(values[headers.indexOf('quantity') || headers.indexOf('qty') || 6]?.trim()) || 1
          };
          newItems.push(item);
        }
      }
      
      onWireCutChange([...wireCutItems, ...newItems]);
    };
    reader.readAsText(file);
  };

  const addManualItem = (item: Omit<WireCutItem, 'id'>) => {
    const newItem: WireCutItem = {
      ...item,
      id: `wire-manual-${Date.now()}`
    };
    onWireCutChange([...wireCutItems, newItem]);
    setShowManualEntry(false);
  };

  const updateItem = (updatedItem: WireCutItem) => {
    onWireCutChange(wireCutItems.map(item => item.id === updatedItem.id ? updatedItem : item));
    setEditingItem(null);
  };

  const removeItem = (id: string) => {
    onWireCutChange(wireCutItems.filter(item => item.id !== id));
  };

  const downloadTemplate = () => {
    const csvContent = "Wire ID,From Point,To Point,Length,Wire Gauge,Color,Quantity\n" +
      "W001,J1-1,J2-1,250,18AWG,Red,1\n" +
      "W002,J1-2,J2-2,300,18AWG,Black,1\n" +
      "W003,J1-3,Splice-1,150,16AWG,Blue,1\n" +
      "W004,Splice-1,J3-1,200,16AWG,Blue,1";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Wire_Cut_List_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTotalLength = () => {
    return wireCutItems.reduce((total, item) => total + (item.length * item.quantity), 0);
  };

  const getWireGaugeBreakdown = () => {
    const breakdown: { [gauge: string]: { count: number; totalLength: number } } = {};
    wireCutItems.forEach(item => {
      if (!breakdown[item.wireGauge]) {
        breakdown[item.wireGauge] = { count: 0, totalLength: 0 };
      }
      breakdown[item.wireGauge].count += item.quantity;
      breakdown[item.wireGauge].totalLength += item.length * item.quantity;
    });
    return breakdown;
  };

  const getTotalWires = () => wireCutItems.reduce((total, item) => total + item.quantity, 0);
  const getUniqueGauges = () => [...new Set(wireCutItems.map(item => item.wireGauge))];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-orange-600 hover:text-orange-800 transition-colors"
        >
          <Scissors className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Wire Cut List</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-4">
          {isCollapsed && wireCutItems.length > 0 && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                {wireCutItems.length} wires
              </span>
              <span>{getTotalLength().toFixed(0)}mm total</span>
              <span>{getUniqueGauges().length} gauges</span>
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
              className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              <Plus className="w-4 h-4" />
              Add Wire
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">Upload Wire Cut List</p>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop your CSV file here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
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

          {/* Summary Statistics */}
          {wireCutItems.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">Total Wires</h4>
                <p className="text-2xl font-bold text-orange-600">{getTotalWires()}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Total Length</h4>
                <p className="text-2xl font-bold text-blue-600">{getTotalLength().toFixed(0)}mm</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Wire Gauges</h4>
                <div className="text-sm">
                  {Object.entries(getWireGaugeBreakdown()).map(([gauge, data]) => (
                    <div key={gauge} className="flex justify-between">
                      <span>{gauge}:</span>
                      <span className="font-medium">{data.count} wires</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Wire Cut Items Table */}
          {wireCutItems.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Wire Cut Items ({wireCutItems.length})</h4>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Wire ID</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">From</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">To</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Length (mm)</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Gauge</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Color</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Qty</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wireCutItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-4 py-2 text-sm font-mono">{item.wireId}</td>
                        <td className="px-4 py-2 text-sm">{item.fromPoint}</td>
                        <td className="px-4 py-2 text-sm">{item.toPoint}</td>
                        <td className="px-4 py-2 text-sm">{item.length}</td>
                        <td className="px-4 py-2 text-sm">{item.wireGauge}</td>
                        <td className="px-4 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: item.color.toLowerCase() }}
                            ></div>
                            {item.color}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
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
              {editingItem ? 'Edit Wire Cut Item' : 'Add Wire Cut Item'}
            </h4>
            <WireCutItemForm
              item={editingItem}
              onSave={editingItem ? updateItem : addManualItem}
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

interface WireCutItemFormProps {
  item?: WireCutItem | null;
  onSave: (item: WireCutItem | Omit<WireCutItem, 'id'>) => void;
  onCancel: () => void;
}

const WireCutItemForm: React.FC<WireCutItemFormProps> = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    wireId: item?.wireId || '',
    fromPoint: item?.fromPoint || '',
    toPoint: item?.toPoint || '',
    length: item?.length || 0,
    wireGauge: item?.wireGauge || '',
    color: item?.color || '',
    quantity: item?.quantity || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (item) {
      onSave({ ...item, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wire ID</label>
          <input
            type="text"
            value={formData.wireId}
            onChange={(e) => setFormData({ ...formData, wireId: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            min="1"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From Point</label>
          <input
            type="text"
            value={formData.fromPoint}
            onChange={(e) => setFormData({ ...formData, fromPoint: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To Point</label>
          <input
            type="text"
            value={formData.toPoint}
            onChange={(e) => setFormData({ ...formData, toPoint: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Length (mm)</label>
          <input
            type="number"
            value={formData.length}
            onChange={(e) => setFormData({ ...formData, length: parseFloat(e.target.value) })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            step="0.1"
            min="0"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Wire Gauge</label>
          <input
            type="text"
            value={formData.wireGauge}
            onChange={(e) => setFormData({ ...formData, wireGauge: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            placeholder="18AWG"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            type="text"
            value={formData.color}
            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-orange-500"
            placeholder="Red"
            required
          />
        </div>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          {item ? 'Update' : 'Add'} Wire
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