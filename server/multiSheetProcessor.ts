import * as XLSX from 'xlsx';

interface PatternMatch {
  id: string;
  type: 'receptacle' | 'cable' | 'whip_length' | 'tail_length' | 'general';
  value: string;
  cellRef: string;
  sheetName: string;
  globalIndex: number;
}

interface SheetProcessingResult {
  sheetName: string;
  patterns: PatternMatch[];
  rowCount: number;
  columnCount: number;
}

interface ProcessingResult {
  success: boolean;
  fileName: string;
  patterns: PatternMatch[];
  transformedOutput: any[];
  summary: {
    totalSheets: number;
    totalPatterns: number;
    sheetNames: string[];
    combinedOutputRows: number;
    processing: string;
    sheetsProcessed: Array<{ name: string; patterns: number }>;
  };
}

// Enhanced pattern recognition with comprehensive regex patterns
const PATTERN_DEFINITIONS = {
  receptacle: [
    /\b(CS8269A|460C9W|L6-30R|L6-20R|L5-30R|L5-20R|L5-15R)\b/gi,
    /\b(NEMA\s*\d+-\d+[PR]?)\b/gi,
    /\b(IEC\s*\d+[AP]?)\b/gi,
    /\b(\d+A\s*\d+V)\b/gi,
  ],
  cable: [
    /\b(MMC|LFMC|FMC|LMZC|EMT|PVC|MC|AC)\b/gi,
    /\b(liquid\s*tight|flex|conduit|cable|wire)\b/gi,
    /\b(\d+\/\d+\s*AWG)\b/gi,
  ],
  whip_length: [
    /\b(\d+['"]?|\d+\s*ft|\d+\s*foot|\d+\s*feet)\b/gi,
    /\b(\d+\.\d+['"]?|\d+\.\d+\s*ft)\b/gi,
  ],
  tail_length: [
    /\b(\d+['"]?|\d+\s*in|\d+\s*inch|\d+\s*inches)\b/gi,
    /\b(\d+\.\d+['"]?|\d+\.\d+\s*in)\b/gi,
  ],
  general: [
    /\b(red|blue|green|yellow|orange|purple|black|white)\b/gi,
    /\b(choose|select|option)\b/gi,
    /\b(\d+)\b/g,
  ]
};

export class MultiSheetProcessor {
  
  static processAllSheets(buffer: Buffer, fileName: string): ProcessingResult {
    try {
      console.log(`Processing Excel file: ${fileName}`);
      
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetNames = workbook.SheetNames;
      
      console.log(`Found ${sheetNames.length} sheets:`, sheetNames);
      
      let globalPatternIndex = 0;
      const allPatterns: PatternMatch[] = [];
      const sheetResults: SheetProcessingResult[] = [];
      
      // Process each sheet
      for (const sheetName of sheetNames) {
        console.log(`Processing sheet: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        
        const sheetPatterns: PatternMatch[] = [];
        
        // Scan all cells in the sheet
        for (let row = range.s.r; row <= range.e.r; row++) {
          for (let col = range.s.c; col <= range.e.c; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
            const cell = worksheet[cellRef];
            
            if (cell && cell.v) {
              const cellValue = cell.v.toString();
              
              // Check against all pattern types
              for (const [patternType, regexList] of Object.entries(PATTERN_DEFINITIONS)) {
                for (const regex of regexList) {
                  const matches = cellValue.match(regex);
                  if (matches) {
                    for (const match of matches) {
                      const pattern: PatternMatch = {
                        id: `pattern_${globalPatternIndex++}`,
                        type: patternType as PatternMatch['type'],
                        value: match,
                        cellRef,
                        sheetName,
                        globalIndex: globalPatternIndex
                      };
                      
                      sheetPatterns.push(pattern);
                      allPatterns.push(pattern);
                    }
                  }
                }
              }
            }
          }
        }
        
        sheetResults.push({
          sheetName,
          patterns: sheetPatterns,
          rowCount: range.e.r - range.s.r + 1,
          columnCount: range.e.c - range.s.c + 1
        });
        
        console.log(`Sheet ${sheetName}: Found ${sheetPatterns.length} patterns`);
      }
      
      // Create transformed output combining all patterns
      const transformedOutput = this.createTransformedOutput(allPatterns);
      
      console.log(`Total patterns found: ${allPatterns.length}`);
      console.log(`Transformed output rows: ${transformedOutput.length}`);
      
      return {
        success: true,
        fileName,
        patterns: allPatterns,
        transformedOutput,
        summary: {
          totalSheets: sheetNames.length,
          totalPatterns: allPatterns.length,
          sheetNames,
          combinedOutputRows: transformedOutput.length,
          processing: 'Multi-sheet comprehensive scanning with pattern combination',
          sheetsProcessed: sheetResults.map(result => ({
            name: result.sheetName,
            patterns: result.patterns.length
          }))
        }
      };
      
    } catch (error) {
      console.error('Error processing Excel file:', error);
      throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private static createTransformedOutput(patterns: PatternMatch[]): any[] {
    const transformedRows: any[] = [];
    
    // Group patterns by some logical grouping (e.g., by sheet and approximate location)
    const patternGroups = this.groupPatterns(patterns);
    
    for (const group of patternGroups) {
      const row: any = {
        'Global Index': group.globalIndex,
        'Source Sheet': group.sheetName,
        'Cell Reference': group.cellRef,
        'Pattern Type': group.type,
        'Original Value': group.value,
        'Receptacle ID': group.type === 'receptacle' ? group.value : 'choose',
        'Cable/Conduit Type ID': group.type === 'cable' ? group.value : 'choose',
        'Whip Length ID': group.type === 'whip_length' ? group.value : 'choose',
        'Tail Length ID': group.type === 'tail_length' ? group.value : 'choose',
        'Label Color': group.type === 'general' && /color|red|blue|green|yellow|orange|purple|black|white/i.test(group.value) ? group.value : 'choose',
        'Processing Notes': `Extracted from ${group.sheetName} at ${group.cellRef}`,
        'Timestamp': new Date().toISOString()
      };
      
      transformedRows.push(row);
    }
    
    return transformedRows;
  }
  
  private static groupPatterns(patterns: PatternMatch[]): PatternMatch[] {
    // For now, return all patterns as individual rows
    // Could be enhanced to group related patterns from same area
    return patterns;
  }
  
  static exportToCombinedExcel(transformedOutput: any[]): Buffer {
    const workbook = XLSX.utils.book_new();
    
    // Create main output sheet
    const worksheet = XLSX.utils.json_to_sheet(transformedOutput);
    
    // Auto-size columns
    const colWidths = [
      { wch: 15 }, // Global Index
      { wch: 20 }, // Source Sheet
      { wch: 15 }, // Cell Reference
      { wch: 15 }, // Pattern Type
      { wch: 20 }, // Original Value
      { wch: 20 }, // Receptacle ID
      { wch: 25 }, // Cable/Conduit Type ID
      { wch: 18 }, // Whip Length ID
      { wch: 18 }, // Tail Length ID
      { wch: 15 }, // Label Color
      { wch: 30 }, // Processing Notes
      { wch: 20 }  // Timestamp
    ];
    worksheet['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Combined Patterns');
    
    // Create summary sheet
    const summaryData = [
      { Field: 'Total Patterns', Value: transformedOutput.length },
      { Field: 'Processing Date', Value: new Date().toISOString() },
      { Field: 'Processing Type', Value: 'Multi-Sheet Comprehensive Scan' },
      { Field: 'Source Sheets', Value: Array.from(new Set(transformedOutput.map(row => row['Source Sheet']))).join(', ') }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 20 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Processing Summary');
    
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}