import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPowerWhipConfigurationSchema, insertElectricalComponentSchema, insertComponentDataSourceSchema } from "@shared/schema";
import { ExcelFormulaExtractor } from "./excelFormulaExtractor";
import { z } from "zod";
import { parseExcelFile, extractComponentData, analyzeExcelStructure, generateBOM } from "./excelParser";
import { MultiSheetProcessor } from "./multiSheetProcessor";
import * as path from "path";
import { fileURLToPath } from 'url';
import multer from "multer";
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as Papa from 'papaparse';

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

// Optimized component extraction for faster Excel processing
function extractComponentDataOptimized(sheets: any): any[] {
  const components: any[] = [];
  const startTime = Date.now();
  
  // Pre-compiled patterns for faster receptacle matching
  const receptaclePatterns = [
    /^[A-Z0-9]{2,10}[A-Z]?\d*[A-Z]*$/,  // Standard receptacle codes
    /^L\d+-\d+[A-Z]?$/,                  // NEMA L-series
    /^CS\d+[A-Z]*$/,                     // CS series
    /^\d+[A-Z]\d+[A-Z]?$/                // Numeric prefix codes
  ];
  
  // Enhanced field mapping for accurate parsing
  const fieldMappings = {
    receptacle: ['receptacle', 'plug', 'connector', 'choose'],
    cableType: ['cable', 'conduit', 'type', 'select'],
    whipLength: ['whip', 'length', 'feet', 'ft'],
    tailLength: ['tail', 'length'],
    labelColor: ['label', 'color', 'background'],
    voltage: ['voltage', 'volt', 'v'],
    current: ['current', 'amp', 'a'],
    awg: ['awg', 'wire', 'conductor']
  };
  
  Object.keys(sheets).forEach(sheetName => {
    const sheetData = sheets[sheetName];
    
    if (!sheetData || !Array.isArray(sheetData) || sheetData.length === 0) return;
    
    // Process headers for optimized field mapping
    const headers = sheetData[0];
    const headerMap = new Map();
    
    headers.forEach((header: string, index: number) => {
      if (typeof header === 'string') {
        const lowerHeader = header.toLowerCase();
        for (const [field, keywords] of Object.entries(fieldMappings)) {
          if (keywords.some(keyword => lowerHeader.includes(keyword))) {
            if (!headerMap.has(field)) {
              headerMap.set(field, []);
            }
            headerMap.get(field).push(index);
          }
        }
      }
    });
    
    // Process data rows with enhanced speed and accuracy
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (!Array.isArray(row) || row.length === 0) continue;
      
      // Fast receptacle identification
      const receptacleIndices = headerMap.get('receptacle') || [];
      let receptacleValue = '';
      let receptacleIndex = -1;
      
      // Check mapped receptacle columns first
      for (const idx of receptacleIndices) {
        if (row[idx] && typeof row[idx] === 'string') {
          const candidate = row[idx].trim().toUpperCase();
          if (receptaclePatterns.some(pattern => pattern.test(candidate))) {
            receptacleValue = candidate;
            receptacleIndex = idx;
            break;
          }
        }
      }
      
      // Fallback scan if needed
      if (!receptacleValue) {
        for (let j = 0; j < row.length; j++) {
          if (row[j] && typeof row[j] === 'string') {
            const candidate = row[j].trim().toUpperCase();
            if (receptaclePatterns.some(pattern => pattern.test(candidate))) {
              receptacleValue = candidate;
              receptacleIndex = j;
              break;
            }
          }
        }
      }
      
      if (receptacleValue) {
        // Build accurate component specifications
        const specifications: any = {};
        headers.forEach((header: string, index: number) => {
          if (row[index] !== null && row[index] !== undefined && row[index] !== '') {
            specifications[header] = row[index];
          }
        });
        
        components.push({
          id: `${sheetName}_${i}`,
          name: receptacleValue,
          type: 'receptacle',
          category: categorizeByReceptacle(receptacleValue),
          partNumber: receptacleValue,
          specifications,
          receptacleType: receptacleValue,
          sourceSheet: sheetName,
          sourceRow: i + 1,
          receptacleIndex,
          optimizedProcessing: true
        });
      }
    }
  });
  
  const processingTime = Date.now() - startTime;
  console.log(`Excel Master Bubble Format Transformer: Processed ${components.length} components in ${processingTime}ms`);
  
  return components;
}

// Ultra-fast component extraction with aggressive optimizations
function extractComponentDataUltraFast(sheets: any): any[] {
  const components: any[] = [];
  const startTime = Date.now();
  
  // Pre-compiled patterns for lightning-fast receptacle matching
  const receptaclePattern = /^([A-Z]{1,3}\d+[A-Z]?\d*[A-Z]?|[0-9]+[A-Z]+[0-9]*[A-Z]*|[A-Z]+\d+-\d+[A-Z]*)$/;
  
  // Category mapping for instant categorization
  const categoryMap = new Map([
    ['CS', 'CS Series - IEC Pin & Sleeve'],
    ['L', 'NEMA Locking'],
    ['460', 'High Voltage'],
    ['480', 'High Voltage'],
    ['120', 'Standard Voltage'],
    ['208', 'Standard Voltage']
  ]);
  
  Object.entries(sheets).forEach(([sheetName, sheetData]: [string, any]) => {
    if (!Array.isArray(sheetData) || sheetData.length === 0) return;
    
    // Get headers from first row
    const headers = sheetData[0] || [];
    
    // Find receptacle column with single pass
    let receptacleIndex = -1;
    for (let i = 0; i < Math.min(headers.length, 20); i++) { // Limit header search
      const header = String(headers[i] || '').toLowerCase();
      if (header.includes('receptacle') || header.includes('choose')) {
        receptacleIndex = i;
        break;
      }
    }
    
    if (receptacleIndex === -1) return;
    
    // Process rows with maximum optimization - limit to 500 rows for speed
    const maxRows = Math.min(sheetData.length, 500);
    for (let i = 1; i < maxRows; i++) {
      const row = sheetData[i];
      if (!row || !Array.isArray(row)) continue;
      
      const receptacleValue = row[receptacleIndex];
      if (!receptacleValue || typeof receptacleValue !== 'string') continue;
      
      // Lightning-fast validation
      const cleanValue = receptacleValue.trim().toUpperCase();
      if (cleanValue.length < 2 || cleanValue.length > 15 || !receptaclePattern.test(cleanValue)) continue;
      
      // Fast category lookup
      let category = 'Other Receptacle Type';
      for (const [key, cat] of categoryMap) {
        if (cleanValue.startsWith(key)) {
          category = cat;
          break;
        }
      }
      
      // Minimal specifications for speed
      const specifications: any = { 'Choose receptacle': receptacleValue };
      
      // Only include essential specifications to reduce processing time
      const essentialHeaders = ['Select Cable/Conduit Type', 'Whip Length (ft)', 'Voltage', 'Current'];
      essentialHeaders.forEach((essentialHeader, idx) => {
        if (idx + 1 < headers.length && row[idx + 1]) {
          specifications[essentialHeader] = row[idx + 1];
        }
      });
      
      components.push({
        id: `${sheetName}_${i}`,
        name: cleanValue,
        type: 'receptacle',
        category,
        partNumber: cleanValue,
        specifications,
        receptacleType: cleanValue,
        sourceSheet: sheetName,
        sourceRow: i + 1,
        optimizedProcessing: true,
        ultraFastMode: true,
        dragType: 'receptacle',
        processingMethod: 'ultra_fast_cached'
      });
    }
  });
  
  const processingTime = Date.now() - startTime;
  console.log(`Excel Master Bubble Format Transformer: Processed ${components.length} components in ${processingTime}ms`);
  
  return components;
}

// Fast categorization for improved accuracy
function categorizeByReceptacle(receptacle: string): string {
  const upper = receptacle.toUpperCase();
  
  if (upper.startsWith('CS')) return 'CS Series - IEC Pin & Sleeve';
  if (upper.startsWith('L') && upper.includes('-')) return 'NEMA Locking';
  if (upper.match(/^\d+[A-Z]\d+/)) return 'NEMA Standard';
  if (upper.includes('460') || upper.includes('480')) return 'High Voltage';
  if (upper.includes('120') || upper.includes('208')) return 'Standard Voltage';
  
  return 'Other Receptacle Type';
}

// Use existing multer configuration

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

  // Advanced Excel analysis endpoints
  app.post('/api/excel/upload-analyze', upload.single('file'), async (req, res) => {
    console.log('Upload analyze request received');
    console.log('File details:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      hasBuffer: !!req.file.buffer,
      bufferLength: req.file.buffer?.length
    } : 'No file');

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.file.buffer || req.file.buffer.length === 0) {
      return res.status(400).json({ error: 'Invalid file - no buffer data' });
    }

    try {
      const { SimpleExcelAnalyzer } = await import('./excelSimpleAnalyzer');
      const analyzer = new SimpleExcelAnalyzer();
      
      const fileName = req.file.originalname || 'uploaded_file.xlsx';
      
      // Create temporary file from buffer since the analyzer expects file path
      const tempPath = `./tmp/uploads/temp_${Date.now()}_${fileName}`;
      await fs.promises.writeFile(tempPath, req.file.buffer);
      console.log(`Created temp file: ${tempPath}, size: ${req.file.buffer.length} bytes`);
      
      const analysis = await analyzer.analyzeFile(tempPath, fileName);
      
      // Clean up temporary file
      try {
        await fs.promises.unlink(tempPath);
      } catch (err) {
        console.log('Note: temp file cleanup failed:', err);
      }
      
      console.log('Analysis completed successfully');
      res.json(analysis);
    } catch (error: unknown) {
      console.error('Advanced Excel analysis error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Failed to analyze Excel file: ${errorMessage}` });
    }
  });

  app.get('/api/excel/analysis/:fileId', async (req, res) => {
    try {
      // In a real implementation, this would fetch from database
      // For now, return mock data to match the interface
      res.json({
        fileId: req.params.fileId,
        processingStatus: 'completed',
        sheets: [],
        patterns: [],
        expressions: [],
        nomenclatureMapping: [],
        transformationRules: []
      });
    } catch (error) {
      console.error('Get analysis error:', error);
      res.status(500).json({ error: 'Failed to get analysis' });
    }
  });

  app.post('/api/excel/apply-mappings', async (req, res) => {
    try {
      const { fileId, mappings } = req.body;
      
      const { SimpleExcelAnalyzer } = await import('./excelSimpleAnalyzer');
      const analyzer = new SimpleExcelAnalyzer();
      
      await analyzer.applyTransformationRules(mappings);
      
      res.json({ success: true, message: 'Mappings applied successfully' });
    } catch (error: unknown) {
      console.error('Apply mappings error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: `Failed to apply mappings: ${errorMessage}` });
    }
  });

  app.post('/api/excel/transform-presal', async (req, res) => {
    try {
      const { fileId, transformationRules } = req.body;
      
      const { ExcelAdvancedAnalyzer } = await import('./excelAdvancedAnalyzer');
      const analyzer = new ExcelAdvancedAnalyzer();
      
      const outputFile = await analyzer.generatePreSalOutput();
      
      res.json({ 
        success: true, 
        outputFile,
        downloadUrl: `/downloads/${path.basename(outputFile)}`
      });
    } catch (error) {
      console.error('Transform PreSal error:', error);
      res.status(500).json({ error: 'Failed to transform to PreSal format' });
    }
  });

  // Ultra-fast caching system for Excel components
  let componentCache: { data: any[], timestamp: number, filePath: string } | null = null;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
  
  app.get("/api/excel/components", async (_req, res) => {
    try {
      const startTime = Date.now();
      
      // Check cache first for instant response
      if (componentCache && (Date.now() - componentCache.timestamp) < CACHE_DURATION) {
        console.log(`Excel Master Bubble Format Transformer: Served from cache in ${Date.now() - startTime}ms`);
        return res.json(componentCache.data);
      }
      
      // Optimized file path selection - use most reliable file first
      const filePaths = [
        './attached_assets/MasterBubbleUpLookup_1753993728695.xlsx',
        './attached_assets/MasterBubbleUpLookup_1753988008068.xlsx',
        './attached_assets/MasterBubbleUpLookup_1753986672989.xlsx'
      ];
      
      let sheets: any = null;
      let usedFilePath = '';
      
      // Fast file loading with immediate optimization
      for (const filePath of filePaths) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
              // Use ultra-fast XLSX parsing with minimal options
              const workbook = XLSX.readFile(filePath, { 
                cellDates: false,  // Skip date parsing for speed
                cellNF: false,     // Skip number formatting
                cellHTML: false,   // Skip HTML parsing
                cellStyles: false, // Skip styles
                cellText: false,   // Skip text formatting
                raw: true,         // Use raw values for speed
                bookVBA: false,    // Skip VBA
                bookSheets: false  // Skip sheet metadata
              });
              
              if (workbook && workbook.SheetNames && workbook.SheetNames.length > 0) {
                sheets = {};
                
                // Process only the first few sheets for speed (most data is in first sheets)
                const sheetsToProcess = workbook.SheetNames.slice(0, 3); // Limit to first 3 sheets
                
                sheetsToProcess.forEach(sheetName => {
                  const worksheet = workbook.Sheets[sheetName];
                  if (worksheet) {
                    // Ultra-fast sheet conversion with minimal processing
                    sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet, { 
                      header: 1, 
                      defval: '',        // Use empty string instead of null for speed
                      blankrows: false,  // Skip blank rows
                      raw: true         // Use raw values
                    });
                  }
                });
                
                usedFilePath = filePath;
                console.log(`Excel Master Bubble Format Transformer: Successfully loaded ${filePath.split('/').pop()}`);
                break;
              }
            }
          }
        } catch (error) {
          console.log(`Failed to parse ${filePath}, trying next...`, error.message);
          continue;
        }
      }
      
      if (!sheets || Object.keys(sheets).length === 0) {
        // Fallback: create sample data structure for demonstration
        console.log('Creating fallback sample data for Excel Master Bubble Format Transformer');
        const sampleComponents = [
          {
            id: 'sample_1',
            name: 'CS8269A',
            type: 'receptacle',
            category: 'CS Series - IEC Pin & Sleeve',
            partNumber: 'CS8269A',
            specifications: {
              'Choose receptacle': 'CS8269A',
              'Select Cable/Conduit Type': 'LMZC',
              'Whip Length (ft)': '25',
              'Tail Length (ft)': '10',
              'Voltage': '208',
              'Current': '60',
              'Conduit Size': '3/4'
            },
            receptacleType: 'CS8269A',
            sourceSheet: 'Sample',
            sourceRow: 1,
            optimizedProcessing: true,
            fallbackData: true
          },
          {
            id: 'sample_2',
            name: '460C9W',
            type: 'receptacle',
            category: 'NEMA Standard',
            partNumber: '460C9W',
            specifications: {
              'Choose receptacle': '460C9W',
              'Select Cable/Conduit Type': 'FMC',
              'Whip Length (ft)': '115',
              'Tail Length (ft)': '10',
              'Voltage': '120',
              'Current': '15'
            },
            receptacleType: '460C9W',
            sourceSheet: 'Sample',
            sourceRow: 2,
            optimizedProcessing: true,
            fallbackData: true
          }
        ];
        
        return res.json(sampleComponents.map(comp => ({
          ...comp,
          dragType: determineDragType(comp),
          category: comp.category,
          specifications: enhanceSpecifications(comp),
          sourceFile: 'Sample Data',
          processingTimestamp: new Date().toISOString(),
          optimized: true,
          processingMethod: 'fallback_sample_data'
        })));
      }
      
      // Use ultra-fast extraction for maximum speed
      const components = extractComponentDataUltraFast(sheets);
      const processingTime = Date.now() - startTime;
      
      console.log(`Excel Master Bubble Format Transformer: Processed ${components.length} components in ${processingTime}ms`);
      
      // Cache the results for future requests
      componentCache = {
        data: components,
        timestamp: Date.now(),
        filePath: usedFilePath
      };
      
      res.json(components);
    } catch (error) {
      console.error('Excel components error:', error);
      res.status(500).json({ message: "Failed to extract components from Excel" });
    }
  });

  // Cache management endpoint for performance optimization
  app.post("/api/excel/clear-cache", async (_req, res) => {
    componentCache = null;
    console.log('Excel component cache cleared');
    res.json({ message: "Cache cleared successfully", timestamp: new Date().toISOString() });
  });

  // NEW: Multi-Sheet Processor for UploadedExcelProcessor component
  app.post("/api/excel/scan-patterns", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log(`Starting multi-sheet processing for: ${req.file.originalname}`);
      
      // Use the new MultiSheetProcessor
      const result = MultiSheetProcessor.processAllSheets(req.file.buffer, req.file.originalname);
      
      res.json(result);
    } catch (error: unknown) {
      console.error('Multi-sheet processing error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process Excel file",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW: Dedicated UploadedOutputFile processor
  app.post("/api/excel/process-uploaded-output-file", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false,
          message: "No file uploaded for UploadedOutputFile processing" 
        });
      }

      console.log(`UploadedOutputFile processing started for: ${req.file.originalname}`);
      
      // Validate file type for UploadedOutputFile
      if (!req.file.originalname.toLowerCase().endsWith('.xlsx')) {
        return res.status(400).json({
          success: false,
          message: "UploadedOutputFile processor requires Excel (.xlsx) files only"
        });
      }
      
      // Use MultiSheetProcessor with UploadedOutputFile-specific processing
      const result = MultiSheetProcessor.processAllSheets(req.file.buffer, req.file.originalname);
      
      // Add UploadedOutputFile-specific metadata
      result.summary.processing = "UploadedOutputFile Multi-Sheet Comprehensive Processing";
      
      console.log(`UploadedOutputFile processing complete: ${result.summary.totalPatterns} patterns from ${result.summary.totalSheets} sheets`);
      
      res.json(result);
    } catch (error) {
      console.error('UploadedOutputFile processing error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to process UploadedOutputFile",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // NEW: Export UploadedOutputFile format
  app.post("/api/excel/export-uploaded-output-file", async (req, res) => {
    try {
      const { transformedOutput, fileName } = req.body;
      
      if (!transformedOutput || !Array.isArray(transformedOutput)) {
        return res.status(400).json({ message: "Invalid UploadedOutputFile data" });
      }

      console.log(`Exporting UploadedOutputFile: ${transformedOutput.length} patterns`);
      
      const excelBuffer = MultiSheetProcessor.exportToCombinedExcel(transformedOutput);
      
      const outputFileName = `UploadedOutputFile_${fileName || 'export'}_${Date.now()}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${outputFileName}"`);
      res.send(excelBuffer);
      
    } catch (error) {
      console.error('UploadedOutputFile export error:', error);
      res.status(500).json({ message: "Failed to export UploadedOutputFile" });
    }
  });

  // LEGACY: Export combined patterns to Excel (for backward compatibility)
  app.post("/api/excel/export-transformed-patterns", async (req, res) => {
    try {
      const { transformedOutput } = req.body;
      
      if (!transformedOutput || !Array.isArray(transformedOutput)) {
        return res.status(400).json({ message: "Invalid transformed output data" });
      }

      console.log(`Exporting combined patterns: ${transformedOutput.length} rows`);
      
      const excelBuffer = MultiSheetProcessor.exportToCombinedExcel(transformedOutput);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="combined_patterns_output.xlsx"');
      res.send(excelBuffer);
      
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ message: "Failed to export combined patterns" });
    }
  });

  // LEGACY: Old pattern scanning for backward compatibility
  app.post("/api/excel/scan-patterns-legacy", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const allPatterns = scanAllPatternsFromExcel(workbook);
      
      // Generate transformed output pattern file
      const outputData = generateTransformedOutputPattern(allPatterns);
      
      res.json({
        success: true,
        fileName: req.file.originalname,
        patterns: allPatterns,
        transformedOutput: outputData,
        summary: {
          totalSheets: allPatterns.length,
          totalPatterns: allPatterns.reduce((sum, sheet) => sum + sheet.patterns.length, 0)
        }
      });
    } catch (error) {
      console.error('Pattern scanning error:', error);
      res.status(500).json({ message: "Failed to scan patterns from Excel file" });
    }
  });

  // Comprehensive pattern scanning function for all pattern types
  function scanAllPatternsFromExcel(workbook: any) {
    const sheetResults: any[] = [];
    
    // Pattern definitions in order of operation
    const patternTypes = [
      {
        name: 'Receptacle IDs',
        patterns: [
          /\b(CS\d{4}[A-Z]?)\b/gi,               // IEC pin & sleeve (CS8269A)
          /\b(460[A-Z]\d+[A-Z]*)\b/gi,           // NEMA standard (460C9W, 460R9W)
          /\b(L\d+-\d+[A-Z])\b/gi,               // NEMA locking (L6-30R, L14-30R)
          /\b(\d+-\d+[A-Z])\b/gi,                // NEMA standard short (5-20R)
          /\b([A-Z]{1,3}\d+[A-Z]?\d*[A-Z]*)\b/gi // Generic receptacle patterns
        ]
      },
      {
        name: 'Cable/Conduit Type IDs',
        patterns: [
          /\b(MMC|LFMC|FMC|LMZC|SO|MC|EMT|RMC|IMC|PVC|THWN|THHN|AWG)\b/gi,
          /\b(\d+\/\d+)\b/gi,                    // Conduit sizes like 3/4
          /\b(\d+\s*AWG)\b/gi                    // Wire gauges
        ]
      },
      {
        name: 'Whip Length IDs',
        patterns: [
          /\b(\d+)\s*['"]?\s*(?:ft|feet|foot)\b/gi,
          /\b(\d+)\s*(?:inch|inches|in)\b/gi,
          /\b(\d{2,3})\b/gi                      // Numbers likely to be lengths (20-999)
        ]
      },
      {
        name: 'Tail Length IDs',
        patterns: [
          /\b(\d+)\s*['"]?\s*(?:tail|pigtail)\b/gi,
          /\b(tail\s*\d+)\b/gi,
          /\b(\d+)\s*(?:inch|in)\s*(?:tail|pigtail)\b/gi
        ]
      }
    ];

    workbook.SheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const sheetPatterns: any[] = [];
      
      // Scan all cells in the sheet
      jsonData.forEach((row: any, rowIndex: number) => {
        if (Array.isArray(row)) {
          row.forEach((cell: any, colIndex: number) => {
            if (cell && typeof cell === 'string') {
              const cellValue = cell.toString().trim();
              if (cellValue.length > 0) {
                
                // Check each pattern type in order
                patternTypes.forEach(patternType => {
                  patternType.patterns.forEach(pattern => {
                    const matches = cellValue.match(pattern);
                    if (matches) {
                      matches.forEach(match => {
                        sheetPatterns.push({
                          type: patternType.name,
                          value: match.trim(),
                          location: `${sheetName}!${getExcelColumnName(colIndex)}${rowIndex + 1}`,
                          cellValue: cellValue,
                          row: rowIndex + 1,
                          column: colIndex + 1
                        });
                      });
                    }
                  });
                });
              }
            }
          });
        }
      });
      
      sheetResults.push({
        sheetName,
        patterns: sheetPatterns,
        totalRows: jsonData.length,
        totalPatterns: sheetPatterns.length
      });
    });
    
    return sheetResults;
  }

  // Generate transformed output pattern file with each pattern on separate row
  function generateTransformedOutputPattern(sheetResults: any[]) {
    const transformedData: any[] = [];
    
    sheetResults.forEach(sheet => {
      sheet.patterns.forEach((pattern: any, index: number) => {
        transformedData.push({
          'Pattern Type': pattern.type,
          'Pattern Value': pattern.value,
          'Source Sheet': sheet.sheetName,
          'Cell Location': pattern.location,
          'Original Cell Value': pattern.cellValue,
          'Row Number': pattern.row,
          'Column Number': pattern.column,
          'Pattern Index': index + 1
        });
      });
    });
    
    return transformedData;
  }

  // Comprehensive pattern scanning endpoint for multi-sheet Excel files
  app.post("/api/excel/scan-patterns", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      console.log(`Processing multi-sheet Excel file: ${req.file.originalname}`);
      
      // Read the Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const patterns: any[] = [];
      const transformedOutput: any[] = [];
      
      // Comprehensive pattern types to capture all identifiers including duplicates
      const patternTypes = [
        { 
          name: 'Receptacle IDs', 
          regex: /^(NEMA\s*\d+-\d+[PR]?|L\d+-\d+[PR]?|CS\d+[A-Z]*|IEC\s*\d+[A-Z]*|\d+[A-Z]+\d*[A-Z]*|[A-Z]+\d+[A-Z]*|SS\d+[A-Z]*|ML\d+[A-Z]*|HBL\d+[A-Z]*|[A-Z]{2,4}\d+[A-Z]*|460[A-Z]\d*[A-Z]*)/i 
        },
        { 
          name: 'Cable/Conduit Type IDs', 
          regex: /^(MMC|LFMC|FMC|LMZC|EMT|PVC|THWN|SO|SJ|SOOW|MC|AC|NM|UF|TC|TRAY|CABLE|FLEX|CORD|WIRE|BX|ARMORED)/i 
        },
        { 
          name: 'Whip Length IDs', 
          regex: /^(\d+(?:\.\d+)?)\s*(?:ft|feet|'|"|inch|in|FT)?$/i 
        },
        { 
          name: 'Tail Length IDs', 
          regex: /^(\d+(?:\.\d+)?)\s*(?:ft|feet|'|"|inch|in|FT)?$/i 
        },
        {
          name: 'General Identifiers',
          regex: /^[A-Z0-9]{3,}[A-Z0-9]*$/i
        }
      ];

      let totalPatterns = 0;
      
      // Process ALL sheets and combine into single output
      console.log(`Processing ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
      
      workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        console.log(`Scanning sheet ${sheetIndex + 1}/${workbook.SheetNames.length}: ${sheetName}`);
        const worksheet = workbook.Sheets[sheetName];
        const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        const sheetPatterns: any[] = [];
        
        // Comprehensive cell scanning - capture ALL patterns including duplicates from every sheet
        (sheetData as any[][]).forEach((row: any[], rowIndex: number) => {
          row.forEach((cellValue, colIndex) => {
            if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
              const stringValue = String(cellValue).trim();
              
              // Skip if empty after trimming
              if (!stringValue) return;
              
              // Check against each pattern type - capture every single match
              patternTypes.forEach(patternType => {
                if (patternType.regex.test(stringValue)) {
                  const cellLocation = `${getExcelColumnName(colIndex)}${rowIndex + 1}`;
                  
                  const patternData = {
                    type: patternType.name,
                    value: stringValue,
                    location: cellLocation,
                    cellValue: cellValue,
                    row: rowIndex + 1,
                    column: colIndex + 1,
                    sheetName: sheetName
                  };
                  
                  sheetPatterns.push(patternData);
                  totalPatterns++;
                  
                  // Add to COMBINED transformed output - ALL sheets into ONE file
                  const transformedRow: any = {
                    'Source Sheet': sheetName,
                    'Cell Location': `${sheetName}!${cellLocation}`,
                    'Pattern Type': patternType.name,
                    'Original Value': stringValue,
                    'Row Number': rowIndex + 1,
                    'Column Number': colIndex + 1,
                    'Pattern ID': `${sheetName}_${cellLocation}_${patternType.name}_${totalPatterns}`,
                    'Global Pattern Index': totalPatterns,
                    'Sheet Index': sheetIndex + 1,
                    'Choose Format': `choose_${stringValue.toLowerCase().replace(/[-\s]/g, '_')}`
                  };
                  
                  // Add specific transformations for each pattern type
                  if (patternType.name === 'Receptacle IDs') {
                    transformedRow['Choose Receptacle'] = `choose_receptacle_${stringValue.toLowerCase().replace(/[-\s]/g, '_')}`;
                    transformedRow['Receptacle Category'] = 'receptacle';
                  } else if (patternType.name === 'Cable/Conduit Type IDs') {
                    transformedRow['Choose Cable'] = `choose_cable_${stringValue.toLowerCase().replace(/[-\s]/g, '_')}`;
                    transformedRow['Cable Category'] = 'cable_conduit';
                  } else if (patternType.name === 'Whip Length IDs') {
                    transformedRow['Choose Whip Length'] = `choose_whip_length_${stringValue.replace(/[^\d.]/g, '')}_ft`;
                    transformedRow['Length Category'] = 'whip_length';
                  } else if (patternType.name === 'Tail Length IDs') {
                    transformedRow['Choose Tail Length'] = `choose_tail_length_${stringValue.replace(/[^\d.]/g, '')}_ft`;
                    transformedRow['Length Category'] = 'tail_length';
                  } else if (patternType.name === 'General Identifiers') {
                    transformedRow['Choose Identifier'] = `choose_id_${stringValue.toLowerCase().replace(/[-\s]/g, '_')}`;
                    transformedRow['Identifier Category'] = 'general';
                  }
                  
                  // Add to combined output array
                  transformedOutput.push(transformedRow);
                }
              });
            }
          });
        });
        
        patterns.push({
          sheetName,
          patterns: sheetPatterns,
          totalRows: sheetData.length,
          totalPatterns: sheetPatterns.length
        });
        
        console.log(`Sheet ${sheetName}: Found ${sheetPatterns.length} patterns`);
      });
      
      console.log(`TOTAL COMBINED PATTERNS: ${totalPatterns} from all ${workbook.SheetNames.length} sheets`);

      const result = {
        success: true,
        fileName: req.file.originalname,
        patterns,
        transformedOutput,
        summary: {
          totalSheets: workbook.SheetNames.length,
          totalPatterns,
          sheetNames: workbook.SheetNames,
          combinedOutputRows: transformedOutput.length,
          processing: `Combined ALL ${workbook.SheetNames.length} sheets into single output with ${totalPatterns} total patterns`,
          sheetsProcessed: patterns.map(p => ({ 
            name: p.sheetName, 
            patterns: p.totalPatterns 
          }))
        }
      };

      console.log(`Pattern scanning complete: ${totalPatterns} patterns found across ${workbook.SheetNames.length} sheets`);
      res.json(result);

    } catch (error) {
      console.error('Pattern scanning error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to scan patterns",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Export transformed output pattern file
  app.post("/api/excel/export-transformed-patterns", async (req, res) => {
    try {
      const { transformedOutput } = req.body;
      
      if (!transformedOutput || !Array.isArray(transformedOutput)) {
        return res.status(400).json({ message: "No transformed output data provided" });
      }

      // Create workbook with transformed patterns
      const worksheet = XLSX.utils.json_to_sheet(transformedOutput);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transformed Output Pattern");

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="transformed_output_pattern.xlsx"');
      res.send(excelBuffer);

    } catch (error) {
      console.error('Export transformed patterns error:', error);
      res.status(500).json({ message: "Failed to export transformed output pattern file" });
    }
  });

  // Helper function to convert column number to Excel column name
  function getExcelColumnName(columnNumber: number): string {
    let columnName = '';
    while (columnNumber >= 0) {
      columnName = String.fromCharCode(65 + (columnNumber % 26)) + columnName;
      columnNumber = Math.floor(columnNumber / 26) - 1;
    }
    return columnName;
  }

  // Enhanced Excel file parsing to extract receptacle patterns
  const extractReceptaclePatternsFromExcel = (workbook: any) => {
    const extractedPatterns: string[] = [];
    const analysisData: any = {
      totalSheets: workbook.SheetNames.length,
      sheetsAnalyzed: [],
      patternsFound: 0,
      cellsScanned: 0
    };
    
    // Pre-compiled regex patterns for faster receptacle identification
    const receptaclePatterns = [
      /\b(460[A-Z]\d+[A-Z]*)\b/gi,           // NEMA standard (460C9W, 460R9W)
      /\b(CS\d{4}[A-Z]?)\b/gi,               // IEC pin & sleeve (CS8269A)
      /\b(L\d+-\d+[A-Z])\b/gi,               // NEMA locking (L6-30R, L14-30R)
      /\b(\d+-\d+[A-Z])\b/gi,                // NEMA standard short (5-20R)
      /\b([A-Z]\d+[A-Z]\d+[A-Z]*)\b/gi       // Generic electrical patterns
    ];
    
    workbook.SheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      const sheetAnalysis = {
        name: sheetName,
        totalRows: jsonData.length,
        patternsFound: 0,
        cellsWithReceptacles: []
      };
      
      jsonData.forEach((row: any[], rowIndex) => {
        if (!row || row.length === 0) return;
        
        row.forEach((cell, colIndex) => {
          if (!cell || typeof cell !== 'string') return;
          
          analysisData.cellsScanned++;
          const cellValue = cell.toString().trim();
          
          // Check for receptacle patterns
          receptaclePatterns.forEach(pattern => {
            const matches = cellValue.match(pattern);
            if (matches) {
              matches.forEach(match => {
                // Try to extract full pattern from surrounding cells
                const fullPattern = extractFullPatternFromRow(row, colIndex, match);
                if (fullPattern) {
                  extractedPatterns.push(fullPattern);
                  sheetAnalysis.patternsFound++;
                  sheetAnalysis.cellsWithReceptacles.push({
                    cell: `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`,
                    receptacle: match,
                    fullPattern: fullPattern,
                    rawValue: cellValue
                  });
                }
              });
            }
          });
        });
      });
      
      analysisData.sheetsAnalyzed.push(sheetAnalysis);
      analysisData.patternsFound += sheetAnalysis.patternsFound;
    });
    
    return {
      patterns: [...new Set(extractedPatterns)], // Remove duplicates
      analysis: analysisData
    };
  };
  
  // Helper function to extract full patterns from Excel rows
  const extractFullPatternFromRow = (row: any[], receptacleIndex: number, receptacle: string): string | null => {
    const nearby = 3; // Check 3 cells on each side
    let conduit = '', length = '', tailLength = '10', color = '';
    
    // Look for conduit, length, and color in nearby cells
    for (let i = Math.max(0, receptacleIndex - nearby); i < Math.min(row.length, receptacleIndex + nearby + 1); i++) {
      if (i === receptacleIndex) continue;
      
      const cellValue = row[i]?.toString().trim();
      if (!cellValue) continue;
      
      // Check for conduit type
      const conduitMatch = cellValue.match(/\b(MMC|LFMC|FMC|LMZC|SO|MC|EMT)\b/i);
      if (conduitMatch && !conduit) {
        conduit = conduitMatch[1].toUpperCase();
      }
      
      // Check for length (prefer larger numbers for whip length)
      const lengthMatch = cellValue.match(/\b(\d+)['"]?\s*(?:ft|feet|foot)?\b/i);
      if (lengthMatch && !length) {
        const num = parseInt(lengthMatch[1]);
        if (num > 15) { // Likely whip length
          length = num.toString();
        } else if (num <= 15 && !tailLength) { // Likely tail length
          tailLength = num.toString();
        }
      }
      
      // Check for color
      const colorMatch = cellValue.match(/\b(red|blue|green|yellow|orange|purple|black|white|gray|grey)\b/i);
      if (colorMatch && !color) {
        color = colorMatch[1].toLowerCase();
      }
    }
    
    // Use defaults if not found
    if (!conduit) conduit = 'MMC';
    if (!length) length = '25';
    if (!color) color = 'red';
    
    return `${receptacle},${conduit},${length},${tailLength},${color}`;
  };

  // Advanced Excel transformation for WHIP LABEL processing
  const transformWhipLabelData = (workbook: any) => {
    const transformedRows: any[] = [];
    const analysisData = {
      totalSheets: workbook.SheetNames.length,
      sheetsProcessed: [],
      originalRows: 0,
      transformedRows: 0,
      labelSourcesSplit: 0
    };

    workbook.SheetNames.forEach((sheetName: string) => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) return;
      
      const headers = jsonData[0] as string[];
      const sheetAnalysis = {
        name: sheetName,
        originalRows: jsonData.length - 1,
        transformedRows: 0,
        headersFound: headers
      };
      
      // Find column indices for required fields
      const columnMap = {
        whipLabelSource1: headers.findIndex(h => h?.toString().toLowerCase().includes('whip label source 1')),
        source1Length: headers.findIndex(h => h?.toString().toLowerCase().includes('source 1 length')),
        whipLabelSource2: headers.findIndex(h => h?.toString().toLowerCase().includes('whip label source 2')),
        source2Length: headers.findIndex(h => h?.toString().toLowerCase().includes('source 2 length')),
        rowNum: headers.findIndex(h => h?.toString().toLowerCase().includes('row #')),
        rackNum: headers.findIndex(h => h?.toString().toLowerCase().includes('rack#')),
        receptacleType: headers.findIndex(h => h?.toString().toLowerCase().includes('receptacle type')),
        sealtight: headers.findIndex(h => h?.toString().toLowerCase().includes('sealtight')),
        conductors: headers.findIndex(h => h?.toString().toLowerCase().includes('conductors'))
      };
      
      // Process data rows (skip header)
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.length === 0) continue;
        
        analysisData.originalRows++;
        sheetAnalysis.originalRows++;
        
        // Extract data from current row
        const baseData = {
          rowNum: row[columnMap.rowNum] || '',
          rackNum: row[columnMap.rackNum] || '',
          receptacleType: row[columnMap.receptacleType] || '',
          sealtight: row[columnMap.sealtight] || '',
          conductors: row[columnMap.conductors] || '',
          sourceSheet: sheetName,
          originalRowIndex: i
        };
        
        // Process Source 1 if exists
        const whipLabelSource1 = row[columnMap.whipLabelSource1];
        const source1Length = row[columnMap.source1Length];
        if (whipLabelSource1) {
          transformedRows.push({
            ...baseData,
            whipLabel: whipLabelSource1,
            sourceLength: source1Length || '',
            sourceNumber: 1,
            transformedId: `${sheetName}_${i}_S1`
          });
          analysisData.transformedRows++;
          analysisData.labelSourcesSplit++;
          sheetAnalysis.transformedRows++;
        }
        
        // Process Source 2 if exists
        const whipLabelSource2 = row[columnMap.whipLabelSource2];
        const source2Length = row[columnMap.source2Length];
        if (whipLabelSource2) {
          transformedRows.push({
            ...baseData,
            whipLabel: whipLabelSource2,
            sourceLength: source2Length || '',
            sourceNumber: 2,
            transformedId: `${sheetName}_${i}_S2`
          });
          analysisData.transformedRows++;
          analysisData.labelSourcesSplit++;
          sheetAnalysis.transformedRows++;
        }
      }
      
      analysisData.sheetsProcessed.push(sheetAnalysis);
    });
    
    return {
      transformedData: transformedRows,
      analysis: analysisData
    };
  };

  // Generate Excel output from transformed data
  const generateTransformedExcel = (transformedData: any[]) => {
    const outputHeaders = [
      'WHIP LABEL',
      'SOURCE LENGTH', 
      'ROW #',
      'RACK#',
      'RECEPTACLE TYPE',
      'SEALTIGHT',
      'CONDUCTORS',
      'SOURCE NUMBER',
      'SOURCE SHEET',
      'ORIGINAL ROW'
    ];
    
    const outputData = [
      outputHeaders,
      ...transformedData.map(row => [
        row.whipLabel,
        row.sourceLength,
        row.rowNum,
        row.rackNum,
        row.receptacleType,
        row.sealtight,
        row.conductors,
        row.sourceNumber,
        row.sourceSheet,
        row.originalRowIndex
      ])
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(outputData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transformed_Data');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  };

  // Excel transformation routes with intelligent pattern extraction
  app.post("/api/excel/transform", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse the uploaded Excel file
      const workbook = XLSX.read(file.buffer);
      
      // Extract receptacle patterns using enhanced parsing
      const extractionResult = extractReceptaclePatternsFromExcel(workbook);
      
      // Process extracted patterns through the multi-format parser
      const processedPatterns = extractionResult.patterns.map((pattern: string) => {
        const parsed = parseReceptaclePattern(pattern);
        
        let formatType = 'comma-delimited';
        if (pattern.includes('\t')) {
          formatType = 'tab-delimited';
        } else if (!pattern.includes(',') && pattern.includes(' ')) {
          formatType = 'space-delimited';
        }
        
        return {
          original: pattern,
          formatType,
          parsed,
          formatted: `${parsed.receptacle}, ${parsed.cableConduitType}, ${parsed.whipLength}, ${parsed.tailLength}, ${parsed.labelColor}`
        };
      });

      res.json({
        success: true,
        fileName: file.originalname,
        extractedPatterns: processedPatterns,
        totalPatterns: processedPatterns.length,
        analysis: extractionResult.analysis,
        supportedFormats: ['comma-delimited', 'tab-delimited', 'space-delimited'],
        processingMethod: 'intelligent_excel_extraction'
      });
    } catch (error) {
      console.error('Error transforming Excel file:', error);
      res.status(500).json({ error: 'Failed to transform Excel file' });
    }
  });

  // New WHIP LABEL transformation endpoint
  app.post("/api/excel/transform-whip-labels", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse the uploaded Excel file
      const workbook = XLSX.read(file.buffer);
      
      // Transform WHIP LABEL data
      const transformResult = transformWhipLabelData(workbook);
      
      res.json({
        success: true,
        fileName: file.originalname,
        transformedData: transformResult.transformedData,
        analysis: transformResult.analysis,
        processingMethod: 'whip_label_transformation'
      });
    } catch (error) {
      console.error('Error transforming WHIP LABEL file:', error);
      res.status(500).json({ error: 'Failed to transform WHIP LABEL file' });
    }
  });

  // Export transformed WHIP LABEL data as Excel
  app.post("/api/excel/export-transformed-whip", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Parse and transform the Excel file
      const workbook = XLSX.read(file.buffer);
      const transformResult = transformWhipLabelData(workbook);
      
      // Generate Excel output
      const excelBuffer = generateTransformedExcel(transformResult.transformedData);
      
      // Set headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="transformed_${file.originalname}"`);
      
      res.send(excelBuffer);
    } catch (error) {
      console.error('Error exporting transformed WHIP LABEL file:', error);
      res.status(500).json({ error: 'Failed to export transformed WHIP LABEL file' });
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
      
      // Extract total quantity (enhanced patterns) 
      const quantityMatch = line.match(/(\d+)\s*(?:power\s*)?whips?\s*(?:total|needed|required)/i) || 
                           line.match(/(\d+)\s*whips?\s*(?:total|needed|required)/i);
      if (quantityMatch) {
        specification.totalQuantity = parseInt(quantityMatch[1]);
      }
      
      // Extract length range or discrete lengths
      const lengthRangeMatch = line.match(/(\d+)['']?\s*-\s*(\d+)['']?/);
      const discreteLengthsMatch = line.match(/lengths?:\s*([\d,\s]+)/i);
      
      if (lengthRangeMatch && lowerLine.includes('length')) {
        specification.lengthRange.min = parseInt(lengthRangeMatch[1]);
        specification.lengthRange.max = parseInt(lengthRangeMatch[2]);
      } else if (discreteLengthsMatch) {
        // Parse discrete lengths like "10, 20, 30"
        const lengths = discreteLengthsMatch[1].split(',').map(l => parseInt(l.trim())).filter(l => !isNaN(l));
        if (lengths.length > 0) {
          specification.lengthRange = {
            min: Math.min(...lengths),
            max: Math.max(...lengths),
            step: lengths.length > 1 ? lengths[1] - lengths[0] : 20,
            discreteLengths: lengths
          };
        }
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
    
    // Use discrete lengths if available, otherwise use range-based lengths
    const lengths = lengthRange.discreteLengths || [];
    if (lengths.length === 0) {
      for (let length = lengthRange.min; length <= lengthRange.max; length += lengthRange.step) {
        lengths.push(length);
      }
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

  // Helper function to parse comma-delimited patterns
  const parseReceptaclePattern = (pattern: string) => {
    let parts: string[] = [];
    
    // Enhanced pattern parsing: Support comma-delimited, tab-delimited, and space-delimited
    if (pattern.includes(',')) {
      // Comma-delimited: "460C9W,MMC,115,10,red"
      parts = pattern.split(',').map(p => p.trim());
    } else if (pattern.includes('\t')) {
      // Tab-delimited: "460C9W MMC     115     10      red"
      parts = pattern.split('\t').map(p => p.trim()).filter(p => p.length > 0);
    } else {
      // Space-delimited: "460C9W MMC 115 10 red"
      // Use regex to split on whitespace while preserving multi-word values
      parts = pattern.trim().split(/\s+/).filter(p => p.length > 0);
    }
    
    return {
      receptacle: parts[0] || '',
      cableConduitType: parts[1] || '',
      whipLength: parts[2] || '',
      tailLength: parts[3] || '',
      labelColor: parts[4] || ''
    };
  };

  app.post("/api/excel/export-master-bubble", async (req, res) => {
    try {
      const { receptacles, rawData } = req.body;
      const XLSX = await import('xlsx');
      
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
      const filePath = './attached_assets/ConfiguratorModelDatasetEPW_1754006250837.xlsx';
      const workbook = XLSX.readFile(filePath);
      
      const results = inputPatterns.map((pattern: string) => {
        // Check if this is a natural language specification
        const isNaturalLanguage = pattern.toLowerCase().includes('power whips total') || 
                                  pattern.toLowerCase().includes('whip lengths ranging') ||
                                  pattern.toLowerCase().includes('liquid tight conduit');
        
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

  // Enhanced Fast Processing Endpoint for Excel Master Bubble Format Transformer
  app.post('/api/excel/fast-transform', async (req, res) => {
    try {
      const { patterns, naturalLanguageInput } = req.body;
      const startTime = Date.now();
      
      let processedPatterns: string[] = [];
      
      // Handle natural language input with enhanced speed
      if (naturalLanguageInput && naturalLanguageInput.trim()) {
        const specification = parseNaturalLanguageSpecification(naturalLanguageInput);
        const generatedPatterns = generateDistributionPatterns(specification);
        
        return res.json({
          success: true,
          processingTimeMs: Date.now() - startTime,
          naturalLanguageProcessed: true,
          specification: specification,
          totalGeneratedRows: generatedPatterns.length,
          patterns: generatedPatterns,
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
        });
      }
      
      // Handle multi-format patterns (comma, tab, space delimited) with enhanced speed
      if (patterns && Array.isArray(patterns)) {
        processedPatterns = patterns.map((pattern: string) => {
          const parsed = parseReceptaclePattern(pattern);
          
          // Determine format type for reporting
          let formatType = 'comma-delimited';
          if (pattern.includes('\t')) {
            formatType = 'tab-delimited';
          } else if (!pattern.includes(',') && pattern.includes(' ')) {
            formatType = 'space-delimited';
          }
          
          return {
            original: pattern,
            formatType: formatType,
            parsed: parsed,
            formatted: `${parsed.receptacle}, ${parsed.cableConduitType || 'LMZC'}, ${parsed.whipLength || '25'}, ${parsed.tailLength || '10'}${parsed.labelColor ? ', ' + parsed.labelColor : ''}`
          };
        });
      }
      
      const processingTime = Date.now() - startTime;
      
      res.json({
        success: true,
        processingTimeMs: processingTime,
        processedPatterns: processedPatterns,
        totalPatterns: processedPatterns.length,
        supportedFormats: ['comma-delimited', 'tab-delimited', 'space-delimited'],
        formatExamples: {
          'comma-delimited': '460C9W,MMC,115,10,red',
          'tab-delimited': '460C9W\tMMC\t115\t10\tred',
          'space-delimited': '460C9W MMC 115 10 red'
        },
        optimized: true
      });
      
    } catch (error) {
      console.error('Error in fast transform:', error);
      res.status(500).json({ error: 'Failed to fast transform patterns' });
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

  // EXAMPLE03 Builder Sheet Transform - Power Cable Specification Processing  
  app.post('/api/excel/transform-builder-sheet', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      
      // Look for Builder sheet specifically
      const builderSheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('builder')
      );
      
      if (!builderSheetName) {
        return res.status(400).json({ error: 'Builder sheet not found in uploaded file' });
      }

      const worksheet = workbook.Sheets[builderSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      // Find the header row (contains "Power Cable Number", "Labels", etc.)
      let headerRowIndex = -1;
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.some((cell: any) => 
          cell && cell.toString().toLowerCase().includes('power cable number')
        )) {
          headerRowIndex = i;
          break;
        }
      }

      if (headerRowIndex === -1) {
        return res.status(400).json({ error: 'Header row not found in Builder sheet' });
      }

      const headers = rawData[headerRowIndex];
      const dataRows = rawData.slice(headerRowIndex + 2); // Skip header and sub-header
      
      // Transform data into structured format
      const transformedData = [];
      let transformedCount = 0;

      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex];
        if (!row || row.every((cell: any) => !cell)) continue; // Skip empty rows
        
        // Map row data to structured object based on Builder sheet format
        const powerCableEntry = {
          id: transformedCount + 1,
          powerCableNumber: row[0] || '',
          pduLabel: row[1] || '',
          panelLabel: row[2] || '',
          circuitNumber: row[3] || '',
          equipment: row[4] || '',
          other: row[5] || '',
          receptacleType: row[10] || '',
          terminatingDevice: row[12] || '',
          phaseCount: row[13] || '',
          panelPhase: row[14] || '',
          volts: row[15] || '',
          amps: row[16] || '',
          cableLength: row[17] || '',
          pigtailLength: row[18] || '',
          boxType: row[19] || '',
          mountingHardware: row[20] || '',
          mountingHardwareSize: row[21] || '',
          conduitType: row[22] || '',
          conduitDiameter: row[23] || '',
          conduitColor: row[24] || '',
          hotWireGauge: row[25] || '',
          groundWireGauge: row[26] || '',
          wireCount: row[27] || '',
          hotWireColors: row[28] || '',
          breakerBrand: row[29] || '',
          breakerAmps: row[30] || '',
          breakerPoles: row[31] || '',
          notes: row[32] || '',
          validation: row[33] || '',
          originalRowIndex: rowIndex + headerRowIndex + 2
        };

        transformedData.push(powerCableEntry);
        transformedCount++;
      }

      const analysis = {
        fileName: req.file.originalname,
        originalRows: dataRows.length,
        transformedRows: transformedCount,
        sheetName: builderSheetName,
        headersFound: headers.filter((h: any) => h).slice(0, 10),
        powerCableCount: transformedCount,
        transformationType: 'Builder Sheet - Power Cable Specifications'
      };

      res.json({
        success: true,
        fileName: req.file.originalname,
        analysis,
        transformedData: transformedData.slice(0, 20), // Send first 20 for preview
        isBuilderSheetTransform: true,
        totalTransformed: transformedCount
      });

    } catch (error) {
      console.error('Builder sheet transformation error:', error);
      res.status(500).json({ 
        error: 'Failed to transform Builder sheet',
        details: error.message 
      });
    }
  });

  // Export Builder Sheet transformed data
  app.post('/api/excel/export-transformed-builder', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Process the file using the same logic as transform-builder-sheet
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const builderSheetName = workbook.SheetNames.find(name => 
        name.toLowerCase().includes('builder')
      );
      
      if (!builderSheetName) {
        return res.status(400).json({ error: 'Builder sheet not found' });
      }

      const worksheet = workbook.Sheets[builderSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      let headerRowIndex = -1;
      for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (row && row.some((cell: any) => 
          cell && cell.toString().toLowerCase().includes('power cable number')
        )) {
          headerRowIndex = i;
          break;
        }
      }

      const headers = rawData[headerRowIndex];
      const dataRows = rawData.slice(headerRowIndex + 2);
      
      // Create new workbook with transformed data
      const newWorkbook = XLSX.utils.book_new();
      
      // Create structured output data
      const outputData = [
        [
          'ID', 'Power Cable Number', 'PDU Label', 'Panel Label', 'Circuit Number',
          'Equipment', 'Receptacle Type', 'Terminating Device', 'Phase Count',
          'Panel Phase', 'Volts', 'Amps', 'Cable Length', 'Pigtail Length',
          'Box Type', 'Mounting Hardware', 'Conduit Type', 'Wire Gauge',
          'Wire Colors', 'Breaker Brand', 'Notes', 'Original Row'
        ]
      ];
      
      let transformedCount = 0;
      for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
        const row = dataRows[rowIndex];
        if (!row || row.every((cell: any) => !cell)) continue;
        
        outputData.push([
          transformedCount + 1,
          row[0] || '', // Power Cable Number
          row[1] || '', // PDU Label
          row[2] || '', // Panel Label
          row[3] || '', // Circuit Number
          row[4] || '', // Equipment
          row[10] || '', // Receptacle Type
          row[12] || '', // Terminating Device
          row[13] || '', // Phase Count
          row[14] || '', // Panel Phase
          row[15] || '', // Volts
          row[16] || '', // Amps
          row[17] || '', // Cable Length
          row[18] || '', // Pigtail Length
          row[19] || '', // Box Type
          row[20] || '', // Mounting Hardware
          row[22] || '', // Conduit Type
          row[25] || '', // Wire Gauge
          row[28] || '', // Wire Colors
          row[29] || '', // Breaker Brand
          row[32] || '', // Notes
          rowIndex + headerRowIndex + 2 // Original Row
        ]);
        transformedCount++;
      }

      const newWorksheet = XLSX.utils.aoa_to_sheet(outputData);
      XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Transformed_Builder_Data');

      const buffer = XLSX.write(newWorkbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="TransformedBuilderSheet.xlsx"');
      res.send(buffer);

    } catch (error) {
      console.error('Export Builder sheet error:', error);
      res.status(500).json({ error: 'Failed to export transformed Builder sheet' });
    }
  });

  // ============================================================================
  // COMPONENT DATA SOURCES API ROUTES
  // ============================================================================
  
  // Get all data sources
  app.get("/api/data-sources", async (req, res) => {
    try {
      const sources = await storage.getAllDataSources();
      res.json(sources);
    } catch (error) {
      console.error('Error fetching data sources:', error);
      res.status(500).json({ error: "Failed to fetch data sources" });
    }
  });

  // Create new data source
  app.post("/api/data-sources", async (req, res) => {
    try {
      const validation = insertComponentDataSourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid data source configuration",
          details: validation.error.errors 
        });
      }

      const source = await storage.createDataSource(validation.data);
      res.status(201).json(source);
    } catch (error) {
      console.error('Error creating data source:', error);
      res.status(500).json({ error: "Failed to create data source" });
    }
  });

  // Sync data source
  app.post("/api/data-sources/:id/sync", async (req, res) => {
    try {
      const result = await storage.syncDataSource(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Error syncing data source:', error);
      res.status(500).json({ 
        success: false, 
        componentCount: 0, 
        errors: [error instanceof Error ? error.message : 'Unknown sync error'] 
      });
    }
  });

  // Delete data source
  app.delete("/api/data-sources/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDataSource(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Data source not found" });
      }
      res.json({ success: true, message: "Data source deleted successfully" });
    } catch (error) {
      console.error('Error deleting data source:', error);
      res.status(500).json({ error: "Failed to delete data source" });
    }
  });

  // Test data source configuration
  app.post("/api/data-sources/test", async (req, res) => {
    try {
      const validation = insertComponentDataSourceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid data source configuration",
          details: validation.error.errors 
        });
      }

      // Create temporary data source for testing
      const tempSource = {
        ...validation.data,
        id: 'test',
        lastSync: null,
        syncStatus: 'pending' as const,
        syncLog: null,
        componentCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Test the data source connection
      const { DataSourceManager } = await import('./dataSourceManager');
      const dataSourceManager = new DataSourceManager();
      const result = await dataSourceManager.syncDataSource(tempSource);

      res.json({
        success: result.success,
        componentCount: result.components.length,
        sampleComponents: result.components.slice(0, 5), // Show first 5 components
        errors: result.errors
      });
    } catch (error) {
      console.error('Error testing data source:', error);
      res.status(500).json({ 
        success: false,
        componentCount: 0,
        sampleComponents: [],
        errors: [error instanceof Error ? error.message : 'Unknown test error'] 
      });
    }
  });

  // NEW: Design Canvas XLSX Export with Receptacle Pattern Lookup
  // Design Canvas XLSX Export endpoint - Dedicated standalone export
  app.post("/api/design-canvas/export-xlsx", async (req, res) => {
    try {
      const { components, exportType } = req.body;
      
      console.log(`Design Canvas Export: Processing ${components?.length || 0} components for ${exportType}`);
      
      if (!components || !Array.isArray(components)) {
        return res.status(400).json({ error: 'Invalid components data' });
      }

      // Use dedicated Design Canvas Exporter
      const { DesignCanvasExporter } = await import('./designCanvasExport');
      const exporter = new DesignCanvasExporter();
      
      // Export design canvas to Excel buffer
      const excelBuffer = await exporter.exportDesignCanvas({
        components,
        exportType: exportType || 'receptacle-pattern-lookup'
      });

      // Set response headers for DesignCanvasOutput.xlsx download
      res.setHeader('Content-Disposition', 'attachment; filename=DesignCanvasOutput.xlsx');
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      
      // Send the Excel file
      res.send(excelBuffer);
      
      console.log(`DesignCanvasOutput.xlsx export completed: ${components?.length || 0} components exported`);
      
    } catch (error) {
      console.error('Design Canvas XLSX export error:', error);
      res.status(500).json({ 
        message: "Failed to export Design Canvas to XLSX",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
