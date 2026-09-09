import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import type { EntityData, EntityRecord } from "../types.js";

interface EntityRow {
  id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: EntityRow): EntityRecord {
  const data = JSON.parse(row.data) as EntityData;
  return {
    id: row.id,
    name: row.name,
    // Rows created before `actions` existed have no such key in their stored JSON.
    data: { ...data, actions: data.actions ?? [] },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const entitiesRouter = Router();

entitiesRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM entities ORDER BY created_at ASC").all() as unknown as EntityRow[];
  res.json(rows.map(toRecord));
});

entitiesRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM entities WHERE id = ?").get(req.params.id) as EntityRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  res.json(toRecord(row));
});

entitiesRouter.post("/", (req, res) => {
  const data = req.body as EntityData;
  if (!data?.name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const normalized: EntityData = { name: data.name, fields: data.fields ?? [], actions: data.actions ?? [] };
  db.prepare(
    "INSERT INTO entities (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, normalized.name, JSON.stringify(normalized), now, now);
  res.status(201).json({ id, name: normalized.name, data: normalized, createdAt: now, updatedAt: now } satisfies EntityRecord);
});

entitiesRouter.put("/:id", (req, res) => {
  const data = req.body as EntityData;
  const existing = db.prepare("SELECT * FROM entities WHERE id = ?").get(req.params.id) as EntityRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  const now = new Date().toISOString();
  const normalized: EntityData = { name: data.name, fields: data.fields ?? [], actions: data.actions ?? [] };
  db.prepare("UPDATE entities SET name = ?, data = ?, updated_at = ? WHERE id = ?").run(
    normalized.name,
    JSON.stringify(normalized),
    now,
    req.params.id,
  );
  res.json(toRecord({ ...existing, name: normalized.name, data: JSON.stringify(normalized), updated_at: now }));
});

entitiesRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM entities WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Entity not found" });
    return;
  }
  res.status(204).send();
});
