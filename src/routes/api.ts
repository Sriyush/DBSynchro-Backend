import { db } from "@/lib/db";
import { sheetIdToTableName } from "@/lib/helpers";
import { getSheetNames, readGoogleSheet, } from "@/lib/sheet";
import { auth } from "@/middleware/auth";
import { userTables } from "@/models/schema";
import { eq,sql } from "drizzle-orm";
import express from "express";

const router = express.Router();

router.get("/me", auth, async (req, res) => {
  try {
    const user = req.dbUser;

    const tables = await db
      .select()
      .from(userTables)
      .where(eq(userTables.userId, req.user!.id));

    res.json({
      user,
      tables,
    });
  } catch (err: any) {
    console.error("ERROR /me:", err);
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.get("/preview", auth, async (req, res) => {
  try {
    const sheetId = req.query.sheetId as string;
    const selectedSheet = req.query.tab as string | undefined;
    const token = req.googleAccessToken!;

    const sheetNames = await getSheetNames(token, sheetId);

    if (sheetNames.length === 0)
      return res.status(400).json({ error: "No sheets found" });

    const activeSheet = selectedSheet || sheetNames[0];

    const rows = await readGoogleSheet(token, sheetId, activeSheet!);

    res.json({
      sheets: sheetNames,
      activeSheet,
      columns: rows[0] || [],
      rows: rows.slice(1) || [],
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/table/:tableName",auth, async (req, res) => {
  try {
    const tableName = req.params.tableName;

    if (!tableName)
      return res.status(400).json({ error: "Missing table name" });

    // 1️⃣ Validate that the table belongs to this user
    const [meta] = await db
      .select()
      .from(userTables)
      .where(eq(userTables.tableName, tableName));

    if (!meta)
      return res.status(404).json({ error: "Table not found" });

    if (meta.userId !== req.user!.id)
      return res.status(403).json({ error: "Forbidden" });

    // 2️⃣ Fetch rows
    const rows = await db.execute(sql`
      SELECT * FROM ${sql.identifier(tableName)}
      ORDER BY id ASC
      LIMIT 500;
    `);

    // 3️⃣ Extract column names
    const columns = rows.fields.map((c: any) => c.name);

    res.json({
      tableName,
      columns,
      rows: rows.rows,
    });

  } catch (err: any) {
    console.error("VIEW TABLE ERROR:", err);
    res.status(500).json({ error: "Failed to load table" });
  }
});

// router.get("/check/:sheetId", auth, async (req, res) => {
//   const sheetId = req.params.sheetId;
//   const tableName = sheetIdToTableName(sheetId);

//   const existsQuery = await db.execute(sql`
//     SELECT EXISTS (
//       SELECT 1 FROM information_schema.tables
//       WHERE table_name = ${tableName}
//     );
//   `);

//   const exists = existsQuery.rows[0].exists;

//   if (!exists) return res.json({ exists: false, tableName });

//   const colsQuery = await db.execute(sql`
//     SELECT column_name
//     FROM information_schema.columns
//     WHERE table_name = ${tableName}
//     ORDER BY ordinal_position;
//   `);

//   res.json({
//     exists: true,
//     tableName,
//     columns: colsQuery.rows.map((r) => r.column_name),
//   });
// });

export default router;