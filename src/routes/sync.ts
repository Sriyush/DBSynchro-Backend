import { db } from "@/lib/db";
import { auth } from "@/middleware/auth";
import { syncConfigs, syncLogs } from "@/models/schema";
import { Router } from "express";
import {eq } from "drizzle-orm";
import { readGoogleSheet } from "@/lib/sheet";
const router = Router();

router.post("/create", auth, async (req, res) => {
    const { sheetId , sheetRange , tableName , mapping} = req.body;

    const [created] = await db.insert(syncConfigs).values({
        userId: req.user!.id,
        sheetId,
        sheetRange,
        tableName,
        mapping
    }).returning();

    res.json({success: true, config: created});
})

router.get("/configs", auth, async (req, res) => {
    const configs = await db.select().from(syncConfigs).where(eq(syncConfigs.userId ,req.user!.id));

    res.json({ configs});

})

router.post("/run/:id", auth, async (req, res) => {
  const id = req.params.id;

  // fetch config
  const [config] = await db
    .select()
    .from(syncConfigs)
    .where(eq(syncConfigs.id, Number(id)));

  if (!config) return res.status(404).json({ error: "Sync config not found" });

  try {
    // read google sheet
    const rows = await readGoogleSheet(
      req.user!.user_metadata.access_token,
      config.sheetId,
      config.sheetRange
    );

    // convert rows to objects
    const mappedRows = rows.slice(1).map((row: string[]) => {
      const obj: any = {};

      Object.entries(config.mapping).forEach(([sheetCol, dbCol], index) => {
        obj[dbCol] = row[index] || null;
      });

      return obj;
    });

    // insert into postgres
    await db.insert(config.tableName as any).values(mappedRows);

    // save log
    await db.insert(syncLogs).values({
      syncConfigId: id,
      status: "success",
      details: { inserted: mappedRows.length }
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);

    await db.insert(syncLogs).values({
      syncConfigId: id,
      status: "failed",
      details: { error: (err as any).message }
    });

    res.status(500).json({ error: "Sync failed" });
  }
});
export default router;