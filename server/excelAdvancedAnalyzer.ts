import * as XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';

interface ExcelAnalysis {
  fileId: string;
  fileName: string;
  sheets: SheetAnalysis[];
  patterns: PatternAnalysis[];
  expressions: ExpressionAnalysis[];
  nomenclatureMapping: NomenclatureMapping[];
  instructionsScope: InstructionsScope | null;
  processingStatus: 'analyzing' | 'completed' | 'error';
  transformationRules: TransformationRule[];
}

interface SheetAnalysis {
  name: string;
  rowCount: number;
  columnCount: number;
  dataTypes: Record<string, string>;
  formulaCount: number;
  hasHeaders: boolean;
  primaryDataPattern: string;
  rawData: any[][];
}

interface PatternAnalysis {
  id: string;
  pattern: string;
  category: 'length' | 'receptacle' | 'cable' | 'voltage' | 'current' | 'other';
  frequency: number;
  variations: string[];
  standardMapping: string;
  confidence: number;
}

interface ExpressionAnalysis {
  id: string;
  formula: string;
  cell: string;
  sheet: string;
  complexity: number;
  dependencies: string[];
  purpose: string;
  category: 'calculation' | 'lookup' | 'validation' | 'transformation';
}

interface NomenclatureMapping {
  id: string;
  originalTerms: string[];
  standardTerm: string;
  category: string;
  mappingRule: string;
  confidence: number;
}

interface InstructionsScope {
  sheetName: string;
  configurationScope: string;
  requirements: string[];
  specifications: Record<string, any>;
  voltage?: number;
  current?: number;
  componentCount?: number;
}

interface TransformationRule {
  id: string;
  name: string;
  sourcePattern: string;
  targetColumn: string;
  transformFunction: string;
  priority: number;
  isActive: boolean;
}

export class ExcelAdvancedAnalyzer {
  private workbook: XLSX.WorkBook | null = null;
  private analysis: ExcelAnalysis | null = null;

  // Standard PreSal column mappings
  private readonly STANDARD_MAPPINGS = {
    // Length variations → "Length (ft)"
    length: {
      patterns: [
        /pig\s*tail/i,
        /pigtail/i,
        /pig\s*tail\s*length/i,
        /whip\s*tail/i,
        /terminating\s*device/i,
        /whip\s*length/i,
        /tail\s*length/i,
        /source\s*1\s*length/i,
        /source\s*2\s*length/i,
        /cable\s*length/i,
        /length\s*\(ft\)/i
      ],
      standardTerm: 'Length (ft)',
      category: 'length'
    },
    
    // Receptacle variations
    receptacle: {
      patterns: [
        /receptacle/i,
        /outlet/i,
        /socket/i,
        /connector/i,
        /plug/i,
        /nema/i,
        /iec/i,
        /L\d+-\d+R/i,
        /\d+-\d+R/i
      ],
      standardTerm: 'Receptacle Type',
      category: 'receptacle'
    },
    
    // Voltage variations
    voltage: {
      patterns: [
        /voltage/i,
        /volts/i,
        /V$/i,
        /\d+V/i,
        /nominal\s*voltage/i,
        /operating\s*voltage/i
      ],
      standardTerm: 'Voltage (V)',
      category: 'voltage'
    },
    
    // Current variations
    current: {
      patterns: [
        /current/i,
        /amps/i,
        /amperage/i,
        /A$/i,
        /\d+A/i,
        /rated\s*current/i,
        /max\s*current/i
      ],
      standardTerm: 'Current (A)',
      category: 'current'
    },
    
    // Wire gauge variations
    wireGauge: {
      patterns: [
        /wire\s*gauge/i,
        /awg/i,
        /gauge/i,
        /wire\s*size/i,
        /conductor\s*size/i,
        /\d+\s*awg/i
      ],
      standardTerm: 'Wire Gauge (AWG)',
      category: 'wire'
    }
  };

  async analyzeFile(filePath: string, fileName: string): Promise<ExcelAnalysis> {
    try {
      // Validate file path
      if (!filePath || typeof filePath !== 'string') {
        throw new Error('Invalid file path provided');
      }
      
      // Read the Excel file
      const fileBuffer = await fs.readFile(filePath);
      this.workbook = XLSX.read(fileBuffer, { type: 'buffer', cellFormula: true, cellNF: true });

      const fileId = this.generateFileId();
      
      this.analysis = {
        fileId,
        fileName,
        sheets: [],
        patterns: [],
        expressions: [],
        nomenclatureMapping: [],
        instructionsScope: null,
        processingStatus: 'analyzing',
        transformationRules: []
      };

      // Analyze each sheet
      for (const sheetName of this.workbook.SheetNames) {
        const sheet = this.workbook.Sheets[sheetName];
        const sheetAnalysis = await this.analyzeSheet(sheet, sheetName);
        this.analysis.sheets.push(sheetAnalysis);
      }

      // Extract patterns and expressions
      await this.extractPatterns();
      await this.extractExpressions();
      await this.generateNomenclatureMapping();
      await this.analyzeInstructions();
      await this.generateTransformationRules();

      this.analysis.processingStatus = 'completed';
      return this.analysis;

    } catch (error) {
      console.error('Excel analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Excel analysis failed: ${errorMessage}`);
    }
  }

  private async analyzeSheet(sheet: XLSX.WorkSheet, sheetName: string): Promise<SheetAnalysis> {
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    const rowCount = range.e.r + 1;
    const columnCount = range.e.c + 1;

    // Convert sheet to array of arrays
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
    
    // Analyze data types and patterns
    const dataTypes: Record<string, string> = {};
    let formulaCount = 0;
    let hasHeaders = false;

    // Check for headers (first row contains mostly strings)
    if (rawData.length > 0) {
      const firstRow = rawData[0];
      const stringCount = firstRow.filter(cell => typeof cell === 'string' && cell.trim().length > 0).length;
      hasHeaders = stringCount > columnCount * 0.7;
    }

    // Analyze formulas
    for (const cellAddress in sheet) {
      if (cellAddress.startsWith('!')) continue;
      const cell = sheet[cellAddress];
      if (cell.f) {
        formulaCount++;
      }
    }

    // Determine primary data pattern
    const primaryDataPattern = this.determinePrimaryDataPattern(rawData, sheetName);

    return {
      name: sheetName,
      rowCount,
      columnCount,
      dataTypes,
      formulaCount,
      hasHeaders,
      primaryDataPattern,
      rawData
    };
  }

  private determinePrimaryDataPattern(data: any[][], sheetName: string): string {
    if (sheetName.toLowerCase().includes('instruction')) return 'instructions';
    if (sheetName.toLowerCase().includes('lookup')) return 'lookup_table';
    if (sheetName.toLowerCase().includes('bubble')) return 'bubble_format';
    if (sheetName.toLowerCase().includes('config')) return 'configuration';
    
    // Analyze content patterns
    const flatData = data.flat().filter(cell => 
      typeof cell === 'string' && cell.trim().length > 0
    );
    
    const receptaclePattern = flatData.filter(cell => 
      /receptacle|outlet|connector|plug|nema|iec|L\d+-\d+R|\d+-\d+R/i.test(cell)
    ).length;
    
    const lengthPattern = flatData.filter(cell =>
      /length|tail|pigtail|whip/i.test(cell)
    ).length;

    if (receptaclePattern > lengthPattern) return 'receptacle_data';
    if (lengthPattern > 0) return 'length_data';
    
    return 'general_data';
  }

  private async extractPatterns(): Promise<void> {
    if (!this.analysis || !this.workbook) return;

    const patterns: PatternAnalysis[] = [];
    const patternCounts = new Map<string, number>();

    // Scan all cells for patterns
    for (const sheet of this.analysis.sheets) {
      for (const row of sheet.rawData) {
        for (const cell of row) {
          if (typeof cell === 'string' && cell.trim().length > 0) {
            this.analyzePatternInCell(cell, patternCounts);
          }
        }
      }
    }

    // Convert pattern counts to analysis objects
    for (const [pattern, frequency] of Array.from(patternCounts.entries())) {
      if (frequency >= 2) { // Only include patterns that appear multiple times
        const category = this.categorizePattern(pattern);
        const variations = this.findPatternVariations(pattern);
        const standardMapping = this.getStandardMapping(pattern, category);
        const confidence = this.calculatePatternConfidence(pattern, frequency, variations.length);

        patterns.push({
          id: this.generateId(),
          pattern,
          category,
          frequency,
          variations,
          standardMapping,
          confidence
        });
      }
    }

    this.analysis.patterns = patterns;
  }

  private analyzePatternInCell(cell: string, patternCounts: Map<string, number>): void {
    // Check against all standard mapping patterns
    for (const [key, mapping] of Object.entries(this.STANDARD_MAPPINGS)) {
      for (const pattern of mapping.patterns) {
        if (pattern.test(cell)) {
          const normalizedPattern = cell.toLowerCase().trim();
          const count = patternCounts.get(normalizedPattern) || 0;
          patternCounts.set(normalizedPattern, count + 1);
        }
      }
    }

    // Additional pattern detection for electrical components
    const electricalPatterns = [
      /\d+A/i,           // Amperage
      /\d+V/i,           // Voltage
      /\d+\s*AWG/i,      // Wire gauge
      /L\d+-\d+[RP]/i,   // Twist-lock patterns
      /\d+-\d+[RP]/i,    // NEMA patterns
      /CS\d+[A-Z]+/i,    // IEC patterns
      /MMC|LFMC|FMC|SO|MC|EMT/i // Conduit types
    ];

    for (const pattern of electricalPatterns) {
      if (pattern.test(cell)) {
        const normalizedPattern = cell.toLowerCase().trim();
        const count = patternCounts.get(normalizedPattern) || 0;
        patternCounts.set(normalizedPattern, count + 1);
      }
    }
  }

  private categorizePattern(pattern: string): PatternAnalysis['category'] {
    const lowerPattern = pattern.toLowerCase();
    
    if (this.STANDARD_MAPPINGS.length.patterns.some(p => p.test(pattern))) return 'length';
    if (this.STANDARD_MAPPINGS.receptacle.patterns.some(p => p.test(pattern))) return 'receptacle';
    if (this.STANDARD_MAPPINGS.voltage.patterns.some(p => p.test(pattern))) return 'voltage';
    if (this.STANDARD_MAPPINGS.current.patterns.some(p => p.test(pattern))) return 'current';
    if (/mmc|lfmc|fmc|so|mc|emt|conduit|cable/i.test(lowerPattern)) return 'cable';
    
    return 'other';
  }

  private findPatternVariations(pattern: string): string[] {
    if (!this.analysis) return [];
    
    const variations = new Set<string>();
    const category = this.categorizePattern(pattern);
    
    // Find similar patterns in the same category
    for (const sheet of this.analysis.sheets) {
      for (const row of sheet.rawData) {
        for (const cell of row) {
          if (typeof cell === 'string' && this.categorizePattern(cell) === category) {
            if (this.isSimilarPattern(pattern, cell)) {
              variations.add(cell.trim());
            }
          }
        }
      }
    }
    
    return Array.from(variations);
  }

  private isSimilarPattern(pattern1: string, pattern2: string): boolean {
    const p1 = pattern1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const p2 = pattern2.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Simple similarity check - could be enhanced with edit distance
    return p1.includes(p2) || p2.includes(p1) || 
           this.calculateSimilarity(p1, p2) > 0.7;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private getStandardMapping(pattern: string, category: PatternAnalysis['category']): string {
    switch (category) {
      case 'length': return this.STANDARD_MAPPINGS.length.standardTerm;
      case 'receptacle': return this.STANDARD_MAPPINGS.receptacle.standardTerm;
      case 'voltage': return this.STANDARD_MAPPINGS.voltage.standardTerm;
      case 'current': return this.STANDARD_MAPPINGS.current.standardTerm;
      case 'cable': return 'Cable/Conduit Type';
      default: return 'Other';
    }
  }

  private calculatePatternConfidence(pattern: string, frequency: number, variationCount: number): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on frequency
    confidence += Math.min(frequency * 0.1, 0.3);
    
    // Increase confidence for known electrical patterns
    if (/\d+[VA]|\d+\s*AWG|L\d+-\d+|NEMA|IEC/i.test(pattern)) {
      confidence += 0.2;
    }
    
    // Decrease confidence for too many variations
    if (variationCount > 5) {
      confidence -= 0.1;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private async extractExpressions(): Promise<void> {
    if (!this.analysis || !this.workbook) return;

    const expressions: ExpressionAnalysis[] = [];

    // Scan all sheets for formulas
    for (const sheetName of this.workbook.SheetNames) {
      const sheet = this.workbook.Sheets[sheetName];
      
      for (const cellAddress in sheet) {
        if (cellAddress.startsWith('!')) continue;
        
        const cell = sheet[cellAddress];
        if (cell.f) { // Formula exists
          const formula = cell.f;
          const complexity = this.calculateFormulaComplexity(formula);
          const dependencies = this.extractFormulaDependencies(formula);
          const purpose = this.determineFormulaPurpose(formula);
          const category = this.categorizeFormula(formula, purpose);

          expressions.push({
            id: this.generateId(),
            formula,
            cell: cellAddress,
            sheet: sheetName,
            complexity,
            dependencies,
            purpose,
            category
          });
        }
      }
    }

    this.analysis.expressions = expressions;
  }

  private calculateFormulaComplexity(formula: string): number {
    let complexity = 1;
    
    // Count functions
    const functionCount = (formula.match(/[A-Z]+\(/g) || []).length;
    complexity += functionCount;
    
    // Count references
    const referenceCount = (formula.match(/[A-Z]+\d+/g) || []).length;
    complexity += referenceCount * 0.5;
    
    // Count operators
    const operatorCount = (formula.match(/[+\-*/]/g) || []).length;
    complexity += operatorCount * 0.2;
    
    // Special functions increase complexity
    if (/VLOOKUP|HLOOKUP|INDEX|MATCH|IF|SUMIF|COUNTIF/i.test(formula)) {
      complexity += 2;
    }
    
    return Math.round(complexity);
  }

  private extractFormulaDependencies(formula: string): string[] {
    const dependencies: string[] = [];
    
    // Extract cell references
    const cellReferences = formula.match(/[A-Z]+\d+/g) || [];
    dependencies.push(...cellReferences);
    
    // Extract range references
    const rangeReferences = formula.match(/[A-Z]+\d+:[A-Z]+\d+/g) || [];
    dependencies.push(...rangeReferences);
    
    // Extract sheet references
    const sheetReferences = formula.match(/[^!]+![A-Z]+\d+/g) || [];
    dependencies.push(...sheetReferences);
    
    return Array.from(new Set(dependencies)); // Remove duplicates
  }

  private determineFormulaPurpose(formula: string): string {
    const upperFormula = formula.toUpperCase();
    
    if (upperFormula.includes('VLOOKUP') || upperFormula.includes('HLOOKUP')) {
      return 'Data lookup and retrieval';
    }
    if (upperFormula.includes('SUM') || upperFormula.includes('COUNT')) {
      return 'Aggregation and calculation';
    }
    if (upperFormula.includes('IF') || upperFormula.includes('AND') || upperFormula.includes('OR')) {
      return 'Conditional logic and validation';
    }
    if (upperFormula.includes('CONCATENATE') || upperFormula.includes('&')) {
      return 'Text manipulation and formatting';
    }
    if (upperFormula.includes('ROUND') || upperFormula.includes('ABS')) {
      return 'Numerical processing';
    }
    
    return 'General calculation';
  }

  private categorizeFormula(formula: string, purpose: string): ExpressionAnalysis['category'] {
    if (purpose.includes('lookup')) return 'lookup';
    if (purpose.includes('validation') || purpose.includes('logic')) return 'validation';
    if (purpose.includes('calculation') || purpose.includes('processing')) return 'calculation';
    if (purpose.includes('manipulation') || purpose.includes('formatting')) return 'transformation';
    
    return 'calculation';
  }

  private async generateNomenclatureMapping(): Promise<void> {
    if (!this.analysis) return;

    const mappings: NomenclatureMapping[] = [];

    // Group patterns by category
    const patternsByCategory = this.analysis.patterns.reduce((acc, pattern) => {
      if (!acc[pattern.category]) acc[pattern.category] = [];
      acc[pattern.category].push(pattern);
      return acc;
    }, {} as Record<string, PatternAnalysis[]>);

    // Generate mappings for each category
    for (const [category, patterns] of Object.entries(patternsByCategory)) {
      const originalTerms = patterns.map(p => p.pattern);
      const standardTerm = patterns[0]?.standardMapping || 'Unknown';
      const mappingRule = this.generateMappingRule(category, originalTerms);
      const confidence = this.calculateMappingConfidence(patterns);

      mappings.push({
        id: this.generateId(),
        originalTerms,
        standardTerm,
        category,
        mappingRule,
        confidence
      });
    }

    this.analysis.nomenclatureMapping = mappings;
  }

  private generateMappingRule(category: string, terms: string[]): string {
    switch (category) {
      case 'length':
        return 'REGEX: /(pig.?tail|whip.?tail|.*length.*)/i → "Length (ft)"';
      case 'receptacle':
        return 'REGEX: /(receptacle|outlet|connector|plug|.*R$)/i → "Receptacle Type"';
      case 'voltage':
        return 'REGEX: /(voltage|volts|\\d+V)/i → "Voltage (V)"';
      case 'current':
        return 'REGEX: /(current|amps|\\d+A)/i → "Current (A)"';
      default:
        return `CONTAINS: [${terms.join(', ')}] → Standard format`;
    }
  }

  private calculateMappingConfidence(patterns: PatternAnalysis[]): number {
    if (patterns.length === 0) return 0;
    
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    const frequencyBonus = Math.min(patterns.length * 0.1, 0.2);
    
    return Math.min(avgConfidence + frequencyBonus, 1);
  }

  private async analyzeInstructions(): Promise<void> {
    if (!this.analysis) return;

    // Look for instruction sheets
    const instructionSheets = this.analysis.sheets.filter(sheet =>
      /instruction|scope|config|requirement/i.test(sheet.name)
    );

    if (instructionSheets.length === 0) {
      this.analysis.instructionsScope = null;
      return;
    }

    const instructionSheet = instructionSheets[0];
    const scope = this.extractConfigurationScope(instructionSheet);
    
    this.analysis.instructionsScope = scope;
  }

  private extractConfigurationScope(sheet: SheetAnalysis): InstructionsScope {
    const data = sheet.rawData;
    const scope: InstructionsScope = {
      sheetName: sheet.name,
      configurationScope: '',
      requirements: [],
      specifications: {}
    };

    // Extract text data and analyze
    const textCells = data.flat().filter(cell => 
      typeof cell === 'string' && cell.trim().length > 3
    );

    // Look for voltage mentions
    const voltageMatch = textCells.find(cell => /\d+\s*V|voltage.*\d+/i.test(cell));
    if (voltageMatch) {
      const voltage = parseInt(voltageMatch.match(/\d+/)?.[0] || '0');
      if (voltage > 0) scope.voltage = voltage;
    }

    // Look for current mentions
    const currentMatch = textCells.find(cell => /\d+\s*A|current.*\d+|amp.*\d+/i.test(cell));
    if (currentMatch) {
      const current = parseInt(currentMatch.match(/\d+/)?.[0] || '0');
      if (current > 0) scope.current = current;
    }

    // Look for component count
    const countMatch = textCells.find(cell => /\d+.*component|component.*\d+|\d+.*whip|whip.*\d+/i.test(cell));
    if (countMatch) {
      const count = parseInt(countMatch.match(/\d+/)?.[0] || '0');
      if (count > 0) scope.componentCount = count;
    }

    // Extract requirements
    scope.requirements = textCells.filter(cell =>
      /require|must|shall|need|should/i.test(cell) && cell.length < 100
    ).slice(0, 10);

    // Generate configuration scope summary
    scope.configurationScope = this.generateScopeDescription(scope);

    return scope;
  }

  private generateScopeDescription(scope: InstructionsScope): string {
    const parts: string[] = [];

    if (scope.voltage) parts.push(`${scope.voltage}V system`);
    if (scope.current) parts.push(`${scope.current}A capacity`);
    if (scope.componentCount) parts.push(`${scope.componentCount} components`);

    if (parts.length === 0) {
      return 'General electrical configuration with specific requirements';
    }

    return `Electrical configuration for ${parts.join(', ')}`;
  }

  private async generateTransformationRules(): Promise<void> {
    if (!this.analysis) return;

    const rules: TransformationRule[] = [];

    // Generate rules based on nomenclature mappings
    for (const mapping of this.analysis.nomenclatureMapping) {
      const rule: TransformationRule = {
        id: this.generateId(),
        name: `Transform ${mapping.category} to ${mapping.standardTerm}`,
        sourcePattern: mapping.originalTerms.join('|'),
        targetColumn: mapping.standardTerm,
        transformFunction: this.generateTransformFunction(mapping),
        priority: this.calculateRulePriority(mapping),
        isActive: mapping.confidence > 0.7
      };

      rules.push(rule);
    }

    // Add standard PreSal transformation rules
    rules.push(
      {
        id: this.generateId(),
        name: 'Standardize Length Columns',
        sourcePattern: 'pig.*tail|whip.*tail|.*length.*',
        targetColumn: 'Length (ft)',
        transformFunction: 'STANDARDIZE_LENGTH',
        priority: 10,
        isActive: true
      },
      {
        id: this.generateId(),
        name: 'Normalize Receptacle Types',
        sourcePattern: 'receptacle|outlet|connector',
        targetColumn: 'Receptacle Type',
        transformFunction: 'NORMALIZE_RECEPTACLE',
        priority: 9,
        isActive: true
      },
      {
        id: this.generateId(),
        name: 'Convert Voltage Format',
        sourcePattern: 'voltage|volts|.*V$',
        targetColumn: 'Voltage (V)',
        transformFunction: 'EXTRACT_VOLTAGE',
        priority: 8,
        isActive: true
      }
    );

    this.analysis.transformationRules = rules.sort((a, b) => b.priority - a.priority);
  }

  private generateTransformFunction(mapping: NomenclatureMapping): string {
    switch (mapping.category) {
      case 'length':
        return 'EXTRACT_NUMBER_UNIT';
      case 'voltage':
        return 'EXTRACT_VOLTAGE_VALUE';
      case 'current':
        return 'EXTRACT_CURRENT_VALUE';
      case 'receptacle':
        return 'NORMALIZE_RECEPTACLE_TYPE';
      default:
        return 'DIRECT_MAPPING';
    }
  }

  private calculateRulePriority(mapping: NomenclatureMapping): number {
    const basePriority = mapping.confidence * 10;
    const categoryBonus = {
      'length': 3,
      'receptacle': 2,
      'voltage': 2,
      'current': 2,
      'other': 1
    };

    return Math.round(basePriority + (categoryBonus[mapping.category as keyof typeof categoryBonus] || 0));
  }

  async applyTransformationRules(mappings: NomenclatureMapping[]): Promise<void> {
    // Implementation for applying transformation rules
    // This would modify the internal data structure based on the rules
    console.log('Applying transformation rules:', mappings);
  }

  async generatePreSalOutput(): Promise<string> {
    if (!this.analysis || !this.workbook) {
      throw new Error('No analysis data available');
    }

    // Create new workbook for PreSal output
    const outputWorkbook = XLSX.utils.book_new();

    // Generate Order Entry sheet
    const orderEntryData = this.generateOrderEntrySheet();
    const orderEntryWS = XLSX.utils.aoa_to_sheet(orderEntryData);
    XLSX.utils.book_append_sheet(outputWorkbook, orderEntryWS, 'Order Entry');

    // Generate Components sheet
    const componentsData = this.generateComponentsSheet();
    const componentsWS = XLSX.utils.aoa_to_sheet(componentsData);
    XLSX.utils.book_append_sheet(outputWorkbook, componentsWS, 'Components');

    // Generate Specifications sheet
    const specificationsData = this.generateSpecificationsSheet();
    const specificationsWS = XLSX.utils.aoa_to_sheet(specificationsData);
    XLSX.utils.book_append_sheet(outputWorkbook, specificationsWS, 'Specifications');

    // Generate Compliance sheet
    const complianceData = this.generateComplianceSheet();
    const complianceWS = XLSX.utils.aoa_to_sheet(complianceData);
    XLSX.utils.book_append_sheet(outputWorkbook, complianceWS, 'Compliance');

    // Generate Summary sheet
    const summaryData = this.generateSummarySheet();
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(outputWorkbook, summaryWS, 'Summary');

    // Write file
    const outputPath = path.join(process.cwd(), 'tmp', `PreSalOutput_${Date.now()}.xlsx`);
    XLSX.writeFile(outputWorkbook, outputPath);

    return outputPath;
  }

  private generateOrderEntrySheet(): any[][] {
    // Standard PreSal Order Entry format with 50+ columns
    const headers = [
      'Item', 'Quantity', 'Part Number', 'Description', 'Manufacturer',
      'Receptacle Type', 'Length (ft)', 'Voltage (V)', 'Current (A)', 'Wire Gauge (AWG)',
      'Cable Type', 'Conduit Type', 'Protection Rating', 'Certification', 'Unit Price',
      'Extended Price', 'Lead Time', 'Availability', 'Weight', 'Dimensions',
      // ... additional standard columns
    ];

    const data = [headers];

    // Transform original data using transformation rules
    let itemNumber = 1;
    for (const sheet of this.analysis!.sheets) {
      if (sheet.primaryDataPattern === 'general_data') continue;

      for (const row of sheet.rawData.slice(sheet.hasHeaders ? 1 : 0)) {
        if (row.some(cell => cell && cell.toString().trim())) {
          const transformedRow = this.transformRowToPreSalFormat(row, itemNumber++);
          data.push(transformedRow);
        }
      }
    }

    return data;
  }

  private transformRowToPreSalFormat(row: any[], itemNumber: number): any[] {
    const preSalRow = new Array(50).fill(''); // Standard 50-column format

    preSalRow[0] = itemNumber;
    preSalRow[1] = 1; // Default quantity

    // Apply transformation rules to map data
    for (let i = 0; i < row.length && i < 10; i++) {
      const cellValue = row[i];
      if (!cellValue) continue;

      const cellStr = cellValue.toString();
      
      // Apply pattern matching and transformation
      for (const rule of this.analysis!.transformationRules) {
        if (rule.isActive && new RegExp(rule.sourcePattern, 'i').test(cellStr)) {
          const transformedValue = this.applyTransformFunction(cellStr, rule.transformFunction);
          const targetIndex = this.getColumnIndex(rule.targetColumn);
          if (targetIndex >= 0) {
            preSalRow[targetIndex] = transformedValue;
          }
        }
      }
    }

    return preSalRow;
  }

  private applyTransformFunction(value: string, transformFunction: string): any {
    switch (transformFunction) {
      case 'EXTRACT_NUMBER_UNIT':
        const numberMatch = value.match(/(\d+(?:\.\d+)?)/);
        return numberMatch ? parseFloat(numberMatch[1]) : value;
      
      case 'EXTRACT_VOLTAGE_VALUE':
        const voltageMatch = value.match(/(\d+)\s*V?/i);
        return voltageMatch ? parseInt(voltageMatch[1]) : value;
      
      case 'EXTRACT_CURRENT_VALUE':
        const currentMatch = value.match(/(\d+)\s*A?/i);
        return currentMatch ? parseInt(currentMatch[1]) : value;
      
      case 'NORMALIZE_RECEPTACLE_TYPE':
        return value.replace(/receptacle|outlet/gi, '').trim() || value;
      
      default:
        return value;
    }
  }

  private getColumnIndex(columnName: string): number {
    const columnMap: Record<string, number> = {
      'Receptacle Type': 5,
      'Length (ft)': 6,
      'Voltage (V)': 7,
      'Current (A)': 8,
      'Wire Gauge (AWG)': 9,
      'Cable Type': 10,
      'Conduit Type': 11,
      'Protection Rating': 12,
      'Unit Price': 14
    };

    return columnMap[columnName] ?? -1;
  }

  private generateComponentsSheet(): any[][] {
    return [
      ['Component ID', 'Type', 'Category', 'Specifications', 'Standards'],
      // Component data based on analysis
    ];
  }

  private generateSpecificationsSheet(): any[][] {
    return [
      ['Specification', 'Value', 'Unit', 'Tolerance', 'Standard'],
      // Specifications based on analysis
    ];
  }

  private generateComplianceSheet(): any[][] {
    return [
      ['Requirement', 'Status', 'Verification Method', 'Notes'],
      // Compliance data based on instructions analysis
    ];
  }

  private generateSummarySheet(): any[][] {
    return [
      ['Analysis Summary'],
      ['File Name', this.analysis!.fileName],
      ['Sheets Processed', this.analysis!.sheets.length.toString()],
      ['Patterns Found', this.analysis!.patterns.length.toString()],
      ['Expressions Analyzed', this.analysis!.expressions.length.toString()],
      ['Transformation Rules', this.analysis!.transformationRules.length.toString()],
      // Additional summary information
    ];
  }

  private generateFileId(): string {
    return `excel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}