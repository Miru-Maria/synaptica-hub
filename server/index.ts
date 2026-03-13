import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { auditRouter } from "./routes/audit.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter } from "./routes/public.js";
import { kaSprintRouter } from "./routes/ka-sprint.js";
import { ragRouter } from "./routes/rag.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = isProd ? (parseInt(process.env.PORT || "5000")) : 3001;

const app = express();

app.use(cors({
  credentials: true,
  origin: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/audit", auditRouter);
app.use("/api/admin/ka-sprint", kaSprintRouter);
app.use("/api/admin/rag", ragRouter);
app.use("/api/admin", adminRouter);
app.use("/api/public", publicRouter);

app.get("/difflens", (_req, res) => {
  res.redirect(302, "https://diff-lens.replit.app/");
});

app.get("/docscope", (_req, res) => {
  res.redirect(302, "https://intel-engine-scope.replit.app/");
});

if (isProd) {
  const distPath = join(__dirname, "..", "dist");
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("/{*splat}", (_req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }
}

createServer(app).listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
