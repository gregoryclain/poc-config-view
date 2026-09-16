import { Router } from "express";
import { randomUUID } from "node:crypto";
import { db } from "../db.js";
import type { ActionData, ActionRecord } from "../types.js";

interface ActionRow {
  id: string;
  name: string;
  data: string;
  created_at: string;
  updated_at: string;
}

function toRecord(row: ActionRow): ActionRecord {
  return {
    id: row.id,
    name: row.name,
    data: JSON.parse(row.data) as ActionData,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const actionsRouter = Router();

actionsRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM actions ORDER BY created_at ASC").all() as unknown as ActionRow[];
  res.json(rows.map(toRecord));
});

actionsRouter.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM actions WHERE id = ?").get(req.params.id) as ActionRow | undefined;
  if (!row) {
    res.status(404).json({ error: "Action not found" });
    return;
  }
  res.json(toRecord(row));
});

actionsRouter.post("/", (req, res) => {
  const data = req.body as ActionData;
  if (!data?.name || !data?.label) {
    res.status(400).json({ error: "name and label are required" });
    return;
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const normalized: ActionData = { name: data.name, label: data.label, kind: data.kind ?? "fill-fields" };
  db.prepare(
    "INSERT INTO actions (id, name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, normalized.name, JSON.stringify(normalized), now, now);
  res.status(201).json({ id, name: normalized.name, data: normalized, createdAt: now, updatedAt: now } satisfies ActionRecord);
});

actionsRouter.put("/:id", (req, res) => {
  const data = req.body as ActionData;
  const existing = db.prepare("SELECT * FROM actions WHERE id = ?").get(req.params.id) as ActionRow | undefined;
  if (!existing) {
    res.status(404).json({ error: "Action not found" });
    return;
  }
  const now = new Date().toISOString();
  const normalized: ActionData = { name: data.name, label: data.label, kind: data.kind ?? "fill-fields" };
  db.prepare("UPDATE actions SET name = ?, data = ?, updated_at = ? WHERE id = ?").run(
    normalized.name,
    JSON.stringify(normalized),
    now,
    req.params.id,
  );
  res.json(toRecord({ ...existing, name: normalized.name, data: JSON.stringify(normalized), updated_at: now }));
});

actionsRouter.delete("/:id", (req, res) => {
  const result = db.prepare("DELETE FROM actions WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Action not found" });
    return;
  }
  res.status(204).send();
});
