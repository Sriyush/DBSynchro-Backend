import { pgTable, unique, serial, text, json, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const userTables = pgTable("user_tables", {
	id: serial().primaryKey().notNull(),
	userId: text("user_id").notNull(),
	tableName: text("table_name").notNull(),
	sheetId: text("sheet_id").notNull(),
	sheetTab: text("sheet_tab").notNull(),
	mapping: json().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	lastRowCount: integer("last_row_count"),
	lastColCount: integer("last_col_count"),
	firstRowHash: text("first_row_hash"),
	lastRowHash: text("last_row_hash"),
}, (table) => [
	unique("user_tables_table_name_unique").on(table.tableName),
]);

export const users = pgTable("users", {
	id: serial().primaryKey().notNull(),
	supabaseId: text("supabase_id").notNull(),
	email: text().notNull(),
	name: text(),
	avatar: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	unique("users_supabase_id_unique").on(table.supabaseId),
	unique("users_email_unique").on(table.email),
]);

export const master = pgTable("master", {
	id: serial().primaryKey().notNull(),
	gameId: text("game_id"),
	gameName: text("game_name"),
	assignedCategory: text("assigned_category"),
	rawTags: text("raw_tags"),
});

export const test = pgTable("Test", {
	id: serial().primaryKey().notNull(),
	name: text(),
	company: text(),
	role: text(),
});
