"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@/lib/db");
const sheet_1 = require("@/lib/sheet");
const auth_1 = require("@/middleware/auth");
const schema_1 = require("@/models/schema");
const drizzle_orm_1 = require("drizzle-orm");
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
router.get("/me", auth_1.auth, async (req, res) => {
    try {
        const user = req.dbUser;
        const tables = await db_1.db
            .select()
            .from(schema_1.userTables)
            .where((0, drizzle_orm_1.eq)(schema_1.userTables.userId, req.user.id));
        res.json({
            user,
            tables,
        });
    }
    catch (err) {
        console.error("ERROR /me:", err);
        res.status(500).json({ error: "Failed to load profile" });
    }
});
router.get("/preview", auth_1.auth, async (req, res) => {
    try {
        const sheetId = req.query.sheetId;
        const selectedSheet = req.query.tab;
        const token = req.googleAccessToken;
        const sheetNames = await (0, sheet_1.getSheetNames)(token, sheetId);
        if (sheetNames.length === 0)
            return res.status(400).json({ error: "No sheets found" });
        const activeSheet = selectedSheet || sheetNames[0];
        const rows = await (0, sheet_1.readGoogleSheet)(token, sheetId, activeSheet);
        res.json({
            sheets: sheetNames,
            activeSheet,
            columns: rows[0] || [],
            rows: rows.slice(1) || [],
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get("/table/:tableName", auth_1.auth, async (req, res) => {
    try {
        const tableName = req.params.tableName;
        if (!tableName)
            return res.status(400).json({ error: "Missing table name" });
        // 1️⃣ Validate that the table belongs to this user
        const [meta] = await db_1.db
            .select()
            .from(schema_1.userTables)
            .where((0, drizzle_orm_1.eq)(schema_1.userTables.tableName, tableName));
        if (!meta)
            return res.status(404).json({ error: "Table not found" });
        if (meta.userId !== req.user.id)
            return res.status(403).json({ error: "Forbidden" });
        // 2️⃣ Fetch rows
        const userDb = req.db || db_1.db;
        const rows = await userDb.execute((0, drizzle_orm_1.sql) `
      SELECT * FROM ${drizzle_orm_1.sql.identifier(tableName)}
      ORDER BY id ASC
      LIMIT 500;
    `);
        // 3️⃣ Extract column names
        const columns = rows.fields.map((c) => c.name);
        res.json({
            tableName,
            columns,
            rows: rows.rows,
        });
    }
    catch (err) {
        console.error("VIEW TABLE ERROR:", err);
        res.status(500).json({ error: "Failed to load table" });
    }
});
router.put("/user/settings", auth_1.auth, async (req, res) => {
    try {
        const { connectionString } = req.body;
        if (!connectionString) {
            return res.status(400).json({ error: "Connection string is required" });
        }
        await db_1.db
            .update(schema_1.users)
            .set({ encryptedConnectionString: connectionString })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, req.dbUser.id));
        res.json({ success: true });
    }
    catch (err) {
        console.error("UPDATE SETTINGS ERROR:", err);
        res.status(500).json({ error: "Failed to update settings" });
    }
});
router.post("/table/:tableName/row", auth_1.auth, async (req, res) => {
    try {
        const { tableName } = req.params;
        const rowData = req.body; // { col1: val1, col2: val2 }
        if (!rowData || Object.keys(rowData).length === 0) {
            return res.status(400).json({ error: "No data provided" });
        }
        // 1. Get Table Metadata
        const [meta] = await db_1.db
            .select()
            .from(schema_1.userTables)
            .where((0, drizzle_orm_1.eq)(schema_1.userTables.tableName, tableName));
        if (!meta || meta.userId !== req.user.id) {
            return res.status(404).json({ error: "Table not found" });
        }
        // 2. Insert into DB
        const cols = Object.keys(rowData).map((c) => `"${c}"`).join(",");
        const vals = Object.values(rowData)
            .map((v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`))
            .join(",");
        const userDb = req.db || db_1.db;
        await userDb.execute((0, drizzle_orm_1.sql) `
      INSERT INTO ${drizzle_orm_1.sql.identifier(tableName)} (${drizzle_orm_1.sql.raw(cols)})
      VALUES (${drizzle_orm_1.sql.raw(vals)})
    `);
        // 3. Sync to Google Sheet
        // We need to map DB keys back to Sheet keys, or just dump values in order?
        // The mapping is stored in `meta.mapping`.
        // mapping: { "Sheet Header": "db_column" }
        // Invert mapping to get order: Sheet Header -> DB Column
        // We need to know the *order* of columns in the Sheet.
        // Ideally, we read the sheet header row again, or store column order.
        // For now, let's assume we read the sheet first to be safe (slower but safer).
        const { readGoogleSheet, appendRowToSheet } = await Promise.resolve().then(() => __importStar(require("@/lib/sheet")));
        const sheetData = await readGoogleSheet(req.googleAccessToken, meta.sheetId, meta.sheetTab);
        const header = sheetData[0] || [];
        // Construct the row array in correct order
        const newSheetRow = header.map((h) => {
            // Find db column name for this header
            const dbCol = meta.mapping[h];
            return rowData[dbCol] || ""; // Default to empty string
        });
        await appendRowToSheet(req.googleAccessToken, meta.sheetId, meta.sheetTab, newSheetRow);
        res.json({ success: true });
    }
    catch (err) {
        console.error("ADD ROW ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
router.post("/table/:tableName/column", auth_1.auth, async (req, res) => {
    try {
        const { tableName } = req.params;
        const { columnName } = req.body; // "New Column"
        if (!columnName)
            return res.status(400).json({ error: "Column name required" });
        const [meta] = await db_1.db
            .select()
            .from(schema_1.userTables)
            .where((0, drizzle_orm_1.eq)(schema_1.userTables.tableName, tableName));
        if (!meta || meta.userId !== req.user.id) {
            return res.status(404).json({ error: "Table not found" });
        }
        // 1. Sanitize
        const dbColName = columnName.replace(/\s+/g, "_").toLowerCase();
        // 2. Alter DB Table
        const userDb = req.db || db_1.db;
        await userDb.execute((0, drizzle_orm_1.sql) `
        ALTER TABLE ${drizzle_orm_1.sql.identifier(tableName)}
        ADD COLUMN ${drizzle_orm_1.sql.identifier(dbColName)} text;
    `);
        // 3. Update Metadata Mapping
        const newMapping = { ...meta.mapping, [columnName]: dbColName };
        await db_1.db
            .update(schema_1.userTables)
            .set({ mapping: newMapping })
            .where((0, drizzle_orm_1.eq)(schema_1.userTables.id, meta.id));
        // 4. Sync to Sheet (Add Header)
        const { addColumnToSheet } = await Promise.resolve().then(() => __importStar(require("@/lib/sheet")));
        await addColumnToSheet(req.googleAccessToken, meta.sheetId, meta.sheetTab, columnName);
        res.json({ success: true, newColumn: dbColName });
    }
    catch (err) {
        console.error("ADD COLUMN ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
router.put("/table/:tableName/row/:id", auth_1.auth, async (req, res) => {
    try {
        const { tableName, id } = req.params;
        const updates = req.body; // { col1: newVal1, col2: newVal2 }
        if (!updates || Object.keys(updates).length === 0) {
            return res.status(400).json({ error: "No update data provided" });
        }
        const [meta] = await db_1.db
            .select()
            .from(schema_1.userTables)
            .where((0, drizzle_orm_1.eq)(schema_1.userTables.tableName, tableName));
        if (!meta || meta.userId !== req.user.id) {
            return res.status(404).json({ error: "Table not found" });
        }
        // 1. Update Database
        // Construct SET clause
        const setClause = Object.keys(updates)
            .map((col) => `"${col}" = ${updates[col] === null ? "NULL" : `'${String(updates[col]).replace(/'/g, "''")}'`}`)
            .join(", ");
        const userDb = req.db || db_1.db;
        // We update by 'id'. Assumes the table has a primary key 'id'.
        await userDb.execute((0, drizzle_orm_1.sql) `
      UPDATE ${drizzle_orm_1.sql.identifier(tableName)}
      SET ${drizzle_orm_1.sql.raw(setClause)}
      WHERE id = ${id}
    `);
        // 2. Update Google Sheet
        // Step 2a: We need the *original* row data before update to find it in the Sheet
        const originalRowResult = await userDb.execute((0, drizzle_orm_1.sql) `
        SELECT * FROM ${drizzle_orm_1.sql.identifier(tableName)} WHERE id = ${id}
    `);
        const originalRow = originalRowResult.rows[0];
        if (!originalRow) {
            // Row might have been deleted? Or concurrency issue.
            console.warn("⚠️ Could not find original row for Sheet sync.");
        }
        else {
            // Step 2b: Update Database
            const setClause = Object.keys(updates)
                .map((col) => `"${col}" = ${updates[col] === null ? "NULL" : `'${String(updates[col]).replace(/'/g, "''")}'`}`)
                .join(", ");
            await userDb.execute((0, drizzle_orm_1.sql) `
        UPDATE ${drizzle_orm_1.sql.identifier(tableName)}
        SET ${drizzle_orm_1.sql.raw(setClause)}
        WHERE id = ${id}
        `);
            // Step 2c: Sync to Sheet
            // Invert mapping: DB Col -> Sheet Header
            const dbToSheet = Object.entries(meta.mapping).reduce((acc, [sheetKey, dbKey]) => {
                acc[dbKey] = sheetKey;
                return acc;
            }, {});
            // Prepare "Search Row" (Map original DB Row -> Sheet Headers)
            const searchRow = {};
            for (const [dbCol, val] of Object.entries(originalRow)) {
                if (dbToSheet[dbCol]) {
                    searchRow[dbToSheet[dbCol]] = String(val);
                }
            }
            console.log("🔍 Searching Sheet for row matching:", searchRow);
            // Prepare "New Data" (Map updates -> Sheet Headers)
            const sheetUpdates = {};
            for (const [dbCol, val] of Object.entries(updates)) {
                if (dbToSheet[dbCol]) {
                    sheetUpdates[dbToSheet[dbCol]] = String(val);
                }
            }
            const { updateSheetRow } = await Promise.resolve().then(() => __importStar(require("@/lib/sheet")));
            await updateSheetRow(req.googleAccessToken, meta.sheetId, meta.sheetTab, searchRow, sheetUpdates);
        }
        res.json({ success: true });
    }
    catch (err) {
        console.error("UPDATE ROW ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
router.get("/check-sheet", auth_1.auth, async (req, res) => {
    try {
        const sheetId = req.query.sheetId;
        const sheetTab = req.query.sheetTab;
        if (!sheetId || !sheetTab) {
            return res.status(400).json({ error: "Missing sheetId or sheetTab" });
        }
        // Check metadata first
        const [existing] = await db_1.db
            .select()
            .from(schema_1.userTables)
            .where((0, drizzle_orm_1.sql) `${schema_1.userTables.sheetId} = ${sheetId} AND ${schema_1.userTables.sheetTab} = ${sheetTab} AND ${schema_1.userTables.userId} = ${req.user.id}`);
        if (existing) {
            return res.json({
                exists: true,
                tableName: existing.tableName,
                lastSynced: existing.createdAt
            });
        }
        return res.json({ exists: false });
    }
    catch (err) {
        console.error("CHECK SHEET ERROR:", err);
        res.status(500).json({ error: "Failed to check sheet" });
    }
});
exports.default = router;
