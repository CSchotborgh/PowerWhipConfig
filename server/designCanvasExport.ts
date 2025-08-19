import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

interface DroppedComponent {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  specifications?: Record<string, any>;
  partNumber?: string;
}

interface DesignCanvasExportRequest {
  components: DroppedComponent[];
  exportType: string;
}

export class DesignCanvasExporter {
  private masterBubbleLookupData: any[] = [];

  constructor() {
    this.loadMasterBubbleLookupData();
  }

  private loadMasterBubbleLookupData() {
    try {
      const lookupFilePath = path.join(process.cwd(), 'attached_assets', 'MasterBubbleUpLookup_1755560556826.xlsx');
      if (fs.existsSync(lookupFilePath)) {
        const workbook = XLSX.readFile(lookupFilePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        this.masterBubbleLookupData = XLSX.utils.sheet_to_json(worksheet);
      }
    } catch (error) {
      console.error('Error loading master bubble lookup data:', error);
    }
  }

  public async exportDesignCanvas(exportData: DesignCanvasExportRequest): Promise<Buffer> {
    const { components } = exportData;
    
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Design Canvas Components (Main Output)
    const designCanvasData = this.createDesignCanvasSheet(components);
    const designCanvasSheet = XLSX.utils.json_to_sheet(designCanvasData);
    XLSX.utils.book_append_sheet(workbook, designCanvasSheet, 'Design Canvas Output');

    // Sheet 2: Receptacle Pattern Lookup
    const receptacleLookupData = this.createReceptacleLookupSheet(components);
    const receptacleLookupSheet = XLSX.utils.json_to_sheet(receptacleLookupData);
    XLSX.utils.book_append_sheet(workbook, receptacleLookupSheet, 'Receptacle Pattern Lookup');

    // Sheet 3: Master Bubble Lookup Reference
    if (this.masterBubbleLookupData.length > 0) {
      const masterBubbleSheet = XLSX.utils.json_to_sheet(this.masterBubbleLookupData);
      XLSX.utils.book_append_sheet(workbook, masterBubbleSheet, 'Master Bubble Lookup');
    }

    // Sheet 4: Export Summary and Instructions
    const summaryData = this.createExportSummarySheet(components);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Summary');

    // Generate the Excel buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  private createDesignCanvasSheet(components: DroppedComponent[]) {
    const designCanvasData = [];
    
    // Header row
    designCanvasData.push({
      'Row': 'Row',
      'Component ID': 'Component ID',
      'Component Type': 'Component Type', 
      'Component Name': 'Component Name',
      'Part Number': 'Part Number',
      'Position X': 'Position X',
      'Position Y': 'Position Y',
      'Specifications': 'Specifications',
      'Receptacle ID': 'Receptacle ID',
      'Cable Type': 'Cable Type',
      'Whip Length': 'Whip Length',
      'Tail Length': 'Tail Length',
      'Configuration': 'Configuration'
    });

    // Component data rows
    components.forEach((component, index) => {
      const receptacleId = this.extractReceptacleId(component);
      const cableType = this.extractCableType(component);
      const whipLength = this.extractWhipLength(component);
      const tailLength = this.extractTailLength(component);

      designCanvasData.push({
        'Row': `Row-${index + 1}`,
        'Component ID': component.id,
        'Component Type': component.type,
        'Component Name': component.name,
        'Part Number': component.partNumber || 'N/A',
        'Position X': Math.round(component.x),
        'Position Y': Math.round(component.y),
        'Specifications': JSON.stringify(component.specifications || {}),
        'Receptacle ID': receptacleId,
        'Cable Type': cableType,
        'Whip Length': whipLength,
        'Tail Length': tailLength,
        'Configuration': this.getMatchedConfiguration(component)
      });
    });

    return designCanvasData;
  }

  private createReceptacleLookupSheet(components: DroppedComponent[]) {
    const lookupData = [];
    
    // Header
    lookupData.push({
      'Receptacle Pattern': 'Receptacle Pattern',
      'Component Count': 'Component Count',
      'Component Types': 'Component Types',
      'Common Configurations': 'Common Configurations',
      'Pattern Category': 'Pattern Category'
    });

    // Analyze patterns from components
    const patterns = this.analyzeComponentPatterns(components);
    
    patterns.forEach(pattern => {
      lookupData.push({
        'Receptacle Pattern': pattern.pattern,
        'Component Count': pattern.count,
        'Component Types': pattern.types.join(', '),
        'Common Configurations': pattern.configurations.join(', '),
        'Pattern Category': pattern.category
      });
    });

    return lookupData;
  }

  private createExportSummarySheet(components: DroppedComponent[]) {
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();
    const formattedTime = currentDate.toLocaleTimeString();

    return [
      { 'Export Information': 'Export Information', 'Value': 'Value' },
      { 'Export Information': 'Export Date', 'Value': formattedDate },
      { 'Export Information': 'Export Time', 'Value': formattedTime },
      { 'Export Information': 'Total Components', 'Value': components.length },
      { 'Export Information': 'Export Type', 'Value': 'Design Canvas XLSX Export' },
      { 'Export Information': 'File Format', 'Value': 'DesignCanvasOutput.xlsx' },
      { 'Export Information': '', 'Value': '' },
      { 'Export Information': 'Sheet Descriptions', 'Value': '' },
      { 'Export Information': 'Design Canvas Output', 'Value': 'Main component data with positions and specifications' },
      { 'Export Information': 'Receptacle Pattern Lookup', 'Value': 'Pattern analysis and receptacle identification' },
      { 'Export Information': 'Master Bubble Lookup', 'Value': 'Reference data for pattern matching' },
      { 'Export Information': 'Export Summary', 'Value': 'This summary and export information' },
      { 'Export Information': '', 'Value': '' },
      { 'Export Information': 'Instructions', 'Value': '' },
      { 'Export Information': '1. Review Design Canvas Output', 'Value': 'Main sheet with component positions and data' },
      { 'Export Information': '2. Check Pattern Lookup', 'Value': 'Analyze receptacle patterns and configurations' },
      { 'Export Information': '3. Reference Master Lookup', 'Value': 'Use for additional pattern matching' },
      { 'Export Information': '4. Validate Specifications', 'Value': 'Ensure all component specs are accurate' }
    ];
  }

  private extractReceptacleId(component: DroppedComponent): string {
    // Extract receptacle ID based on component type and specifications
    if (component.type === 'connector' || component.type === 'receptacle') {
      return component.name || component.partNumber || 'Unknown';
    }
    return 'N/A';
  }

  private extractCableType(component: DroppedComponent): string {
    // Extract cable type from specifications
    if (component.specifications?.cableType) {
      return component.specifications.cableType;
    }
    if (component.specifications?.wireGauge) {
      return `${component.specifications.wireGauge} AWG`;
    }
    return 'Standard';
  }

  private extractWhipLength(component: DroppedComponent): string {
    // Extract whip length from specifications
    if (component.specifications?.length) {
      return `${component.specifications.length}"`;
    }
    if (component.specifications?.whipLength) {
      return component.specifications.whipLength;
    }
    return '6"'; // Default
  }

  private extractTailLength(component: DroppedComponent): string {
    // Extract tail length from specifications
    if (component.specifications?.tailLength) {
      return component.specifications.tailLength;
    }
    return '12"'; // Default
  }

  private getMatchedConfiguration(component: DroppedComponent): string {
    // Match component against known configurations
    const configs = [
      'Standard Office Configuration',
      'Industrial Twist-Lock Configuration',
      'Three-Phase Configuration',
      'Data Center Configuration',
      'Outdoor GFCI Configuration',
      'Arc Fault Protected Configuration'
    ];

    // Simple matching logic based on component type and specs
    if (component.type === 'connector' && component.specifications?.voltage === '120V') {
      return 'Standard Office Configuration';
    }
    if (component.name?.includes('L') && component.specifications?.phase === '3') {
      return 'Three-Phase Configuration';
    }
    if (component.specifications?.protection === 'GFCI') {
      return 'Outdoor GFCI Configuration';
    }
    
    return 'Custom Configuration';
  }

  private analyzeComponentPatterns(components: DroppedComponent[]) {
    const patterns = [];
    const patternMap = new Map();

    // Group components by type and analyze patterns
    components.forEach(component => {
      const key = `${component.type}-${component.name}`;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          pattern: key,
          count: 0,
          types: new Set(),
          configurations: new Set(),
          category: this.categorizeComponent(component)
        });
      }
      
      const pattern = patternMap.get(key);
      pattern.count++;
      pattern.types.add(component.type);
      pattern.configurations.add(this.getMatchedConfiguration(component));
    });

    // Convert to array format
    patternMap.forEach(pattern => {
      patterns.push({
        pattern: pattern.pattern,
        count: pattern.count,
        types: Array.from(pattern.types),
        configurations: Array.from(pattern.configurations),
        category: pattern.category
      });
    });

    return patterns;
  }

  private categorizeComponent(component: DroppedComponent): string {
    if (component.type === 'connector') return 'Connector';
    if (component.type === 'receptacle') return 'Receptacle';
    if (component.type === 'protection') return 'Protection Device';
    if (component.type === 'cable') return 'Cable/Wire';
    if (component.type === 'junction') return 'Junction Box';
    return 'Other';
  }
}