import express from "express";
import cors from "cors";
import { Resend } from "resend";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || (isProduction ? "5000" : "3001"));

const app = express();
app.use(express.json());
app.use(cors());

app.post("/api/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ success: false, message: "Email service not configured" });
  }

  try {
    const { Resend: ResendClient } = await import("resend");
    const resend = new ResendClient(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Synaptica Contact Form <onboarding@resend.dev>",
      to: ["cristiana_paun@protonmail.com"],
      replyTo: email,
      subject: `[Synaptica] ${subject || "New inquiry"}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #7c3aed; margin-bottom: 24px;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold; width: 100px; color: #555;">Name</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Email</td>
              <td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold; color: #555;">Subject</td>
              <td style="padding: 8px 0;">${subject || "(none)"}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="color: #555; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
          <p style="font-size: 12px; color: #999;">Reply directly to this email to respond to ${name}.</p>
        </div>
      `,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || "(none)"}\n\n${message}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Email send error:", err?.message || err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

if (isProduction) {
  const distPath = join(__dirname, "..", "dist");
  if (existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(join(distPath, "index.html"));
    });
  }
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});
