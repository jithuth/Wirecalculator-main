import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import { HarnessSpecsForm } from './components/HarnessSpecsForm';
import { WorkstationConfigComponent } from './components/WorkstationConfig';
import { ProjectParametersComponent } from './components/ProjectParameters';
import { OperationSelector } from './components/OperationSelector';
import { OperationsList } from './components/OperationsList';
import { BOMUploader } from './components/BOMUploader';
import { WireCutListUploader } from './components/WireCutListUploader';
import { CostAnalysis } from './components/CostAnalysis';
import { HarnessTemplateManager } from './components/HarnessTemplateManager';
import { 
  Operation, 
  HarnessSpecs, 
  WorkstationConfig, 
  ProjectParameters,
  BOMItem,
  WireCutItem
} from './types';

function App() {
  // State management
  const [operations, setOperations] = useState<Operation[]>([]);
  const [harnessSpecs, setHarnessSpecs] = useState<HarnessSpecs>({
    totalWires: 0,
    totalConnectors: 0,
    totalBranches: 0,
    totalSplices: 0,
    harnessLength: 0,
    complexityLevel: 'Simple'
  });
  const [workstationConfig, setWorkstationConfig] = useState<WorkstationConfig>({
    type: 'Manual',
    efficiencyMultiplier: 1.0
  });
  const [parameters, setParameters] = useState<ProjectParameters>({
    laborRate: 25,
    shiftDuration: 480,
    productionVolume: 100,
    efficiencyRate: 85,
    qualityInspectionTime: 10,
    overtimeMultiplier: 1.5,
    setupCostPerOperation: 5,
    materialHandlingTime: 15
  });
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [wireCutItems, setWireCutItems] = useState<WireCutItem[]>([]);

  // Helper function to calculate quantity from BOM for an operation
  const calculateQuantityFromBOM = (operation: Operation): number => {
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

  // Operation management
  const addOperation = (operationTemplate: Omit<Operation, 'id'>) => {
    const newOperation: Operation = {
      ...operationTemplate,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: calculateQuantityFromBOM({
        ...operationTemplate,
        id: 'temp',
        quantity: operationTemplate.quantity || 1
      })
    };
    setOperations([...operations, newOperation]);
  };

  const addMultipleOperations = (operationTemplates: Omit<Operation, 'id'>[]) => {
    const newOperations: Operation[] = operationTemplates.map(template => ({
      ...template,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      quantity: template.quantity || 1 // Quantities should already be calculated in template expansion
    }));
    setOperations([...operations, ...newOperations]);
  };

  const updateOperation = (id: string, updates: Partial<Operation>) => {
    setOperations(operations.map(op => 
      op.id === id ? { ...op, ...updates } : op
    ));
  };

  const removeOperation = (id: string) => {
    setOperations(operations.filter(op => op.id !== id));
  };

  const duplicateOperation = (operation: Operation) => {
    const duplicated: Operation = {
      ...operation,
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${operation.name} (Copy)`,
      quantity: calculateQuantityFromBOM(operation)
    };
    setOperations([...operations, duplicated]);
  };

  const clearAllOperations = () => {
    setOperations([]);
  };

  // Function to recalculate all operation quantities based on current BOM (sum approach)
  const recalculateOperationQuantities = () => {
    setOperations(operations.map(operation => ({
      ...operation,
      quantity: calculateQuantityFromBOM(operation)
    })));
  };

  // Function to split operations by individual BOM items
  const splitOperationsByBOM = () => {
    const newOperations: Operation[] = [];
    
    operations.forEach(operation => {
      if (!operation.bomCategory || bomItems.length === 0) {
        // Keep operation as-is if no BOM category or no BOM items
        newOperations.push(operation);
        return;
      }

      let relevantBomItems: BOMItem[] = [];
      
      if (operation.bomCategory === 'All') {
        relevantBomItems = bomItems;
      } else {
        relevantBomItems = bomItems.filter(item => item.category === operation.bomCategory);
      }

      if (relevantBomItems.length === 0) {
        // Keep operation as-is if no matching BOM items
        newOperations.push(operation);
      } else if (relevantBomItems.length === 1) {
        // Update quantity for single matching item
        newOperations.push({
          ...operation,
          quantity: relevantBomItems[0].quantity
        });
      } else {
        // Create separate operations for each BOM item
        relevantBomItems.forEach((bomItem, index) => {
          newOperations.push({
            ...operation,
            id: `${operation.id}-split-${index}`,
            name: `${operation.name} (${bomItem.partNumber})`,
            quantity: bomItem.quantity
          });
        });
      }
    });

    setOperations(newOperations);
  };

  // Auto-populate harness specs from BOM and wire cut list
  React.useEffect(() => {
    const wireCount = wireCutItems.reduce((total, item) => total + item.quantity, 0);
    const connectorCount = bomItems
      .filter(item => item.category === 'Connector')
      .reduce((total, item) => total + item.quantity, 0);
    
    // Estimate branches and splices from wire cut list patterns
    const uniqueFromPoints = new Set(wireCutItems.map(item => item.fromPoint));
    const uniqueToPoints = new Set(wireCutItems.map(item => item.toPoint));
    const estimatedBranches = Math.max(uniqueFromPoints.size - 1, 0);
    const estimatedSplices = wireCutItems.filter(item => 
      item.fromPoint.toLowerCase().includes('splice') || 
      item.toPoint.toLowerCase().includes('splice')
    ).length;

    const totalLength = wireCutItems.reduce((total, item) => total + (item.length * item.quantity), 0);

    // Auto-determine complexity level
    let complexityLevel: HarnessSpecs['complexityLevel'] = 'Simple';
    if (wireCount > 50 || connectorCount > 10 || estimatedBranches > 5) {
      complexityLevel = 'Medium';
    }
    if (wireCount > 100 || connectorCount > 20 || estimatedBranches > 10) {
      complexityLevel = 'Complex';
    }
    if (wireCount > 200 || connectorCount > 40 || estimatedBranches > 20) {
      complexityLevel = 'Very Complex';
    }

    setHarnessSpecs(prev => ({
      ...prev,
      totalWires: wireCount || prev.totalWires,
      totalConnectors: connectorCount || prev.totalConnectors,
      totalBranches: estimatedBranches || prev.totalBranches,
      totalSplices: estimatedSplices || prev.totalSplices,
      harnessLength: totalLength || prev.harnessLength,
      complexityLevel: (wireCount > 0 || connectorCount > 0) ? complexityLevel : prev.complexityLevel
    }));
  }, [bomItems, wireCutItems]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Advanced Wiring Harness Labor Cost Calculator
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive cost analysis with BOM integration, wire cut lists, operation templates, and harness templates
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Project Parameters */}
          <ProjectParametersComponent 
            parameters={parameters}
            onParametersChange={setParameters}
          />

          {/* BOM and Wire Cut List Upload */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BOMUploader 
              bomItems={bomItems}
              onBOMChange={setBomItems}
            />
            <WireCutListUploader 
              wireCutItems={wireCutItems}
              onWireCutChange={setWireCutItems}
            />
          </div>

          {/* Harness Specifications */}
          <HarnessSpecsForm 
            specs={harnessSpecs}
            onSpecsChange={setHarnessSpecs}
          />

          {/* Workstation Configuration */}
          <WorkstationConfigComponent 
            config={workstationConfig}
            onConfigChange={setWorkstationConfig}
          />

          {/* Harness Template Manager */}
          <HarnessTemplateManager
            operations={operations}
            bomItems={bomItems}
            harnessSpecs={harnessSpecs}
            onApplyTemplate={addMultipleOperations}
            onClearOperations={clearAllOperations}
          />

          {/* Operation Selection */}
          <OperationSelector 
            onAddOperation={addOperation}
            bomItems={bomItems}
          />

          {/* Selected Operations */}
          <OperationsList 
            operations={operations}
            bomItems={bomItems}
            onUpdateOperation={updateOperation}
            onRemoveOperation={removeOperation}
            onDuplicateOperation={duplicateOperation}
            onRecalculateQuantities={recalculateOperationQuantities}
            onSplitOperationsByBOM={splitOperationsByBOM}
            onClearAllOperations={clearAllOperations}
          />

          {/* Cost Analysis Results */}
          <CostAnalysis 
            operations={operations}
            harnessSpecs={harnessSpecs}
            workstationConfig={workstationConfig}
            parameters={parameters}
            bomItems={bomItems}
            wireCutItems={wireCutItems}
          />
        </div>
      </div>
    </div>
  );
}

export default App;