import React, { useState, useEffect } from 'react';
import { Save, BookTemplate as FileTemplate, Trash2, Edit3, Download, Upload, Star, Clock, Zap, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { HarnessTemplate, Operation, BOMItem, HarnessSpecs, TemplateMatchCriteria } from '../types';

interface HarnessTemplateManagerProps {
  operations: Operation[];
  bomItems: BOMItem[];
  harnessSpecs: HarnessSpecs;
  onApplyTemplate: (operations: Omit<Operation, 'id'>[]) => void;
  onClearOperations: () => void;
}

export const HarnessTemplateManager: React.FC<HarnessTemplateManagerProps> = ({
  operations,
  bomItems,
  harnessSpecs,
  onApplyTemplate,
  onClearOperations
}) => {
  const [templates, setTemplates] = useState<HarnessTemplate[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<HarnessTemplate | null>(null);
  const [suggestedTemplates, setSuggestedTemplates] = useState<HarnessTemplate[]>([]);
  const [autoRepeatEnabled, setAutoRepeatEnabled] = useState(true);
  const [autoQuantityEnabled, setAutoQuantityEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterComplexity, setFilterComplexity] = useState<string>('All');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load templates from localStorage on component mount
  useEffect(() => {
    const savedTemplates = localStorage.getItem('harnessTemplates');
    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates).map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          lastUsed: t.lastUsed ? new Date(t.lastUsed) : undefined
        }));
        setTemplates(parsedTemplates);
      } catch (error) {
        console.error('Error loading templates:', error);
      }
    }
  }, []);

  // Save templates to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem('harnessTemplates', JSON.stringify(templates));
  }, [templates]);

  // Auto-suggest templates based on current BOM and harness specs
  useEffect(() => {
    if (bomItems.length > 0 || harnessSpecs.totalWires > 0) {
      const suggested = findMatchingTemplates();
      setSuggestedTemplates(suggested);
    }
  }, [bomItems, harnessSpecs, templates]);

  const findMatchingTemplates = (): HarnessTemplate[] => {
    const currentBomCategories = [...new Set(bomItems.map(item => item.category))];
    
    return templates
      .filter(template => {
        // Match complexity level
        if (template.complexity !== harnessSpecs.complexityLevel) return false;
        
        // Match wire count range (±20%)
        const wireCountMatch = Math.abs(template.estimatedWireCount - harnessSpecs.totalWires) <= (template.estimatedWireCount * 0.2);
        
        // Match connector count range (±20%)
        const connectorCountMatch = Math.abs(template.estimatedConnectorCount - harnessSpecs.totalConnectors) <= (template.estimatedConnectorCount * 0.2);
        
        // Match BOM categories (at least 70% overlap)
        const categoryOverlap = template.bomCategories.filter(cat => currentBomCategories.includes(cat)).length;
        const categoryMatch = categoryOverlap >= Math.max(1, template.bomCategories.length * 0.7);
        
        return wireCountMatch && connectorCountMatch && categoryMatch;
      })
      .sort((a, b) => {
        // Sort by last used date, then by creation date
        if (a.lastUsed && b.lastUsed) {
          return b.lastUsed.getTime() - a.lastUsed.getTime();
        }
        if (a.lastUsed && !b.lastUsed) return -1;
        if (!a.lastUsed && b.lastUsed) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, 3); // Show top 3 matches
  };

  // Function to automatically repeat operations based on unique part numbers and set quantities from BOM
  const expandOperationsForBOM = (templateOperations: Omit<Operation, 'id'>[]): Omit<Operation, 'id'>[] => {
    if (!autoRepeatEnabled && !autoQuantityEnabled) {
      return templateOperations;
    }

    if (bomItems.length === 0) {
      return templateOperations.map(op => ({
        ...op,
        quantity: op.quantity || 1
      }));
    }

    const expandedOperations: Omit<Operation, 'id'>[] = [];
    
    // Group BOM items by category with part numbers and quantities
    const bomByCategory = bomItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = new Map();
      }
      acc[item.category].set(item.partNumber, {
        partNumber: item.partNumber,
        quantity: item.quantity,
        description: item.description
      });
      return acc;
    }, {} as Record<string, Map<string, { partNumber: string; quantity: number; description: string }>>);

    templateOperations.forEach(operation => {
      const bomCategory = operation.bomCategory;
      
      if (autoRepeatEnabled && bomCategory && bomCategory !== 'All' && bomByCategory[bomCategory]) {
        // Get unique part numbers for this category with their quantities
        const categoryParts = Array.from(bomByCategory[bomCategory].values());
        
        // Create one operation instance for each unique part number
        categoryParts.forEach((partInfo) => {
          const operationQuantity = autoQuantityEnabled ? partInfo.quantity : 1;
          
          expandedOperations.push({
            ...operation,
            name: categoryParts.length > 1 
              ? `${operation.name} (${partInfo.partNumber})`
              : operation.name,
            quantity: operationQuantity // Set quantity from BOM
          });
        });
      } else {
        // For 'All' category or operations without specific BOM category, add as-is
        // For 'All' category operations, we can sum up all BOM quantities if auto-quantity is enabled
        let operationQuantity = operation.quantity || 1;
        
        if (autoQuantityEnabled) {
          if (bomCategory === 'All') {
            operationQuantity = bomItems.reduce((sum, item) => sum + item.quantity, 0);
          } else if (bomCategory && bomByCategory[bomCategory]) {
            // If it's a specific category but auto-repeat is disabled, sum quantities for that category
            operationQuantity = Array.from(bomByCategory[bomCategory].values())
              .reduce((sum, part) => sum + part.quantity, 0);
          }
        }
        
        expandedOperations.push({
          ...operation,
          quantity: operationQuantity
        });
      }
    });

    return expandedOperations;
  };

  const saveTemplate = (templateData: Omit<HarnessTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: HarnessTemplate = {
      ...templateData,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date()
    };
    
    setTemplates([...templates, newTemplate]);
    setShowCreateModal(false);
  };

  const updateTemplate = (updatedTemplate: HarnessTemplate) => {
    setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    setEditingTemplate(null);
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates(templates.filter(t => t.id !== templateId));
  };

  const applyTemplate = (template: HarnessTemplate) => {
    // Update last used date
    const updatedTemplate = { ...template, lastUsed: new Date() };
    setTemplates(templates.map(t => t.id === template.id ? updatedTemplate : t));
    
    // Expand operations based on BOM if auto-repeat is enabled
    const expandedOperations = expandOperationsForBOM(template.operations);
    
    // Apply operations
    onApplyTemplate(expandedOperations);
  };

  const exportTemplates = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'harness-templates.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTemplates = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedTemplates = JSON.parse(e.target?.result as string);
        const validTemplates = importedTemplates.map((t: any) => ({
          ...t,
          id: `imported-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(t.createdAt || Date.now()),
          lastUsed: t.lastUsed ? new Date(t.lastUsed) : undefined
        }));
        setTemplates([...templates, ...validTemplates]);
      } catch (error) {
        alert('Error importing templates. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  // Calculate how many operations would be generated with auto-repeat and their quantities
  const getOperationPreview = (template: HarnessTemplate) => {
    if (!autoRepeatEnabled && !autoQuantityEnabled) {
      return { 
        total: template.operations.length, 
        breakdown: [],
        totalQuantity: template.operations.reduce((sum, op) => sum + (op.quantity || 1), 0)
      };
    }

    if (bomItems.length === 0) {
      return { 
        total: template.operations.length, 
        breakdown: [],
        totalQuantity: template.operations.reduce((sum, op) => sum + (op.quantity || 1), 0)
      };
    }

    const bomByCategory = bomItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = new Map();
      }
      acc[item.category].set(item.partNumber, {
        partNumber: item.partNumber,
        quantity: item.quantity,
        description: item.description
      });
      return acc;
    }, {} as Record<string, Map<string, { partNumber: string; quantity: number; description: string }>>);

    let totalOperations = 0;
    let totalQuantity = 0;
    const breakdown: { category: string; count: number; operations: number; totalQty: number }[] = [];

    // Group operations by BOM category
    const operationsByCategory = template.operations.reduce((acc, op) => {
      const category = op.bomCategory || 'All';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(op);
      return acc;
    }, {} as Record<string, Omit<Operation, 'id'>[]>);

    Object.entries(operationsByCategory).forEach(([category, ops]) => {
      if (category === 'All') {
        totalOperations += ops.length;
        const categoryTotalQty = autoQuantityEnabled 
          ? bomItems.reduce((sum, item) => sum + item.quantity, 0) * ops.length
          : ops.reduce((sum, op) => sum + (op.quantity || 1), 0);
        totalQuantity += categoryTotalQty;
        breakdown.push({
          category,
          count: 1,
          operations: ops.length,
          totalQty: categoryTotalQty
        });
      } else if (autoRepeatEnabled && bomByCategory[category]) {
        const uniqueParts = Array.from(bomByCategory[category].values());
        const categoryOps = ops.length * uniqueParts.length;
        totalOperations += categoryOps;
        
        const categoryTotalQty = autoQuantityEnabled
          ? uniqueParts.reduce((sum, part) => sum + part.quantity, 0) * ops.length
          : categoryOps;
        totalQuantity += categoryTotalQty;
        
        breakdown.push({
          category,
          count: uniqueParts.length,
          operations: ops.length,
          totalQty: categoryTotalQty
        });
      } else {
        totalOperations += ops.length;
        let categoryTotalQty = ops.reduce((sum, op) => sum + (op.quantity || 1), 0);
        
        if (autoQuantityEnabled && bomByCategory[category]) {
          // Sum quantities for this category
          categoryTotalQty = Array.from(bomByCategory[category].values())
            .reduce((sum, part) => sum + part.quantity, 0) * ops.length;
        }
        
        totalQuantity += categoryTotalQty;
        breakdown.push({
          category,
          count: 1,
          operations: ops.length,
          totalQty: categoryTotalQty
        });
      }
    });

    return { total: totalOperations, breakdown, totalQuantity };
  };

  const canSaveTemplate = operations.length > 0;
  const currentBomCategories = [...new Set(bomItems.map(item => item.category))];

  // Filter templates based on search and complexity
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.harnessType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesComplexity = filterComplexity === 'All' || template.complexity === filterComplexity;
    return matchesSearch && matchesComplexity;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      {/* Header with Collapse/Expand */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <FileTemplate className="w-6 h-6" />
            <h3 className="text-lg font-semibold text-gray-900">Harness Templates</h3>
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
          {templates.length > 0 && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {templates.length} template{templates.length !== 1 ? 's' : ''}
            </span>
          )}
          {suggestedTemplates.length > 0 && !isCollapsed && (
            <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded flex items-center gap-1">
              <Star className="w-3 h-3" />
              {suggestedTemplates.length} suggested
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".json"
            onChange={importTemplates}
            className="hidden"
            id="import-templates"
          />
          <label
            htmlFor="import-templates"
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import
          </label>
          <button
            onClick={exportTemplates}
            disabled={templates.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!canSaveTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            Save as Template
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <>
          {/* Auto-Repeat and Auto-Quantity Settings */}
          <div className="mb-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Auto-Repeat Operations</h4>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoRepeatEnabled}
                    onChange={(e) => setAutoRepeatEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-blue-800">Enabled</span>
                </label>
              </div>
              <p className="text-sm text-blue-700">
                {autoRepeatEnabled 
                  ? 'Operations will be automatically repeated for each unique part number in their BOM category.'
                  : 'Operations will be applied as-is without automatic repetition.'
                }
              </p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Auto-Quantity from BOM</h4>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={autoQuantityEnabled}
                    onChange={(e) => setAutoQuantityEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-green-800">Enabled</span>
                </label>
              </div>
              <p className="text-sm text-green-700">
                {autoQuantityEnabled 
                  ? 'Operation quantities will be automatically set based on corresponding BOM item quantities.'
                  : 'Operation quantities will remain as defined in the template (typically 1).'
                }
              </p>
            </div>

            {(autoRepeatEnabled || autoQuantityEnabled) && bomItems.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Current BOM Summary:</h5>
                <div className="text-xs text-gray-600 space-y-1">
                  {Object.entries(bomItems.reduce((acc, item) => {
                    if (!acc[item.category]) {
                      acc[item.category] = { uniqueParts: new Set(), totalQty: 0 };
                    }
                    acc[item.category].uniqueParts.add(item.partNumber);
                    acc[item.category].totalQty += item.quantity;
                    return acc;
                  }, {} as Record<string, { uniqueParts: Set<string>; totalQty: number }>)).map(([cat, data]) => (
                    <div key={cat} className="flex justify-between">
                      <span>{cat}:</span>
                      <span>{data.uniqueParts.size} unique parts, {data.totalQty} total quantity</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggested Templates */}
          {suggestedTemplates.length > 0 && (
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Suggested Templates for Current Harness
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {suggestedTemplates.map((template) => {
                  const preview = getOperationPreview(template);
                  return (
                    <div key={template.id} className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{template.name}</h5>
                        <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                          {template.complexity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{template.operations.length} base operations</span>
                        <span>{template.estimatedWireCount} wires</span>
                        <span>{template.estimatedConnectorCount} connectors</span>
                      </div>
                      {(autoRepeatEnabled || autoQuantityEnabled) && preview.total > template.operations.length && (
                        <div className="text-xs space-y-1 mb-2">
                          {autoRepeatEnabled && (
                            <div className="text-blue-600">
                              Will generate {preview.total} operations total
                            </div>
                          )}
                          {autoQuantityEnabled && (
                            <div className="text-green-600">
                              Total quantity: {preview.totalQuantity}
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => applyTemplate(template)}
                        className="w-full px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
                      >
                        Apply Template
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Templates Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <FileTemplate className="w-5 h-5 text-indigo-600" />
                All Templates ({templates.length})
              </h4>
              
              {/* Search and Filter Controls */}
              {templates.length > 0 && (
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <select
                    value={filterComplexity}
                    onChange={(e) => setFilterComplexity(e.target.value)}
                    className="px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="All">All Complexity</option>
                    <option value="Simple">Simple</option>
                    <option value="Medium">Medium</option>
                    <option value="Complex">Complex</option>
                    <option value="Very Complex">Very Complex</option>
                  </select>
                </div>
              )}
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                {templates.length === 0 ? (
                  <div>
                    <FileTemplate className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium mb-2">No templates saved yet</p>
                    <p className="text-sm">Create your first template by adding operations and clicking "Save as Template"</p>
                  </div>
                ) : (
                  <p>No templates match your search criteria</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                  const preview = getOperationPreview(template);
                  return (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 mb-1">{template.name}</h5>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {template.harnessType}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {template.complexity}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => setEditingTemplate(template)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit template"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this template?')) {
                                deleteTemplate(template.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Delete template"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{template.operations.length} operations</span>
                        <span>{template.estimatedWireCount} wires</span>
                        <span>{template.estimatedConnectorCount} connectors</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                        <span>Created: {template.createdAt.toLocaleDateString()}</span>
                        {template.lastUsed && (
                          <span>Last used: {template.lastUsed.toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      {(autoRepeatEnabled || autoQuantityEnabled) && bomItems.length > 0 && (
                        <div className="text-xs space-y-1 mb-3">
                          {autoRepeatEnabled && preview.total > template.operations.length && (
                            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              Will generate {preview.total} operations
                            </div>
                          )}
                          {autoQuantityEnabled && (
                            <div className="bg-green-50 text-green-700 px-2 py-1 rounded">
                              Total quantity: {preview.totalQuantity}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => applyTemplate(template)}
                        className="w-full px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 transition-colors"
                      >
                        Apply Template
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Zap className="w-5 h-5" />
                <h4 className="font-medium">Quick Start</h4>
              </div>
              <p className="text-sm text-blue-600 mb-3">
                Apply a template based on your BOM and wire list to get started quickly.
              </p>
              <p className="text-xs text-blue-500">
                {templates.length > 0 ? `${templates.length} templates available above` : 'Create your first template'}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Save className="w-5 h-5" />
                <h4 className="font-medium">Save Current Setup</h4>
              </div>
              <p className="text-sm text-green-600 mb-3">
                Save your current operations as a reusable template for similar harnesses.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={!canSaveTemplate}
                className="text-sm text-green-700 hover:text-green-800 font-medium disabled:opacity-50"
              >
                {canSaveTemplate ? 'Save Template →' : 'Add operations first'}
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-2">
                <Clock className="w-5 h-5" />
                <h4 className="font-medium">Template Library</h4>
              </div>
              <p className="text-sm text-purple-600 mb-3">
                {templates.length > 0 
                  ? `You have ${templates.length} saved template${templates.length !== 1 ? 's' : ''}`
                  : 'Build your template library'
                }
              </p>
              <p className="text-xs text-purple-500">
                Import/export templates to share with your team
              </p>
            </div>
          </div>
        </>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          operations={operations}
          bomCategories={currentBomCategories}
          harnessSpecs={harnessSpecs}
          onSave={saveTemplate}
          onCancel={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          onSave={updateTemplate}
          onCancel={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
};

// Create Template Modal Component
interface CreateTemplateModalProps {
  operations: Operation[];
  bomCategories: string[];
  harnessSpecs: HarnessSpecs;
  onSave: (template: Omit<HarnessTemplate, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  operations,
  bomCategories,
  harnessSpecs,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    harnessType: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave({
        ...formData,
        operations: operations.map(({ id, ...op }) => op),
        bomCategories,
        complexity: harnessSpecs.complexityLevel,
        estimatedWireCount: harnessSpecs.totalWires,
        estimatedConnectorCount: harnessSpecs.totalConnectors
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h4 className="text-lg font-semibold mb-4">Save as Template</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Automotive Engine Harness"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harness Type</label>
            <input
              type="text"
              value={formData.harnessType}
              onChange={(e) => setFormData({ ...formData, harnessType: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Engine, Dashboard, Lighting"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Describe when to use this template..."
            />
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm">
            <h5 className="font-medium mb-2">Template will include:</h5>
            <ul className="space-y-1 text-gray-600">
              <li>• {operations.length} manufacturing operations</li>
              <li>• {bomCategories.length} BOM categories: {bomCategories.join(', ')}</li>
              <li>• Complexity: {harnessSpecs.complexityLevel}</li>
              <li>• Estimated {harnessSpecs.totalWires} wires, {harnessSpecs.totalConnectors} connectors</li>
            </ul>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Save Template
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
      </div>
    </div>
  );
};

// Edit Template Modal Component
interface EditTemplateModalProps {
  template: HarnessTemplate;
  onSave: (template: HarnessTemplate) => void;
  onCancel: () => void;
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  template,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: template.name,
    description: template.description,
    harnessType: template.harnessType
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...template,
      ...formData
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h4 className="text-lg font-semibold mb-4">Edit Template</h4>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harness Type</label>
            <input
              type="text"
              value={formData.harnessType}
              onChange={(e) => setFormData({ ...formData, harnessType: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Update Template
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
      </div>
    </div>
  );
};