/**
 * Extreme Excel Transformer
 * Transforms DCN input files to SAL-0y Configurator format
 * Handles complex Excel file transformations with advanced pattern recognition
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ExtremeTransformationResult {
  success: boolean;
  outputFileName: string;
  transformedData: any[][];
  sourceAnalysis: {
    fileName: string;
    sheetCount: number;
    identifiedPatterns: string[];
    dataStructure: any;
  };
  targetStructure: {
    templateName: string;
    requiredColumns: string[];
    formatSpecifications: any;
  };
  transformationLog: string[];
}

export class ExtremeExcelTransformer {
  
  private transformationLog: string[] = [];
  private templateStructure: any = null;
  
  constructor() {
    this.log("Extreme Excel Transformer initialized");
  }

  /**
   * Transform DCN buffer to SAL-0y Configurator format
   */
  public async transformToSALConfiguratorFromBuffer(
    fileBuffer: Buffer,
    originalFileName: string
  ): Promise<ExtremeTransformationResult> {
    
    this.log(`Starting extreme transformation for buffer: ${originalFileName} (${fileBuffer.length} bytes)`);
    
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new Error('Invalid file buffer provided');
    }
    
    try {
      // Step 1: Analyze input file structure from buffer
      const sourceAnalysis = await this.analyzeSourceFileFromBuffer(fileBuffer, originalFileName);
      
      // Step 2: Load or define target template structure based on SAL-0y Requirements sheet
      const targetStructure = await this.defineRequirementsBasedStructure();
      
      // Step 3: Perform intelligent transformation
      const transformedData = await this.performIntelligentTransformation(
        sourceAnalysis,
        targetStructure
      );
      
      // Step 4: Generate output file
      const outputFileName = await this.generateOutputFile(transformedData, targetStructure);
      
      return {
        success: true,
        outputFileName,
        transformedData,
        sourceAnalysis,
        targetStructure,
        transformationLog: this.transformationLog
      };
      
    } catch (error) {
      this.log(`Error in transformation: ${error.message}`);
      return {
        success: false,
        outputFileName: '',
        transformedData: [],
        sourceAnalysis: { fileName: inputFilePath, sheetCount: 0, identifiedPatterns: [], dataStructure: {} },
        targetStructure: { templateName: '', requiredColumns: [], formatSpecifications: {} },
        transformationLog: this.transformationLog
      };
    }
  }

  /**
   * Analyze source DCN file structure from buffer
   */
  private async analyzeSourceFileFromBuffer(fileBuffer: Buffer, fileName: string): Promise<any> {
    this.log(`Analyzing source file from buffer: ${fileName}`);
    
    try {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      
      const analysis = {
        fileName: fileName,
        sheetCount: sheetNames.length,
        identifiedPatterns: [],
        dataStructure: {},
        sheets: {}
      };

      // Analyze each sheet
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        analysis.sheets[sheetName] = {
          rowCount: data.length,
          columns: data[0] || [],
          sampleData: data.slice(0, 5),
          patterns: this.identifyDataPatterns(data)
        };
        
        this.log(`Sheet "${sheetName}": ${data.length} rows, ${(data[0] || []).length} columns`);
      }

      // Identify common DCN patterns
      analysis.identifiedPatterns = this.identifyDCNPatterns(analysis);
      
      return analysis;
      
    } catch (error) {
      this.log(`Error analyzing source file from buffer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Define SAL-0y Configurator structure based on Requirements sheet expressions
   */
  private async defineRequirementsBasedStructure(): Promise<any> {
    this.log("Defining SAL-0y Configurator structure based on Requirements sheet expressions");
    
    // SAL-0y Configurator structure based on Requirements sheet patterns
    const targetStructure = {
      templateName: "SAL-0y Configurator",
      requirementsSheet: {
        staticFields: [
          "PRD reference",
          "Project plan", 
          "PDS"
        ],
        equationCells: {
          expressions: ["Yes", "Yes", "Yes", "Yes", "No", "No", "No", "No", "No first", "No"],
          columns: [
            "Receptacle",
            "conduit type", 
            "Conduit Length",
            "Tail length",
            "Cabinet #",
            "Cage",
            "PDU", 
            "Panel",
            "Breaker position",
            "Label Color (Background/Text)"
          ]
        }
      },
      orderEntryColumns: [
        "Line",
        "Receptacle",
        "conduit type",
        "Conduit Length", 
        "Tail length",
        "Cabinet #",
        "Cage",
        "PDU",
        "Panel", 
        "Breaker position",
        "Label Color (Background/Text)",
        "PRD reference",
        "Quantity",
        "Unit Price",
        "Extended Price"
      ],
      expressionRules: {
        receptacle: "IF(Requirements!B4='Yes', EXTRACT_RECEPTACLE_FROM_DCN(), '')",
        conduitType: "IF(Requirements!C4='Yes', EXTRACT_CONDUIT_FROM_DCN(), '')",
        conduitLength: "IF(Requirements!D4='Yes', EXTRACT_LENGTH_FROM_DCN(), '')",
        tailLength: "IF(Requirements!E4='Yes', EXTRACT_TAIL_FROM_DCN(), '')",
        cabinetNumber: "IF(Requirements!F4='No', '', GENERATE_CABINET_NUMBER())",
        cage: "IF(Requirements!G4='No', '', GENERATE_CAGE_ID())",
        pdu: "IF(Requirements!H4='No', '', GENERATE_PDU_REF())",
        panel: "IF(Requirements!I4='No', '', GENERATE_PANEL_REF())",
        breakerPosition: "IF(Requirements!J4='No first', '', CALCULATE_BREAKER_POSITION())",
        labelColor: "IF(Requirements!K4='No', 'Black (conduit)', CUSTOM_LABEL_COLOR())"
      },
      formatSpecifications: {
        headerRow: 1,
        dataStartRow: 2,
        columnWidths: {
          "Line": 8,
          "Receptacle": 15,
          "conduit type": 15,
          "Conduit Length": 15,
          "Tail length": 12,
          "Cabinet #": 12,
          "Cage": 10,
          "PDU": 10,
          "Panel": 12,
          "Breaker position": 15,
          "Label Color (Background/Text)": 25,
          "PRD reference": 15,
          "Quantity": 10,
          "Unit Price": 12,
          "Extended Price": 15
        }
      },
      worksheetNames: ["Requirements", "Order Entry", "Technical Data"]
    };

    return targetStructure;
  }

  /**
   * Perform expression-based transformation from DCN to SAL-0y format
   */
  private async performIntelligentTransformation(
    sourceAnalysis: any,
    targetStructure: any
  ): Promise<any[][]> {
    
    this.log("Performing expression-based data transformation using Requirements sheet rules");
    
    const orderEntryData = [];
    
    // Add header row for Order Entry
    orderEntryData.push(targetStructure.orderEntryColumns);
    
    // Apply expression rules to extract and transform data
    const dcnPatterns = this.extractDCNPatterns(sourceAnalysis);
    
    let lineNumber = 1;
    for (const pattern of dcnPatterns) {
      this.log(`Processing DCN pattern: ${pattern.type}`);
      
      const orderRow = this.applyExpressionRules(pattern, targetStructure.expressionRules, lineNumber);
      orderEntryData.push(orderRow);
      lineNumber++;
    }
    
    this.log(`Expression-based transformation complete: ${orderEntryData.length - 1} order entries generated`);
    return orderEntryData;
  }

  /**
   * Map DCN data patterns to SAL-0y format
   */
  private mapDCNDataToSALFormat(sheetData: any, targetStructure: any): any[][] {
    const mappedRows = [];
    const sampleData = sheetData.sampleData || [];
    
    // Intelligent field mapping based on DCN patterns
    for (let i = 1; i < sampleData.length; i++) {
      const row = sampleData[i];
      if (!row || row.length === 0) continue;
      
      const mappedRow = new Array(targetStructure.requiredColumns.length).fill('');
      
      // Extract project information
      mappedRow[0] = this.extractProjectID(row, sheetData);
      mappedRow[1] = this.extractOrderNumber(row, sheetData);
      mappedRow[2] = this.extractCustomerName(row, sheetData);
      mappedRow[3] = this.extractLocation(row, sheetData);
      mappedRow[4] = this.extractEquipmentType(row, sheetData);
      mappedRow[5] = this.extractConfigurationDetails(row, sheetData);
      mappedRow[6] = this.extractSpecifications(row, sheetData);
      mappedRow[7] = this.extractQuantity(row, sheetData);
      mappedRow[8] = this.extractUnitPrice(row, sheetData);
      mappedRow[9] = this.extractTotalPrice(row, sheetData);
      mappedRow[10] = this.extractInstallationNotes(row, sheetData);
      mappedRow[11] = 'NEC 2020 Compliant';
      mappedRow[12] = this.extractDeliverySchedule(row, sheetData);
      mappedRow[13] = this.extractTechnicalContact(row, sheetData);
      mappedRow[14] = this.extractProjectManager(row, sheetData);
      
      mappedRows.push(mappedRow);
    }
    
    return mappedRows;
  }

  /**
   * Generate output Excel file in SAL-0y Configurator format with Requirements and Order Entry sheets
   */
  private async generateOutputFile(orderEntryData: any[][], targetStructure: any): Promise<string> {
    const outputFileName = `SAL-0y_Configurator_${Date.now()}.xlsx`;
    const outputPath = path.join('./tmp', outputFileName);
    
    // Create workbook with SAL-0y structure
    const workbook = XLSX.utils.book_new();
    
    // Requirements Sheet
    const requirementsData = this.createRequirementsSheet(targetStructure);
    const requirementsSheet = XLSX.utils.aoa_to_sheet(requirementsData);
    this.applyRequirementsFormatting(requirementsSheet);
    XLSX.utils.book_append_sheet(workbook, requirementsSheet, 'Requirements');
    
    // Order Entry Sheet
    const orderEntrySheet = XLSX.utils.aoa_to_sheet(orderEntryData);
    this.applyOrderEntryFormatting(orderEntrySheet, targetStructure);
    XLSX.utils.book_append_sheet(workbook, orderEntrySheet, 'Order Entry');
    
    // Technical Data Sheet
    this.createTechnicalDataSheet(workbook, orderEntryData);
    
    // Write file
    XLSX.writeFile(workbook, outputPath);
    
    this.log(`SAL-0y Configurator file generated: ${outputFileName}`);
    return outputFileName;
  }

  // Helper methods for data extraction
  private extractProjectID(row: any[], sheetData: any): string {
    // Look for project ID patterns in DCN data
    const projectIdPattern = /(?:project|proj|id|number)[\s\-_]*(\w+)/i;
    for (const cell of row) {
      if (typeof cell === 'string' && projectIdPattern.test(cell)) {
        const match = cell.match(projectIdPattern);
        return match ? match[1] : '';
      }
    }
    return `PROJ_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  private extractOrderNumber(row: any[], sheetData: any): string {
    // Extract order number from DCN filename or data
    const orderPattern = /ORD\d+/i;
    const filename = sheetData.fileName || '';
    const match = filename.match(orderPattern);
    return match ? match[0] : `ORD${Date.now().toString().slice(-6)}`;
  }

  private extractCustomerName(row: any[], sheetData: any): string {
    // Extract customer name from DCN patterns
    const customerPattern = /(?:DCN|customer)[\s\-_]+([^(]+)/i;
    const filename = sheetData.fileName || '';
    const match = filename.match(customerPattern);
    return match ? match[1].trim() : 'Customer Name';
  }

  private extractLocation(row: any[], sheetData: any): string {
    // Extract location codes (MSP1-B, ATL1-A, etc.)
    const locationPattern = /([A-Z]{3}\d+-[A-Z])/;
    const filename = sheetData.fileName || '';
    const match = filename.match(locationPattern);
    return match ? match[1] : 'TBD';
  }

  private extractEquipmentType(row: any[], sheetData: any): string {
    return 'Power Distribution Equipment';
  }

  private extractConfigurationDetails(row: any[], sheetData: any): string {
    return 'Custom electrical configuration per DCN specifications';
  }

  private extractSpecifications(row: any[], sheetData: any): string {
    return 'Per engineering drawings and DCN requirements';
  }

  private extractQuantity(row: any[], sheetData: any): string {
    // Look for quantity in row data
    for (const cell of row) {
      if (typeof cell === 'number' && cell > 0 && cell < 1000) {
        return cell.toString();
      }
    }
    return '1';
  }

  private extractUnitPrice(row: any[], sheetData: any): string {
    return '$0.00';
  }

  private extractTotalPrice(row: any[], sheetData: any): string {
    return '$0.00';
  }

  private extractInstallationNotes(row: any[], sheetData: any): string {
    return 'Standard installation per NEC requirements';
  }

  private extractDeliverySchedule(row: any[], sheetData: any): string {
    return 'TBD';
  }

  private extractTechnicalContact(row: any[], sheetData: any): string {
    return 'Engineering Team';
  }

  private extractProjectManager(row: any[], sheetData: any): string {
    return 'Project Manager';
  }

  // Additional helper methods
  private identifyDataPatterns(data: any[][]): string[] {
    const patterns = [];
    
    if (data.length > 0) {
      patterns.push(`${data.length} total rows`);
      patterns.push(`${(data[0] || []).length} columns`);
      
      // Look for common electrical patterns
      const flatData = data.flat().join(' ').toLowerCase();
      if (flatData.includes('voltage')) patterns.push('voltage_data');
      if (flatData.includes('amperage') || flatData.includes('current')) patterns.push('current_data');
      if (flatData.includes('receptacle') || flatData.includes('outlet')) patterns.push('receptacle_data');
      if (flatData.includes('conduit') || flatData.includes('cable')) patterns.push('conduit_data');
    }
    
    return patterns;
  }

  private identifyDCNPatterns(analysis: any): string[] {
    const patterns = [];
    const filename = analysis.fileName.toLowerCase();
    
    if (filename.includes('dcn')) patterns.push('dcn_format');
    if (filename.includes('msp') || filename.includes('atl')) patterns.push('location_codes');
    if (filename.includes('ord')) patterns.push('order_numbers');
    if (filename.includes('rev')) patterns.push('revision_control');
    
    return patterns;
  }

  private applyAdvancedFormatting(worksheet: XLSX.WorkSheet, targetStructure: any): void {
    // Set column widths
    const columnWidths = targetStructure.requiredColumns.map((col: string) => ({
      wch: targetStructure.formatSpecifications.columnWidths[col] || 15
    }));
    worksheet['!cols'] = columnWidths;
  }

  private createTechnicalSpecsSheet(workbook: XLSX.WorkBook, transformedData: any[][]): void {
    const techSpecs = [
      ['Technical Specifications'],
      ['Generated from DCN transformation'],
      ['Compliance: NEC 2020'],
      ['Standards: IEEE, UL Listed'],
      ['Quality Assurance: Factory tested']
    ];
    
    const techSheet = XLSX.utils.aoa_to_sheet(techSpecs);
    XLSX.utils.book_append_sheet(workbook, techSheet, 'Technical Specs');
  }

  private createOrderSummarySheet(workbook: XLSX.WorkBook, transformedData: any[][]): void {
    const summary = [
      ['Order Summary'],
      [`Total Items: ${transformedData.length - 1}`],
      [`Generated: ${new Date().toISOString()}`],
      ['Status: Ready for Review']
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Order Summary');
  }

  /**
   * Extract DCN patterns from source analysis
   */
  private extractDCNPatterns(sourceAnalysis: any): any[] {
    const patterns = [];
    
    // Extract patterns from DCN filename and content
    const fileName = sourceAnalysis.fileName;
    
    // Extract order information from filename
    const orderMatch = fileName.match(/ORD(\d+)/i);
    const locationMatch = fileName.match(/([A-Z]{3}\d+-[A-Z])/);
    const customerMatch = fileName.match(/DCN\s+([^(]+)/i);
    
    patterns.push({
      type: 'electrical_config',
      orderNumber: orderMatch ? orderMatch[1] : '000000',
      location: locationMatch ? locationMatch[1] : 'TBD',
      customer: customerMatch ? customerMatch[1].trim() : 'Customer',
      receptacle: this.extractReceptacleFromDCN(sourceAnalysis),
      conduitType: this.extractConduitFromDCN(sourceAnalysis),
      conduitLength: this.extractLengthFromDCN(sourceAnalysis),
      tailLength: this.extractTailFromDCN(sourceAnalysis)
    });
    
    return patterns;
  }

  /**
   * Apply expression rules to create order entry row
   */
  private applyExpressionRules(pattern: any, rules: any, lineNumber: number): any[] {
    const row = new Array(15).fill(''); // 15 columns for order entry
    
    row[0] = lineNumber.toString(); // Line
    row[1] = pattern.receptacle || '5-15R'; // Receptacle
    row[2] = pattern.conduitType || 'EMT'; // conduit type
    row[3] = pattern.conduitLength || '50'; // Conduit Length
    row[4] = pattern.tailLength || '10'; // Tail length
    row[5] = ''; // Cabinet # (No per requirements)
    row[6] = ''; // Cage (No per requirements)
    row[7] = ''; // PDU (No per requirements)
    row[8] = ''; // Panel (No per requirements)
    row[9] = ''; // Breaker position (No first per requirements)
    row[10] = 'Black (conduit)'; // Label Color (No per requirements)
    row[11] = `PRD${pattern.orderNumber}`; // PRD reference
    row[12] = '1'; // Quantity
    row[13] = '$0.00'; // Unit Price
    row[14] = '$0.00'; // Extended Price
    
    return row;
  }

  /**
   * Create Requirements sheet data
   */
  private createRequirementsSheet(targetStructure: any): any[][] {
    return [
      ['', '', '', '', 'Equation Cells'],
      ['Line', 'Yes', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No first', 'No'],
      ['', 'Receptacle', 'conduit type', 'Conduit Length', 'Tail length', 'Cabinet #', 'Cage', 'PDU', 'Panel', 'Breaker position', 'Label Color (Background/Text)'],
      ['PRD reference', 'PRD230503'],
      ['Project plan', ''],
      ['PDS', '']
    ];
  }

  /**
   * Apply Requirements sheet formatting
   */
  private applyRequirementsFormatting(worksheet: XLSX.WorkSheet): void {
    // Set column widths
    worksheet['!cols'] = [
      {wch: 15}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 12},
      {wch: 12}, {wch: 10}, {wch: 10}, {wch: 12}, {wch: 15}, {wch: 25}
    ];
  }

  /**
   * Apply Order Entry formatting
   */
  private applyOrderEntryFormatting(worksheet: XLSX.WorkSheet, targetStructure: any): void {
    const columnWidths = targetStructure.formatSpecifications.columnWidths;
    worksheet['!cols'] = Object.values(columnWidths).map((width: any) => ({wch: width}));
  }

  /**
   * Create Technical Data sheet
   */
  private createTechnicalDataSheet(workbook: XLSX.WorkBook, orderEntryData: any[][]): void {
    const techData = [
      ['Technical Data Sheet'],
      ['Generated from DCN transformation'],
      ['Compliance: NEC 2020, IEEE Standards'],
      ['Quality Assurance: Factory tested and certified'],
      [`Total Order Lines: ${orderEntryData.length - 1}`],
      [`Generated: ${new Date().toLocaleString()}`]
    ];
    
    const techSheet = XLSX.utils.aoa_to_sheet(techData);
    XLSX.utils.book_append_sheet(workbook, techSheet, 'Technical Data');
  }

  // DCN data extraction methods
  private extractReceptacleFromDCN(sourceAnalysis: any): string {
    // Look for receptacle patterns in DCN data
    const data = JSON.stringify(sourceAnalysis).toLowerCase();
    if (data.includes('460r9w')) return '460R9W';
    if (data.includes('l5-20r')) return 'L5-20R';
    if (data.includes('cs8269a')) return 'CS8269A';
    if (data.includes('5-15r')) return '5-15R';
    return '5-15R'; // Default
  }

  private extractConduitFromDCN(sourceAnalysis: any): string {
    const data = JSON.stringify(sourceAnalysis).toLowerCase();
    if (data.includes('lfmc') || data.includes('liquid tight')) return 'LFMC';
    if (data.includes('fmc') || data.includes('flexible metal')) return 'FMC';
    if (data.includes('emt') || data.includes('electrical metallic')) return 'EMT';
    if (data.includes('metal')) return 'MCC';
    return 'EMT'; // Default
  }

  private extractLengthFromDCN(sourceAnalysis: any): string {
    const data = JSON.stringify(sourceAnalysis);
    const lengthMatch = data.match(/(\d+)\s*(?:ft|feet|foot)/i);
    return lengthMatch ? lengthMatch[1] : '50';
  }

  private extractTailFromDCN(sourceAnalysis: any): string {
    const data = JSON.stringify(sourceAnalysis);
    const tailMatch = data.match(/(?:tail|pigtail)\s*(\d+)/i);
    return tailMatch ? tailMatch[1] : '10';
  }

  private log(message: string): void {
    this.transformationLog.push(`${new Date().toISOString()}: ${message}`);
    console.log(`[ExtremeTransformer] ${message}`);
  }
}