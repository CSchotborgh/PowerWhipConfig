import { type PowerWhipConfiguration, type InsertPowerWhipConfiguration, type ElectricalComponent, type InsertElectricalComponent } from "@shared/schema";
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
}

export class MemStorage implements IStorage {
  private configurations: Map<string, PowerWhipConfiguration>;
  private components: Map<string, ElectricalComponent>;

  constructor() {
    this.configurations = new Map();
    this.components = new Map();
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
      const fullComponent: ElectricalComponent = { ...component, id };
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
    const fullComponent: ElectricalComponent = { ...component, id };
    this.components.set(id, fullComponent);
    return fullComponent;
  }
}

export const storage = new MemStorage();
