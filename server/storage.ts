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
  type InsertExcelFileArchive,
  type ComponentDataSource,
  type InsertComponentDataSource
} from "@shared/schema";
import { randomUUID } from "crypto";
import { DataSourceManager } from "./dataSourceManager";

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
  
  // Component Data Source methods
  createDataSource(source: InsertComponentDataSource): Promise<ComponentDataSource>;
  getAllDataSources(): Promise<ComponentDataSource[]>;
  getDataSource(id: string): Promise<ComponentDataSource | undefined>;
  updateDataSource(id: string, source: Partial<InsertComponentDataSource>): Promise<ComponentDataSource | undefined>;
  deleteDataSource(id: string): Promise<boolean>;
  syncDataSource(id: string): Promise<{ success: boolean; componentCount: number; errors: string[] }>;
}

export class MemStorage implements IStorage {
  private configurations: Map<string, PowerWhipConfiguration>;
  private components: Map<string, ElectricalComponent>;
  private formulaLibrary: Map<string, ExcelFormulaLibrary>;
  private patternLibrary: Map<string, ExcelPatternLibrary>;
  private fileArchive: Map<string, ExcelFileArchive>;
  private dataSources: Map<string, ComponentDataSource>;
  private dataSourceManager: DataSourceManager;

  constructor() {
    this.configurations = new Map();
    this.components = new Map();
    this.formulaLibrary = new Map();
    this.patternLibrary = new Map();
    this.fileArchive = new Map();
    this.dataSources = new Map();
    this.dataSourceManager = new DataSourceManager();
    this.initializeDefaultComponents();
    this.initializeBasicConfigurations();
    this.initializeDefaultDataSources();
  }

  private initializeDefaultComponents() {
    const defaultComponents: InsertElectricalComponent[] = [
      // NEMA Straight Blade Receptacles & Plugs
      {
        name: "NEMA 5-15P",
        type: "connector",
        category: "plug",
        specifications: { type: "plug", poles: 3, voltage: 125, current: 15, pattern: "5-15P" },
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
        category: "receptacle",
        specifications: { type: "receptacle", poles: 3, voltage: 125, current: 15, pattern: "5-15R" },
        symbol: "receptacle",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 8.75
      },
      {
        name: "NEMA 5-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "plug", poles: 3, voltage: 125, current: 20, pattern: "5-20P" },
        symbol: "plug",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 15.75
      },
      {
        name: "NEMA 5-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "receptacle", poles: 3, voltage: 125, current: 20, pattern: "5-20R" },
        symbol: "receptacle",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 11.25
      },
      {
        name: "NEMA 6-15P",
        type: "connector",
        category: "plug",
        specifications: { type: "plug", poles: 3, voltage: 250, current: 15, pattern: "6-15P" },
        symbol: "plug",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 18.50
      },
      {
        name: "NEMA 6-15R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "receptacle", poles: 3, voltage: 250, current: 15, pattern: "6-15R" },
        symbol: "receptacle",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 14.25
      },
      {
        name: "NEMA 6-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "plug", poles: 3, voltage: 250, current: 20, pattern: "6-20P" },
        symbol: "plug",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 22.75
      },
      {
        name: "NEMA 6-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "receptacle", poles: 3, voltage: 250, current: 20, pattern: "6-20R" },
        symbol: "receptacle",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 17.50
      },

      // NEMA Twist-Lock Receptacles & Plugs (L Series)
      {
        name: "L5-15P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 3, voltage: 125, current: 15, pattern: "L5-15P" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 24.50
      },
      {
        name: "L5-15R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 3, voltage: 125, current: 15, pattern: "L5-15R" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 19.75
      },
      {
        name: "L5-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 3, voltage: 125, current: 20, pattern: "L5-20P" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 28.25
      },
      {
        name: "L5-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 3, voltage: 125, current: 20, pattern: "L5-20R" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 22.75
      },
      {
        name: "L5-30P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 3, voltage: 125, current: 30, pattern: "L5-30P" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 35.50
      },
      {
        name: "L5-30R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 3, voltage: 125, current: 30, pattern: "L5-30R" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 125,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 28.25
      },
      {
        name: "L6-15P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 3, voltage: 250, current: 15, pattern: "L6-15P" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 32.75
      },
      {
        name: "L6-15R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 3, voltage: 250, current: 15, pattern: "L6-15R" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 26.50
      },
      {
        name: "L6-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 3, voltage: 250, current: 20, pattern: "L6-20P" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 38.75
      },
      {
        name: "L6-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 3, voltage: 250, current: 20, pattern: "L6-20R" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 31.25
      },
      {
        name: "L6-30P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 3, voltage: 250, current: 30, pattern: "L6-30P" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 45.25
      },
      {
        name: "L6-30R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 3, voltage: 250, current: 30, pattern: "L6-30R" },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 36.75
      },

      // Three-Phase Twist-Lock (L15, L21, L22 Series)
      {
        name: "L15-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 4, voltage: 250, current: 20, pattern: "L15-20P", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 52.50
      },
      {
        name: "L15-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 4, voltage: 250, current: 20, pattern: "L15-20R", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 42.25
      },
      {
        name: "L15-30P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 4, voltage: 250, current: 30, pattern: "L15-30P", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 68.75
      },
      {
        name: "L15-30R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 4, voltage: 250, current: 30, pattern: "L15-30R", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 55.50
      },
      {
        name: "L21-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 4, voltage: 120, current: 20, pattern: "L21-20P", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 120,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 58.25
      },
      {
        name: "L21-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 4, voltage: 120, current: 20, pattern: "L21-20R", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 120,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 46.75
      },
      {
        name: "L21-30P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 4, voltage: 120, current: 30, pattern: "L21-30P", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 120,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 72.50
      },
      {
        name: "L21-30R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 4, voltage: 120, current: 30, pattern: "L21-30R", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 120,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 58.75
      },
      {
        name: "L22-20P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 4, voltage: 277, current: 20, pattern: "L22-20P", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 277,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 64.25
      },
      {
        name: "L22-20R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 4, voltage: 277, current: 20, pattern: "L22-20R", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 277,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 52.25
      },
      {
        name: "L22-30P",
        type: "connector",
        category: "plug",
        specifications: { type: "twist-lock-plug", poles: 4, voltage: 277, current: 30, pattern: "L22-30P", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 277,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 78.75
      },
      {
        name: "L22-30R",
        type: "connector",
        category: "receptacle",
        specifications: { type: "twist-lock-receptacle", poles: 4, voltage: 277, current: 30, pattern: "L22-30R", phase: 3 },
        symbol: "twist-lock",
        icon: "fas fa-plug",
        maxVoltage: 277,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 64.50
      },

      // California Standard (CS) Connectors
      {
        name: "CS8264C",
        type: "connector",
        category: "receptacle",
        specifications: { type: "california-standard", poles: 4, voltage: 250, current: 50, pattern: "CS8264C" },
        symbol: "cs-connector",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 50,
        compatibleGauges: ["6", "8"],
        price: 85.25
      },
      {
        name: "CS8269A",
        type: "connector",
        category: "plug",
        specifications: { type: "california-standard", poles: 4, voltage: 250, current: 50, pattern: "CS8269A" },
        symbol: "cs-connector",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 50,
        compatibleGauges: ["6", "8"],
        price: 92.75
      },
      {
        name: "CS8369A",
        type: "connector",
        category: "plug",
        specifications: { type: "california-standard", poles: 4, voltage: 480, current: 50, pattern: "CS8369A" },
        symbol: "cs-connector",
        icon: "fas fa-plug",
        maxVoltage: 480,
        maxCurrent: 50,
        compatibleGauges: ["6", "8"],
        price: 105.50
      },
      {
        name: "530C6W",
        type: "connector",
        category: "receptacle",
        specifications: { type: "california-standard", poles: 4, voltage: 480, current: 30, pattern: "530C6W" },
        symbol: "cs-connector",
        icon: "fas fa-plug",
        maxVoltage: 480,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 78.25
      },

      // Industrial Connectors
      {
        name: "460C9W",
        type: "connector",
        category: "receptacle",
        specifications: { type: "industrial", poles: 4, voltage: 480, current: 60, pattern: "460C9W" },
        symbol: "industrial",
        icon: "fas fa-plug",
        maxVoltage: 480,
        maxCurrent: 60,
        compatibleGauges: ["4", "6"],
        price: 125.75
      },
      {
        name: "460R9W",
        type: "connector",
        category: "receptacle",
        specifications: { type: "industrial", poles: 4, voltage: 480, current: 60, pattern: "460R9W" },
        symbol: "industrial",
        icon: "fas fa-plug",
        maxVoltage: 480,
        maxCurrent: 60,
        compatibleGauges: ["4", "6"],
        price: 118.25
      },
      {
        name: "560C9W",
        type: "connector",
        category: "receptacle",
        specifications: { type: "industrial", poles: 4, voltage: 600, current: 60, pattern: "560C9W" },
        symbol: "industrial",
        icon: "fas fa-plug",
        maxVoltage: 600,
        maxCurrent: 60,
        compatibleGauges: ["4", "6"],
        price: 138.50
      },
      {
        name: "560R9W",
        type: "connector",
        category: "receptacle",
        specifications: { type: "industrial", poles: 4, voltage: 600, current: 60, pattern: "560R9W" },
        symbol: "industrial",
        icon: "fas fa-plug",
        maxVoltage: 600,
        maxCurrent: 60,
        compatibleGauges: ["4", "6"],
        price: 142.75
      },
      {
        name: "9C54U2",
        type: "connector",
        category: "receptacle",
        specifications: { type: "industrial", poles: 4, voltage: 600, current: 100, pattern: "9C54U2" },
        symbol: "industrial",
        icon: "fas fa-plug",
        maxVoltage: 600,
        maxCurrent: 100,
        compatibleGauges: ["1", "2"],
        price: 195.75
      },

      // IEC Connectors
      {
        name: "IEC C13",
        type: "connector",
        category: "receptacle",
        specifications: { type: "iec", poles: 3, voltage: 250, current: 10, pattern: "C13" },
        symbol: "iec",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 10,
        compatibleGauges: ["12", "14"],
        price: 6.50
      },
      {
        name: "IEC C14",
        type: "connector",
        category: "plug",
        specifications: { type: "iec", poles: 3, voltage: 250, current: 10, pattern: "C14" },
        symbol: "iec",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 10,
        compatibleGauges: ["12", "14"],
        price: 8.25
      },
      {
        name: "IEC C19",
        type: "connector",
        category: "receptacle",
        specifications: { type: "iec", poles: 3, voltage: 250, current: 16, pattern: "C19" },
        symbol: "iec",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 16,
        compatibleGauges: ["10", "12"],
        price: 12.75
      },
      {
        name: "IEC C20",
        type: "connector",
        category: "plug",
        specifications: { type: "iec", poles: 3, voltage: 250, current: 16, pattern: "C20" },
        symbol: "iec",
        icon: "fas fa-plug",
        maxVoltage: 250,
        maxCurrent: 16,
        compatibleGauges: ["10", "12"],
        price: 15.25
      },
      
      // Protection Components
      {
        name: "15A Circuit Breaker",
        type: "protection",
        category: "breaker",
        specifications: { rating: 15, type: "thermal-magnetic", poles: 1 },
        symbol: "breaker",
        icon: "fas fa-shield-alt",
        maxVoltage: 240,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 28.50
      },
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
        name: "30A Circuit Breaker",
        type: "protection",
        category: "breaker",
        specifications: { rating: 30, type: "thermal-magnetic", poles: 1 },
        symbol: "breaker",
        icon: "fas fa-shield-alt",
        maxVoltage: 240,
        maxCurrent: 30,
        compatibleGauges: ["8", "10"],
        price: 45.75
      },
      {
        name: "50A Circuit Breaker",
        type: "protection",
        category: "breaker",
        specifications: { rating: 50, type: "thermal-magnetic", poles: 2 },
        symbol: "breaker",
        icon: "fas fa-shield-alt",
        maxVoltage: 480,
        maxCurrent: 50,
        compatibleGauges: ["4", "6"],
        price: 85.25
      },
      {
        name: "GFCI 15A Outlet",
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
        name: "GFCI 20A Outlet",
        type: "protection",
        category: "gfci",
        specifications: { rating: 20, type: "gfci", testButton: true },
        symbol: "gfci",
        icon: "fas fa-flash",
        maxVoltage: 125,
        maxCurrent: 20,
        compatibleGauges: ["10", "12"],
        price: 35.75
      },
      {
        name: "Arc Fault Breaker 15A",
        type: "protection",
        category: "afci",
        specifications: { rating: 15, type: "arc-fault", poles: 1 },
        symbol: "afci",
        icon: "fas fa-flash",
        maxVoltage: 240,
        maxCurrent: 15,
        compatibleGauges: ["12", "14"],
        price: 85.50
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
      
      // Wire and Cable
      {
        name: "12 AWG SOOW Cable",
        type: "wire",
        category: "portable",
        specifications: { gauge: 12, type: "SOOW", conductors: 3, jacket: "oil-resistant" },
        symbol: "wire",
        icon: "fas fa-minus",
        maxVoltage: 600,
        maxCurrent: 20,
        compatibleGauges: ["12"],
        price: 2.85 // per foot
      },
      {
        name: "10 AWG SOOW Cable",
        type: "wire",
        category: "portable",
        specifications: { gauge: 10, type: "SOOW", conductors: 3, jacket: "oil-resistant" },
        symbol: "wire",
        icon: "fas fa-minus",
        maxVoltage: 600,
        maxCurrent: 30,
        compatibleGauges: ["10"],
        price: 4.25 // per foot
      },
      {
        name: "8 AWG SOOW Cable",
        type: "wire",
        category: "portable",
        specifications: { gauge: 8, type: "SOOW", conductors: 3, jacket: "oil-resistant" },
        symbol: "wire",
        icon: "fas fa-minus",
        maxVoltage: 600,
        maxCurrent: 40,
        compatibleGauges: ["8"],
        price: 6.75 // per foot
      },
      {
        name: "6 AWG SOOW Cable",
        type: "wire",
        category: "portable",
        specifications: { gauge: 6, type: "SOOW", conductors: 4, jacket: "oil-resistant" },
        symbol: "wire",
        icon: "fas fa-minus",
        maxVoltage: 600,
        maxCurrent: 55,
        compatibleGauges: ["6"],
        price: 9.50 // per foot
      },
      {
        name: "4 AWG SOOW Cable",
        type: "wire",
        category: "portable",
        specifications: { gauge: 4, type: "SOOW", conductors: 4, jacket: "oil-resistant" },
        symbol: "wire",
        icon: "fas fa-minus",
        maxVoltage: 600,
        maxCurrent: 70,
        compatibleGauges: ["4"],
        price: 14.25 // per foot
      },
      
      // Junction and Enclosures
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
      },
      {
        name: "6x6 Junction Box",
        type: "junction",
        category: "box",
        specifications: { size: "6x6", depth: 2.125, material: "steel" },
        symbol: "junction",
        icon: "fas fa-cube",
        maxVoltage: 600,
        maxCurrent: 60,
        compatibleGauges: ["6", "8", "10", "12"],
        price: 18.50
      },
      {
        name: "Weatherproof Box",
        type: "junction",
        category: "weatherproof",
        specifications: { size: "4x4", depth: 2.125, material: "aluminum", rating: "NEMA 3R" },
        symbol: "weatherproof",
        icon: "fas fa-shield-alt",
        maxVoltage: 600,
        maxCurrent: 40,
        compatibleGauges: ["8", "10", "12", "14"],
        price: 28.75
      },
      {
        name: "Cable Tray 6-inch",
        type: "junction",
        category: "tray",
        specifications: { width: 6, material: "galvanized-steel", finish: "hot-dip" },
        symbol: "tray",
        icon: "fas fa-grip-lines",
        maxVoltage: 600,
        maxCurrent: 200,
        compatibleGauges: ["1", "2", "4", "6"],
        price: 45.25 // per foot
      },

      // Multi-Conductor Wire Assemblies (from Excel data)
      {
        name: "3 #6AWG, 1 #8AWG GRD Assembly",
        type: "wire",
        category: "assembly",
        specifications: { 
          conductors: 4, 
          power: "3 #6AWG", 
          ground: "1 #8AWG", 
          type: "SOOW",
          configuration: "3P+G"
        },
        symbol: "wire-assembly",
        icon: "fas fa-grip-lines",
        maxVoltage: 480,
        maxCurrent: 50,
        compatibleGauges: ["6", "8"],
        price: 8.75 // per foot
      },
      {
        name: "4 #6AWG, 1 #8AWG GRD Assembly",
        type: "wire",
        category: "assembly",
        specifications: { 
          conductors: 5, 
          power: "4 #6AWG", 
          ground: "1 #8AWG", 
          type: "SOOW",
          configuration: "4P+G"
        },
        symbol: "wire-assembly",
        icon: "fas fa-grip-lines",
        maxVoltage: 480,
        maxCurrent: 50,
        compatibleGauges: ["6", "8"],
        price: 11.25 // per foot
      },
      {
        name: "5 #6AWG, 1 #8AWG GRD Assembly",
        type: "wire",
        category: "assembly",
        specifications: { 
          conductors: 6, 
          power: "5 #6AWG", 
          ground: "1 #8AWG", 
          type: "SOOW",
          configuration: "5P+G"
        },
        symbol: "wire-assembly",
        icon: "fas fa-grip-lines",
        maxVoltage: 480,
        maxCurrent: 50,
        compatibleGauges: ["6", "8"],
        price: 13.75 // per foot
      },

      // Conduit Components (from Excel data)
      {
        name: "3/4\" Grey Flexible Conduit",
        type: "conduit",
        category: "flexible",
        specifications: { 
          size: "3/4\"", 
          material: "PVC", 
          color: "grey",
          type: "flexible",
          innerDiameter: 0.75
        },
        symbol: "conduit",
        icon: "fas fa-tube",
        maxVoltage: 600,
        maxCurrent: 40,
        compatibleGauges: ["6", "8", "10", "12"],
        price: 3.25 // per foot
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

  private initializeBasicConfigurations() {
    const basicConfigurations: InsertPowerWhipConfiguration[] = [
      // Standard Office/Residential Power Whips
      {
        name: "15A Standard Office Power Whip",
        voltage: 125,
        current: 15,
        wireGauge: "12",
        totalLength: 25,
        components: [
          { componentId: this.findComponentByName("NEMA 5-15P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("NEMA 5-15R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("12 AWG SOOW Cable")?.id, quantity: 25, position: "cable" },
          { componentId: this.findComponentByName("15A Circuit Breaker")?.id, quantity: 1, position: "protection" }
        ],
        wireConnections: [
          { from: "NEMA 5-15P", to: "12 AWG SOOW Cable", type: "power" },
          { from: "12 AWG SOOW Cable", to: "NEMA 5-15R", type: "power" },
          { from: "15A Circuit Breaker", to: "12 AWG SOOW Cable", type: "protection" }
        ],
        configuration: {
          type: "standard_office",
          application: "Office equipment, computers, monitors",
          environment: "Indoor, dry locations",
          usage: "Light duty commercial",
          compliance: ["NEC 400", "UL 62"],
          features: ["Portable", "Flexible", "OSHA compliant"]
        },
        isValid: true,
        validationResults: {
          voltage: { valid: true, message: "Within NEMA 5-15 rating" },
          current: { valid: true, message: "Within 12 AWG capacity" },
          wireGauge: { valid: true, message: "Appropriate for 15A load" },
          connections: { valid: true, message: "All connections verified" }
        }
      },
      {
        name: "20A Heavy Duty Power Whip",
        voltage: 125,
        current: 20,
        wireGauge: "10",
        totalLength: 50,
        components: [
          { componentId: this.findComponentByName("NEMA 5-20P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("NEMA 5-20R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("10 AWG SOOW Cable")?.id, quantity: 50, position: "cable" },
          { componentId: this.findComponentByName("20A Circuit Breaker")?.id, quantity: 1, position: "protection" },
          { componentId: this.findComponentByName("GFCI 20A Outlet")?.id, quantity: 1, position: "safety" }
        ],
        wireConnections: [
          { from: "NEMA 5-20P", to: "10 AWG SOOW Cable", type: "power" },
          { from: "10 AWG SOOW Cable", to: "NEMA 5-20R", type: "power" },
          { from: "20A Circuit Breaker", to: "10 AWG SOOW Cable", type: "protection" },
          { from: "GFCI 20A Outlet", to: "NEMA 5-20R", type: "safety" }
        ],
        configuration: {
          type: "heavy_duty",
          application: "Power tools, industrial equipment, temporary power",
          environment: "Indoor/outdoor, wet locations",
          usage: "Heavy duty commercial/industrial",
          compliance: ["NEC 400", "NEC 590", "UL 62", "NEMA WD-6"],
          features: ["GFCI protection", "Weather resistant", "Heavy duty construction"]
        },
        isValid: true
      },

      // Industrial Twist-Lock Configurations
      {
        name: "L5-20 Twist-Lock Industrial Power Whip",
        voltage: 125,
        current: 20,
        wireGauge: "10",
        totalLength: 75,
        components: [
          { componentId: this.findComponentByName("L5-20P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("L5-20R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("10 AWG SOOW Cable")?.id, quantity: 75, position: "cable" },
          { componentId: this.findComponentByName("20A Circuit Breaker")?.id, quantity: 1, position: "protection" },
          { componentId: this.findComponentByName("Weatherproof Box")?.id, quantity: 1, position: "enclosure" }
        ],
        wireConnections: [
          { from: "L5-20P", to: "10 AWG SOOW Cable", type: "power" },
          { from: "10 AWG SOOW Cable", to: "L5-20R", type: "power" },
          { from: "20A Circuit Breaker", to: "10 AWG SOOW Cable", type: "protection" }
        ],
        configuration: {
          type: "industrial_twist_lock",
          application: "Manufacturing equipment, outdoor events, construction",
          environment: "Industrial, wet locations, outdoor",
          usage: "Heavy duty industrial",
          compliance: ["NEC 400", "NEC 590", "UL 62", "NEMA WD-6"],
          features: ["Twist-lock security", "Weather resistant", "Locking connectors"]
        },
        isValid: true
      },
      {
        name: "L6-30 High Voltage Power Whip",
        voltage: 250,
        current: 30,
        wireGauge: "8",
        totalLength: 100,
        components: [
          { componentId: this.findComponentByName("L6-30P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("L6-30R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("8 AWG SOOW Cable")?.id, quantity: 100, position: "cable" },
          { componentId: this.findComponentByName("30A Circuit Breaker")?.id, quantity: 1, position: "protection" },
          { componentId: this.findComponentByName("6x6 Junction Box")?.id, quantity: 1, position: "junction" }
        ],
        wireConnections: [
          { from: "L6-30P", to: "8 AWG SOOW Cable", type: "power" },
          { from: "8 AWG SOOW Cable", to: "L6-30R", type: "power" },
          { from: "30A Circuit Breaker", to: "8 AWG SOOW Cable", type: "protection" }
        ],
        configuration: {
          type: "high_voltage_industrial",
          application: "Large motors, welding equipment, industrial machinery",
          environment: "Industrial facilities, manufacturing plants",
          usage: "Heavy industrial applications",
          compliance: ["NEC 400", "NEC 430", "UL 62", "NEMA MG-1"],
          features: ["High current capacity", "250V rating", "Twist-lock security"]
        },
        isValid: true
      },

      // Three-Phase Industrial Configurations
      {
        name: "L15-20 Three-Phase Power Whip",
        voltage: 250,
        current: 20,
        wireGauge: "10",
        totalLength: 50,
        components: [
          { componentId: this.findComponentByName("L15-20P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("L15-20R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("10 AWG SOOW Cable")?.id, quantity: 50, position: "cable" },
          { componentId: this.findComponentByName("20A Circuit Breaker")?.id, quantity: 3, position: "protection" },
          { componentId: this.findComponentByName("6x6 Junction Box")?.id, quantity: 1, position: "junction" }
        ],
        wireConnections: [
          { from: "L15-20P", to: "10 AWG SOOW Cable", type: "power_3phase" },
          { from: "10 AWG SOOW Cable", to: "L15-20R", type: "power_3phase" },
          { from: "20A Circuit Breaker", to: "10 AWG SOOW Cable", type: "protection_3phase" }
        ],
        configuration: {
          type: "three_phase_industrial",
          application: "Three-phase motors, HVAC equipment, industrial machinery",
          environment: "Industrial facilities, commercial buildings",
          usage: "Three-phase industrial applications",
          compliance: ["NEC 400", "NEC 430", "UL 62", "NEMA MG-1"],
          features: ["Three-phase power", "Balanced load distribution", "Motor starting capability"]
        },
        isValid: true
      },
      {
        name: "L21-30 Three-Phase Wye Power Whip",
        voltage: 120,
        current: 30,
        wireGauge: "8",
        totalLength: 75,
        components: [
          { componentId: this.findComponentByName("L21-30P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("L21-30R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("8 AWG SOOW Cable")?.id, quantity: 75, position: "cable" },
          { componentId: this.findComponentByName("30A Circuit Breaker")?.id, quantity: 3, position: "protection" },
          { componentId: this.findComponentByName("6x6 Junction Box")?.id, quantity: 2, position: "junction" }
        ],
        wireConnections: [
          { from: "L21-30P", to: "8 AWG SOOW Cable", type: "power_3phase_neutral" },
          { from: "8 AWG SOOW Cable", to: "L21-30R", type: "power_3phase_neutral" },
          { from: "30A Circuit Breaker", to: "8 AWG SOOW Cable", type: "protection_3phase" }
        ],
        configuration: {
          type: "three_phase_wye",
          application: "Mixed single/three-phase loads, data centers, laboratory equipment",
          environment: "Critical facilities, laboratories, data centers",
          usage: "Precision three-phase applications",
          compliance: ["NEC 400", "NEC 645", "UL 62", "NEMA MG-1"],
          features: ["Wye configuration", "Neutral conductor", "Balanced loads"]
        },
        isValid: true
      },

      // California Standard and Industrial
      {
        name: "CS8264C/CS8269A Industrial Power Whip",
        voltage: 250,
        current: 50,
        wireGauge: "6",
        totalLength: 100,
        components: [
          { componentId: this.findComponentByName("CS8269A")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("CS8264C")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("6 AWG SOOW Cable")?.id, quantity: 100, position: "cable" },
          { componentId: this.findComponentByName("50A Circuit Breaker")?.id, quantity: 1, position: "protection" },
          { componentId: this.findComponentByName("6x6 Junction Box")?.id, quantity: 2, position: "junction" }
        ],
        wireConnections: [
          { from: "CS8269A", to: "6 AWG SOOW Cable", type: "power_high_current" },
          { from: "6 AWG SOOW Cable", to: "CS8264C", type: "power_high_current" },
          { from: "50A Circuit Breaker", to: "6 AWG SOOW Cable", type: "protection" }
        ],
        configuration: {
          type: "california_standard",
          application: "Large industrial equipment, distribution panels, temporary power",
          environment: "Industrial, outdoor events, construction sites",
          usage: "High current industrial applications",
          compliance: ["NEC 400", "NEC 590", "Cal Title 24", "UL 62"],
          features: ["High current capacity", "California standard", "Robust construction"]
        },
        isValid: true
      },

      // Data Center and IEC Configurations
      {
        name: "IEC C13/C14 Data Center Power Whip",
        voltage: 250,
        current: 10,
        wireGauge: "12",
        totalLength: 15,
        components: [
          { componentId: this.findComponentByName("IEC C14")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("IEC C13")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("12 AWG SOOW Cable")?.id, quantity: 15, position: "cable" },
          { componentId: this.findComponentByName("15A Circuit Breaker")?.id, quantity: 1, position: "protection" }
        ],
        wireConnections: [
          { from: "IEC C14", to: "12 AWG SOOW Cable", type: "power" },
          { from: "12 AWG SOOW Cable", to: "IEC C13", type: "power" },
          { from: "15A Circuit Breaker", to: "12 AWG SOOW Cable", type: "protection" }
        ],
        configuration: {
          type: "data_center_iec",
          application: "Server equipment, UPS systems, network hardware",
          environment: "Data centers, server rooms, network closets",
          usage: "IT equipment power distribution",
          compliance: ["NEC 645", "IEC 60320", "UL 62", "NEMA Standards"],
          features: ["IEC standard connectors", "Compact design", "High reliability"]
        },
        isValid: true
      },
      {
        name: "IEC C19/C20 High Power Data Center Whip",
        voltage: 250,
        current: 16,
        wireGauge: "10",
        totalLength: 20,
        components: [
          { componentId: this.findComponentByName("IEC C20")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("IEC C19")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("10 AWG SOOW Cable")?.id, quantity: 20, position: "cable" },
          { componentId: this.findComponentByName("20A Circuit Breaker")?.id, quantity: 1, position: "protection" }
        ],
        wireConnections: [
          { from: "IEC C20", to: "10 AWG SOOW Cable", type: "power" },
          { from: "10 AWG SOOW Cable", to: "IEC C19", type: "power" },
          { from: "20A Circuit Breaker", to: "10 AWG SOOW Cable", type: "protection" }
        ],
        configuration: {
          type: "high_power_data_center",
          application: "High-power servers, blade centers, storage arrays",
          environment: "Enterprise data centers, cloud facilities",
          usage: "High-density IT equipment",
          compliance: ["NEC 645", "IEC 60320", "UL 62", "TIA-942"],
          features: ["Higher current rating", "Enterprise grade", "Redundant power"]
        },
        isValid: true
      },

      // Specialized Applications
      {
        name: "GFCI Protected Outdoor Power Whip",
        voltage: 125,
        current: 20,
        wireGauge: "10",
        totalLength: 100,
        components: [
          { componentId: this.findComponentByName("NEMA 5-20P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("GFCI 20A Outlet")?.id, quantity: 1, position: "protection_output" },
          { componentId: this.findComponentByName("10 AWG SOOW Cable")?.id, quantity: 100, position: "cable" },
          { componentId: this.findComponentByName("Weatherproof Box")?.id, quantity: 2, position: "enclosure" },
          { componentId: this.findComponentByName("Surge Protector")?.id, quantity: 1, position: "surge_protection" }
        ],
        wireConnections: [
          { from: "NEMA 5-20P", to: "10 AWG SOOW Cable", type: "power" },
          { from: "10 AWG SOOW Cable", to: "GFCI 20A Outlet", type: "power" },
          { from: "Surge Protector", to: "GFCI 20A Outlet", type: "protection" }
        ],
        configuration: {
          type: "outdoor_gfci",
          application: "Outdoor tools, wet locations, construction sites",
          environment: "Outdoor, wet locations, extreme weather",
          usage: "Outdoor and wet location applications",
          compliance: ["NEC 400", "NEC 590", "OSHA", "UL 62"],
          features: ["GFCI protection", "Weather resistant", "Surge protection"]
        },
        isValid: true
      },
      {
        name: "Arc Fault Protected Office Power Whip",
        voltage: 125,
        current: 15,
        wireGauge: "12",
        totalLength: 50,
        components: [
          { componentId: this.findComponentByName("NEMA 5-15P")?.id, quantity: 1, position: "input" },
          { componentId: this.findComponentByName("NEMA 5-15R")?.id, quantity: 1, position: "output" },
          { componentId: this.findComponentByName("12 AWG SOOW Cable")?.id, quantity: 50, position: "cable" },
          { componentId: this.findComponentByName("Arc Fault Breaker 15A")?.id, quantity: 1, position: "arc_protection" },
          { componentId: this.findComponentByName("4x4 Junction Box")?.id, quantity: 1, position: "junction" }
        ],
        wireConnections: [
          { from: "NEMA 5-15P", to: "12 AWG SOOW Cable", type: "power" },
          { from: "12 AWG SOOW Cable", to: "NEMA 5-15R", type: "power" },
          { from: "Arc Fault Breaker 15A", to: "12 AWG SOOW Cable", type: "arc_protection" }
        ],
        configuration: {
          type: "arc_fault_protected",
          application: "Office equipment, sensitive electronics, fire prevention",
          environment: "Commercial offices, healthcare, education",
          usage: "Arc fault sensitive applications",
          compliance: ["NEC 210.12", "UL 1699", "NFPA 70", "UL 62"],
          features: ["Arc fault protection", "Fire prevention", "Electronic equipment safe"]
        },
        isValid: true
      }
    ];

    // Initialize the basic configurations
    basicConfigurations.forEach(config => {
      const id = randomUUID();
      const now = new Date();
      const configuration: PowerWhipConfiguration = { 
        ...config, 
        id, 
        createdAt: now,
        updatedAt: now
      };
      this.configurations.set(id, configuration);
    });
  }

  private findComponentByName(name: string): ElectricalComponent | undefined {
    return Array.from(this.components.values()).find(c => c.name === name);
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

  // Component Data Source methods
  async createDataSource(source: InsertComponentDataSource): Promise<ComponentDataSource> {
    const id = randomUUID();
    const now = new Date();
    const dataSource: ComponentDataSource = {
      ...source,
      id,
      lastSync: null,
      syncStatus: 'pending',
      syncLog: null,
      componentCount: 0,
      createdAt: now,
      updatedAt: now
    };
    this.dataSources.set(id, dataSource);
    return dataSource;
  }

  async getAllDataSources(): Promise<ComponentDataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async getDataSource(id: string): Promise<ComponentDataSource | undefined> {
    return this.dataSources.get(id);
  }

  async updateDataSource(id: string, source: Partial<InsertComponentDataSource>): Promise<ComponentDataSource | undefined> {
    const existing = this.dataSources.get(id);
    if (!existing) return undefined;
    
    const updated: ComponentDataSource = {
      ...existing,
      ...source,
      updatedAt: new Date()
    };
    this.dataSources.set(id, updated);
    return updated;
  }

  async deleteDataSource(id: string): Promise<boolean> {
    return this.dataSources.delete(id);
  }

  async syncDataSource(id: string): Promise<{ success: boolean; componentCount: number; errors: string[] }> {
    const source = this.dataSources.get(id);
    if (!source) {
      return { success: false, componentCount: 0, errors: ['Data source not found'] };
    }

    // Update sync status
    const updatingSource = { ...source, syncStatus: 'syncing' as const, lastSync: new Date() };
    this.dataSources.set(id, updatingSource);

    try {
      const result = await this.dataSourceManager.syncDataSource(source);
      
      if (result.success) {
        // Clear existing components from this source and add new ones
        const existingComponents = Array.from(this.components.values())
          .filter(c => c.specifications?.dataSourceId === id);
        
        // Remove old components
        existingComponents.forEach(c => this.components.delete(c.id));
        
        // Add new components
        for (const component of result.components) {
          const componentWithSource = {
            ...component,
            specifications: {
              ...component.specifications,
              dataSourceId: id
            }
          };
          await this.createComponent(componentWithSource);
        }

        // Update source with success status
        const finalSource = {
          ...updatingSource,
          syncStatus: 'success' as const,
          componentCount: result.components.length,
          syncLog: { lastSync: new Date(), errors: result.errors }
        };
        this.dataSources.set(id, finalSource);

        return { success: true, componentCount: result.components.length, errors: result.errors };
      } else {
        // Update source with error status
        const errorSource = {
          ...updatingSource,
          syncStatus: 'error' as const,
          syncLog: { lastSync: new Date(), errors: result.errors }
        };
        this.dataSources.set(id, errorSource);

        return { success: false, componentCount: 0, errors: result.errors };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      const errorSource = {
        ...updatingSource,
        syncStatus: 'error' as const,
        syncLog: { lastSync: new Date(), errors: [errorMessage] }
      };
      this.dataSources.set(id, errorSource);

      return { success: false, componentCount: 0, errors: [errorMessage] };
    }
  }

  private initializeDefaultDataSources() {
    const defaultSources: InsertComponentDataSource[] = [
      {
        name: "Manual Components (Built-in)",
        type: "manual",
        config: {
          description: "Hardcoded electrical components with NEMA standards"
        },
        isActive: true
      },
      {
        name: "Sample Excel Source",
        type: "excel",
        config: {
          excel: {
            columnMapping: {
              name: "Component Name",
              type: "Type",
              category: "Category",
              maxVoltage: "Max Voltage",
              maxCurrent: "Max Current",
              price: "Price",
              specifications: "Specifications"
            }
          }
        },
        isActive: false
      },
      {
        name: "Sample API Source",
        type: "url",
        config: {
          url: {
            endpoint: "https://api.example.com/electrical-components",
            format: "json" as const,
            dataPath: "data.components"
          }
        },
        isActive: false
      },
      {
        name: "Sample Odoo Integration",
        type: "odoo",
        config: {
          odoo: {
            baseUrl: "https://your-odoo.example.com",
            database: "your_db",
            username: "api_user",
            password: "api_password",
            model: "product.product",
            fields: ["name", "default_code", "list_price", "categ_id"],
            fieldMapping: {
              name: "name",
              type: "categ_id",
              category: "categ_id",
              price: "list_price"
            }
          }
        },
        isActive: false
      }
    ];

    defaultSources.forEach(async (source) => {
      await this.createDataSource(source);
    });
  }
}

export const storage = new MemStorage();
