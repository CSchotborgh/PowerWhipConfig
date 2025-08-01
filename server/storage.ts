import { 
  type PowerWhipConfiguration, 
  type InsertPowerWhipConfiguration, 
  type ElectricalComponent, 
  type InsertElectricalComponent,
  type ExcelFormulaLibrary,
  type InsertExcelFormulaLibrary,
  type ExcelPatternLibrary,
  type InsertExcelPatternLibrary,
  type ExcelFileArchive,
  type InsertExcelFileArchive
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Power Whip Configuration methods
  getConfiguration(id: string): Promise<PowerWhipConfiguration | undefined>;
  getAllConfigurations(): Promise<PowerWhipConfiguration[]>;
  createConfiguration(config: InsertPowerWhipConfiguration): Promise<PowerWhipConfiguration>;
  updateConfiguration(id: string, config: Partial<InsertPowerWhipConfiguration>): Promise<PowerWhipConfiguration | undefined>;
  deleteConfiguration(id: string): Promise<boolean>;
  
  // Electrical Component methods
  getComponent(id: string): Promise<ElectricalComponent | undefined>;
  getAllComponents(): Promise<ElectricalComponent[]>;
  getComponentsByType(type: string): Promise<ElectricalComponent[]>;
  createComponent(component: InsertElectricalComponent): Promise<ElectricalComponent>;
  
  // Excel Formula Library methods
  saveFormulaToLibrary(formula: InsertExcelFormulaLibrary): Promise<ExcelFormulaLibrary>;
  savePatternToLibrary(pattern: InsertExcelPatternLibrary): Promise<ExcelPatternLibrary>;
  saveFileToArchive(fileData: InsertExcelFileArchive): Promise<ExcelFileArchive>;
  getFormulasFromLibrary(category?: string): Promise<ExcelFormulaLibrary[]>;
  getPatternsFromLibrary(patternType?: string): Promise<ExcelPatternLibrary[]>;
  getArchivedFiles(): Promise<ExcelFileArchive[]>;
  searchFormulas(searchTerm: string): Promise<ExcelFormulaLibrary[]>;
  searchPatterns(searchTerm: string): Promise<ExcelPatternLibrary[]>;
}

export class MemStorage implements IStorage {
  private configurations: Map<string, PowerWhipConfiguration>;
  private components: Map<string, ElectricalComponent>;
  private formulaLibrary: Map<string, ExcelFormulaLibrary>;
  private patternLibrary: Map<string, ExcelPatternLibrary>;
  private fileArchive: Map<string, ExcelFileArchive>;

  constructor() {
    this.configurations = new Map();
    this.components = new Map();
    this.formulaLibrary = new Map();
    this.patternLibrary = new Map();
    this.fileArchive = new Map();
    this.initializeDefaultComponents();
  }

  private initializeDefaultComponents() {
    const defaultComponents: InsertElectricalComponent[] = [
      // Connectors
      {
        name: "NEMA 5-15P",
        type: "connector",
        category: "input",
        specifications: { type: "plug", poles: 3, voltage: 125, current: 15 },
        symbol: "plug",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 12.50
      },
      {
        name: "NEMA 5-15R",
        type: "connector",
        category: "output",
        specifications: { type: "receptacle", poles: 3, voltage: 125, current: 15 },
        symbol: "receptacle",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 8.75
      },
      {
        name: "Twist-Lock L5-20P",
        type: "connector",
        category: "input",
        specifications: { type: "plug", poles: 3, voltage: 125, current: 20 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 18.25
      },
      {
        name: "IEC C13",
        type: "connector",
        category: "output",
        specifications: { type: "receptacle", poles: 3, voltage: 250, current: 10 },
        symbol: "iec",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 10,
        compatibleGauges: ["12", "14"],
        price: 6.50
      },
      
      // Protection
      {
        name: "20A Circuit Breaker",
        type: "protection",
        category: "breaker",
        specifications: { rating: 20, type: "thermal-magnetic", poles: 1 },
        symbol: "breaker",
        icon: "fas fa-shield-alt",
        maxVoltage: 240,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 35.00
      },
      {
        name: "GFCI Outlet",
        type: "protection",
        category: "gfci",
        specifications: { rating: 15, type: "gfci", testButton: true },
        symbol: "gfci",
        icon: "fas fa-flash",
        maxVoltage: 125,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 28.50
      },
      {
        name: "Surge Protector",
        type: "protection",
        category: "surge",
        specifications: { joules: 2000, response: "1ns", warranty: "lifetime" },
        symbol: "surge",
        icon: "fas fa-exclamation-triangle",
        maxVoltage: 240,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 45.00
      },
      {
        name: "15A Fuse",
        type: "protection",
        category: "fuse",
        specifications: { rating: 15, type: "time-delay", voltage: 250 },
        symbol: "fuse",
        icon: "fas fa-fire",
        maxVoltage: 250,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 3.25
      },
      
      // Junction
      {
        name: "4x4 Junction Box",
        type: "junction",
        category: "box",
        specifications: { size: "4x4", depth: 2.125, material: "steel" },
        symbol: "junction",
        icon: "fas fa-cube",
        maxVoltage: 600,
        maxCurrent: 40,
        compatibleGauges: ["8", "10", "12", "14"],
        price: 12.75
      }
    ];

    defaultComponents.forEach(component => {
      const id = randomUUID();
      const fullComponent: ElectricalComponent = { 
        ...component, 
        id,
        maxVoltage: component.maxVoltage ?? null,
        maxCurrent: component.maxCurrent ?? null,
        price: component.price ?? null,
        compatibleGauges: component.compatibleGauges ?? null
      };
      this.components.set(id, fullComponent);
    });
  }

  // Power Whip Configuration methods
  async getConfiguration(id: string): Promise<PowerWhipConfiguration | undefined> {
    return this.configurations.get(id);
  }

  async getAllConfigurations(): Promise<PowerWhipConfiguration[]> {
    return Array.from(this.configurations.values());
  }

  async createConfiguration(config: InsertPowerWhipConfiguration): Promise<PowerWhipConfiguration> {
    const id = randomUUID();
    const now = new Date();
    const configuration: PowerWhipConfiguration = { 
      ...config, 
      id, 
      isValid: config.isValid ?? false,
      validationResults: config.validationResults ?? null,
      createdAt: now,
      updatedAt: now
    };
    this.configurations.set(id, configuration);
    return configuration;
  }

  async updateConfiguration(id: string, config: Partial<InsertPowerWhipConfiguration>): Promise<PowerWhipConfiguration | undefined> {
    const existing = this.configurations.get(id);
    if (!existing) return undefined;
    
    const updated: PowerWhipConfiguration = { 
      ...existing, 
      ...config, 
      updatedAt: new Date() 
    };
    this.configurations.set(id, updated);
    return updated;
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    return this.configurations.delete(id);
  }

  // Electrical Component methods
  async getComponent(id: string): Promise<ElectricalComponent | undefined> {
    return this.components.get(id);
  }

  async getAllComponents(): Promise<ElectricalComponent[]> {
    return Array.from(this.components.values());
  }

  async getComponentsByType(type: string): Promise<ElectricalComponent[]> {
    return Array.from(this.components.values()).filter(c => c.type === type);
  }

  async createComponent(component: InsertElectricalComponent): Promise<ElectricalComponent> {
    const id = randomUUID();
    const fullComponent: ElectricalComponent = { 
      ...component, 
      id,
      maxVoltage: component.maxVoltage ?? null,
      maxCurrent: component.maxCurrent ?? null,
      price: component.price ?? null,
      compatibleGauges: component.compatibleGauges ?? null
    };
    this.components.set(id, fullComponent);
    return fullComponent;
  }

  // Excel Formula Library methods
  async saveFormulaToLibrary(formula: InsertExcelFormulaLibrary): Promise<ExcelFormulaLibrary> {
    const id = randomUUID();
    const now = new Date();
    const fullFormula: ExcelFormulaLibrary = {
      ...formula,
      id,
      usage: formula.usage ?? 0,
      isActive: formula.isActive ?? true,
      createdAt: now
    };
    this.formulaLibrary.set(id, fullFormula);
    return fullFormula;
  }

  async savePatternToLibrary(pattern: InsertExcelPatternLibrary): Promise<ExcelPatternLibrary> {
    const id = randomUUID();
    const now = new Date();
    const fullPattern: ExcelPatternLibrary = {
      ...pattern,
      id,
      usage: pattern.usage ?? 0,
      isTemplate: pattern.isTemplate ?? false,
      createdAt: now
    };
    this.patternLibrary.set(id, fullPattern);
    return fullPattern;
  }

  async saveFileToArchive(fileData: InsertExcelFileArchive): Promise<ExcelFileArchive> {
    const id = randomUUID();
    const now = new Date();
    const fullFileData: ExcelFileArchive = {
      ...fileData,
      id,
      isProcessed: fileData.isProcessed ?? false,
      createdAt: now
    };
    this.fileArchive.set(id, fullFileData);
    return fullFileData;
  }

  async getFormulasFromLibrary(category?: string): Promise<ExcelFormulaLibrary[]> {
    const formulas = Array.from(this.formulaLibrary.values());
    if (category) {
      return formulas.filter(f => f.category === category && f.isActive);
    }
    return formulas.filter(f => f.isActive);
  }

  async getPatternsFromLibrary(patternType?: string): Promise<ExcelPatternLibrary[]> {
    const patterns = Array.from(this.patternLibrary.values());
    if (patternType) {
      return patterns.filter(p => p.patternType === patternType);
    }
    return patterns;
  }

  async getArchivedFiles(): Promise<ExcelFileArchive[]> {
    return Array.from(this.fileArchive.values());
  }

  async searchFormulas(searchTerm: string): Promise<ExcelFormulaLibrary[]> {
    const formulas = Array.from(this.formulaLibrary.values());
    const term = searchTerm.toLowerCase();
    return formulas.filter(f => 
      f.isActive && (
        f.formulaText.toLowerCase().includes(term) ||
        f.description?.toLowerCase().includes(term) ||
        f.category?.toLowerCase().includes(term)
      )
    );
  }

  async searchPatterns(searchTerm: string): Promise<ExcelPatternLibrary[]> {
    const patterns = Array.from(this.patternLibrary.values());
    const term = searchTerm.toLowerCase();
    return patterns.filter(p => 
      p.patternName.toLowerCase().includes(term) ||
      p.businessLogic?.toLowerCase().includes(term) ||
      (p.tags && p.tags.some((tag: any) => 
        typeof tag === 'string' && tag.toLowerCase().includes(term)
      ))
    );
  }
}

export const storage = new MemStorage();
