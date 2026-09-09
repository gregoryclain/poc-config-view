import express from "express";
import cors from "cors";
import { fieldTypesRouter } from "./routes/fieldTypes.js";
import { entitiesRouter } from "./routes/entities.js";
import { screensRouter } from "./routes/screens.js";
import { actionsRouter } from "./routes/actions.js";
import { entityValuesRouter } from "./routes/entityValues.js";
import "./db.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 4310;

app.use(cors());
app.use(express.json());

app.use("/api/field-types", fieldTypesRouter);
app.use("/api/entities", entitiesRouter);
app.use("/api/screens", screensRouter);
app.use("/api/actions", actionsRouter);
app.use("/api/entity-values", entityValuesRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`generator backend listening on http://localhost:${port}`);
});
