"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.master = exports.userTables = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    supabaseId: (0, pg_core_1.text)("supabase_id").notNull().unique(),
    email: (0, pg_core_1.text)("email").notNull().unique(),
    name: (0, pg_core_1.text)("name"),
    avatar: (0, pg_core_1.text)("avatar"),
    encryptedConnectionString: (0, pg_core_1.text)("encrypted_connection_string"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow()
});
exports.userTables = (0, pg_core_1.pgTable)("user_tables", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.text)("user_id").notNull(),
    tableName: (0, pg_core_1.text)("table_name").notNull().unique(),
    sheetId: (0, pg_core_1.text)("sheet_id").notNull(),
    sheetTab: (0, pg_core_1.text)("sheet_tab").notNull(),
    mapping: (0, pg_core_1.json)("mapping").$type().notNull(),
    lastRowCount: (0, pg_core_1.integer)("last_row_count"),
    lastColCount: (0, pg_core_1.integer)("last_col_count"),
    firstRowHash: (0, pg_core_1.text)("first_row_hash"),
    lastRowHash: (0, pg_core_1.text)("last_row_hash"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.master = (0, pg_core_1.pgTable)("master", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    gameId: (0, pg_core_1.text)("game_id"),
    gameName: (0, pg_core_1.text)("game_name"),
    assignedCategory: (0, pg_core_1.text)("assigned_category"),
    rawTags: (0, pg_core_1.text)("raw_tags"),
});
exports.test = (0, pg_core_1.pgTable)("Test", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name"),
    company: (0, pg_core_1.text)("company"),
    role: (0, pg_core_1.text)("role"),
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
