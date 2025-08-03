import React, { useState } from 'react';
import { Cable, GitBranch, Zap, Ruler, ChevronDown, ChevronUp } from 'lucide-react';
import { HarnessSpecs } from '../types';

interface HarnessSpecsFormProps {
  specs: HarnessSpecs;
  onSpecsChange: (specs: HarnessSpecs) => void;
}

export const HarnessSpecsForm: React.FC<HarnessSpecsFormProps> = ({ specs, onSpecsChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const updateSpec = (field: keyof HarnessSpecs, value: string | number) => {
    onSpecsChange({
      ...specs,
      [field]: value
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-purple-600 hover:text-purple-800 transition-colors"
        >
          <Cable className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Harness Specifications</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        {isCollapsed && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
              {specs.complexityLevel}
            </span>
            <span>{specs.totalWires} wires</span>
            <span>{specs.totalConnectors} connectors</span>
            <span>{specs.harnessLength}mm</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Cable className="w-4 h-4 inline mr-1" />
              Total Wires
            </label>
            <input
              type="number"
              value={specs.totalWires}
              onChange={(e) => updateSpec('totalWires', Number(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Zap className="w-4 h-4 inline mr-1" />
              Total Connectors
            </label>
            <input
              type="number"
              value={specs.totalConnectors}
              onChange={(e) => updateSpec('totalConnectors', Number(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <GitBranch className="w-4 h-4 inline mr-1" />
              Total Branches
            </label>
            <input
              type="number"
              value={specs.totalBranches}
              onChange={(e) => updateSpec('totalBranches', Number(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Total Splices</label>
            <input
              type="number"
              value={specs.totalSplices}
              onChange={(e) => updateSpec('totalSplices', Number(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Ruler className="w-4 h-4 inline mr-1" />
              Harness Length (mm)
            </label>
            <input
              type="number"
              value={specs.harnessLength}
              onChange={(e) => updateSpec('harnessLength', Number(e.target.value))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Complexity Level</label>
            <select
              value={specs.complexityLevel}
              onChange={(e) => updateSpec('complexityLevel', e.target.value as HarnessSpecs['complexityLevel'])}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="Simple">Simple</option>
              <option value="Medium">Medium</option>
              <option value="Complex">Complex</option>
              <option value="Very Complex">Very Complex</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};