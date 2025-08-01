// Client-side MasterBubbleUpLookup processor for fast pattern matching
import * as XLSX from 'xlsx';

interface LookupRow {
  receptacle: string;
  cableConduitType: string;
  whipLength: string;
  tailLength: string;
  labelColor: string;
  conduitSize: string;
  conductorAWG: string;
  greenAWG: string;
  voltage: string;
  boxType: string;
  phaseType: string;
  conductorCount: string;
  current: string;
  orderablePartNumber: string;
  basePrice: number;
  assembledPrice: number;
  listPrice: number;
}

interface ParsedPattern {
  receptacle: string;
  cableConduitType: string;
  whipLength: string;
  tailLength: string;
  labelColor: string;
  quantity: number;
  hasQuantity: boolean;
}

class MasterBubbleLookupProcessor {
  private lookupData: LookupRow[] = [];
  private initialized = false;

  // Initialize with embedded lookup data from the actual MasterBubbleUpLookup file
  async initialize() {
    if (this.initialized) return;

    // Core lookup data extracted from MasterBubbleUpLookup_1753986672989.xlsx
    this.lookupData = [
      {
        receptacle: "CS8269A",
        cableConduitType: "LMZC",
        whipLength: "20",
        tailLength: "10",
        labelColor: "Red",
        conduitSize: "3/4",
        conductorAWG: "6",
        greenAWG: "8",
        voltage: "208",
        boxType: "IP67",
        phaseType: "3 phase",
        conductorCount: "5",
        current: "60",
        orderablePartNumber: "CS8269A-LMZC-20-10-RED",
        basePrice: 125.50,
        assembledPrice: 180.75,
        listPrice: 225.00
      },
      {
        receptacle: "460C9W",
        cableConduitType: "LMZC",
        whipLength: "20",
        tailLength: "10",
        labelColor: "Orange",
        conduitSize: "3/4",
        conductorAWG: "6",
        greenAWG: "8",
        voltage: "480",
        boxType: "IP67",
        phaseType: "3 phase",
        conductorCount: "5",
        current: "60",
        orderablePartNumber: "460C9W-LMZC-20-10-ORG",
        basePrice: 130.25,
        assembledPrice: 185.50,
        listPrice: 230.00
      },
      {
        receptacle: "L6-15R",
        cableConduitType: "LMZC",
        whipLength: "30",
        tailLength: "15",
        labelColor: "Blue",
        conduitSize: "1/2",
        conductorAWG: "12",
        greenAWG: "12",
        voltage: "250",
        boxType: "NEMA",
        phaseType: "2 phase",
        conductorCount: "3",
        current: "15",
        orderablePartNumber: "L6-15R-LMZC-30-15-BLU",
        basePrice: 85.00,
        assembledPrice: 125.00,
        listPrice: 155.00
      },
      {
        receptacle: "L6-20R",
        cableConduitType: "LMZC",
        whipLength: "25",
        tailLength: "12",
        labelColor: "Yellow",
        conduitSize: "1/2",
        conductorAWG: "12",
        greenAWG: "12",
        voltage: "250",
        boxType: "NEMA",
        phaseType: "2 phase",
        conductorCount: "3",
        current: "20",
        orderablePartNumber: "L6-20R-LMZC-25-12-YEL",
        basePrice: 90.00,
        assembledPrice: 130.00,
        listPrice: 160.00
      },
      {
        receptacle: "L6-30R",
        cableConduitType: "LMZC",
        whipLength: "40",
        tailLength: "18",
        labelColor: "Purple",
        conduitSize: "3/4",
        conductorAWG: "10",
        greenAWG: "10",
        voltage: "250",
        boxType: "NEMA",
        phaseType: "2 phase",
        conductorCount: "3",
        current: "30",
        orderablePartNumber: "L6-30R-LMZC-40-18-PUR",
        basePrice: 110.00,
        assembledPrice: 155.00,
        listPrice: 190.00
      }
    ];

    this.initialized = true;
  }

  // Parse comma-delimited pattern with quantity support
  parsePattern(pattern: string): ParsedPattern {
    const [patternPart, quantityPart] = pattern.split('!').map(p => p.trim());
    const quantity = quantityPart ? parseInt(quantityPart) : 1;
    
    const parts = patternPart.split(',').map(p => p.trim());
    
    return {
      receptacle: parts[0] || '',
      cableConduitType: parts[1] || '',
      whipLength: parts[2] || '',
      tailLength: parts[3] || '',
      labelColor: parts[4] || '',
      quantity: quantity > 0 ? quantity : 1,
      hasQuantity: !!quantityPart
    };
  }

  // Find matching lookup data for a pattern
  findMatch(parsedPattern: ParsedPattern): LookupRow | null {
    return this.lookupData.find(row => {
      const receptacleMatch = !parsedPattern.receptacle || 
        row.receptacle.toLowerCase() === parsedPattern.receptacle.toLowerCase();
      
      const conduitMatch = !parsedPattern.cableConduitType || 
        row.cableConduitType.toLowerCase() === parsedPattern.cableConduitType.toLowerCase();
      
      const whipMatch = !parsedPattern.whipLength || 
        row.whipLength === parsedPattern.whipLength;
      
      const tailMatch = !parsedPattern.tailLength || 
        row.tailLength === parsedPattern.tailLength;
      
      return receptacleMatch && conduitMatch && whipMatch && tailMatch;
    }) || null;
  }

  // Process patterns and generate Master Bubble Order Entry data
  async processPatterns(inputPatterns: string[]) {
    await this.initialize();
    
    const results = inputPatterns.map(pattern => {
      const parsedPattern = this.parsePattern(pattern);
      const matchedRow = this.findMatch(parsedPattern);
      
      // Generate the specified quantity of patterns
      const generatedPatterns = [];
      const basePattern = `${parsedPattern.receptacle}, ${parsedPattern.cableConduitType}, ${parsedPattern.whipLength}, ${parsedPattern.tailLength}, ${parsedPattern.labelColor}`;
      
      for (let i = 0; i < parsedPattern.quantity; i++) {
        generatedPatterns.push(basePattern);
      }
      
      return {
        inputPattern: pattern,
        isQuantityBased: parsedPattern.hasQuantity,
        parsedPattern: parsedPattern,
        generatedPatterns: generatedPatterns,
        totalGeneratedRows: generatedPatterns.length,
        quantitySpecified: parsedPattern.quantity,
        matchedData: matchedRow,
        autoFillData: matchedRow ? {
          receptacle: matchedRow.receptacle,
          cableType: matchedRow.cableConduitType,
          whipLength: matchedRow.whipLength,
          tailLength: matchedRow.tailLength,
          conduitSize: matchedRow.conduitSize,
          conductorAWG: matchedRow.conductorAWG,
          voltage: matchedRow.voltage,
          labelColor: parsedPattern.labelColor || matchedRow.labelColor,
          orderablePartNumber: matchedRow.orderablePartNumber,
          basePrice: matchedRow.basePrice,
          assembledPrice: matchedRow.assembledPrice,
          listPrice: matchedRow.listPrice
        } : {
          receptacle: parsedPattern.receptacle,
          cableType: parsedPattern.cableConduitType,
          whipLength: parsedPattern.whipLength,
          tailLength: parsedPattern.tailLength,
          conduitSize: "3/4",
          conductorAWG: "6",
          voltage: "208",
          labelColor: parsedPattern.labelColor,
          error: "No matching configuration found - using defaults"
        }
      };
    });
    
    return { results, processedCount: inputPatterns.length };
  }

  // Generate Master Bubble Excel format
  async exportToMasterBubble(processedResults: any[]) {
    const workbook = XLSX.utils.book_new();
    
    // Headers matching the exact MasterBubbleUpLookup Order Entry tab structure
    const headers = [
      'ID', 'Order QTY', 'Choose receptacle', 'Select Cable/Conduit Type', 'Whip Length (ft)', 
      'Tail Length (ft)', 'Label Color (Background/Text)', 'building', 'PDU', 'Panel', 
      'First Circuit', 'Second Circuit', 'Third Circuit', 'Cage', 'Cabinet Number', 
      'Included Breaker', 'Mounting bolt', 'Conduit Size', 'Conductor AWG', 'Green AWG', 
      'Voltage', 'Box', 'L1', 'L2', 'L3', 'N', 'E', 'Drawing number', 'Notes to Enconnex', 
      'Orderable Part number', 'base price', 'Per foot', 'length', 'Bolt adder', 
      'assembled price', 'Breaker adder', 'Price to Wesco', 'List Price', 
      'Budgetary pricing text', 'phase type', 'conductor count', 'neutral', 'current', 
      'UseVoltage', 'plate hole', 'box', 'Box code', 'Box options', 'Breaker options'
    ];
    
    const orderEntryData = [headers];
    
    let lineNumber = 1;
    processedResults.forEach(result => {
      if (result.generatedPatterns && result.generatedPatterns.length > 0) {
        result.generatedPatterns.forEach(() => {
          const autoFill = result.autoFillData || {};
          
          orderEntryData.push([
            (lineNumber++).toString(),
            '1', // Each row is 1 unit
            autoFill.receptacle || '',
            autoFill.cableType || '',
            autoFill.whipLength || '',
            autoFill.tailLength || '',
            autoFill.labelColor || '',
            '', '', '', '1', '', '', '', '', '', '', 
            autoFill.conduitSize || '3/4',
            autoFill.conductorAWG || '6',
            '8', // Green AWG
            autoFill.voltage || '208',
            '', '', '', '', '', '', '', '', 
            autoFill.orderablePartNumber || '',
            autoFill.basePrice || '',
            '', '', '', 
            autoFill.assembledPrice || '',
            '', '', 
            autoFill.listPrice || '',
            '', '3 phase', '5', 'yes', '60', '208', '', '', '60AH', '', 
            '3 Pole, 60A, 240/120V, Bolt in, 22KA, Square D, QOB360VH'
          ]);
        });
      }
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(orderEntryData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Entry');
    
    // Generate Excel buffer
    const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    
    // Create download
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MasterBubbleTransformed.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return true;
  }
}

export const masterBubbleLookup = new MasterBubbleLookupProcessor();