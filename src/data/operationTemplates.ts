import { Operation } from '../types';

export const operationTemplates: Omit<Operation, 'id'>[] = [
  // Pre-Production and Preparation
  {
    name: 'Wire Cutting',
    category: 'Pre-Production',
    setupMinutes: 15,
    laborMinutes: 2,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Wire'
  },
  {
    name: 'Wire Stripping',
    category: 'Pre-Production',
    setupMinutes: 10,
    laborMinutes: 1.5,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Wire'
  },
  {
    name: 'Wire Marking/Labeling',
    category: 'Pre-Production',
    setupMinutes: 20,
    laborMinutes: 1,
    isManual: false,
    complexityFactor: 0.8,
    bomCategory: 'Wire'
  },
  {
    name: 'Manual Wire Labeling',
    category: 'Pre-Production',
    setupMinutes: 5,
    laborMinutes: 3,
    isManual: true,
    complexityFactor: 1.2,
    bomCategory: 'Wire'
  },
  {
    name: 'Terminal Crimping',
    category: 'Pre-Production',
    setupMinutes: 25,
    laborMinutes: 2.5,
    isManual: false,
    complexityFactor: 1.1,
    bomCategory: 'Terminal'
  },
  {
    name: 'Manual Crimping',
    category: 'Pre-Production',
    setupMinutes: 10,
    laborMinutes: 4,
    isManual: true,
    complexityFactor: 1.3,
    bomCategory: 'Terminal'
  },
  {
    name: 'Crimp Pull Force Testing',
    category: 'Pre-Production',
    setupMinutes: 15,
    laborMinutes: 1,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Terminal'
  },
  {
    name: 'Tin Dipping',
    category: 'Pre-Production',
    setupMinutes: 30,
    laborMinutes: 2,
    isManual: false,
    complexityFactor: 1.0,
    bomCategory: 'Wire'
  },

  // Assembly Operations
  {
    name: 'Connector Insertion',
    category: 'Assembly',
    setupMinutes: 10,
    laborMinutes: 3,
    isManual: true,
    complexityFactor: 1.2,
    bomCategory: 'Connector'
  },
  {
    name: 'Terminal Locking',
    category: 'Assembly',
    setupMinutes: 5,
    laborMinutes: 1.5,
    isManual: true,
    complexityFactor: 1.1,
    bomCategory: 'Terminal'
  },
  {
    name: 'Corrugated Tube Application',
    category: 'Assembly',
    setupMinutes: 10,
    laborMinutes: 2,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Protection'
  },
  {
    name: 'Braid Sleeve Installation',
    category: 'Assembly',
    setupMinutes: 15,
    laborMinutes: 3,
    isManual: true,
    complexityFactor: 1.2,
    bomCategory: 'Protection'
  },
  {
    name: 'Spiral Wrap Application',
    category: 'Assembly',
    setupMinutes: 8,
    laborMinutes: 1.5,
    isManual: true,
    complexityFactor: 0.9,
    bomCategory: 'Protection'
  },
  {
    name: 'Cloth Tape Wrapping',
    category: 'Assembly',
    setupMinutes: 5,
    laborMinutes: 2.5,
    isManual: true,
    complexityFactor: 1.1,
    bomCategory: 'Protection'
  },
  {
    name: 'Heat Shrink Tubing',
    category: 'Assembly',
    setupMinutes: 20,
    laborMinutes: 2,
    isManual: false,
    complexityFactor: 1.0,
    bomCategory: 'Protection'
  },
  {
    name: 'Clip/Bracket Mounting',
    category: 'Assembly',
    setupMinutes: 10,
    laborMinutes: 1.5,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Hardware'
  },
  {
    name: 'Grommet Installation',
    category: 'Assembly',
    setupMinutes: 5,
    laborMinutes: 1,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Hardware'
  },
  {
    name: 'Ultrasonic Splicing',
    category: 'Assembly',
    setupMinutes: 30,
    laborMinutes: 3,
    isManual: false,
    complexityFactor: 1.3,
    bomCategory: 'Wire'
  },
  {
    name: 'Manual Splicing',
    category: 'Assembly',
    setupMinutes: 10,
    laborMinutes: 5,
    isManual: true,
    complexityFactor: 1.5,
    bomCategory: 'Wire'
  },
  {
    name: 'Branch Routing',
    category: 'Assembly',
    setupMinutes: 15,
    laborMinutes: 4,
    isManual: true,
    complexityFactor: 1.4,
    bomCategory: 'Wire'
  },

  // Testing and Quality Control
  {
    name: 'Continuity Testing',
    category: 'Testing',
    setupMinutes: 20,
    laborMinutes: 3,
    isManual: false,
    complexityFactor: 1.0,
    bomCategory: 'All'
  },
  {
    name: 'Manual Continuity Check',
    category: 'Testing',
    setupMinutes: 5,
    laborMinutes: 5,
    isManual: true,
    complexityFactor: 1.2,
    bomCategory: 'All'
  },
  {
    name: 'High Voltage Testing',
    category: 'Testing',
    setupMinutes: 25,
    laborMinutes: 2,
    isManual: false,
    complexityFactor: 1.1,
    bomCategory: 'All'
  },
  {
    name: 'Insulation Testing',
    category: 'Testing',
    setupMinutes: 20,
    laborMinutes: 2,
    isManual: false,
    complexityFactor: 1.0,
    bomCategory: 'Wire'
  },
  {
    name: 'Visual Inspection',
    category: 'Testing',
    setupMinutes: 5,
    laborMinutes: 4,
    isManual: true,
    complexityFactor: 1.2,
    bomCategory: 'All'
  },

  // Finishing and Logistics
  {
    name: 'Harness Tying/Bundling',
    category: 'Finishing',
    setupMinutes: 5,
    laborMinutes: 2,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Hardware'
  },
  {
    name: 'Cable Tie Application',
    category: 'Finishing',
    setupMinutes: 3,
    laborMinutes: 1.5,
    isManual: true,
    complexityFactor: 0.9,
    bomCategory: 'Hardware'
  },
  {
    name: 'Barcode Tagging',
    category: 'Finishing',
    setupMinutes: 10,
    laborMinutes: 1,
    isManual: false,
    complexityFactor: 0.8,
    bomCategory: 'Other'
  },
  {
    name: 'Final Part Labeling',
    category: 'Finishing',
    setupMinutes: 5,
    laborMinutes: 1.5,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'Other'
  },
  {
    name: 'Packaging',
    category: 'Finishing',
    setupMinutes: 10,
    laborMinutes: 3,
    isManual: true,
    complexityFactor: 1.0,
    bomCategory: 'All'
  }
];