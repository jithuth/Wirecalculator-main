import React, { useState } from 'react';
import { Calculator, Clock, DollarSign, TrendingUp, Factory, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { Operation, HarnessSpecs, WorkstationConfig, ProjectParameters, BOMItem, WireCutItem } from '../types';

interface CostAnalysisProps {
  operations: Operation[];
  harnessSpecs: HarnessSpecs;
  workstationConfig: WorkstationConfig;
  parameters: ProjectParameters;
  bomItems: BOMItem[];
  wireCutItems: WireCutItem[];
}

export const CostAnalysis: React.FC<CostAnalysisProps> = ({
  operations,
  harnessSpecs,
  workstationConfig,
  parameters,
  bomItems,
  wireCutItems
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Complexity multipliers based on harness specifications
  const getComplexityMultiplier = () => {
    const baseMultiplier = {
      'Simple': 1.0,
      'Medium': 1.2,
      'Complex': 1.5,
      'Very Complex': 2.0
    }[harnessSpecs.complexityLevel];

    // Additional complexity factors
    const wireComplexity = Math.min(1 + (harnessSpecs.totalWires / 100) * 0.1, 1.5);
    const connectorComplexity = Math.min(1 + (harnessSpecs.totalConnectors / 20) * 0.1, 1.3);
    const branchComplexity = Math.min(1 + (harnessSpecs.totalBranches / 10) * 0.15, 1.4);
    const spliceComplexity = Math.min(1 + (harnessSpecs.totalSplices / 5) * 0.2, 1.6);

    return baseMultiplier * wireComplexity * connectorComplexity * branchComplexity * spliceComplexity;
  };

  // Calculate total setup time
  const calculateTotalSetupTime = () => {
    return operations.reduce((total, op) => {
      const quantity = op.quantity || 1;
      return total + (op.setupMinutes * quantity);
    }, 0);
  };

  // Calculate total labor time with complexity and workstation factors
  const calculateTotalLaborTime = () => {
    const complexityMultiplier = getComplexityMultiplier();
    
    return operations.reduce((total, op) => {
      const quantity = op.quantity || 1;
      const baseTime = op.laborMinutes * quantity;
      const complexityAdjusted = baseTime * op.complexityFactor * complexityMultiplier;
      const workstationAdjusted = complexityAdjusted * workstationConfig.efficiencyMultiplier;
      
      return total + workstationAdjusted;
    }, 0);
  };

  // Calculate effective labor time with efficiency
  const calculateEffectiveLaborTime = () => {
    return (calculateTotalLaborTime() * 100) / parameters.efficiencyRate;
  };

  // Calculate total production time
  const calculateTotalProductionTime = () => {
    return calculateTotalSetupTime() + 
           calculateEffectiveLaborTime() + 
           parameters.qualityInspectionTime + 
           parameters.materialHandlingTime;
  };

  // Calculate labor cost with overtime consideration
  const calculateLaborCost = () => {
    const totalMinutes = calculateTotalProductionTime();
    const totalHours = totalMinutes / 60;
    const regularHours = Math.min(totalHours, parameters.shiftDuration / 60);
    const overtimeHours = Math.max(totalHours - (parameters.shiftDuration / 60), 0);
    
    const regularCost = regularHours * parameters.laborRate;
    const overtimeCost = overtimeHours * parameters.laborRate * parameters.overtimeMultiplier;
    
    return (regularCost + overtimeCost) * parameters.productionVolume;
  };

  // Calculate setup costs
  const calculateSetupCosts = () => {
    return operations.length * parameters.setupCostPerOperation * parameters.productionVolume;
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return calculateLaborCost() + calculateSetupCosts();
  };

  // Calculate cost per unit
  const calculateCostPerUnit = () => {
    return calculateTotalCost() / parameters.productionVolume;
  };

  // Calculate units per shift
  const calculateUnitsPerShift = () => {
    const timePerUnit = calculateTotalProductionTime();
    return Math.floor(parameters.shiftDuration / timePerUnit);
  };

  // Wire analysis from cut list
  const getWireAnalysis = () => {
    const totalWireLength = wireCutItems.reduce((total, item) => total + (item.length * item.quantity), 0);
    const uniqueGauges = [...new Set(wireCutItems.map(item => item.wireGauge))];
    const avgWireLength = wireCutItems.length > 0 ? totalWireLength / wireCutItems.reduce((total, item) => total + item.quantity, 0) : 0;
    
    return {
      totalLength: totalWireLength,
      uniqueGauges: uniqueGauges.length,
      averageLength: avgWireLength,
      totalWires: wireCutItems.reduce((total, item) => total + item.quantity, 0)
    };
  };

  // BOM analysis
  const getBOMAnalysis = () => {
    const categories = bomItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.quantity;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalItems: bomItems.reduce((total, item) => total + item.quantity, 0),
      uniqueParts: bomItems.length,
      categories
    };
  };

  const wireAnalysis = getWireAnalysis();
  const bomAnalysis = getBOMAnalysis();
  const complexityMultiplier = getComplexityMultiplier();
  const costPerUnit = calculateCostPerUnit();
  const totalCost = calculateTotalCost();

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Calculator className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Cost Analysis & Results</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        {isCollapsed && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              ${costPerUnit.toFixed(2)} per unit
            </span>
            <span>${totalCost.toFixed(2)} total</span>
            <span>{calculateUnitsPerShift()} units/shift</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {/* Complexity Analysis */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Complexity Analysis
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Base Level:</span>
                <span className="ml-2 font-medium">{harnessSpecs.complexityLevel}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Multiplier:</span>
                <span className="ml-2 font-medium">{complexityMultiplier.toFixed(2)}x</span>
              </div>
              <div>
                <span className="text-gray-600">Workstation:</span>
                <span className="ml-2 font-medium">{workstationConfig.type}</span>
              </div>
              <div>
                <span className="text-gray-600">Efficiency:</span>
                <span className="ml-2 font-medium">{Math.round(workstationConfig.efficiencyMultiplier * 100)}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Time Breakdown */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 mb-3">
                <Clock className="w-5 h-5" />
                <h4 className="font-medium">Time Breakdown</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Setup Time:</span>
                  <span className="font-medium">{calculateTotalSetupTime().toFixed(1)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Base Labor:</span>
                  <span className="font-medium">{calculateTotalLaborTime().toFixed(1)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Effective Labor:</span>
                  <span className="font-medium">{calculateEffectiveLaborTime().toFixed(1)} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Quality Check:</span>
                  <span className="font-medium">{parameters.qualityInspectionTime} min</span>
                </div>
                <div className="flex justify-between">
                  <span>Material Handling:</span>
                  <span className="font-medium">{parameters.materialHandlingTime} min</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total Time:</span>
                  <span>{calculateTotalProductionTime().toFixed(1)} min</span>
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-3">
                <DollarSign className="w-5 h-5" />
                <h4 className="font-medium">Cost Analysis</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Labor Cost:</span>
                  <span className="font-medium">${calculateLaborCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Setup Costs:</span>
                  <span className="font-medium">${calculateSetupCosts().toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total Cost:</span>
                  <span>${calculateTotalCost().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-green-700 border-t pt-2">
                  <span>Cost per Unit:</span>
                  <span>${calculateCostPerUnit().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Production Metrics */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-purple-700 mb-3">
                <Factory className="w-5 h-5" />
                <h4 className="font-medium">Production Metrics</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Units per Shift:</span>
                  <span className="font-medium">{calculateUnitsPerShift()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Production Volume:</span>
                  <span className="font-medium">{parameters.productionVolume}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efficiency Rate:</span>
                  <span className="font-medium">{parameters.efficiencyRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Operations Count:</span>
                  <span className="font-medium">{operations.length}</span>
                </div>
              </div>
            </div>

            {/* Wire Analysis */}
            {wireCutItems.length > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700 mb-3">
                  <span className="text-lg">🔌</span>
                  <h4 className="font-medium">Wire Analysis</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Wires:</span>
                    <span className="font-medium">{wireAnalysis.totalWires}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Length:</span>
                    <span className="font-medium">{wireAnalysis.totalLength.toFixed(0)}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Length:</span>
                    <span className="font-medium">{wireAnalysis.averageLength.toFixed(0)}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wire Gauges:</span>
                    <span className="font-medium">{wireAnalysis.uniqueGauges}</span>
                  </div>
                </div>
              </div>
            )}

            {/* BOM Analysis */}
            {bomItems.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 mb-3">
                  <span className="text-lg">📋</span>
                  <h4 className="font-medium">BOM Analysis</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Unique Parts:</span>
                    <span className="font-medium">{bomAnalysis.uniqueParts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Items:</span>
                    <span className="font-medium">{bomAnalysis.totalItems}</span>
                  </div>
                  {Object.entries(bomAnalysis.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between text-xs">
                      <span>{category}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 mb-3">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-medium">Alerts & Warnings</h4>
              </div>
              <div className="space-y-2 text-sm">
                {calculateTotalProductionTime() > parameters.shiftDuration && (
                  <div className="text-red-600">⚠️ Production time exceeds shift duration</div>
                )}
                {operations.length === 0 && (
                  <div className="text-red-600">⚠️ No operations selected</div>
                )}
                {complexityMultiplier > 1.8 && (
                  <div className="text-orange-600">⚠️ High complexity harness</div>
                )}
                {parameters.efficiencyRate < 70 && (
                  <div className="text-yellow-600">⚠️ Low efficiency rate</div>
                )}
                {operations.length === 0 && bomItems.length === 0 && wireCutItems.length === 0 ? (
                  <div className="text-gray-500">No alerts - system ready</div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};