"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = exports.master = exports.users = exports.userTables = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.userTables = (0, pg_core_1.pgTable)("user_tables", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    userId: (0, pg_core_1.text)("user_id").notNull(),
    tableName: (0, pg_core_1.text)("table_name").notNull(),
    sheetId: (0, pg_core_1.text)("sheet_id").notNull(),
    sheetTab: (0, pg_core_1.text)("sheet_tab").notNull(),
    mapping: (0, pg_core_1.json)().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
    lastRowCount: (0, pg_core_1.integer)("last_row_count"),
    lastColCount: (0, pg_core_1.integer)("last_col_count"),
    firstRowHash: (0, pg_core_1.text)("first_row_hash"),
    lastRowHash: (0, pg_core_1.text)("last_row_hash"),
}, (table) => [
    (0, pg_core_1.unique)("user_tables_table_name_unique").on(table.tableName),
]);
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    supabaseId: (0, pg_core_1.text)("supabase_id").notNull(),
    email: (0, pg_core_1.text)().notNull(),
    name: (0, pg_core_1.text)(),
    avatar: (0, pg_core_1.text)(),
    createdAt: (0, pg_core_1.timestamp)("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
    (0, pg_core_1.unique)("users_supabase_id_unique").on(table.supabaseId),
    (0, pg_core_1.unique)("users_email_unique").on(table.email),
]);
exports.master = (0, pg_core_1.pgTable)("master", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    gameId: (0, pg_core_1.text)("game_id"),
    gameName: (0, pg_core_1.text)("game_name"),
    assignedCategory: (0, pg_core_1.text)("assigned_category"),
    rawTags: (0, pg_core_1.text)("raw_tags"),
});
exports.test = (0, pg_core_1.pgTable)("Test", {
    id: (0, pg_core_1.serial)().primaryKey().notNull(),
    name: (0, pg_core_1.text)(),
    company: (0, pg_core_1.text)(),
    role: (0, pg_core_1.text)(),
});
