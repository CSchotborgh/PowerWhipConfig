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
      const filePath = path.join(__dirname, '../attached_assets/MasterBubbleUpLookup_1753982166714.xlsx');
      const sheets = parseExcelFile(filePath);
      const components = extractComponentData(sheets);
      res.json(components);
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
