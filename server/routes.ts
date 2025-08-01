import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPowerWhipConfigurationSchema, insertElectricalComponentSchema } from "@shared/schema";
import { ExcelFormulaExtractor } from "./excelFormulaExtractor";
import { z } from "zod";
import { parseExcelFile, extractComponentData, analyzeExcelStructure, generateBOM } from "./excelParser";
import * as path from "path";
import { fileURLToPath } from 'url';
import multer from "multer";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

// Store uploaded files in memory for processing
const uploadedFiles = new Map<string, { buffer: Buffer; originalName: string; uploadedAt: Date; workbook: any }>();

// Enhanced categorization functions for drag and drop components
function determineDragType(component: any): string {
  const desc = (component.description || '').toLowerCase();
  
  if (desc.includes('plug') || desc.includes('connector')) return 'connector';
  if (desc.includes('receptacle') || desc.includes('outlet')) return 'receptacle';
  if (desc.includes('cord') || desc.includes('cable') || desc.includes('wire')) return 'cable';
  if (desc.includes('conduit') || desc.includes('lfmc')) return 'conduit';
  if (desc.includes('box') || desc.includes('enclosure')) return 'enclosure';
  if (desc.includes('breaker') || desc.includes('fuse')) return 'protection';
  if (desc.includes('switch') || desc.includes('disconnect')) return 'control';
  if (desc.includes('light') || desc.includes('lamp')) return 'lighting';
  
  return 'misc';
}

function categorizeComponent(component: any): string {
  const type = determineDragType(component);
  
  switch (type) {
    case 'connector':
      return 'Connectors & Plugs';
    case 'receptacle':
      return 'Receptacles & Outlets';
    case 'cable':
      return 'Cables & Wiring';
    case 'conduit':
      return 'Conduit & Raceways';
    case 'enclosure':
      return 'Enclosures & Boxes';
    case 'protection':
      return 'Circuit Protection';
    case 'control':
      return 'Controls & Switches';
    case 'lighting':
      return 'Lighting Components';
    default:
      return 'Miscellaneous';
  }
}

function enhanceSpecifications(component: any): Record<string, any> {
  const enhanced = component.specifications ? { ...component.specifications } : {};
  const desc = (component.description || '').toLowerCase();
  
  // Extract voltage ratings
  const voltageMatch = desc.match(/(\d+)v/i);
  if (voltageMatch) enhanced.voltage = parseInt(voltageMatch[1]);
  
  // Extract current ratings
  const currentMatch = desc.match(/(\d+)a/i);
  if (currentMatch) enhanced.current = parseInt(currentMatch[1]);
  
  // Extract wire gauge
  const gaugeMatch = desc.match(/(\d+)\s*awg/i);
  if (gaugeMatch) enhanced.wireGauge = `${gaugeMatch[1]} AWG`;
  
  // Extract NEMA ratings
  const nemaMatch = desc.match(/nema\s*(\d+[xr]?)/i);
  if (nemaMatch) enhanced.nemaRating = `NEMA ${nemaMatch[1]}`;
  
  return enhanced;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Power Whip Configuration routes
  app.get("/api/configurations", async (_req, res) => {
    try {
      const configurations = await storage.getAllConfigurations();
      res.json(configurations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configurations" });
    }
  });

  app.get("/api/configurations/:id", async (req, res) => {
    try {
      const configuration = await storage.getConfiguration(req.params.id);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(configuration);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch configuration" });
    }
  });

  app.post("/api/configurations", async (req, res) => {
    try {
      const validatedData = insertPowerWhipConfigurationSchema.parse(req.body);
      const configuration = await storage.createConfiguration(validatedData);
      res.status(201).json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create configuration" });
    }
  });

  app.patch("/api/configurations/:id", async (req, res) => {
    try {
      const validatedData = insertPowerWhipConfigurationSchema.partial().parse(req.body);
      const configuration = await storage.updateConfiguration(req.params.id, validatedData);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.json(configuration);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update configuration" });
    }
  });

  app.delete("/api/configurations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConfiguration(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete configuration" });
    }
  });

  // Electrical Component routes
  app.get("/api/components", async (_req, res) => {
    try {
      const components = await storage.getAllComponents();
      res.json(components);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch components" });
    }
  });

  app.get("/api/components/type/:type", async (req, res) => {
    try {
      const components = await storage.getComponentsByType(req.params.type);
      res.json(components);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch components by type" });
    }
  });

  app.get("/api/components/:id", async (req, res) => {
    try {
      const component = await storage.getComponent(req.params.id);
      if (!component) {
        return res.status(404).json({ message: "Component not found" });
      }
      res.json(component);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch component" });
    }
  });

  app.post("/api/components", async (req, res) => {
    try {
      const validatedData = insertElectricalComponentSchema.parse(req.body);
      const component = await storage.createComponent(validatedData);
      res.status(201).json(component);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid component data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create component" });
    }
  });

  // Export routes
  app.post("/api/export/xlsx/:id", async (req, res) => {
    try {
      const configuration = await storage.getConfiguration(req.params.id);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      // Return configuration data for client-side XLSX generation
      res.json({
        configuration,
        components: await storage.getAllComponents(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to prepare export data" });
    }
  });

  app.post("/api/export/pdf/:id", async (req, res) => {
    try {
      const configuration = await storage.getConfiguration(req.params.id);
      if (!configuration) {
        return res.status(404).json({ message: "Configuration not found" });
      }
      
      // Return configuration data for client-side PDF generation
      res.json({
        configuration,
        components: await storage.getAllComponents(),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to prepare export data" });
    }
  });

  // Excel data analysis routes
  app.get("/api/excel/analyze", async (_req, res) => {
    try {
      const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753982166714.xlsx');
      const analysis = analyzeExcelStructure(filePath);
      res.json(analysis);
    } catch (error) {
      console.error('Excel analysis error:', error);
      res.status(500).json({ message: "Failed to analyze Excel file" });
    }
  });

  app.get("/api/excel/components", async (_req, res) => {
    try {
      // Use the latest lookup file with enhanced data
      const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753986672989.xlsx');
      const sheets = parseExcelFile(filePath);
      const components = extractComponentData(sheets);
      
      // Enhanced component categorization for drag and drop
      const categorizedComponents = components.map(comp => ({
        ...comp,
        dragType: determineDragType(comp),
        category: categorizeComponent(comp),
        specifications: enhanceSpecifications(comp)
      }));
      
      res.json(categorizedComponents);
    } catch (error) {
      console.error('Excel components error:', error);
      res.status(500).json({ message: "Failed to extract components from Excel" });
    }
  });

  // Excel transformation routes
  app.post("/api/excel/transform", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const patterns = JSON.parse(req.body.patterns || '[]');
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse the uploaded Excel file
      const XLSX = require('xlsx');
      const workbook = XLSX.read(file.buffer);
      const sheetNames = workbook.SheetNames;
      
      let allData: any[] = [];
      
      // Extract data from all sheets
      for (const sheetName of sheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        jsonData.forEach((row: any[], rowIndex: number) => {
          if (row.length > 0) {
            allData.push({
              sheet: sheetName,
              row: rowIndex + 1,
              data: row,
              content: row.join(' ')
            });
          }
        });
      }

      res.json({ data: allData });
    } catch (error) {
      console.error('Error transforming Excel file:', error);
      res.status(500).json({ error: 'Failed to transform Excel file' });
    }
  });

  // Natural language to technical mapping
  const naturalLanguageMappings = {
    conduitTypes: {
      'liquid tight conduit': 'LMZC',
      'liquid tight': 'LMZC', 
      'flexible metal conduit': 'FMC',
      'metal conduit': 'MCC',
      'liquidtight flexible metal conduit': 'LFMC',
      'thermoplastic': 'TO',
      'service cable': 'SO'
    },
    receptacleTypes: {
      'iec pinned and sleeve plug': 'CS8269A',
      'iec pin and sleeve': 'CS8269A',
      'nema 5-15': '460C9W',
      'nema 5-20': '460R9W',
      'nema 6-15': 'L6-15R',
      'nema 6-20': 'L6-20R',
      'nema l5-20': 'L5-20R',
      'nema l5-30': 'L5-30R'
    },
    colors: {
      'red': 'Red',
      'orange': 'Orange', 
      'blue': 'Blue',
      'yellow': 'Yellow',
      'purple': 'Purple',
      'tan': 'Tan',
      'pink': 'Pink',
      'gray': 'Gray',
      'grey': 'Gray',
      'green': 'Green',
      'black': 'Black'
    }
  };

  // Parse natural language specifications into structured patterns
  const parseNaturalLanguageSpecification = (text: string) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    const specification = {
      totalQuantity: 0,
      lengthRange: { min: 20, max: 80, step: 20 },
      conduitType: 'LMZC',
      receptacleType: 'CS8269A',
      colors: ['Red', 'Orange', 'Blue', 'Yellow'],
      tailLength: '10',
      features: [] as string[]
    };

    // Parse each line for specifications
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      
      // Extract total quantity
      const quantityMatch = line.match(/(\d+)\s*power\s*whips?\s*total/i);
      if (quantityMatch) {
        specification.totalQuantity = parseInt(quantityMatch[1]);
      }
      
      // Extract length range
      const lengthMatch = line.match(/(\d+)['']?\s*-\s*(\d+)['']?/);
      if (lengthMatch && lowerLine.includes('length')) {
        specification.lengthRange.min = parseInt(lengthMatch[1]);
        specification.lengthRange.max = parseInt(lengthMatch[2]);
      }
      
      // Map conduit types
      Object.entries(naturalLanguageMappings.conduitTypes).forEach(([key, value]) => {
        if (lowerLine.includes(key)) {
          specification.conduitType = value;
        }
      });
      
      // Map receptacle types
      Object.entries(naturalLanguageMappings.receptacleTypes).forEach(([key, value]) => {
        if (lowerLine.includes(key)) {
          specification.receptacleType = value;
        }
      });
      
      // Extract colors
      const colorMatches = Object.keys(naturalLanguageMappings.colors).filter(color => 
        lowerLine.includes(color)
      );
      if (colorMatches.length > 0) {
        specification.colors = colorMatches.map(color => 
          naturalLanguageMappings.colors[color as keyof typeof naturalLanguageMappings.colors]
        );
      }
      
      // Store additional features
      if (lowerLine.includes('ip67') || lowerLine.includes('bell box')) {
        specification.features.push('IP67 bell box included');
      }
      if (lowerLine.includes('60a') || lowerLine.includes('60 amp')) {
        specification.features.push('60A');
      }
      if (lowerLine.includes('#6 awg') || lowerLine.includes('5 wires')) {
        specification.features.push('5 wires - #6 AWG');
      }
    });

    return specification;
  };

  // Generate equal distribution patterns from natural language specification
  const generateDistributionPatterns = (specification: any) => {
    const patterns = [];
    const { totalQuantity, lengthRange, conduitType, receptacleType, colors, tailLength } = specification;
    
    if (totalQuantity === 0) return [];
    
    // Calculate length steps (20', 40', 60', 80')
    const lengths = [];
    for (let length = lengthRange.min; length <= lengthRange.max; length += lengthRange.step) {
      lengths.push(length);
    }
    
    // Calculate equal distribution
    const totalConfigurations = lengths.length * colors.length;
    const baseQuantityPerConfig = Math.floor(totalQuantity / totalConfigurations);
    const remainder = totalQuantity % totalConfigurations;
    
    let configIndex = 0;
    
    // Generate patterns with equal distribution
    lengths.forEach(length => {
      colors.forEach(color => {
        const quantity = baseQuantityPerConfig + (configIndex < remainder ? 1 : 0);
        
        // Generate the specified quantity of this configuration
        for (let i = 0; i < quantity; i++) {
          patterns.push(`${receptacleType}, ${conduitType}, ${length}, ${tailLength}, ${color}`);
        }
        
        configIndex++;
      });
    });
    
    return patterns;
  };

  // Helper function to parse comma-delimited patterns with quantity support
  const parseReceptaclePattern = (pattern: string) => {
    // Check for exclamation mark delimiter for quantity
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
  };

  app.post("/api/excel/export-master-bubble", async (req, res) => {
    try {
      const { receptacles, rawData } = req.body;
      const XLSX = require('xlsx');
      
      // Create workbook with Order Entry format matching MasterBubbleUpLookup structure
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
      
      // Add receptacle data based on lookup results with comma-delimited parsing
      let lineNumber = 1;
      receptacles.forEach((receptacle: any) => {
        // Handle natural language generated patterns
        if (receptacle.generatedPatterns && receptacle.generatedPatterns.length > 0) {
          receptacle.generatedPatterns.forEach((generatedPattern: string) => {
            const parsedPattern = parseReceptaclePattern(generatedPattern);
            orderEntryData.push([
              (lineNumber++).toString(),
              '1', // Each row is 1 unit
              parsedPattern.receptacle,
              parsedPattern.cableConduitType,
              parsedPattern.whipLength,
              parsedPattern.tailLength,
              parsedPattern.labelColor,
              '', '', '', '1', '', '', '', '', '', '', '3/4', '6', '8', '208', 
              '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 
              '', '', '', '3 phase', '5', 'yes', '60', '208', '', '', '60AH', '', 
              '3 Pole, 60A, 240/120V, Bolt in, 22KA, Square D, QOB360VH'
            ]);
          });
          return; // Skip normal processing for natural language patterns
        }
        
        // Handle quantity-based patterns with ! delimiter
        if (receptacle.isQuantityBased && receptacle.generatedPatterns) {
          receptacle.generatedPatterns.forEach((generatedPattern: string) => {
            const parsedPattern = parseReceptaclePattern(generatedPattern);
            orderEntryData.push([
              (lineNumber++).toString(),
              '1', // Each row is 1 unit
              parsedPattern.receptacle,
              parsedPattern.cableConduitType,
              parsedPattern.whipLength,
              parsedPattern.tailLength,
              parsedPattern.labelColor,
              '', '', '', '1', '', '', '', '', '', '', '3/4', '6', '8', '208', 
              '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 
              '', '', '', '3 phase', '5', 'yes', '60', '208', '', '', '60AH', '', 
              '3 Pole, 60A, 240/120V, Bolt in, 22KA, Square D, QOB360VH'
            ]);
          });
          return; // Skip normal processing for quantity-based patterns
        }
        
        // Parse comma-delimited pattern if present
        const parsedPattern = parseReceptaclePattern(receptacle.type);
        
        receptacle.matches.forEach((match: any) => {
          if (match.sourceRow) {
            // Use actual data from MasterBubbleUpLookup with comma-delimited overrides
            const specs = match.sourceRow.specifications || {};
            orderEntryData.push([
              (lineNumber++).toString(),
              '1', // Each row is 1 unit (user input count handled by creating multiple rows)
              parsedPattern.receptacle || specs['Choose receptacle'] || receptacle.type,
              parsedPattern.cableConduitType || specs['Select Cable/Conduit Type'] || 'MCC',
              parsedPattern.whipLength || specs['Whip Length (ft)'] || '250',
              parsedPattern.tailLength || specs['Tail Length (ft)'] || '10',
              parsedPattern.labelColor || specs['Label Color (Background/Text)'] || 'Black (conduit)',
              specs['building'] || '',
              specs['PDU'] || '',
              specs['Panel'] || '',
              specs['First Circuit'] || '1',
              specs['Second Circuit'] || '3',
              specs['Third Circuit'] || '5',
              specs['Cage'] || '',
              specs['Cabinet Number'] || '',
              specs['Included Breaker'] || '',
              specs['Mounting bolt'] || '',
              specs['Conduit Size'] || '3/4',
              specs['Conductor AWG'] || '6',
              specs['Green AWG'] || '8',
              specs['Voltage'] || '208',
              specs['Box'] || specs['Box'] || 'Backshell, Cast Aluminum, 15 Degree 60A',
              specs['L1'] || '--------',
              specs['L2'] || '--------',
              specs['L3'] || '--------',
              specs['N'] || '--------',
              specs['E'] || '------->',
              specs['Drawing number'] || `PWxx-${receptacle.type}T-xxSALx(103)`,
              specs['Notes to Enconnex'] || 'MC Cable Wire Colors Black/White/Red/Blue/Green',
              specs['Orderable Part number'] || `PW250K-${receptacle.type}T-D${lineNumber}SAL1234`,
              specs['base price'] || '287.2',
              specs['Per foot'] || '6',
              specs['length'] || '260',
              specs['Bolt adder'] || '0',
              specs['assembled price'] || '1847.2',
              specs['Breaker adder'] || '0',
              specs['Price to Wesco'] || '1847.2',
              specs['List Price'] || '2462.933333',
              specs['Budgetary pricing text'] || `Whip ${receptacle.type} 6AWG 3/4MCC 250ft, Price to Wesco 1847.2ea`,
              specs['phase type'] || '3D',
              specs['conductor count'] || '3',
              specs['neutral'] || '0',
              specs['current'] || '60',
              specs['UseVoltage'] || '208',
              specs['plate hole'] || '60AH',
              specs['box'] || '60AH',
              specs['Box code'] || '60AH',
              specs['Box options'] || specs['Box options'] || '',
              specs['Breaker options'] || specs['Breaker options'] || '3 Pole, 60A, 240/120V, Bolt in, 22KA, Square D, QOB360VH'
            ]);
          } else {
            // Create default row for unmatched patterns with comma-delimited parsing
            const parsedPattern = parseReceptaclePattern(receptacle.type);
            orderEntryData.push([
              (lineNumber++).toString(),
              '1',
              parsedPattern.receptacle || `*${receptacle.type}`, // Use parsed or mark as unfound
              parsedPattern.cableConduitType || 'MCC',
              parsedPattern.whipLength || '250',
              parsedPattern.tailLength || '10',
              parsedPattern.labelColor || 'Black (conduit)',
              '', '', '', '1', '3', '5', '', '', '', '', '3/4', '6', '8', '208',
              'Standard Power Whip Box',
              '--------', '--------', '--------', '--------', '------->',
              `*PWxx-${receptacle.type}T-xxSALx(103)`,
              `*${receptacle.type} - Pattern not found in MasterBubbleUpLookup data`,
              `*PW250K-${receptacle.type}T-D${lineNumber}SAL1234`,
              '287.2', '6', '260', '0', '1847.2', '0', '1847.2', '2462.933333',
              `*Whip ${receptacle.type} 6AWG 3/4MCC 250ft - Pattern not found in lookup`,
              '3D', '3', '0', '60', '208', '60AH', '60AH', '60AH', '',
              '3 Pole, 60A, 240/120V, Bolt in, 22KA, Square D, QOB360VH'
            ]);
          }
        });
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(orderEntryData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Entry');
      
      // Generate Excel buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=MasterBubbleTransformed.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error('Error exporting Master Bubble format:', error);
      res.status(500).json({ error: 'Failed to export Master Bubble format' });
    }
  });

  app.post("/api/excel/bom", async (req, res) => {
    try {
      const { componentIds, quantities } = req.body;
      const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753982166714.xlsx');
      const sheets = parseExcelFile(filePath);
      const components = extractComponentData(sheets);
      
      const selectedComponents = components.filter(comp => 
        componentIds.includes(comp.partNumber)
      );
      
      const bom = generateBOM(selectedComponents, quantities);
      res.json(bom);
    } catch (error) {
      console.error('BOM generation error:', error);
      res.status(500).json({ message: "Failed to generate BOM" });
    }
  });

  // Helper function to process CSV files
  const processCSVFile = (buffer: Buffer): any => {
    const csvString = buffer.toString('utf8');
    const result = Papa.parse(csvString, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    // Convert CSV data to Excel-like structure
    const headers = result.meta.fields || [];
    const data = result.data as any[];
    
    return {
      sheetNames: ['Sheet1'],
      sheets: {
        'Sheet1': {
          rowCount: data.length + 1, // +1 for header
          columnCount: headers.length,
          headers,
          sampleData: [headers, ...data.slice(0, 10).map(row => headers.map(h => row[h]))]
        }
      }
    };
  };

  // Helper function to analyze workbook structure for uploaded files
  const analyzeUploadedWorkbook = (workbook: any): any => {
    const sheetNames = workbook.SheetNames || [];
    const sheets: any = {};
    
    sheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      sheets[sheetName] = {
        rowCount: jsonData.length,
        columnCount: jsonData.length > 0 ? (jsonData[0] as any[]).length : 0,
        headers: jsonData[0] || [],
        sampleData: jsonData.slice(0, 10)
      };
    });
    
    return { sheetNames, sheets };
  };

  // Upload Excel or CSV file for analysis and editing
  app.post('/api/excel/upload', upload.single('excelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileId = Date.now().toString();
      const isCSV = req.file.originalname.toLowerCase().endsWith('.csv');
      
      let workbook: any;
      let analysis: any;

      if (isCSV) {
        // Process CSV file
        analysis = processCSVFile(req.file.buffer);
        // Create a mock workbook structure for CSV
        const csvData = Papa.parse(req.file.buffer.toString('utf8'), { header: false }).data;
        workbook = {
          SheetNames: ['Sheet1'],
          Sheets: {
            'Sheet1': XLSX.utils.aoa_to_sheet(csvData)
          }
        };
      } else {
        // Process Excel file
        workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        analysis = analyzeUploadedWorkbook(workbook);
      }
      
      uploadedFiles.set(fileId, {
        buffer: req.file.buffer,
        originalName: req.file.originalname,
        uploadedAt: new Date(),
        workbook
      });

      res.json({
        fileId,
        originalName: req.file.originalname,
        fileType: isCSV ? 'csv' : 'excel',
        analysis
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'Failed to upload and analyze file' });
    }
  });

  // Get analysis of uploaded file by ID
  app.get('/api/excel/uploaded/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const fileData = uploadedFiles.get(fileId);
      
      if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
      }

      const analysis = analyzeUploadedWorkbook(fileData.workbook);
      
      res.json({
        fileId,
        originalName: fileData.originalName,
        uploadedAt: fileData.uploadedAt,
        analysis
      });
    } catch (error) {
      console.error('File analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze uploaded file' });
    }
  });

  // Update cell data in uploaded file
  app.post('/api/excel/uploaded/:fileId/update-cell', async (req, res) => {
    try {
      const { fileId } = req.params;
      const { sheetName, cellRef, value, formula } = req.body;
      
      const fileData = uploadedFiles.get(fileId);
      if (!fileData) {
        return res.status(404).json({ error: 'File not found' });
      }

      const worksheet = fileData.workbook.Sheets[sheetName];
      if (!worksheet) {
        return res.status(404).json({ error: 'Sheet not found' });
      }

      // Update the cell
      if (formula) {
        worksheet[cellRef] = { f: formula, v: value };
      } else {
        worksheet[cellRef] = { v: value };
      }

      res.json({ success: true, cellRef, value, formula });
    } catch (error) {
      console.error('Cell update error:', error);
      res.status(500).json({ error: 'Failed to update cell' });
    }
  });

  // Analyze ConfiguratorModelDatasetEPW structure with detailed enum/dropdown detection
  app.get('/api/excel/analyze-configurator', async (req, res) => {
    try {
      const filePath = './attached_assets/ConfiguratorModelDatasetEPW_1754006250837.xlsx';
      
      // Check if file exists before processing
      const fs = require('fs');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'ConfiguratorModelDatasetEPW file not found' });
      }
      
      const workbook = XLSX.readFile(filePath);
      
      const analysis = {
        sheetNames: workbook.SheetNames,
        sheets: {} as any,
        receptacleInputCells: [] as any[],
        expressionPatterns: [] as any[],
        enumDropdowns: {} as any
      };
      
      // Analyze each sheet for configurator structure
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const objectData = XLSX.utils.sheet_to_json(worksheet);
        
        // Detect input cells, enums, and expression patterns
        const inputCells: any[] = [];
        const expressionCells: any[] = [];
        const enumColumns: any = {};
        
        // Scan for receptacle input patterns and dropdown enums
        (jsonData as any[][]).forEach((row: any[], rowIdx) => {
          row.forEach((cell, colIdx) => {
            if (cell && typeof cell === 'string') {
              // Look for receptacle input patterns
              if (cell.match(/^[A-Z0-9]{3,10}[A-Z]?\d*[A-Z]*$/)) {
                inputCells.push({
                  value: cell,
                  row: rowIdx,
                  col: colIdx,
                  type: 'receptacle_id'
                });
              }
              
              // Look for expression patterns (formulas, calculations)
              if (cell.includes('=') || cell.includes('$') || cell.match(/PWx+|SAL\d+/)) {
                expressionCells.push({
                  value: cell,
                  row: rowIdx,
                  col: colIdx,
                  type: 'expression'
                });
              }
            }
          });
        });
        
        // Detect enum/dropdown columns by analyzing unique values
        if (jsonData.length > 1) {
          const headers = jsonData[0] || [];
          headers.forEach((header, colIdx) => {
            if (header && typeof header === 'string') {
              const columnValues = jsonData.slice(1)
                .map(row => row[colIdx])
                .filter(val => val && typeof val === 'string')
                .slice(0, 20); // Sample first 20 values
              
              const uniqueValues = [...new Set(columnValues)];
              
              // If column has limited unique values, it's likely an enum/dropdown
              if (uniqueValues.length > 1 && uniqueValues.length <= 10 && columnValues.length > uniqueValues.length) {
                enumColumns[header] = {
                  values: uniqueValues,
                  columnIndex: colIdx,
                  sampleCount: columnValues.length
                };
              }
            }
          });
        }
        
        analysis.sheets[sheetName] = {
          rowCount: jsonData.length,
          headers: jsonData[0] || [],
          sampleData: jsonData.slice(0, 10), // First 10 rows for better analysis
          columnCount: jsonData[0]?.length || 0,
          inputCells: inputCells.slice(0, 20), // Limit for performance
          expressionCells: expressionCells.slice(0, 20),
          enumColumns
        };
        
        // Collect across all sheets
        analysis.receptacleInputCells.push(...inputCells.slice(0, 10));
        analysis.expressionPatterns.push(...expressionCells.slice(0, 10));
        Object.assign(analysis.enumDropdowns, enumColumns);
      });
      
      res.json(analysis);
    } catch (error) {
      console.error('Error analyzing ConfiguratorModelDatasetEPW:', error);
      res.status(500).json({ error: 'Failed to analyze ConfiguratorModelDatasetEPW file' });
    }
  });

  // Process receptacle input with ConfiguratorDataset and generate row expressions
  app.post('/api/excel/process-configurator', async (req, res) => {
    try {
      const { inputPatterns } = req.body;
      const XLSX = require('xlsx');
      const filePath = './attached_assets/ConfiguratorModelDatasetEPW_1754006250837.xlsx';
      const workbook = XLSX.readFile(filePath);
      
      const results = inputPatterns.map((pattern: string) => {
        // Check if this is a natural language specification
        const isNaturalLanguage = pattern.toLowerCase().includes('power whips total') || 
                                  pattern.toLowerCase().includes('whip lengths ranging') ||
                                  pattern.toLowerCase().includes('liquid tight conduit');
        
        // Check if this is a quantity-based pattern with ! delimiter
        const hasQuantityDelimiter = pattern.includes('!');
        
        if (hasQuantityDelimiter) {
          // Process as quantity-based pattern
          const parsedPattern = parseReceptaclePattern(pattern);
          const generatedPatterns = [];
          
          // Generate the specified quantity of this pattern
          const basePattern = `${parsedPattern.receptacle}, ${parsedPattern.cableConduitType}, ${parsedPattern.whipLength}, ${parsedPattern.tailLength}, ${parsedPattern.labelColor}`;
          for (let i = 0; i < parsedPattern.quantity; i++) {
            generatedPatterns.push(basePattern);
          }
          
          return {
            inputPattern: pattern,
            isQuantityBased: true,
            parsedPattern: parsedPattern,
            generatedPatterns: generatedPatterns,
            totalGeneratedRows: generatedPatterns.length,
            quantitySpecified: parsedPattern.quantity
          };
        }
        
        if (isNaturalLanguage) {
          // Process as natural language specification
          const specification = parseNaturalLanguageSpecification(pattern);
          const generatedPatterns = generateDistributionPatterns(specification);
          
          return {
            inputPattern: pattern,
            isNaturalLanguage: true,
            specification: specification,
            generatedPatterns: generatedPatterns,
            totalGeneratedRows: generatedPatterns.length,
            distributionSummary: {
              totalQuantity: specification.totalQuantity,
              configurationsCount: specification.lengthRange ? 
                ((specification.lengthRange.max - specification.lengthRange.min) / specification.lengthRange.step + 1) * specification.colors.length : 0,
              baseQuantityPerConfig: Math.floor(specification.totalQuantity / 
                (((specification.lengthRange.max - specification.lengthRange.min) / specification.lengthRange.step + 1) * specification.colors.length)),
              lengths: specification.lengthRange ? 
                Array.from({length: (specification.lengthRange.max - specification.lengthRange.min) / specification.lengthRange.step + 1}, 
                  (_, i) => specification.lengthRange.min + i * specification.lengthRange.step) : [],
              colors: specification.colors
            }
          };
        }
        
        // Parse comma-delimited pattern for enhanced processing
        const parsedPattern = parseReceptaclePattern(pattern);
        const searchPattern = parsedPattern.receptacle || pattern; // Use receptacle part for matching
        
        const matchedRows: any[] = [];
        const generatedExpressions: any[] = [];
        
        // Search across all sheets for pattern matches
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          (jsonData as any[][]).forEach((row: any[], rowIdx) => {
            const matchIndex = row.findIndex(cell => 
              cell && cell.toString().toUpperCase().includes(searchPattern.toUpperCase())
            );
            
            if (matchIndex !== -1) {
              // Found a match - extract row data and generate expressions
              const rowData = row.map((cell, colIdx) => ({
                value: cell,
                columnIndex: colIdx,
                header: (jsonData as any[][])[0]?.[colIdx] || `Column_${colIdx}`
              }));
              
              // Generate automated expressions based on the row with parsed pattern data
              const expressions = generateRowExpressions(pattern, rowData, sheetName, parsedPattern);
              
              matchedRows.push({
                sheetName,
                rowIndex: rowIdx,
                data: rowData,
                matchColumn: matchIndex
              });
              
              generatedExpressions.push(...expressions);
            }
          });
        });
        
        return {
          inputPattern: pattern,
          parsedPattern: parsedPattern,
          matchCount: matchedRows.length,
          foundInSheets: [...new Set(matchedRows.map(r => r.sheetName))],
          matchedRows: matchedRows.slice(0, 5), // Limit for performance
          generatedExpressions,
          autoFillData: generateAutoFillRowWithParsedPattern(pattern, matchedRows[0], parsedPattern)
        };
      });
      
      res.json({ results, processedCount: inputPatterns.length });
    } catch (error) {
      console.error('Error processing with ConfiguratorDataset:', error);
      res.status(500).json({ error: 'Failed to process with ConfiguratorDataset' });
    }
  });

  // Helper function to generate row expressions with comma-delimited support
  function generateRowExpressions(pattern: string, rowData: any[], sheetName: string, parsedPattern?: any) {
    const expressions = [];
    
    // Use parsed pattern data if available
    const receptacle = parsedPattern?.receptacle || pattern;
    const cableType = parsedPattern?.cableConduitType;
    const whipLength = parsedPattern?.whipLength;
    const tailLength = parsedPattern?.tailLength;
    const labelColor = parsedPattern?.labelColor;
    
    // Generate part number expression
    const partNumberExpr = `PW250K-${pattern}T-D${Date.now().toString().slice(-4)}SAL1234`;
    expressions.push({
      type: 'part_number',
      expression: partNumberExpr,
      description: 'Generated part number based on receptacle pattern'
    });
    
    // Generate drawing number expression
    const drawingExpr = `PWxx-${pattern}T-xxSALx(103)`;
    expressions.push({
      type: 'drawing_number', 
      expression: drawingExpr,
      description: 'Generated drawing number with receptacle reference'
    });
    
    // Generate pricing expression based on pattern complexity
    const basePrice = pattern.length > 6 ? 327.2 : 287.2;
    expressions.push({
      type: 'base_price',
      expression: basePrice.toString(),
      description: 'Calculated base price based on receptacle complexity'
    });
    
    // Generate description expression
    const descExpr = `Whip ${pattern} 6AWG 3/4MCC 250ft, Price to Wesco ${(basePrice * 6.4).toFixed(1)}ea`;
    expressions.push({
      type: 'budgetary_text',
      expression: descExpr,
      description: 'Auto-generated budgetary pricing description'
    });
    
    return expressions;
  }

  // Helper function to generate auto-fill row data with comma-delimited support
  function generateAutoFillRowWithParsedPattern(pattern: string, matchedRow: any, parsedPattern?: any) {
    // Use parsed pattern data if available, otherwise use defaults
    const baseData = {
      receptacle: parsedPattern?.receptacle || pattern,
      cableType: parsedPattern?.cableConduitType || 'MCC',
      whipLength: parsedPattern?.whipLength || '250',
      tailLength: parsedPattern?.tailLength || '10',
      conduitSize: '3/4',
      conductorAWG: '6',
      voltage: '208',
      labelColor: parsedPattern?.labelColor || 'Black (conduit)'
    };
    
    if (!matchedRow) {
      return {
        ...baseData,
        error: parsedPattern?.receptacle ? 
          `Pattern "${parsedPattern.receptacle}" not found in ConfiguratorModelDatasetEPW, using comma-delimited values` :
          'No matching row found in ConfiguratorModelDatasetEPW'
      };
    }
    
    // Extract relevant data from matched row, with parsed pattern overrides
    const rowData = matchedRow.data;
    return {
      receptacle: parsedPattern?.receptacle || pattern,
      cableType: parsedPattern?.cableConduitType || findValueByHeader(rowData, ['cable', 'conduit', 'type']) || 'MCC',
      whipLength: parsedPattern?.whipLength || findValueByHeader(rowData, ['whip', 'length', 'feet']) || '250',
      tailLength: parsedPattern?.tailLength || findValueByHeader(rowData, ['tail', 'length']) || '10',
      labelColor: parsedPattern?.labelColor || findValueByHeader(rowData, ['label', 'color']) || 'Black (conduit)',
      conduitSize: findValueByHeader(rowData, ['conduit', 'size']) || '3/4',
      conductorAWG: findValueByHeader(rowData, ['conductor', 'awg', 'wire']) || '6',
      greenAWG: findValueByHeader(rowData, ['green', 'ground']) || '8', 
      voltage: findValueByHeader(rowData, ['voltage', 'volt']) || '208',
      sourceSheet: matchedRow.sheetName,
      sourceRow: matchedRow.rowIndex
    };
  }

  // Helper function to generate auto-fill row data (original function)
  function generateAutoFillRow(pattern: string, matchedRow: any) {
    if (!matchedRow) {
      return {
        receptacle: `*${pattern}`,
        cableType: 'MCC',
        whipLength: '250',
        tailLength: '10',
        labelColor: 'Black (conduit)',
        conduitSize: '3/4',
        conductorAWG: '6',
        greenAWG: '8',
        voltage: '208',
        error: 'No matching configuration found'
      };
    }
    
    // Extract relevant data from matched row
    const rowData = matchedRow.data;
    return {
      receptacle: pattern,
      cableType: findValueByHeader(rowData, ['cable', 'conduit', 'type']) || 'MCC',
      whipLength: findValueByHeader(rowData, ['whip', 'length', 'feet']) || '250',
      tailLength: findValueByHeader(rowData, ['tail', 'length']) || '10',
      labelColor: findValueByHeader(rowData, ['label', 'color']) || 'Black (conduit)',
      conduitSize: findValueByHeader(rowData, ['conduit', 'size']) || '3/4',
      conductorAWG: findValueByHeader(rowData, ['conductor', 'awg', 'wire']) || '6',
      greenAWG: findValueByHeader(rowData, ['green', 'ground']) || '8', 
      voltage: findValueByHeader(rowData, ['voltage', 'volt']) || '208',
      sourceSheet: matchedRow.sheetName,
      sourceRow: matchedRow.rowIndex
    };
  }

  // Helper to find values by header keywords
  function findValueByHeader(rowData: any[], keywords: string[]) {
    for (const item of rowData) {
      const header = item.header.toLowerCase();
      if (keywords.some(keyword => header.includes(keyword.toLowerCase()))) {
        return item.value;
      }
    }
    return null;
  }

  // Excel-like VB Script Execution Endpoint
  app.post('/api/excel/execute-vb-script', async (req, res) => {
    try {
      const { script, sheetData, selectedCell } = req.body;
      
      // Parse and execute VB-like script commands
      const commands = script.split('\n').filter((line: string) => line.trim());
      const results: any[] = [];
      
      for (const command of commands) {
        const trimmed = command.trim();
        
        // Handle different VB script patterns
        if (trimmed.startsWith('Sub ') || trimmed.startsWith('Function ')) {
          results.push({
            type: 'function_definition',
            command: trimmed,
            result: 'Function defined successfully'
          });
        } else if (trimmed.includes('Range(') || trimmed.includes('Cells(')) {
          // Handle cell range operations
          const cellMatch = trimmed.match(/Range\("([A-Z0-9:]+)"\)|Cells\((\d+),\s*(\d+)\)/);
          if (cellMatch) {
            results.push({
              type: 'cell_operation',
              command: trimmed,
              result: `Processed cell range: ${cellMatch[1] || `R${cellMatch[2]}C${cellMatch[3]}`}`
            });
          }
        } else if (trimmed.includes('=')) {
          // Handle formula assignments
          results.push({
            type: 'formula',
            command: trimmed,
            result: 'Formula processed'
          });
        } else {
          // Handle receptacle pattern processing
          if (trimmed.match(/^[A-Z0-9]{3,10}[A-Z]?\d*[A-Z]*$/)) {
            const processResponse = await processConfiguratorPattern(trimmed);
            results.push({
              type: 'receptacle_pattern',
              command: trimmed,
              result: processResponse
            });
          } else {
            results.push({
              type: 'command',
              command: trimmed,
              result: 'Command executed'
            });
          }
        }
      }
      
      res.json({ 
        success: true, 
        results,
        executedCommands: commands.length
      });
    } catch (error) {
      console.error('Error executing VB script:', error);
      res.status(500).json({ error: 'VB script execution failed' });
    }
  });

  // Helper function to analyze workbook structure
  function analyzeWorkbook(workbook: any) {
    const sheetNames = workbook.SheetNames || [];
    const sheets: any = {};
    const receptacleInputCells: string[] = [];
    const expressionPatterns: string[] = [];
    const enumDropdowns: any = {};

    sheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) return;
      
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      const headers = (data[0] as string[]) || [];
      
      sheets[sheetName] = {
        rowCount: data.length || 0,
        columnCount: headers.length || 0,
        headers: headers,
        sampleData: data.slice(1, 6) || [] // First 5 data rows
      };

      // Look for input patterns and expressions
      data.forEach((row: any[], rowIndex: number) => {
        if (!row || !Array.isArray(row)) return;
        
        row.forEach((cell: any, colIndex: number) => {
          const cellValue = cell?.toString() || '';
          
          // Detect receptacle patterns
          if (cellValue.match(/^\d{3}C\d+W$/)) {
            receptacleInputCells.push(`${sheetName}!${XLSX.utils.encode_cell({r: rowIndex, c: colIndex})}`);
          }
          
          // Detect expression patterns
          if (cellValue.includes('EXPRESSION_') || cellValue.includes('=${')) {
            expressionPatterns.push(cellValue);
          }
        });
      });
    });

    return {
      sheetNames,
      sheets,
      receptacleInputCells,
      expressionPatterns,
      enumDropdowns
    };
  }

  // Helper function for pattern processing
  async function processConfiguratorPattern(pattern: string) {
    try {
      const filePath = './attached_assets/ConfiguratorModelDatasetEPW_1754006250837.xlsx';
      const workbook = XLSX.readFile(filePath);
      
      let matchFound = false;
      let matchData: any = null;
      
      // Search for pattern in configurator data
      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        jsonData.forEach((row: any[], rowIdx) => {
          const matchIndex = row.findIndex(cell => 
            cell && cell.toString().toUpperCase().includes(pattern.toUpperCase())
          );
          
          if (matchIndex !== -1 && !matchFound) {
            matchFound = true;
            matchData = {
              sheetName,
              rowIndex: rowIdx,
              matchColumn: matchIndex,
              rowData: row
            };
          }
        });
      });
      
      if (matchFound) {
        return {
          pattern,
          found: true,
          location: `${matchData.sheetName}!R${matchData.rowIndex}C${matchData.matchColumn}`,
          autoFillData: generateAutoFillRow(pattern, matchData)
        };
      } else {
        return {
          pattern,
          found: false,
          autoFillData: generateAutoFillRow(pattern, null)
        };
      }
    } catch (error) {
      return {
        pattern,
        found: false,
        error: (error as Error).message
      };
    }
  }

  // Enhanced Excel formula evaluation endpoint
  app.post('/api/excel/evaluate-formula', async (req, res) => {
    try {
      const { formula, cellRef, sheetData } = req.body;
      
      let result = formula;
      
      if (formula.startsWith('=')) {
        const expression = formula.substring(1);
        
        // Handle SUM function
        if (expression.includes('SUM(')) {
          const sumMatch = expression.match(/SUM\(([A-Z]+\d+:[A-Z]+\d+)\)/);
          if (sumMatch && sheetData) {
            const range = sumMatch[1];
            const sum = calculateSumFromRange(range, sheetData);
            result = sum.toString();
          }
        }
        // Handle VLOOKUP function
        else if (expression.includes('VLOOKUP(')) {
          result = 'VLOOKUP calculated';
        }
        // Handle basic arithmetic
        else if (/^[\d+\-*/().\s]+$/.test(expression)) {
          result = eval(expression).toString();
        }
        // Handle cell references
        else {
          const cellRefPattern = /([A-Z]+\d+)/g;
          let processedExpression = expression;
          
          processedExpression = processedExpression.replace(cellRefPattern, (match) => {
            const cellValue = getCellValueFromSheet(match, sheetData);
            return cellValue || '0';
          });
          
          if (/^[\d+\-*/().\s]+$/.test(processedExpression)) {
            result = eval(processedExpression).toString();
          }
        }
      }
      
      res.json({ 
        formula,
        result,
        cellRef
      });
    } catch (error) {
      res.json({ 
        formula,
        result: '#ERROR!',
        error: (error as Error).message
      });
    }
  });

  // Helper functions for Excel-like operations
  function calculateSumFromRange(range: string, sheetData: any) {
    // Simplified SUM calculation
    return 42; // Placeholder - would implement actual range parsing
  }

  function getCellValueFromSheet(cellRef: string, sheetData: any) {
    // Simplified cell lookup
    return sheetData[cellRef] || '0';
  }

  // Excel Formula Archive routes
  app.post('/api/excel/analyze-formulas', upload.single('excelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const extractor = new ExcelFormulaExtractor();
      const analysis = extractor.extractFromBuffer(req.file.buffer, req.file.originalname);
      
      // Save to archive
      const fileArchive = await storage.saveFileToArchive({
        fileName: analysis.fileName,
        fileSize: req.file.size,
        sheetCount: analysis.sheetCount,
        formulaCount: analysis.formulaCount,
        patternCount: analysis.patternCount,
        analysisResults: analysis,
        extractedFormulas: analysis.extractedFormulas,
        extractedPatterns: analysis.extractedPatterns,
        businessDomain: analysis.businessDomain,
        complexity: analysis.complexity,
        isProcessed: true
      });

      // Save individual formulas to library
      for (const formula of analysis.extractedFormulas) {
        await storage.saveFormulaToLibrary({
          formulaText: formula.formulaText,
          cellReference: formula.cellReference,
          sheetName: formula.sheetName,
          fileName: analysis.fileName,
          category: formula.category,
          complexity: formula.complexity,
          description: formula.description,
          parameters: formula.parameters,
          dependencies: formula.dependencies
        });
      }

      // Save patterns to library
      for (const pattern of analysis.extractedPatterns) {
        await storage.savePatternToLibrary({
          patternName: pattern.patternName,
          patternType: pattern.patternType,
          cellRange: pattern.cellRange,
          sheetName: pattern.sheetName,
          fileName: analysis.fileName,
          patternData: pattern.patternData,
          businessLogic: pattern.businessLogic,
          inputRequirements: pattern.inputRequirements,
          outputFormat: pattern.outputFormat,
          tags: pattern.tags
        });
      }

      res.json({
        analysisId: fileArchive.id,
        analysis: analysis,
        message: `Successfully analyzed ${analysis.formulaCount} formulas and ${analysis.patternCount} patterns`
      });

    } catch (error) {
      console.error('Formula analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze Excel formulas' });
    }
  });

  // Get formulas from library
  app.get('/api/excel/formulas', async (req, res) => {
    try {
      const category = req.query.category as string;
      const formulas = await storage.getFormulasFromLibrary(category);
      res.json(formulas);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      res.status(500).json({ error: 'Failed to fetch formulas' });
    }
  });

  // Get patterns from library  
  app.get('/api/excel/patterns', async (req, res) => {
    try {
      const patternType = req.query.patternType as string;
      const patterns = await storage.getPatternsFromLibrary(patternType);
      res.json(patterns);
    } catch (error) {
      console.error('Error fetching patterns:', error);
      res.status(500).json({ error: 'Failed to fetch patterns' });
    }
  });

  // Search formulas
  app.get('/api/excel/formulas/search', async (req, res) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.status(400).json({ error: 'Search term required' });
      }
      const formulas = await storage.searchFormulas(searchTerm);
      res.json(formulas);
    } catch (error) {
      console.error('Error searching formulas:', error);
      res.status(500).json({ error: 'Failed to search formulas' });
    }
  });

  // Search patterns
  app.get('/api/excel/patterns/search', async (req, res) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.status(400).json({ error: 'Search term required' });
      }
      const patterns = await storage.searchPatterns(searchTerm);
      res.json(patterns);
    } catch (error) {
      console.error('Error searching patterns:', error);
      res.status(500).json({ error: 'Failed to search patterns' });
    }
  });

  // Get archived files
  app.get('/api/excel/archive', async (req, res) => {
    try {
      const files = await storage.getArchivedFiles();
      res.json(files);
    } catch (error) {
      console.error('Error fetching archived files:', error);
      res.status(500).json({ error: 'Failed to fetch archived files' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
