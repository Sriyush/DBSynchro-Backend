import { pgTable, serial, text, timestamp, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  supabaseId: text("supabase_id").notNull().unique(),

  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow()
});

export const syncConfigs = pgTable("sync_configs", {
  id: serial("id").primaryKey(),

  userId: text("user_id").notNull(),

  sheetId: text("sheet_id").notNull(),
  sheetRange: text("sheet_range").notNull(),
  tableName: text("table_name").notNull(),

  mapping: json("mapping").$type<Record<string, string>>().notNull(),

  createdAt: timestamp("created_at").defaultNow()
});


export const syncLogs = pgTable("sync_logs", {
  id: serial("id").primaryKey(),

  syncConfigId: text("sync_config_id").notNull(),
  status: text("status").notNull(), 
  details: json("details"),

  createdAt: timestamp("created_at").defaultNow()
});
