import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPowerWhipConfigurationSchema, insertElectricalComponentSchema } from "@shared/schema";
import { z } from "zod";
import { parseExcelFile, extractComponentData, analyzeExcelStructure, generateBOM } from "./excelParser";
import * as path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  const enhanced = { ...component.specifications } || {};
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

  const httpServer = createServer(app);
  return httpServer;
}
