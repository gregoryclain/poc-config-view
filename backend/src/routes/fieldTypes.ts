import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import type { FieldTypeData, FieldTypeRecord } from "../types.js";

interface FieldTypeRow {
  id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: FieldTypeRow): FieldTypeRecord {
  return {
    id: row.id,
    name: row.name,
    data: JSON.parse(row.data) as FieldTypeData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const fieldTypesRouter = Router();

fieldTypesRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM field_types ORDER BY created_at ASC").all() as unknown as FieldTypeRow[];
  res.json(rows.map(toRecord));
});

fieldTypesRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM field_types WHERE id = ?").get(req.params.id) as FieldTypeRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Field type not found" });
    return;
  }
  res.json(toRecord(row));
});

fieldTypesRouter.post("/", (req, res) => {
  const data = req.body as FieldTypeData;
  if (!data?.type || !data?.key || !data?.label) {
    res.status(400).json({ error: "type, key and label are required" });
    return;
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO field_types (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, data.label, JSON.stringify(data), now, now);
  res.status(201).json({ id, name: data.label, data, createdAt: now, updatedAt: now } satisfies FieldTypeRecord);
});

fieldTypesRouter.put("/:id", (req, res) => {
  const data = req.body as FieldTypeData;
  const existing = db.prepare("SELECT * FROM field_types WHERE id = ?").get(req.params.id) as FieldTypeRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Field type not found" });
    return;
  }
  const now = new Date().toISOString();
  db.prepare("UPDATE field_types SET name = ?, data = ?, updated_at = ? WHERE id = ?").run(
    data.label,
    JSON.stringify(data),
    now,
    req.params.id,
  );
  res.json(toRecord({ ...existing, name: data.label, data: JSON.stringify(data), updated_at: now }));
});

fieldTypesRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM field_types WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Field type not found" });
    return;
  }
  res.status(204).send();
});
