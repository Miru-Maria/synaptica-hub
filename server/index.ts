import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { auditRouter } from "./routes/audit.js";
import { adminRouter } from "./routes/admin.js";
import { publicRouter } from "./routes/public.js";

const app = express();
const PORT = 3001;

app.use(cors({
  credentials: true,
  origin: process.env.NODE_ENV === "production"
    ? (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : true)
    : true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use("/api/audit", auditRouter);
app.use("/api/admin", adminRouter);
app.use("/api/public", publicRouter);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DocAudit server running on port ${PORT}`);
});
