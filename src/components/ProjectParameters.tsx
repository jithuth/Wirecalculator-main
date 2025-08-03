import React, { useState } from 'react';
import { Settings, DollarSign, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import { ProjectParameters } from '../types';

interface ProjectParametersProps {
  parameters: ProjectParameters;
  onParametersChange: (parameters: ProjectParameters) => void;
}

export const ProjectParametersComponent: React.FC<ProjectParametersProps> = ({ 
  parameters, 
  onParametersChange 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateParameter = (field: keyof ProjectParameters, value: number) => {
    onParametersChange({
      ...parameters,
      [field]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Settings className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Project Parameters</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        {isCollapsed && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>${parameters.laborRate}/hr</span>
            <span>{parameters.productionVolume} units</span>
            <span>{parameters.efficiencyRate}% efficiency</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <DollarSign className="w-4 h-4" />
              Labor Rate ($/hr)
            </label>
            <input
              type="number"
              value={parameters.laborRate}
              onChange={(e) => updateParameter('laborRate', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4" />
              Shift Duration (min)
            </label>
            <input
              type="number"
              value={parameters.shiftDuration}
              onChange={(e) => updateParameter('shiftDuration', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <TrendingUp className="w-4 h-4" />
              Production Volume
            </label>
            <input
              type="number"
              value={parameters.productionVolume}
              onChange={(e) => updateParameter('productionVolume', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Efficiency Rate (%)</label>
            <input
              type="number"
              value={parameters.efficiencyRate}
              onChange={(e) => updateParameter('efficiencyRate', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Quality Inspection (min)</label>
            <input
              type="number"
              value={parameters.qualityInspectionTime}
              onChange={(e) => updateParameter('qualityInspectionTime', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Overtime Multiplier</label>
            <input
              type="number"
              value={parameters.overtimeMultiplier}
              onChange={(e) => updateParameter('overtimeMultiplier', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              step="0.1"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Setup Cost per Operation ($)</label>
            <input
              type="number"
              value={parameters.setupCostPerOperation}
              onChange={(e) => updateParameter('setupCostPerOperation', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Material Handling (min)</label>
            <input
              type="number"
              value={parameters.materialHandlingTime}
              onChange={(e) => updateParameter('materialHandlingTime', Number(e.target.value))}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
              step="0.1"
            />
          </div>
        </div>
      )}
    </div>
  );
};