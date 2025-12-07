import { db } from "@/lib/db";
import { sheetIdToTableName } from "@/lib/helpers";
import { getSheetNames, readGoogleSheet, } from "@/lib/sheet";
import { auth } from "@/middleware/auth";
import { sql } from "drizzle-orm";
import express from "express";
import { google } from "googleapis";

const router = express.Router();

router.get("/me", auth, (req, res) => {
  res.json({
    dbUser: req.dbUser
  });
});
router.get("/preview", auth, async (req, res) => {
  try {
    const sheetId = req.query.sheetId as string;
    const selectedSheet = req.query.tab as string | undefined;
    const token = req.googleAccessToken!;

    // 1️⃣ Get all sheet tabs
    const sheetNames = await getSheetNames(token, sheetId);

    if (sheetNames.length === 0)
      return res.status(400).json({ error: "No sheets found" });

    const activeSheet = selectedSheet || sheetNames[0];

    // 2️⃣ Read sheet values
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


router.get("/check/:sheetId", auth, async (req, res) => {
  const sheetId = req.params.sheetId;
  const tableName = sheetIdToTableName(sheetId);

  const existsQuery = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_name = ${tableName}
    );
  `);

  const exists = existsQuery.rows[0].exists;

  if (!exists) return res.json({ exists: false, tableName });

  const colsQuery = await db.execute(sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = ${tableName}
    ORDER BY ordinal_position;
  `);

  res.json({
    exists: true,
    tableName,
    columns: colsQuery.rows.map((r) => r.column_name),
  });
});

export default router;