import * as XLSX from 'node-xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ExcelData {
  sheetName: string;
  data: any[][];
}

export interface ComponentData {
  partNumber?: string;
  description?: string;
  category?: string;
  specifications?: Record<string, any>;
  pricing?: number;
  availability?: boolean;
  manufacturer?: string;
}

export interface BOMEntry {
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  category?: string;
}

export function parseExcelFile(filePath: string): ExcelData[] {
  try {
    const workbook = XLSX.parse(fs.readFileSync(filePath));
    return workbook.map(sheet => ({
      sheetName: sheet.name,
      data: sheet.data
    }));
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    return [];
  }
}

export function extractComponentData(sheets: ExcelData[]): ComponentData[] {
  const components: ComponentData[] = [];
  
  for (const sheet of sheets) {
    // Skip empty sheets
    if (!sheet.data || sheet.data.length === 0) continue;
    
    // Assume first row contains headers
    const headers = sheet.data[0];
    if (!headers) continue;
    
    // Process each data row
    for (let i = 1; i < sheet.data.length; i++) {
      const row = sheet.data[i];
      if (!row || row.length === 0) continue;
      
      const component: ComponentData = {};
      
      // Map common column names to component properties
      headers.forEach((header: string, index: number) => {
        const value = row[index];
        if (value === undefined || value === null || value === '') return;
        
        const headerLower = header?.toString().toLowerCase() || '';
        
        if (headerLower.includes('part') && headerLower.includes('number')) {
          component.partNumber = value.toString();
        } else if (headerLower.includes('description') || headerLower.includes('desc')) {
          component.description = value.toString();
        } else if (headerLower.includes('category') || headerLower.includes('type')) {
          component.category = value.toString();
        } else if (headerLower.includes('price') || headerLower.includes('cost')) {
          component.pricing = parseFloat(value.toString()) || 0;
        } else if (headerLower.includes('manufacturer') || headerLower.includes('mfg')) {
          component.manufacturer = value.toString();
        } else if (headerLower.includes('available') || headerLower.includes('stock')) {
          component.availability = Boolean(value);
        } else {
          // Store other specifications
          if (!component.specifications) component.specifications = {};
          component.specifications[header] = value;
        }
      });
      
      // Only add if we have meaningful data
      if (component.partNumber || component.description) {
        components.push(component);
      }
    }
  }
  
  return components;
}

export function generateBOM(components: ComponentData[], quantities: Record<string, number> = {}): BOMEntry[] {
  return components.map(comp => ({
    partNumber: comp.partNumber || 'N/A',
    description: comp.description || 'No description',
    quantity: quantities[comp.partNumber || ''] || 1,
    unitPrice: comp.pricing,
    totalPrice: comp.pricing ? comp.pricing * (quantities[comp.partNumber || ''] || 1) : undefined,
    category: comp.category
  }));
}

export function analyzeExcelStructure(filePath: string): {
  sheets: string[];
  totalRows: number;
  sampleData: Record<string, any[]>;
} {
  const sheets = parseExcelFile(filePath);
  const analysis = {
    sheets: sheets.map(s => s.sheetName),
    totalRows: sheets.reduce((sum, sheet) => sum + sheet.data.length, 0),
    sampleData: {} as Record<string, any[]>
  };
  
  // Get sample data from each sheet
  sheets.forEach(sheet => {
    analysis.sampleData[sheet.sheetName] = sheet.data.slice(0, 5); // First 5 rows
  });
  
  return analysis;
}