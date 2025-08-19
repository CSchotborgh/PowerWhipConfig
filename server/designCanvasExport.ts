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

    // Sheet 1: Standard Order Entry Header (using Parse Processing functions)
    const orderEntryData = this.createOrderEntryHeaderSheet(components);
    const orderEntrySheet = XLSX.utils.aoa_to_sheet(orderEntryData);
    XLSX.utils.book_append_sheet(workbook, orderEntrySheet, 'Order Entry');

    // Sheet 2: Design Canvas Components (Main Output)
    const designCanvasData = this.createDesignCanvasSheet(components);
    const designCanvasSheet = XLSX.utils.json_to_sheet(designCanvasData);
    XLSX.utils.book_append_sheet(workbook, designCanvasSheet, 'Design Canvas Output');

    // Sheet 3: Receptacle Pattern Lookup
    const receptacleLookupData = this.createReceptacleLookupSheet(components);
    const receptacleLookupSheet = XLSX.utils.json_to_sheet(receptacleLookupData);
    XLSX.utils.book_append_sheet(workbook, receptacleLookupSheet, 'Receptacle Pattern Lookup');

    // Sheet 4: Master Bubble Lookup Reference
    if (this.masterBubbleLookupData.length > 0) {
      const masterBubbleSheet = XLSX.utils.json_to_sheet(this.masterBubbleLookupData);
      XLSX.utils.book_append_sheet(workbook, masterBubbleSheet, 'Master Bubble Lookup');
    }

    // Sheet 5: Export Summary and Instructions
    const summaryData = this.createExportSummarySheet(components);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Summary');

    // Generate the Excel buffer
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  // ENHANCED: Create sophisticated Design Canvas parsing rules
  private createOrderEntryHeaderSheet(components: DroppedComponent[]): any[][] {
    const orderEntryData: any[][] = [];
    let lineNumber = 1;
    
    // Header row based on PreSal output format structure
    orderEntryData.push([
      'Line', 'Qty', 'Choose receptacle', 'Select Cable/Conduit Type', 'Whip Length (ft)', 
      'Tail Length (ft)', 'Label Color (Background/Text)', 'building', 'PDU', 'Panel',
      'First Circuit', 'Second Circuit', 'Third Circuit', 'Cage', 'Cabinet Number',
      'Included Breaker', 'Mounting bolt', 'Conduit Size', 'Conductor AWG', 'Green AWG', 
      'Voltage', 'Box', 'L1', 'L2', 'L3', 'N', 'E', 'Drawing number', 'Notes to Enconnex',
      'Orderable Part number', 'base price', 'Per foot', 'length', 'Bolt adder',
      'assembled price', 'Breaker adder', 'Price to Wesco', 'List Price',
      'Budgetary pricing text', 'phase type', 'conductor count', 'neutral', 'current',
      'UseVoltage', 'plate hole', 'box', 'Box code', 'Box options', 'Breaker options'
    ]);

    // Apply sophisticated Design Canvas parsing rules
    const processedRows = this.applyDesignCanvasParsingRules(components);
    
    processedRows.forEach(rowData => {
      orderEntryData.push([
        (lineNumber++).toString(),
        rowData.qty,
        rowData.receptacle,
        rowData.cableConduitType,
        rowData.whipLength,
        rowData.tailLength,
        rowData.labelColor,
        rowData.building || '',
        rowData.pdu || '',
        rowData.panel || '',
        rowData.firstCircuit || '1',
        rowData.secondCircuit || '3',
        rowData.thirdCircuit || '5',
        rowData.cage || '',
        rowData.cabinetNumber || '',
        rowData.includedBreaker || '',
        rowData.mountingBolt || '',
        rowData.conduitSize,
        rowData.conductorAWG,
        rowData.greenAWG,
        rowData.voltage,
        rowData.box,
        rowData.l1 || '--------',
        rowData.l2 || '--------',
        rowData.l3 || '--------',
        rowData.n || '--------',
        rowData.e || '------->',
        rowData.drawingNumber,
        rowData.notesToEnconnex,
        rowData.orderablePartNumber,
        rowData.basePrice,
        rowData.perFoot || '6',
        rowData.length || '260',
        rowData.boltAdder || '0',
        rowData.assembledPrice,
        rowData.breakerAdder || '0',
        rowData.priceToWesco,
        rowData.listPrice,
        rowData.budgetaryPricingText,
        rowData.phaseType,
        rowData.conductorCount,
        rowData.neutral || '0',
        rowData.current,
        rowData.useVoltage,
        rowData.plateHole,
        rowData.boxCode,
        rowData.boxCode, // Box code duplicate
        rowData.boxOptions || '',
        rowData.breakerOptions
      ]);
    });

    return orderEntryData;
  }

  // NEW: Apply Design Canvas parsing rules where connectors/receptacles create new rows
  private applyDesignCanvasParsingRules(components: DroppedComponent[]): any[] {
    const processedRows: any[] = [];
    
    // Group components by spatial proximity and electrical relationships
    const componentGroups = this.groupComponentsByElectricalRelationships(components);
    
    componentGroups.forEach(group => {
      // Find the primary connector/receptacle that triggers the row creation
      const primaryConnector = this.findPrimaryConnector(group);
      
      if (primaryConnector) {
        // Create a new row with this connector/receptacle as the base
        const baseRowData = this.createBaseRowFromConnector(primaryConnector);
        
        // Place each design object in its appropriate cell based on component type
        group.forEach(component => {
          if (component.id !== primaryConnector.id) {
            this.placeComponentInAppropriateCell(baseRowData, component);
          }
        });
        
        processedRows.push(baseRowData);
      } else {
        // Handle non-connector components that don't trigger new rows
        if (group.length > 0) {
          const standaloneRowData = this.createStandaloneComponentRow(group[0]);
          group.slice(1).forEach(component => {
            this.placeComponentInAppropriateCell(standaloneRowData, component);
          });
          processedRows.push(standaloneRowData);
        }
      }
    });
    
    return processedRows;
  }

  // Group components by spatial proximity and electrical relationships
  private groupComponentsByElectricalRelationships(components: DroppedComponent[]): DroppedComponent[][] {
    const groups: DroppedComponent[][] = [];
    const processed = new Set<string>();
    const PROXIMITY_THRESHOLD = 150; // pixels
    
    components.forEach(component => {
      if (processed.has(component.id)) return;
      
      const currentGroup = [component];
      processed.add(component.id);
      
      // Find nearby components within threshold
      components.forEach(otherComponent => {
        if (processed.has(otherComponent.id)) return;
        
        const distance = Math.sqrt(
          Math.pow(component.x - otherComponent.x, 2) + 
          Math.pow(component.y - otherComponent.y, 2)
        );
        
        if (distance <= PROXIMITY_THRESHOLD) {
          currentGroup.push(otherComponent);
          processed.add(otherComponent.id);
        }
      });
      
      groups.push(currentGroup);
    });
    
    return groups;
  }

  // Find the primary connector/receptacle that should trigger row creation
  private findPrimaryConnector(components: DroppedComponent[]): DroppedComponent | null {
    // Priority order: receptacles > plugs > twist-lock > other connectors
    const receptacles = components.filter(c => 
      c.type === 'connector' && (c.name.includes('R') || c.specifications?.type === 'receptacle')
    );
    if (receptacles.length > 0) return receptacles[0];
    
    const plugs = components.filter(c => 
      c.type === 'connector' && (c.name.includes('P') || c.specifications?.type === 'plug')
    );
    if (plugs.length > 0) return plugs[0];
    
    const connectors = components.filter(c => c.type === 'connector');
    if (connectors.length > 0) return connectors[0];
    
    return null;
  }

  // Create base row data from the primary connector/receptacle
  private createBaseRowFromConnector(connector: DroppedComponent): any {
    const receptacleType = this.determineReceptacleType(connector);
    const basePrice = parseFloat(this.determineBasePrice(connector));
    const assembledPrice = parseFloat(this.determineAssembledPrice(connector));
    
    return {
      qty: '1',
      receptacle: receptacleType,
      cableConduitType: 'MCC', // Default, will be updated by cable components
      whipLength: '250', // Default, will be updated by length specifications
      tailLength: '10', // Default
      labelColor: 'Black (conduit)',
      conduitSize: '3/4', // Default, will be updated by conduit components
      conductorAWG: this.determineConductorAWG(connector),
      greenAWG: this.determineGroundAWG(connector),
      voltage: this.determineVoltage(connector),
      box: 'Standard Power Whip Box', // Default, will be updated by enclosure components
      drawingNumber: `PWxx-${receptacleType}T-xxSALx(103)`,
      notesToEnconnex: `Design Canvas: ${connector.name} at (${Math.round(connector.x)}, ${Math.round(connector.y)})`,
      orderablePartNumber: `PW250K-${receptacleType}T-DCxxSALx`,
      basePrice: basePrice.toString(),
      assembledPrice: assembledPrice.toString(),
      priceToWesco: assembledPrice.toString(),
      listPrice: this.determineListPrice(connector),
      budgetaryPricingText: `${connector.name} from Design Canvas - Position (${Math.round(connector.x)}, ${Math.round(connector.y)})`,
      phaseType: this.determinePhaseType(connector),
      conductorCount: this.determineConductorCount(connector),
      current: this.determineCurrent(connector),
      useVoltage: this.determineVoltage(connector),
      plateHole: this.determinePlateHole(connector),
      boxCode: this.determineBoxCode(connector),
      breakerOptions: this.determineBreakerOptions(connector)
    };
  }

  // Create row for standalone components (no connector triggers)
  private createStandaloneComponentRow(component: DroppedComponent): any {
    const basePrice = parseFloat(this.determineBasePrice(component));
    const assembledPrice = parseFloat(this.determineAssembledPrice(component));
    
    return {
      qty: '1',
      receptacle: `*${component.name}`,
      cableConduitType: this.determineCableType(component),
      whipLength: this.determineWhipLength(component),
      tailLength: this.determineTailLength(component),
      labelColor: this.determineLabelColor(component),
      conduitSize: this.determineConduitSize(component),
      conductorAWG: this.determineConductorAWG(component),
      greenAWG: this.determineGroundAWG(component),
      voltage: this.determineVoltage(component),
      box: this.determineBoxType(component),
      drawingNumber: `DCxx-${component.type.toUpperCase()}T-xxSALx`,
      notesToEnconnex: `Design Canvas: ${component.name} at (${Math.round(component.x)}, ${Math.round(component.y)})`,
      orderablePartNumber: `DC-${component.type.toUpperCase()}-${component.id.slice(-8)}`,
      basePrice: basePrice.toString(),
      assembledPrice: assembledPrice.toString(),
      priceToWesco: assembledPrice.toString(),
      listPrice: this.determineListPrice(component),
      budgetaryPricingText: `${component.name} from Design Canvas - Position (${Math.round(component.x)}, ${Math.round(component.y)})`,
      phaseType: this.determinePhaseType(component),
      conductorCount: this.determineConductorCount(component),
      current: this.determineCurrent(component),
      useVoltage: this.determineVoltage(component),
      plateHole: this.determinePlateHole(component),
      boxCode: this.determineBoxCode(component),
      breakerOptions: this.determineBreakerOptions(component)
    };
  }

  // Place each design object in its appropriate cell based on component type
  private placeComponentInAppropriateCell(baseRowData: any, component: DroppedComponent): void {
    switch (component.type) {
      case 'wire':
      case 'cable':
        // Wire/Cable components update cable/conduit type and conductor specifications
        baseRowData.cableConduitType = this.determineCableType(component);
        baseRowData.conductorAWG = this.determineConductorAWG(component);
        if (component.specifications?.length) {
          baseRowData.whipLength = component.specifications.length.toString();
        }
        baseRowData.notesToEnconnex += ` | Cable: ${component.name}`;
        break;
        
      case 'protection':
        // Protection components (breakers) update breaker specifications
        baseRowData.includedBreaker = component.name;
        baseRowData.breakerOptions = this.determineBreakerOptions(component);
        baseRowData.current = this.determineCurrent(component);
        baseRowData.notesToEnconnex += ` | Breaker: ${component.name}`;
        break;
        
      case 'enclosure':
        // Enclosure components update box specifications
        baseRowData.box = component.name;
        baseRowData.boxCode = this.determineBoxCode(component);
        baseRowData.notesToEnconnex += ` | Enclosure: ${component.name}`;
        break;
        
      case 'fitting':
        // Fitting components update conduit size and mounting specifications
        if (component.specifications?.size || component.name.match(/(\d+\/\d+|\d+)"/)) {
          const sizeMatch = component.name.match(/(\d+\/\d+|\d+)"/);
          if (sizeMatch) {
            baseRowData.conduitSize = sizeMatch[1] + '"';
          }
        }
        baseRowData.mountingBolt = component.name;
        baseRowData.notesToEnconnex += ` | Fitting: ${component.name}`;
        break;
        
      case 'terminal':
        // Terminal components update connection specifications
        baseRowData.notesToEnconnex += ` | Terminal: ${component.name}`;
        break;
        
      default:
        // Other components get added to notes
        baseRowData.notesToEnconnex += ` | ${component.type}: ${component.name}`;
        break;
    }
  }

  // Helper functions for Parse Processing logic
  private determineReceptacleType(component: DroppedComponent): string {
    if (component.name.includes('NEMA')) {
      return component.name.replace(/NEMA\s*/i, '');
    }
    if (component.specifications?.pattern) {
      return component.specifications.pattern;
    }
    return component.name;
  }

  private determineCableType(component: DroppedComponent): string {
    if (component.type === 'wire' || component.name.toLowerCase().includes('cable')) {
      return 'MC';
    }
    return 'MCC'; // Default
  }

  private determineWhipLength(component: DroppedComponent): string {
    if (component.specifications?.length) {
      return component.specifications.length.toString();
    }
    return '250'; // Default
  }

  private determineTailLength(component: DroppedComponent): string {
    return '10'; // Default
  }

  private determineLabelColor(component: DroppedComponent): string {
    return 'Black (conduit)'; // Default
  }

  private determineConduitSize(component: DroppedComponent): string {
    if (component.specifications?.conduitSize) {
      return component.specifications.conduitSize;
    }
    return '3/4'; // Default
  }

  private determineConductorAWG(component: DroppedComponent): string {
    if (component.specifications?.gauge) {
      return component.specifications.gauge.toString();
    }
    if (component.name.includes('12 AWG')) return '12';
    if (component.name.includes('14 AWG')) return '14';
    if (component.name.includes('10 AWG')) return '10';
    return '6'; // Default
  }

  private determineGroundAWG(component: DroppedComponent): string {
    return '8'; // Default
  }

  private determineVoltage(component: DroppedComponent): string {
    if (component.specifications?.voltage) {
      return component.specifications.voltage.toString();
    }
    return '208'; // Default
  }

  private determineBoxType(component: DroppedComponent): string {
    if (component.type === 'enclosure' || component.name.toLowerCase().includes('box')) {
      return component.name;
    }
    return 'Standard Power Whip Box'; // Default
  }

  private determineBasePrice(component: DroppedComponent): string {
    if (component.specifications?.price || component.specifications?.cost) {
      return (component.specifications.price || component.specifications.cost).toString();
    }
    return '287.2'; // Default
  }

  private determineAssembledPrice(component: DroppedComponent): string {
    const basePrice = parseFloat(this.determineBasePrice(component));
    return (basePrice * 6.4).toFixed(1); // Base price * factor
  }

  private determineListPrice(component: DroppedComponent): string {
    const assembledPrice = parseFloat(this.determineAssembledPrice(component));
    return (assembledPrice * 1.33).toFixed(2); // Assembled price * markup
  }

  private determinePhaseType(component: DroppedComponent): string {
    if (component.specifications?.phases || component.specifications?.poles) {
      const phases = component.specifications.phases || component.specifications.poles;
      return phases === 1 ? '1P' : phases === 3 ? '3D' : '1P';
    }
    return '3D'; // Default
  }

  private determineConductorCount(component: DroppedComponent): string {
    if (component.specifications?.conductors) {
      return component.specifications.conductors.toString();
    }
    if (component.specifications?.poles) {
      return component.specifications.poles.toString();
    }
    return '3'; // Default
  }

  private determineCurrent(component: DroppedComponent): string {
    if (component.specifications?.current) {
      return component.specifications.current.toString();
    }
    if (component.specifications?.rating) {
      return component.specifications.rating.toString();
    }
    return '60'; // Default
  }

  private determinePlateHole(component: DroppedComponent): string {
    const current = this.determineCurrent(component);
    return `${current}AH`;
  }

  private determineBoxCode(component: DroppedComponent): string {
    const current = this.determineCurrent(component);
    return `${current}AH`;
  }

  private determineBreakerOptions(component: DroppedComponent): string {
    if (component.type === 'protection' || component.name.toLowerCase().includes('breaker')) {
      const current = this.determineCurrent(component);
      return `${this.determinePhaseType(component) === '1P' ? '1' : '3'} Pole, ${current}A, 240/120V, Bolt in, 22KA, Square D, QOB${current}0VH`;
    }
    return '3 Pole, 60A, 240/120V, Bolt in, 22KA, Square D, QOB360VH'; // Default
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