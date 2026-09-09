import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import type { ScreenData, ScreenRecord } from "../types.js";

interface ScreenRow {
  id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: ScreenRow): ScreenRecord {
  return {
    id: row.id,
    name: row.name,
    data: JSON.parse(row.data) as ScreenData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const screensRouter = Router();

screensRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM screens ORDER BY created_at ASC").all() as unknown as ScreenRow[];
  res.json(rows.map(toRecord));
});

screensRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM screens WHERE id = ?").get(req.params.id) as ScreenRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Screen not found" });
    return;
  }
  res.json(toRecord(row));
});

screensRouter.post("/", (req, res) => {
  const data = req.body as ScreenData;
  if (!data?.name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const normalized: ScreenData = { name: data.name, items: data.items ?? [] };
  db.prepare(
    "INSERT INTO screens (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, normalized.name, JSON.stringify(normalized), now, now);
  res.status(201).json({ id, name: normalized.name, data: normalized, createdAt: now, updatedAt: now } satisfies ScreenRecord);
});

screensRouter.put("/:id", (req, res) => {
  const data = req.body as ScreenData;
  const existing = db.prepare("SELECT * FROM screens WHERE id = ?").get(req.params.id) as ScreenRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Screen not found" });
    return;
  }
  const now = new Date().toISOString();
  const normalized: ScreenData = { name: data.name, items: data.items ?? [] };
  db.prepare("UPDATE screens SET name = ?, data = ?, updated_at = ? WHERE id = ?").run(
    normalized.name,
    JSON.stringify(normalized),
    now,
    req.params.id,
  );
  res.json(toRecord({ ...existing, name: normalized.name, data: JSON.stringify(normalized), updated_at: now }));
});

screensRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM screens WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Screen not found" });
    return;
  }
  res.status(204).send();
});
