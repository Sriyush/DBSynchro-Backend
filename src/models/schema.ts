import { pgTable, serial, text, timestamp, json, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),

  supabaseId: text("supabase_id").notNull().unique(),

  email: text("email").notNull().unique(),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").defaultNow()
});

export const userTables = pgTable("user_tables", {
  id: serial("id").primaryKey(),

  userId: text("user_id").notNull(),
  tableName: text("table_name").notNull().unique(),

  sheetId: text("sheet_id").notNull(),
  sheetTab: text("sheet_tab").notNull(),

  mapping: json("mapping").$type<Record<string, string>>().notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

// export const syncConfigs = pgTable("sync_configs", {
//   id: serial("id").primaryKey(),

//   userId: text("user_id").notNull(),
//   userTableId: integer("user_table_id")
//   .references(() => userTables.id)
//   .notNull(),

//   sheetId: text("sheet_id").notNull(),
//   sheetRange: text("sheet_range").notNull(),

//   mapping: json("mapping").$type<Record<string, string>>().notNull(),

//   createdAt: timestamp("created_at").defaultNow()
// });


// export const syncLogs = pgTable("sync_logs", {
//   id: serial("id").primaryKey(),

//   syncConfigId: text("sync_config_id").notNull(),
//   status: text("status").notNull(), 
//   details: json("details"),

//   createdAt: timestamp("created_at").defaultNow()
// });
