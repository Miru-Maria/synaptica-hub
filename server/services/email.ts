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
