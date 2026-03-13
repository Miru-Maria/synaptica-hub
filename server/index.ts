import express from "express";
import cors from "cors";
import { auditRouter } from "./routes/audit.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use("/api/audit", auditRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DocAudit server running on port ${PORT}`);
});
