import * as XLSX from 'xlsx';

export interface ExtractedFormula {
  cellReference: string;
  formulaText: string;
  sheetName: string;
  category: string;
  complexity: string;
  dependencies: string[];
  parameters: any[];
  description: string;
}

export interface ExtractedPattern {
  patternName: string;
  patternType: string;
  cellRange: string;
  sheetName: string;
  patternData: any;
  businessLogic: string;
  inputRequirements: any[];
  outputFormat: any;
  tags: string[];
}

export interface ExcelAnalysisResult {
  fileName: string;
  sheetCount: number;
  formulaCount: number;
  patternCount: number;
  extractedFormulas: ExtractedFormula[];
  extractedPatterns: ExtractedPattern[];
  businessDomain: string;
  complexity: string;
}

export class ExcelFormulaExtractor {
  constructor() {
  }

  public extractFromBuffer(buffer: Buffer, fileName: string): ExcelAnalysisResult {
    const workbook = XLSX.read(buffer, { 
      type: 'buffer',
      cellFormula: true,
      cellHTML: false,
      cellNF: false,
      cellStyles: true,
      cellText: false,
      cellDates: true,
      raw: false
    });

    const extractedFormulas: ExtractedFormula[] = [];
    const extractedPatterns: ExtractedPattern[] = [];
    let totalFormulas = 0;

    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const sheetFormulas = this.extractFormulasFromSheet(sheet, sheetName);
      const sheetPatterns = this.extractPatternsFromSheet(sheet, sheetName);
      
      extractedFormulas.push(...sheetFormulas);
      extractedPatterns.push(...sheetPatterns);
      totalFormulas += sheetFormulas.length;
    });

    return {
      fileName,
      sheetCount: workbook.SheetNames.length,
      formulaCount: totalFormulas,
      patternCount: extractedPatterns.length,
      extractedFormulas,
      extractedPatterns,
      businessDomain: this.detectBusinessDomain(extractedFormulas, extractedPatterns),
      complexity: this.assessComplexity(extractedFormulas, extractedPatterns)
    };
  }

  private extractFormulasFromSheet(sheet: XLSX.WorkSheet, sheetName: string): ExtractedFormula[] {
    const formulas: ExtractedFormula[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');

    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];

        if (cell && cell.f) { // Cell has a formula
          const formula = this.analyzeFormula(cell.f, cellAddress, sheetName);
          if (formula) {
            formulas.push(formula);
          }
        }
      }
    }

    return formulas;
  }

  private analyzeFormula(formulaText: string, cellReference: string, sheetName: string): ExtractedFormula | null {
    try {
      // Parse the formula to extract dependencies and structure
      const dependencies = this.extractDependencies(formulaText);
      const category = this.categorizeFormula(formulaText);
      const complexity = this.assessFormulaComplexity(formulaText);
      const parameters = this.extractParameters(formulaText);
      const description = this.generateDescription(formulaText, category);

      return {
        cellReference,
        formulaText,
        sheetName,
        category,
        complexity,
        dependencies,
        parameters,
        description
      };
    } catch (error) {
      console.warn(`Failed to analyze formula in ${cellReference}: ${error}`);
      return null;
    }
  }

  private extractDependencies(formulaText: string): string[] {
    const dependencies: string[] = [];
    
    // Extract cell references (e.g., A1, B2:C5, Sheet1!A1)
    const cellRefPattern = /([A-Z]+[0-9]+(?::[A-Z]+[0-9]+)?)|([A-Za-z0-9_]+![A-Z]+[0-9]+(?::[A-Z]+[0-9]+)?)/g;
    const matches = formulaText.match(cellRefPattern);
    
    if (matches) {
      dependencies.push(...matches.filter(ref => ref !== formulaText));
    }

    return Array.from(new Set(dependencies)); // Remove duplicates
  }

  private categorizeFormula(formulaText: string): string {
    const formula = formulaText.toUpperCase();
    
    if (formula.includes('SUM') || formula.includes('COUNT') || formula.includes('AVERAGE') || 
        formula.includes('MIN') || formula.includes('MAX')) {
      return 'CALCULATION';
    }
    
    if (formula.includes('VLOOKUP') || formula.includes('HLOOKUP') || formula.includes('INDEX') || 
        formula.includes('MATCH') || formula.includes('LOOKUP')) {
      return 'LOOKUP';
    }
    
    if (formula.includes('IF') || formula.includes('AND') || formula.includes('OR') || 
        formula.includes('NOT') || formula.includes('SWITCH')) {
      return 'CONDITIONAL';
    }
    
    if (formula.includes('CONCATENATE') || formula.includes('LEFT') || formula.includes('RIGHT') || 
        formula.includes('MID') || formula.includes('TRIM') || formula.includes('UPPER') || formula.includes('LOWER')) {
      return 'TEXT_MANIPULATION';
    }
    
    if (formula.includes('DATE') || formula.includes('TIME') || formula.includes('NOW') || 
        formula.includes('TODAY') || formula.includes('YEAR') || formula.includes('MONTH')) {
      return 'DATE_TIME';
    }
    
    if (formula.includes('PMT') || formula.includes('FV') || formula.includes('PV') || 
        formula.includes('RATE') || formula.includes('NPV') || formula.includes('IRR')) {
      return 'FINANCIAL';
    }

    return 'OTHER';
  }

  private assessFormulaComplexity(formulaText: string): string {
    const nestingLevel = (formulaText.match(/\(/g) || []).length;
    const functionCount = (formulaText.match(/[A-Z]+\(/g) || []).length;
    const referenceCount = (formulaText.match(/[A-Z]+[0-9]+/g) || []).length;
    
    if (nestingLevel >= 3 || functionCount >= 4 || referenceCount >= 10) {
      return 'ADVANCED';
    } else if (nestingLevel >= 2 || functionCount >= 2 || referenceCount >= 5) {
      return 'INTERMEDIATE';
    } else {
      return 'SIMPLE';
    }
  }

  private extractParameters(formulaText: string): any[] {
    const parameters: any[] = [];
    
    // Extract function parameters
    const functionPattern = /([A-Z]+)\(([^)]+)\)/g;
    let match;
    
    while ((match = functionPattern.exec(formulaText)) !== null) {
      const funcName = match[1];
      const params = match[2].split(',').map(p => p.trim());
      
      parameters.push({
        function: funcName,
        parameters: params,
        parameterCount: params.length
      });
    }
    
    return parameters;
  }

  private generateDescription(formulaText: string, category: string): string {
    const funcMatch = formulaText.match(/^=([A-Z]+)/);
    const mainFunction = funcMatch ? funcMatch[1] : 'UNKNOWN';
    
    const descriptions: { [key: string]: string } = {
      'SUM': 'Calculates the sum of values',
      'VLOOKUP': 'Performs vertical lookup in a table',
      'IF': 'Executes conditional logic',
      'CONCATENATE': 'Combines text strings',
      'COUNT': 'Counts non-empty cells',
      'AVERAGE': 'Calculates average of values'
    };
    
    const baseDescription = descriptions[mainFunction] || `Performs ${category.toLowerCase()} operation`;
    const paramCount = (formulaText.match(/,/g) || []).length + 1;
    
    return `${baseDescription} with ${paramCount} parameter(s)`;
  }

  private extractPatternsFromSheet(sheet: XLSX.WorkSheet, sheetName: string): ExtractedPattern[] {
    const patterns: ExtractedPattern[] = [];
    
    // Detect formula sequences (consecutive cells with similar formulas)
    const formulaSequences = this.detectFormulaSequences(sheet, sheetName);
    patterns.push(...formulaSequences);
    
    // Detect data validation patterns
    const dataValidationPatterns = this.detectDataValidationPatterns(sheet, sheetName);
    patterns.push(...dataValidationPatterns);
    
    // Detect calculation chains
    const calculationChains = this.detectCalculationChains(sheet, sheetName);
    patterns.push(...calculationChains);
    
    return patterns;
  }

  private detectFormulaSequences(sheet: XLSX.WorkSheet, sheetName: string): ExtractedPattern[] {
    const sequences: ExtractedPattern[] = [];
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const formulaCells: Array<{address: string, formula: string}> = [];
    
    // Collect all formula cells
    for (let row = range.s.r; row <= range.e.r; row++) {
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[cellAddress];
        if (cell && cell.f) {
          formulaCells.push({ address: cellAddress, formula: cell.f });
        }
      }
    }
    
    // Detect sequences of similar formulas
    if (formulaCells.length >= 3) {
      const pattern = this.identifyFormulaPattern(formulaCells);
      if (pattern) {
        sequences.push({
          patternName: `Formula Sequence - ${pattern.type}`,
          patternType: 'FORMULA_SEQUENCE',
          cellRange: pattern.range,
          sheetName,
          patternData: pattern,
          businessLogic: `Repetitive ${pattern.type} calculation across multiple cells`,
          inputRequirements: pattern.inputs,
          outputFormat: pattern.outputs,
          tags: ['formula', 'sequence', pattern.type.toLowerCase()]
        });
      }
    }
    
    return sequences;
  }

  private identifyFormulaPattern(formulaCells: Array<{address: string, formula: string}>): any | null {
    // Simple pattern detection - look for similar formula structures
    const firstFormula = formulaCells[0].formula;
    const pattern = firstFormula.replace(/[A-Z]+[0-9]+/g, '[CELL_REF]');
    
    let similarCount = 0;
    formulaCells.forEach(cell => {
      const normalized = cell.formula.replace(/[A-Z]+[0-9]+/g, '[CELL_REF]');
      if (normalized === pattern) {
        similarCount++;
      }
    });
    
    if (similarCount >= 3) {
      return {
        type: this.categorizeFormula(firstFormula),
        range: `${formulaCells[0].address}:${formulaCells[formulaCells.length - 1].address}`,
        pattern: pattern,
        instances: similarCount,
        inputs: ['Cell references', 'Input values'],
        outputs: ['Calculated results']
      };
    }
    
    return null;
  }

  private detectDataValidationPatterns(sheet: XLSX.WorkSheet, sheetName: string): ExtractedPattern[] {
    // This would require more advanced XLSX parsing to detect data validation rules
    return [];
  }

  private detectCalculationChains(sheet: XLSX.WorkSheet, sheetName: string): ExtractedPattern[] {
    // Detect chains of dependent calculations
    return [];
  }

  private detectBusinessDomain(formulas: ExtractedFormula[], patterns: ExtractedPattern[]): string {
    const domains: { [key: string]: number } = {
      'ELECTRICAL': 0,
      'FINANCIAL': 0,
      'ENGINEERING': 0,
      'MANUFACTURING': 0,
      'GENERAL': 0
    };
    
    formulas.forEach(formula => {
      if (formula.category === 'FINANCIAL') domains['FINANCIAL']++;
      else if (formula.formulaText.toLowerCase().includes('voltage') || 
               formula.formulaText.toLowerCase().includes('current') ||
               formula.formulaText.toLowerCase().includes('power')) {
        domains['ELECTRICAL']++;
      }
      else domains['GENERAL']++;
    });
    
    const maxDomain = Object.keys(domains).reduce((a, b) => domains[a] > domains[b] ? a : b);
    return maxDomain;
  }

  private assessComplexity(formulas: ExtractedFormula[], patterns: ExtractedPattern[]): string {
    const complexityScores = formulas.map(f => {
      switch (f.complexity) {
        case 'ADVANCED': return 3;
        case 'INTERMEDIATE': return 2;
        case 'SIMPLE': return 1;
        default: return 1;
      }
    });
    
    const avgComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
    
    if (avgComplexity >= 2.5) return 'ADVANCED';
    if (avgComplexity >= 1.5) return 'INTERMEDIATE';
    return 'SIMPLE';
  }
}