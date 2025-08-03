export interface Operation {
  id: string;
  name: string;
  category: string;
  setupMinutes: number;
  laborMinutes: number;
  isManual: boolean;
  complexityFactor: number;
  quantity?: number;
  bomCategory?: 'Wire' | 'Connector' | 'Terminal' | 'Protection' | 'Hardware' | 'Other' | 'All' | string;
}

export interface HarnessSpecs {
  totalWires: number;
  totalConnectors: number;
  totalBranches: number;
  totalSplices: number;
  harnessLength: number;
  complexityLevel: 'Simple' | 'Medium' | 'Complex' | 'Very Complex';
}

export interface WorkstationConfig {
  type: 'Manual' | 'Semi-Auto' | 'Automated';
  efficiencyMultiplier: number;
}

export interface BOMItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  category: 'Wire' | 'Connector' | 'Terminal' | 'Protection' | 'Hardware' | 'Other' | string;
  length?: number; // for wires
  wireGauge?: string; // for wires
}

export interface WireCutItem {
  id: string;
  wireId: string;
  fromPoint: string;
  toPoint: string;
  length: number;
  wireGauge: string;
  color: string;
  quantity: number;
}

export interface ProjectParameters {
  laborRate: number;
  shiftDuration: number;
  productionVolume: number;
  efficiencyRate: number;
  qualityInspectionTime: number;
  overtimeMultiplier: number;
  setupCostPerOperation: number;
  materialHandlingTime: number;
}

export interface HarnessTemplate {
  id: string;
  name: string;
  description: string;
  harnessType: string;
  operations: Omit<Operation, 'id'>[];
  bomCategories: string[];
  complexity: HarnessSpecs['complexityLevel'];
  estimatedWireCount: number;
  estimatedConnectorCount: number;
  createdAt: Date;
  lastUsed?: Date;
}

export interface TemplateMatchCriteria {
  wireCountRange: { min: number; max: number };
  connectorCountRange: { min: number; max: number };
  bomCategories: string[];
  complexity: HarnessSpecs['complexityLevel'];
}