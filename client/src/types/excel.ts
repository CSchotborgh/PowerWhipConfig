export interface SimpleExcelAnalysis {
  fileId: string;
  fileName: string;
  processingStatus: 'completed' | 'analyzing' | 'error';
  sheets: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
    formulaCount: number;
    hasHeaders: boolean;
    primaryDataPattern: string;
  }>;
  patterns: Array<{
    id: string;
    type: string;
    frequency: number;
    confidence: number;
    standardTerm: string;
    variations: string[];
  }>;
  expressions: Array<{
    id: string;
    formula: string;
    complexity: 'simple' | 'medium' | 'complex';
    dependencies: string[];
    category: string;
  }>;
  nomenclatureMapping: Array<{
    original: string;
    standardized: string;
    confidence: number;
    category: string;
  }>;
  instructionsScope: {
    voltage: string;
    current: string;
    componentCount: number;
    requirements: string[];
  } | null;
  transformationRules: Array<{
    sourcePattern: string;
    targetFormat: string;
    ruleType: string;
  }>;
}

export interface ExcelAnalysis {
  fileId: string;
  fileName: string;
  processingStatus: 'completed' | 'analyzing' | 'error';
  sheets: Array<{
    name: string;
    rowCount: number;
    columnCount: number;
    formulaCount: number;
    hasHeaders: boolean;
    primaryDataPattern: string;
  }>;
  patterns: Array<{
    id: string;
    type: string;
    frequency: number;
    confidence: number;
    standardTerm: string;
    variations: string[];
  }>;
  expressions: Array<{
    id: string;
    formula: string;
    complexity: 'simple' | 'medium' | 'complex';
    dependencies: string[];
    category: string;
  }>;
  nomenclatureMapping: Array<{
    original: string;
    standardized: string;
    confidence: number;
    category: string;
  }>;
  instructionsScope: {
    voltage: string;
    current: string;
    componentCount: number;
    requirements: string[];
  } | null;
  transformationRules: Array<{
    sourcePattern: string;
    targetFormat: string;
    ruleType: string;
  }>;
}

export interface NomenclatureMapping {
  original: string;
  standardized: string;
  confidence: number;
  category: string;
}

export interface PatternMapping {
  id: string;
  sourcePattern: string;
  targetTerm: string;
  confidence: number;
}

export interface TransformationRule {
  sourcePattern: string;
  targetFormat: string;
  ruleType: string;
}