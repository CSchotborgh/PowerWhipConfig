export interface ElectricalSpecification {
  voltage: number;
  current: number;
  frequency?: number;
  phases: 1 | 3;
  wireGauge: string;
  insulationType?: string;
}

export interface ComponentPosition {
  x: number;
  y: number;
  rotation?: number;
}

export interface WireConnection {
  from: string;
  to: string;
  wireType: string;
  length: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  type: 'voltage' | 'current' | 'thermal' | 'mechanical' | 'code';
  message: string;
  severity: 'error' | 'warning';
  component?: string;
}

export interface ValidationWarning extends ValidationError {
  recommendation?: string;
}

export interface ElectricalCalculation {
  voltageDrops: {
    line1: number;
    line2: number;
    line3?: number;
    percentage: number;
  };
  powerDissipation: number;
  efficiency: number;
  thermalRating: {
    maxTemp: number;
    currentTemp: number;
    derating: number;
  };
}

export interface ComplianceStandard {
  name: string;
  code: string;
  requirement: string;
  status: 'compliant' | 'non-compliant' | 'not-applicable';
  notes?: string;
}

export interface ExportOptions {
  includeDrawing: boolean;
  includeMaterialList: boolean;
  includeCalculations: boolean;
  includeCompliance: boolean;
  format: 'xlsx' | 'pdf' | 'dwg';
  scale?: number;
  pageSize?: 'A4' | 'Letter' | 'A3' | 'Tabloid';
}
