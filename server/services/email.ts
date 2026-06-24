import nodemailer from "nodemailer";

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error(
      "GMAIL_USER and GMAIL_APP_PASSWORD environment variables must be set to send email"
    );
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function fromAddress(): string {
  const user = process.env.GMAIL_USER || "";
  return `Synaptica Knowledge Systems <${user}>`;
}

export async function sendBlogDraftNotification(opts: {
  toEmail: string;
  title: string;
  category: string;
  articleId: string;
}): Promise<void> {
  const { toEmail, title, category, articleId } = opts;
  const adminUrl = `https://synaptica-knowledge-systems.replit.app/admin?tab=blog&draft=${articleId}`;

  const transporter = getTransporter();
  await transporter.sendMail({
    from: fromAddress(),
    to: toEmail,
    subject: `New blog draft ready for review: "${title}"`,
    html: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #10b981; margin-top: 0;">New Blog Draft Ready</h2>
  <p style="color: #374151; margin-bottom: 16px;">
    Your monthly blog draft has been generated and is waiting for your review before publishing.
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr>
      <td style="padding: 8px 0; color: #6b7280; width: 100px; vertical-align: top;">Title</td>
      <td style="padding: 8px 0; font-weight: 600;">${title}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Category</td>
      <td style="padding: 8px 0;">${category}</td>
    </tr>
  </table>
  <a href="${adminUrl}"
     style="display: inline-block; background: #10b981; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 24px;">
    Review &amp; Publish Draft
  </a>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
    This draft is unpublished — nothing goes live until you approve it in the admin dashboard.<br>
    Sent by Synaptica Knowledge Systems &mdash; scheduled monthly blog draft generation.
  </p>
</div>`,
  });
}

export async function sendProcessingCertificate(opts: {
  toEmail: string;
  clientName: string;
  clientCompany: string;
  certRef: string;
  issuedDate: string;
  services: string;
}): Promise<void> {
  const { toEmail, clientName, clientCompany, certRef, issuedDate, services } = opts;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: fromAddress(),
    to: toEmail,
    subject: `Data Processing Certificate — ${certRef}`,
    html: `
<div style="font-family: Georgia, 'Times New Roman', serif; max-width: 680px; margin: 0 auto; padding: 40px 32px; border: 2px solid #10b981; border-radius: 4px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="font-size: 22px; color: #10b981; margin: 0 0 4px 0; letter-spacing: 0.05em; text-transform: uppercase;">Data Processing Certificate</h1>
    <p style="color: #6b7280; font-size: 13px; margin: 0;">Issued under GDPR Article 28 — Processor Compliance</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
    <tr>
      <td style="padding: 10px 0; color: #6b7280; width: 180px; vertical-align: top; border-bottom: 1px solid #e5e7eb;">Certificate Reference</td>
      <td style="padding: 10px 0; font-weight: 600; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${certRef}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #e5e7eb;">Date Issued</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${issuedDate}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #e5e7eb;">Data Controller</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${clientName}${clientCompany ? ` (${clientCompany})` : ""}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #e5e7eb;">Data Processor</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
        <strong>Miruna Cristiana Paun PFA</strong><br>
        trading as Synaptica Knowledge Systems<br>
        Intr. Gheorghe Simionescu, Nr. 19, Apt. B26, Sector 1, Bucharest, Romania<br>
        CUI: 48304268 &nbsp;|&nbsp; EUID: ROONRC.F2023004336407
      </td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #e5e7eb;">Processing Activities</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">${services}</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6b7280; vertical-align: top; border-bottom: 1px solid #e5e7eb;">Legal Basis</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">Contractual necessity (GDPR Art. 6(1)(b)); Data Processing Agreement</td>
    </tr>
    <tr>
      <td style="padding: 10px 0; color: #6b7280; vertical-align: top;">Sub-processors</td>
      <td style="padding: 10px 0;">OpenAI, L.L.C. (AI inference — text analysis and embeddings)</td>
    </tr>
  </table>

  <div style="background: #f9fafb; border-radius: 4px; padding: 16px 20px; margin-bottom: 28px; font-size: 13px; color: #374151; line-height: 1.6;">
    <p style="margin: 0 0 8px 0;">This certificate confirms that <strong>Miruna Cristiana Paun PFA</strong> (the Processor) has processed personal data and/or proprietary content on behalf of the Data Controller named above, in accordance with applicable data protection law, including Regulation (EU) 2016/679 (GDPR).</p>
    <p style="margin: 0;">Processing was conducted solely for the purposes described above, under appropriate technical and organisational safeguards, and no data was retained beyond what was necessary for service delivery.</p>
  </div>

  <p style="font-size: 12px; color: #9ca3af; margin: 0; text-align: center;">
    Miruna Cristiana Paun PFA &mdash; Synaptica Knowledge Systems &mdash; contact@synaptica.dev<br>
    This certificate was issued automatically. For queries, reply to this email.
  </p>
</div>`,
  });
}

export async function sendInquiryNotification(opts: {
  toEmail: string;
  name: string;
  company: string;
  challenge: string;
  timeline: string;
}): Promise<void> {
  const { toEmail, name, company, challenge, timeline } = opts;
  const transporter = getTransporter();
  await transporter.sendMail({
    from: fromAddress(),
    to: toEmail,
    subject: `New inquiry from ${name} (${company})`,
    html: `
<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #10b981; margin-top: 0;">New Discovery Inquiry</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr>
      <td style="padding: 8px 0; color: #6b7280; width: 120px; vertical-align: top;">Name</td>
      <td style="padding: 8px 0; font-weight: 600;">${name}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Company</td>
      <td style="padding: 8px 0;">${company}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Timeline</td>
      <td style="padding: 8px 0;">${timeline}</td>
    </tr>
    <tr>
      <td style="padding: 8px 0; color: #6b7280; vertical-align: top;">Challenge</td>
      <td style="padding: 8px 0; white-space: pre-wrap;">${challenge}</td>
    </tr>
  </table>
  <a href="https://synaptica-knowledge-systems.replit.app/admin?tab=inquiries"
     style="display: inline-block; background: #10b981; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
    View in Admin Dashboard
  </a>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
    Sent by Synaptica Knowledge Systems &mdash; you are receiving this because email notifications are enabled in your admin settings.
  </p>
</div>`,
  });
}
