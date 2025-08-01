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

export function registerRoutes(app: Express): Server {
  // Basic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get components from Excel
  app.get("/api/components", async (req, res) => {
    try {
      const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753986672989.xlsx');
      const sheets = parseExcelFile(filePath);
      const components = extractComponentData(sheets);
      
      res.json(components.slice(0, 100)); // Limit for performance
    } catch (error) {
      console.error('Excel components error:', error);
      res.status(500).json({ message: "Failed to extract components from Excel" });
    }
  });

  // Export to Master Bubble format - OPTIMIZED
  app.post("/api/excel/export-master-bubble", async (req, res) => {
    try {
      const { receptacles, rawData } = req.body;
      
      // Create workbook with Order Entry format
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
      
      // Process receptacle data efficiently
      let lineNumber = 1;
      receptacles.forEach((receptacle: any) => {
        // Handle generated patterns with quantity multiplication
        if (receptacle.generatedPatterns && receptacle.generatedPatterns.length > 0) {
          receptacle.generatedPatterns.forEach((generatedPattern: string) => {
            const parsedPattern = parseReceptaclePattern(generatedPattern);
            
            // If quantity-based pattern, generate multiple rows
            const rowCount = parsedPattern.hasQuantity ? parsedPattern.quantity : 1;
            
            for (let i = 0; i < rowCount; i++) {
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
            }
          });
        }
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(orderEntryData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Order Entry');
      
      // Generate Excel buffer with proper headers
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="MasterBubbleTransformed.xlsx"');
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (error) {
      console.error('Error exporting Master Bubble format:', error);
      res.status(500).json({ error: 'Failed to export Master Bubble format' });
    }
  });

  // Process configurator - OPTIMIZED for speed
  app.post('/api/excel/process-configurator', async (req, res) => {
    try {
      const { inputPatterns } = req.body;
      
      const results = inputPatterns.map((pattern: string) => {
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
        
        // Regular pattern processing
        const parsedPattern = parseReceptaclePattern(pattern);
        
        return {
          inputPattern: pattern,
          isQuantityBased: false,
          parsedPattern: parsedPattern,
          generatedPatterns: [pattern],
          totalGeneratedRows: 1,
          quantitySpecified: 1
        };
      });
      
      res.json({ results, processedCount: inputPatterns.length });
    } catch (error) {
      console.error('Error processing with ConfiguratorDataset:', error);
      res.status(500).json({ error: 'Failed to process with ConfiguratorDataset' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}