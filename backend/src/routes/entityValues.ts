import { Router } from "express";
import { db } from "../db.js";
import type { EntityValueData, EntityValueRecord } from "../types.js";

interface EntityValueRow {
  entity_id: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: EntityValueRow): EntityValueRecord {
  return {
    entityId: row.entity_id,
    data: JSON.parse(row.data) as EntityValueData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const entityValuesRouter = Router();

entityValuesRouter.get("/:entityId", (req, res) => {
  const row = db.prepare("SELECT * FROM entity_values WHERE entity_id = ?").get(req.params.entityId) as
    | EntityValueRow
    | undefined;
  if (!row) {
    const now = new Date().toISOString();
    res.json({ entityId: req.params.entityId, data: { values: {} }, createdAt: now, updatedAt: now } satisfies EntityValueRecord);
    return;
  }
  res.json(toRecord(row));
});

entityValuesRouter.put("/:entityId", (req, res) => {
  const patch = (req.body as { values?: Record<string, string> }).values ?? {};
  const existing = db.prepare("SELECT * FROM entity_values WHERE entity_id = ?").get(req.params.entityId) as
    | EntityValueRow
    | undefined;
  const now = new Date().toISOString();
  const existingValues = existing ? (JSON.parse(existing.data) as EntityValueData).values : {};
  const merged: EntityValueData = { values: { ...existingValues, ...patch } };

  if (existing) {
    db.prepare("UPDATE entity_values SET data = ?, updated_at = ? WHERE entity_id = ?").run(
      JSON.stringify(merged),
      now,
      req.params.entityId,
    );
  } else {
    db.prepare(
      "INSERT INTO entity_values (entity_id, data, created_at, updated_at) VALUES (?, ?, ?, ?)",
    ).run(req.params.entityId, JSON.stringify(merged), now, now);
  }

  res.json({
    entityId: req.params.entityId,
    data: merged,
    createdAt: existing?.created_at ?? now,
    updatedAt: now,
  } satisfies EntityValueRecord);
});
