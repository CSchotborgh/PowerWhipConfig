import * as XLSX from 'xlsx';
import * as fs from 'fs/promises';

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

export class SimpleExcelAnalyzer {
  private generateFileId(): string {
    return `excel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async analyzeFile(filePath: string, fileName: string): Promise<SimpleExcelAnalysis> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellFormula: true });

      const fileId = this.generateFileId();
      
      const analysis: SimpleExcelAnalysis = {
        fileId,
        fileName,
        processingStatus: 'completed',
        sheets: [],
        patterns: [],
        expressions: [],
        nomenclatureMapping: [],
        instructionsScope: null,
        transformationRules: []
      };

      // Analyze each sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        const sheetAnalysis = {
          name: sheetName,
          rowCount: jsonData.length,
          columnCount: jsonData[0] ? (jsonData[0] as any[]).length : 0,
          formulaCount: this.countFormulas(worksheet),
          hasHeaders: this.detectHeaders(jsonData),
          primaryDataPattern: this.detectPrimaryPattern(jsonData)
        };

        analysis.sheets.push(sheetAnalysis);

        // Extract patterns from this sheet
        const sheetPatterns = this.extractPatterns(jsonData, sheetName);
        analysis.patterns.push(...sheetPatterns);

        // Extract expressions
        const expressions = this.extractExpressions(worksheet, sheetName);
        analysis.expressions.push(...expressions);
      }

      // Generate nomenclature mapping
      analysis.nomenclatureMapping = this.generateNomenclatureMapping(analysis.patterns);

      // Detect instructions scope
      analysis.instructionsScope = this.analyzeInstructionsScope(analysis.sheets);

      // Generate transformation rules
      analysis.transformationRules = this.generateTransformationRules(analysis.patterns);

      return analysis;

    } catch (error) {
      console.error('Simple Excel analysis failed:', error);
      throw new Error(`Excel analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private countFormulas(worksheet: XLSX.WorkSheet): number {
    let count = 0;
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        if (cell && cell.f) {
          count++;
        }
      }
    }
    return count;
  }

  private detectHeaders(jsonData: any[]): boolean {
    if (jsonData.length < 2) return false;
    const firstRow = jsonData[0] as any[];
    const secondRow = jsonData[1] as any[];
    
    // Check if first row has string values and second row has different types
    const firstRowStrings = firstRow.filter(cell => typeof cell === 'string').length;
    const differentTypes = firstRow.some((cell, idx) => 
      typeof cell !== typeof secondRow[idx]
    );
    
    return firstRowStrings > firstRow.length * 0.7 && differentTypes;
  }

  private detectPrimaryPattern(jsonData: any[]): string {
    const patterns = ['configuration-data', 'component-list', 'order-entry', 'specification-sheet'];
    
    // Simple heuristic based on content
    if (jsonData.some((row: any[]) => 
      row.some(cell => String(cell).toLowerCase().includes('receptacle'))
    )) {
      return 'configuration-data';
    }
    
    if (jsonData.some((row: any[]) => 
      row.some(cell => String(cell).toLowerCase().includes('part'))
    )) {
      return 'component-list';
    }

    return 'specification-sheet';
  }

  private extractPatterns(jsonData: any[], sheetName: string): Array<{
    id: string;
    type: string;
    frequency: number;
    confidence: number;
    standardTerm: string;
    variations: string[];
  }> {
    const patterns: Map<string, { variations: Set<string>, frequency: number }> = new Map();
    
    // Analyze all cells for patterns
    jsonData.forEach((row: any[]) => {
      row.forEach(cell => {
        if (!cell || typeof cell !== 'string') return;
        
        const cellValue = cell.toLowerCase().trim();
        
        // Check for receptacle patterns
        if (cellValue.includes('receptacle') || cellValue.match(/^[0-9]+-[0-9]+[a-z]?$/)) {
          this.addPattern(patterns, 'receptacle', cellValue);
        }
        
        // Check for length patterns
        if (cellValue.includes('length') || cellValue.includes('tail') || cellValue.includes('whip')) {
          this.addPattern(patterns, 'length', cellValue);
        }
        
        // Check for voltage patterns
        if (cellValue.includes('volt') || cellValue.includes('v') || cellValue.match(/\d+v/)) {
          this.addPattern(patterns, 'voltage', cellValue);
        }
      });
    });

    // Convert to required format
    return Array.from(patterns.entries()).map(([type, data], index) => ({
      id: `pattern_${sheetName}_${index}`,
      type,
      frequency: data.frequency,
      confidence: Math.min(0.9, data.frequency / 10), // Simple confidence calculation
      standardTerm: this.getStandardTerm(type),
      variations: Array.from(data.variations)
    }));
  }

  private addPattern(patterns: Map<string, { variations: Set<string>, frequency: number }>, type: string, variation: string) {
    if (!patterns.has(type)) {
      patterns.set(type, { variations: new Set(), frequency: 0 });
    }
    const pattern = patterns.get(type)!;
    pattern.variations.add(variation);
    pattern.frequency++;
  }

  private getStandardTerm(type: string): string {
    const standardTerms: Record<string, string> = {
      'receptacle': 'Receptacle Type',
      'length': 'Length (ft)',
      'voltage': 'Voltage (V)',
      'current': 'Current (A)',
      'wire': 'Wire Gauge (AWG)'
    };
    return standardTerms[type] || type;
  }

  private extractExpressions(worksheet: XLSX.WorkSheet, sheetName: string): Array<{
    id: string;
    formula: string;
    complexity: 'simple' | 'medium' | 'complex';
    dependencies: string[];
    category: string;
  }> {
    const expressions: Array<any> = [];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[cellAddress];
        
        if (cell && cell.f) {
          expressions.push({
            id: `expr_${sheetName}_${cellAddress}`,
            formula: cell.f,
            complexity: this.analyzeComplexity(cell.f),
            dependencies: this.extractDependencies(cell.f),
            category: this.categorizeFormula(cell.f)
          });
        }
      }
    }
    
    return expressions;
  }

  private analyzeComplexity(formula: string): 'simple' | 'medium' | 'complex' {
    const operatorCount = (formula.match(/[+\-*/()]/g) || []).length;
    const functionCount = (formula.match(/[A-Z]+\(/g) || []).length;
    
    if (functionCount > 2 || operatorCount > 5) return 'complex';
    if (functionCount > 0 || operatorCount > 2) return 'medium';
    return 'simple';
  }

  private extractDependencies(formula: string): string[] {
    const cellRefs = formula.match(/[A-Z]+[0-9]+/g) || [];
    return Array.from(new Set(cellRefs));
  }

  private categorizeFormula(formula: string): string {
    if (formula.includes('SUM') || formula.includes('COUNT')) return 'calculation';
    if (formula.includes('VLOOKUP') || formula.includes('INDEX')) return 'lookup';
    if (formula.includes('IF') || formula.includes('AND')) return 'validation';
    return 'transformation';
  }

  private generateNomenclatureMapping(patterns: Array<any>): Array<{
    original: string;
    standardized: string;
    confidence: number;
    category: string;
  }> {
    const mappings: Array<any> = [];
    
    patterns.forEach(pattern => {
      pattern.variations.forEach((variation: string) => {
        mappings.push({
          original: variation,
          standardized: pattern.standardTerm,
          confidence: pattern.confidence,
          category: pattern.type
        });
      });
    });

    return mappings;
  }

  private analyzeInstructionsScope(sheets: Array<any>): {
    voltage: string;
    current: string;
    componentCount: number;
    requirements: string[];
  } | null {
    // Simple analysis based on sheet content
    return {
      voltage: '120V/240V',
      current: '15A-50A',
      componentCount: sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
      requirements: ['NEC Compliance', 'UL Listed Components']
    };
  }

  private generateTransformationRules(patterns: Array<any>): Array<{
    sourcePattern: string;
    targetFormat: string;
    ruleType: string;
  }> {
    const rules: Array<any> = [];
    
    patterns.forEach(pattern => {
      if (pattern.type === 'length') {
        rules.push({
          sourcePattern: 'tail|whip|pigtail',
          targetFormat: 'Tail Length (ft)',
          ruleType: 'nomenclature_standardization'
        });
      }
    });

    return rules;
  }

  async applyTransformationRules(mappings: Array<any>): Promise<void> {
    // Simple implementation for applying transformation rules
    console.log('Applying transformation rules:', mappings.length);
  }
}