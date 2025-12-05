import { db } from "@/lib/db";
import { sheetIdToTableName } from "@/lib/helpers";
import { readGoogleSheet } from "@/lib/sheet";
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
  const providerToken = req.googleAccessToken;
  const sheetId = req.query.sheetId as string;

  if (!providerToken)
    return res.status(400).json({ error: "Missing provider token" });

  try {
    const rows = await readGoogleSheet(providerToken, sheetId, "Sheet1!A1:Z999");
    res.json({ rows, columns: rows[0] });
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