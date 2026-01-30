"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@/lib/db");
const auth_1 = require("@/middleware/auth");
const schema_1 = require("@/models/schema");
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
// import { readGoogleSheet } from "@/lib/sheet";
const router = (0, express_1.Router)();
router.post("/create-table", auth_1.auth, async (req, res) => {
    try {
        const sheetId = req.body.sheetId;
        const sheetTab = req.body.sheetTab;
        const tableName = req.body.tableName; // <-- FIXED
        const columns = req.body.columns;
        const rows = req.body.rows;
        if (!columns || !rows) {
            return res.status(400).json({ error: "Columns or rows missing" });
        }
        // 1️⃣ Convert sheet column → db-safe names
        const mapping = {};
        for (const col of columns) {
            mapping[col] = col.replace(/\s+/g, "_").toLowerCase();
        }
        // 2️⃣ Construct column SQL
        const colsSQL = Object.values(mapping)
            .map((safe) => `"${safe}" text`)
            .join(",");
        const userDb = req.db || db_1.db; // Use user's DB for creating the table
        await userDb.execute((0, drizzle_orm_1.sql) `
      CREATE TABLE IF NOT EXISTS ${drizzle_orm_1.sql.identifier(tableName)} (
        id serial PRIMARY KEY,
        ${drizzle_orm_1.sql.raw(colsSQL)}
      );
    `);
        for (const row of rows) {
            const dbCols = Object.values(mapping)
                .map((c) => `"${c}"`)
                .join(",");
            const dbVals = Object.values(row)
                .map((v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`))
                .join(",");
            await userDb.execute((0, drizzle_orm_1.sql) `
        INSERT INTO ${drizzle_orm_1.sql.identifier(tableName)}
        (${drizzle_orm_1.sql.raw(dbCols)})
        VALUES (${drizzle_orm_1.sql.raw(dbVals)});
      `);
        }
        // Always save metadata to System DB
        const [createdTable] = await db_1.db.insert(schema_1.userTables).values({
            userId: req.user.id,
            tableName,
            sheetId,
            sheetTab,
            mapping,
        }).returning();
        res.json({
            success: true,
            table: createdTable,
            mapping,
        });
    }
    catch (err) {
        console.error("CREATE TABLE ERROR:", err);
        res.status(500).json({ error: err.message });
    }
});
// router.post("/create", auth, async (req, res) => {
//   const { sheetId, sheetRange, userTableId, mapping } = req.body;
//   if (!sheetId || !sheetRange || !userTableId || !mapping) {
//     return res.status(400).json({ error: "Missing required fields" });
//   }
//   const [tableMeta] = await db
//     .select()
//     .from(userTables)
//     .where(eq(userTables.id, userTableId));
//   if (!tableMeta) {
//     return res.status(404).json({ error: "User table not found" });
//   }
//   if (tableMeta.userId !== req.user!.id) {
//     return res.status(403).json({ error: "You do not own this table" });
//   }
//   // 2️⃣ Create sync config
//   const [created] = await db
//     .insert(syncConfigs)
//     .values({
//       userId: req.user!.id,
//       userTableId,
//       sheetId,
//       sheetRange,
//       mapping,
//     })
//     .returning();
//   res.json({
//     success: true,
//     config: created,
//   });
// });
// router.get("/configs", auth, async (req, res) => {
//     const configs = await db.select().from(syncConfigs).where(eq(syncConfigs.userId ,req.user!.id));
//     res.json({ configs});
// })
// router.post("/run/:id", auth, async (req, res) => {
//   const id = Number(req.params.id);
//   // fetch config
//   const [config] = await db
//     .select()
//     .from(syncConfigs)
//     .where(eq(syncConfigs.id, id));
//   if (!config) {
//     return res.status(404).json({ error: "Sync config not found" });
//   }
//   // fetch table meta and validate ownership
//   const [tableMeta] = await db
//     .select()
//     .from(userTables)
//     .where(eq(userTables.id, config.userTableId));
//   if (!tableMeta) {
//     return res.status(404).json({ error: "Target table metadata not found" });
//   }
//   if (tableMeta.userId !== req.user!.id) {
//     return res.status(403).json({ error: "You do not own this target table" });
//   }
//   try {
//     const token = req.googleAccessToken!;
//     const rows = await readGoogleSheet(token, config.sheetId, config.sheetRange);
//     if (!rows.length) {
//       throw new Error("No rows returned from Google Sheets");
//     }
//     const header = rows[0] as string[];
//     const dataRows = rows.slice(1) as any[][];
//     // map sheet rows -> db rows (object keyed by db column)
//     const mappedRows = dataRows.map((row) => {
//       const obj: Record<string, any> = {};
//       for (const [sheetCol, dbCol] of Object.entries(config.mapping)) {
//         const index = header.indexOf(sheetCol);
//         obj[dbCol] = index >= 0 ? row[index] ?? null : null;
//       }
//       return obj;
//     });
//     // Insert rows in a safe way (per-row, escaped)
//     const targetTableName = tableMeta.tableName; // sanitized on creation
//     for (const row of mappedRows) {
//       const cols = Object.keys(row).map((c) => `"${c}"`).join(",");
//       const vals = Object.values(row)
//         .map((v) => (v === null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`))
//         .join(",");
//       await db.execute(sql`
//         INSERT INTO ${sql.identifier(targetTableName)}
//         (${sql.raw(cols)})
//         VALUES (${sql.raw(vals)})
//       `);
//     }
//     // log success (ensure syncConfigId type matches your schema; using number)
//     await db.insert(syncLogs).values({
//       syncConfigId: String(id),
//       status: "success",
//       details: { inserted: mappedRows.length },
//     });
//     res.json({ success: true, inserted: mappedRows.length });
//   } catch (err: any) {
//     console.error("SYNC ERROR:", err);
//     await db.insert(syncLogs).values({
//       syncConfigId: String(id),
//       status: "failed",
//       details: { error: err.message },
//     });
//     res.status(500).json({ error: "Sync failed", message: err.message });
//   }
// });
exports.default = router;
