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

export type InsertPowerWhipConfiguration = z.infer<typeof insertPowerWhipConfigurationSchema>;
export type PowerWhipConfiguration = typeof powerWhipConfigurations.$inferSelect;
export type InsertElectricalComponent = z.infer<typeof insertElectricalComponentSchema>;
export type ElectricalComponent = typeof electricalComponents.$inferSelect;
