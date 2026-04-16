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
import { promptWorkshopRouter } from "./routes/prompt-workshop.js";
import { blogRouter } from "./routes/blog.js";
import { chatRouter } from "./routes/chat.js";
import { uxAgentRouter } from "./routes/ux-agent.js";
import { toolTesterRouter } from "./routes/tool-tester.js";
import { webhookRouter } from "./routes/webhooks.js";
import { checkRetainerCheckins } from "./data/store.js";
import { generateBlogDraft, shouldGenerateDraft } from "./services/blog-generator.js";
import { initDb } from "./data/db.js";
import { initUXTestTables } from "./data/ux-test-store.js";
import { initToolTestTables } from "./data/tool-test-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = isProd ? (parseInt(process.env.PORT || "5000")) : 3001;

const app = express();

app.use(cors({
  credentials: true,
  origin: true,
}));

app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/audit", auditRouter);
app.use("/api/admin/ka-sprint", kaSprintRouter);
app.use("/api/admin/rag", ragRouter);
app.use("/api/admin/prompt-workshop", promptWorkshopRouter);
app.use("/api/blog", blogRouter);
app.use("/api/chat", chatRouter);
app.use("/api/admin/ux-agent", uxAgentRouter);
app.use("/api/admin/tool-tester", toolTesterRouter);
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
      res.status(200).sendFile(join(distPath, "index.html"));
    });
  }
}

async function start() {
  try {
    await initDb();
    await initUXTestTables();
    await initToolTestTables();
    console.log("Database initialized");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }

  createServer(app).listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);

    checkRetainerCheckins().catch((err) => console.error("checkRetainerCheckins error:", err));
    setInterval(() => {
      checkRetainerCheckins().catch((err) => console.error("checkRetainerCheckins error:", err));
    }, 6 * 60 * 60 * 1000);

    async function runBlogSchedulerCheck() {
      try {
        const due = await shouldGenerateDraft();
        if (due) {
          console.log("[blog-scheduler] 30 days elapsed — generating monthly draft...");
          await generateBlogDraft();
        }
      } catch (err) {
        console.error("[blog-scheduler] Error during scheduled check:", err);
      }
    }

    setTimeout(runBlogSchedulerCheck, 60 * 1000);
    setInterval(runBlogSchedulerCheck, 24 * 60 * 60 * 1000);
  });
}

start();
