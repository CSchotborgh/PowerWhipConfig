import * as XLSX from 'xlsx';

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
  constructor() {
    // Fast, lightweight constructor
  }

  public async exportDesignCanvas(exportData: DesignCanvasExportRequest): Promise<Buffer> {
    const { components } = exportData;
    
    // Fast path: Create minimal, optimized export
    const workbook = XLSX.utils.book_new();

    // Only create essential sheets - optimized for speed
    const orderEntryData = this.createOptimizedOrderEntrySheet(components);
    const orderEntrySheet = XLSX.utils.aoa_to_sheet(orderEntryData);
    XLSX.utils.book_append_sheet(workbook, orderEntrySheet, 'Order Entry');

    const designCanvasData = this.createOptimizedDesignCanvasSheet(components);
    const designCanvasSheet = XLSX.utils.json_to_sheet(designCanvasData);
    XLSX.utils.book_append_sheet(workbook, designCanvasSheet, 'Design Canvas Output');

    // Generate Excel buffer with minimal processing
    return XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx',
      compression: false // Disable compression for speed
    });
  }

  // OPTIMIZED: Fast Order Entry Sheet Creation
  private createOptimizedOrderEntrySheet(components: DroppedComponent[]): any[][] {
    const orderEntryData: any[][] = [];
    
    // Simple header row
    orderEntryData.push([
      'Line', 'Qty', 'Choose receptacle', 'Select Cable/Conduit Type', 'Whip Length (ft)', 
      'Tail Length (ft)', 'Drawing number', 'Notes', 'Unit Price', 'Extended Price'
    ]);

    // Fast component processing - no complex parsing rules
    components.forEach((component, index) => {
      const receptacle = component.specifications?.['Choose receptacle'] || component.name || 'Unknown';
      const qty = 1;
      const unitPrice = component.specifications?.['Unit Price'] || 0;
      
      orderEntryData.push([
        (index + 1).toString(),
        qty,
        receptacle,
        component.specifications?.['Cable Type'] || 'LFMC',
        component.specifications?.['Length'] || '6',
        component.specifications?.['Tail Length'] || '3',
        `DWG-${index + 1}`,
        `Design Canvas Component: ${component.type}`,
        unitPrice,
        unitPrice * qty
      ]);
    });

    return orderEntryData;
  }

  // OPTIMIZED: Fast Design Canvas Sheet Creation
  private createOptimizedDesignCanvasSheet(components: DroppedComponent[]): any[] {
    return components.map((component, index) => ({
      'Line': index + 1,
      'Component ID': component.id,
      'Component Name': component.name,
      'Component Type': component.type,
      'X Position': component.x,
      'Y Position': component.y,
      'Part Number': component.partNumber || '',
      'Specifications': JSON.stringify(component.specifications || {}),
      'Export Time': new Date().toISOString()
    }));
  }
}