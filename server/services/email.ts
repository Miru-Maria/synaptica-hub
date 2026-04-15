import { Resend } from "resend";

const FROM_ADDRESS = "Synaptica <notifications@synapticaks.dev>";

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY environment variable is not set");
  return new Resend(key);
}

export async function sendInquiryNotification(opts: {
  toEmail: string;
  name: string;
  company: string;
  challenge: string;
  timeline: string;
}): Promise<void> {
  const { toEmail, name, company, challenge, timeline } = opts;
  const resend = getResendClient();
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
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

  if (error) {
    console.error("[email] Failed to send inquiry notification:", error);
    throw error;
  }
}
