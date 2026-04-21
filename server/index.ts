import express from "express";
import cors from "cors";
import helmet from "helmet";
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
import { docscopeRouter } from "./routes/docscope.js";
import { docforgeRouter } from "./routes/docforge.js";
import { seoscopeRouter } from "./routes/seoscope.js";
import { kaRouter } from "./routes/knowledge-arch.js";
import { checkRetainerCheckins } from "./data/store.js";
import { generateBlogDraft, shouldGenerateDraft } from "./services/blog-generator.js";
import { initDb } from "./data/db.js";
import { initUXTestTables } from "./data/ux-test-store.js";
import { initToolTestTables } from "./data/tool-test-store.js";
import { initKATables } from "./data/ka-db.js";
import { initRagTables } from "./data/rag-store.js";
import {
  publicLimiter,
  chatLimiter,
  aiToolLimiter,
  auditLimiter,
  loginLimiter,
  embeddingLimiter,
} from "./middleware/security.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const PORT = isProd ? parseInt(process.env.PORT || "5000") : 3001;

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.openai.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(
  cors({
    credentials: true,
    origin: isProd
      ? [
          process.env.ALLOWED_ORIGIN || "",
          /\.replit\.app$/,
          /\.replit\.dev$/,
        ].filter(Boolean)
      : true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

app.use("/api/webhooks", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
app.use(cookieParser());

app.use(publicLimiter);

app.post("/api/admin/login", loginLimiter);

app.use("/api/audit", auditLimiter, auditRouter);
app.use("/api/chat", chatLimiter, chatRouter);

app.use("/api/admin/ka/search", embeddingLimiter);
app.use("/api/admin/ka/kb/:id/ingest", embeddingLimiter);
app.use("/api/admin/ka/gaps", aiToolLimiter);
app.use("/api/admin/ka/faq", aiToolLimiter);
app.use("/api/admin/ka/onboarding/:id/chat", aiToolLimiter);
app.use("/api/admin/ka/prompts/:id/test", aiToolLimiter);
app.use("/api/admin/docscope", aiToolLimiter, docscopeRouter);
app.use("/api/admin/docforge", aiToolLimiter, docforgeRouter);
app.use("/api/admin/seoscope", aiToolLimiter, seoscopeRouter);

app.use("/api/admin/ka-sprint", kaSprintRouter);
app.use("/api/admin/rag", ragRouter);
app.use("/api/admin/prompt-workshop", promptWorkshopRouter);
app.use("/api/admin/ux-agent", uxAgentRouter);
app.use("/api/admin/tool-tester", toolTesterRouter);
app.use("/api/admin/ka", kaRouter);
app.use("/api/admin", adminRouter);
app.use("/api/blog", blogRouter);
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
    app.use(express.static(distPath, { maxAge: "1d", etag: true }));
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
    await initKATables();
    await initRagTables();
    console.log("Database initialized");
  } catch (err) {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  }

  createServer(app).listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);

    checkRetainerCheckins().catch((err) =>
      console.error("checkRetainerCheckins error:", err)
    );
    setInterval(() => {
      checkRetainerCheckins().catch((err) =>
        console.error("checkRetainerCheckins error:", err)
      );
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
