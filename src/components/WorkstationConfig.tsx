import React, { useState } from 'react';
import { Settings, Wrench, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { WorkstationConfig } from '../types';

interface WorkstationConfigProps {
  config: WorkstationConfig;
  onConfigChange: (config: WorkstationConfig) => void;
}

export const WorkstationConfigComponent: React.FC<WorkstationConfigProps> = ({ config, onConfigChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const workstationTypes = [
    { type: 'Manual' as const, icon: Wrench, multiplier: 1.0, description: 'Hand tools and manual processes' },
    { type: 'Semi-Auto' as const, icon: Settings, multiplier: 0.7, description: 'Semi-automated equipment' },
    { type: 'Automated' as const, icon: Cpu, multiplier: 0.4, description: 'Fully automated systems' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-3 text-orange-600 hover:text-orange-800 transition-colors"
        >
          <Settings className="w-6 h-6" />
          <h3 className="text-lg font-semibold text-gray-900">Workstation Configuration</h3>
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </button>
        {isCollapsed && (
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-medium">
              {config.type}
            </span>
            <span>{Math.round(config.efficiencyMultiplier * 100)}% efficiency</span>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {workstationTypes.map(({ type, icon: Icon, multiplier, description }) => (
            <div
              key={type}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                config.type === type
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
              onClick={() => onConfigChange({ type, efficiencyMultiplier: multiplier })}
            >
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`w-6 h-6 ${config.type === type ? 'text-orange-600' : 'text-gray-500'}`} />
                <h4 className="font-medium">{type}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-2">{description}</p>
              <p className="text-xs text-gray-500">Efficiency: {Math.round(multiplier * 100)}%</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};