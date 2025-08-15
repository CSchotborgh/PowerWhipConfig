import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, real, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const powerWhipConfigurations = pgTable("power_whip_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  voltage: integer("voltage").notNull(),
  current: real("current").notNull(),
  wireGauge: text("wire_gauge").notNull(),
  totalLength: real("total_length").notNull(),
  components: jsonb("components").notNull(),
  wireConnections: jsonb("wire_connections").notNull(),
  configuration: jsonb("configuration").notNull(),
  isValid: boolean("is_valid").notNull().default(false),
  validationResults: jsonb("validation_results"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const electricalComponents = pgTable("electrical_components", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'connector', 'protection', 'junction', 'wire'
  category: text("category").notNull(),
  specifications: jsonb("specifications").notNull(),
  symbol: text("symbol").notNull(),
  icon: text("icon").notNull(),
  maxVoltage: integer("max_voltage"),
  maxCurrent: real("max_current"),
  compatibleGauges: jsonb("compatible_gauges"),
  price: real("price"),
});

export const insertPowerWhipConfigurationSchema = createInsertSchema(powerWhipConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertElectricalComponentSchema = createInsertSchema(electricalComponents).omit({
  id: true,
});

// Excel Formula Archive Tables
export const excelFormulaLibrary = pgTable("excel_formula_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formulaText: text("formula_text").notNull(),
  cellReference: text("cell_reference").notNull(),
  sheetName: text("sheet_name").notNull(),
  fileName: text("file_name").notNull(),
  category: text("category"), // CALCULATION, LOOKUP, CONDITIONAL, etc.
  complexity: text("complexity"), // SIMPLE, INTERMEDIATE, ADVANCED
  description: text("description"),
  parameters: jsonb("parameters"), // Input variables and their types
  dependencies: jsonb("dependencies"), // Other cells this formula references
  usage: integer("usage").default(0), // How often this pattern is used
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const excelPatternLibrary = pgTable("excel_pattern_library", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patternName: text("pattern_name").notNull(),
  patternType: text("pattern_type").notNull(), // FORMULA_SEQUENCE, DATA_VALIDATION, CONDITIONAL_FORMATTING
  cellRange: text("cell_range").notNull(),
  sheetName: text("sheet_name").notNull(),
  fileName: text("file_name").notNull(),
  patternData: jsonb("pattern_data").notNull(), // The actual pattern structure
  businessLogic: text("business_logic"), // What this pattern accomplishes
  inputRequirements: jsonb("input_requirements"), // What inputs this pattern needs
  outputFormat: jsonb("output_format"), // What this pattern produces
  tags: jsonb("tags"), // Searchable tags
  usage: integer("usage").default(0),
  isTemplate: boolean("is_template").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const excelFileArchive = pgTable("excel_file_archive", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  originalPath: text("original_path"),
  fileSize: integer("file_size"),
  sheetCount: integer("sheet_count"),
  formulaCount: integer("formula_count"),
  patternCount: integer("pattern_count"),
  analysisResults: jsonb("analysis_results").notNull(),
  extractedFormulas: jsonb("extracted_formulas"),
  extractedPatterns: jsonb("extracted_patterns"),
  businessDomain: text("business_domain"), // ELECTRICAL, FINANCIAL, ENGINEERING, etc.
  complexity: text("complexity"),
  isProcessed: boolean("is_processed").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas for new tables
export const insertExcelFormulaLibrarySchema = createInsertSchema(excelFormulaLibrary).omit({
  id: true,
  createdAt: true,
});

export const insertExcelPatternLibrarySchema = createInsertSchema(excelPatternLibrary).omit({
  id: true,
  createdAt: true,
});

export const insertExcelFileArchiveSchema = createInsertSchema(excelFileArchive).omit({
  id: true,
  createdAt: true,
});

export type InsertPowerWhipConfiguration = z.infer<typeof insertPowerWhipConfigurationSchema>;
export type PowerWhipConfiguration = typeof powerWhipConfigurations.$inferSelect;
export type InsertElectricalComponent = z.infer<typeof insertElectricalComponentSchema>;
export type ElectricalComponent = typeof electricalComponents.$inferSelect;
export type ExcelFormulaLibrary = typeof excelFormulaLibrary.$inferSelect;
export type InsertExcelFormulaLibrary = z.infer<typeof insertExcelFormulaLibrarySchema>;
export type ExcelPatternLibrary = typeof excelPatternLibrary.$inferSelect;
export type InsertExcelPatternLibrary = z.infer<typeof insertExcelPatternLibrarySchema>;
export type ExcelFileArchive = typeof excelFileArchive.$inferSelect;
export type InsertExcelFileArchive = z.infer<typeof insertExcelFileArchiveSchema>;

// Component Data Sources
export const componentDataSources = pgTable("component_data_sources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'excel', 'url', 'odoo', 'manual'
  config: jsonb("config").notNull(), // Source-specific configuration
  isActive: boolean("is_active").default(true),
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").default("pending"), // 'pending', 'syncing', 'success', 'error'
  syncLog: jsonb("sync_log"), // Sync history and error details
  componentCount: integer("component_count").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertComponentDataSourceSchema = createInsertSchema(componentDataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ComponentDataSource = typeof componentDataSources.$inferSelect;
export type InsertComponentDataSource = z.infer<typeof insertComponentDataSourceSchema>;
