import { pool, withTransaction } from "./db.js";

export interface ServicePackage {
  id: string;
  name: string;
  tagline: string;
  priceLow: number;
  priceHigh: number;
  priceLabel?: string;
  duration: string;
  type: string;
  features: string[];
  ideal: string;
  highlighted: boolean;
}

export interface ClientTool {
  name: string;
  slug: string;
  enabled: boolean;
  onboardingCopy?: string;
}

export async function getPackages(): Promise<ServicePackage[]> {
  const { rows } = await pool.query(
    "SELECT * FROM service_packages ORDER BY sort_order"
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    tagline: r.tagline,
    priceLow: Number(r.price_low),
    priceHigh: Number(r.price_high),
    priceLabel: r.price_label ?? undefined,
    duration: r.duration,
    type: r.type,
    features: r.features,
    ideal: r.ideal,
    highlighted: r.highlighted,
  }));
}

export async function savePackages(packages: ServicePackage[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM service_packages");
    for (let i = 0; i < packages.length; i++) {
      const p = packages[i];
      await client.query(
        `INSERT INTO service_packages (id, name, tagline, price_low, price_high, price_label, duration, type, features, ideal, highlighted, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [p.id, p.name, p.tagline, p.priceLow, p.priceHigh, p.priceLabel ?? null, p.duration, p.type, JSON.stringify(p.features), p.ideal, p.highlighted, i]
      );
    }
  });
}

export async function getTools(): Promise<ClientTool[]> {
  const { rows } = await pool.query(
    "SELECT * FROM client_tools ORDER BY sort_order"
  );
  return rows.map((r) => ({
    name: r.name,
    slug: r.slug,
    enabled: r.enabled,
    onboardingCopy: r.onboarding_copy ?? undefined,
  }));
}

export async function saveTools(tools: ClientTool[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM client_tools");
    for (let i = 0; i < tools.length; i++) {
      const t = tools[i];
      await client.query(
        `INSERT INTO client_tools (slug, name, enabled, onboarding_copy, sort_order) VALUES ($1,$2,$3,$4,$5)`,
        [t.slug, t.name, t.enabled, t.onboardingCopy ?? null, i]
      );
    }
  });
}

export interface HealthCheckEntry {
  id: string;
  date: string;
  notes: string;
  recommendations: string;
}

export interface SupportSessionEntry {
  id: string;
  date: string;
  description: string;
}

export interface PriorityRequest {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  completed: boolean;
}

export interface RetainerClient {
  id: string;
  name: string;
  startDate: string;
  monthlyRate: number;
  notes: string;
  healthChecks: HealthCheckEntry[];
  supportSessions: SupportSessionEntry[];
  priorityRequests: PriorityRequest[];
}

export async function getRetainerClients(): Promise<RetainerClient[]> {
  const { rows } = await pool.query("SELECT * FROM retainer_clients");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    startDate: r.start_date,
    monthlyRate: Number(r.monthly_rate),
    notes: r.notes,
    healthChecks: r.health_checks,
    supportSessions: r.support_sessions,
    priorityRequests: r.priority_requests,
  }));
}

export async function saveRetainerClients(clients: RetainerClient[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM retainer_clients");
    for (const c of clients) {
      await client.query(
        `INSERT INTO retainer_clients (id, name, start_date, monthly_rate, notes, health_checks, support_sessions, priority_requests)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [c.id, c.name, c.startDate, c.monthlyRate, c.notes, JSON.stringify(c.healthChecks), JSON.stringify(c.supportSessions), JSON.stringify(c.priorityRequests)]
      );
    }
  });
}

export interface DiscoveryInquiry {
  id: string;
  name: string;
  company: string;
  challenge: string;
  timeline: string;
  createdAt: string;
}

export async function getDiscoveryInquiries(): Promise<DiscoveryInquiry[]> {
  const { rows } = await pool.query(
    "SELECT * FROM discovery_inquiries ORDER BY created_at DESC"
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    company: r.company,
    challenge: r.challenge,
    timeline: r.timeline,
    createdAt: r.created_at,
  }));
}

export async function saveDiscoveryInquiry(inquiry: DiscoveryInquiry): Promise<void> {
  await pool.query(
    `INSERT INTO discovery_inquiries (id, name, company, challenge, timeline, created_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [inquiry.id, inquiry.name, inquiry.company, inquiry.challenge, inquiry.timeline, inquiry.createdAt]
  );
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  quote: string;
  photo: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  industry: string;
  challenge: string;
  outcome: string;
}

export interface OutcomeStat {
  id: string;
  label: string;
  value: string;
}

export async function getTestimonials(): Promise<Testimonial[]> {
  const { rows } = await pool.query("SELECT * FROM testimonials");
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    company: r.company,
    quote: r.quote,
    photo: r.photo,
  }));
}

export async function saveTestimonials(testimonials: Testimonial[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM testimonials");
    for (const t of testimonials) {
      await client.query(
        `INSERT INTO testimonials (id, name, role, company, quote, photo) VALUES ($1,$2,$3,$4,$5,$6)`,
        [t.id, t.name, t.role, t.company, t.quote, t.photo || ""]
      );
    }
  });
}

export async function getCaseStudies(): Promise<CaseStudy[]> {
  const { rows } = await pool.query("SELECT * FROM case_studies");
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    industry: r.industry,
    challenge: r.challenge,
    outcome: r.outcome,
  }));
}

export async function saveCaseStudies(studies: CaseStudy[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM case_studies");
    for (const s of studies) {
      await client.query(
        `INSERT INTO case_studies (id, title, industry, challenge, outcome) VALUES ($1,$2,$3,$4,$5)`,
        [s.id, s.title, s.industry, s.challenge, s.outcome]
      );
    }
  });
}

export async function getOutcomeStats(): Promise<OutcomeStat[]> {
  const { rows } = await pool.query("SELECT * FROM outcome_stats");
  return rows.map((r) => ({ id: r.id, label: r.label, value: r.value }));
}

export async function saveOutcomeStats(stats: OutcomeStat[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM outcome_stats");
    for (const s of stats) {
      await client.query(
        `INSERT INTO outcome_stats (id, label, value) VALUES ($1,$2,$3)`,
        [s.id, s.label, s.value]
      );
    }
  });
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  featuredImage?: string;
  publishDate: string;
  published: boolean;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
}

function rowToArticle(r: Record<string, unknown>): BlogArticle {
  return {
    id: r.id as string,
    title: r.title as string,
    slug: r.slug as string,
    excerpt: r.excerpt as string,
    body: r.body as string,
    category: r.category as string,
    featuredImage: (r.featured_image as string | null) ?? undefined,
    publishDate: r.publish_date as string,
    published: r.published as boolean,
    readingTime: Number(r.reading_time),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function getArticles(): Promise<BlogArticle[]> {
  const { rows } = await pool.query("SELECT * FROM blog_articles");
  return rows.map(rowToArticle);
}

export async function saveArticles(articles: BlogArticle[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM blog_articles");
    for (const a of articles) {
      await client.query(
        `INSERT INTO blog_articles (id, title, slug, excerpt, body, category, featured_image, publish_date, published, reading_time, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [a.id, a.title, a.slug, a.excerpt, a.body, a.category, a.featuredImage ?? null, a.publishDate, a.published, a.readingTime, a.createdAt, a.updatedAt]
      );
    }
  });
}

export async function getArticleBySlug(slug: string): Promise<BlogArticle | undefined> {
  const { rows } = await pool.query("SELECT * FROM blog_articles WHERE slug = $1", [slug]);
  return rows.length > 0 ? rowToArticle(rows[0]) : undefined;
}

export async function getPublishedArticles(): Promise<BlogArticle[]> {
  const { rows } = await pool.query(
    "SELECT * FROM blog_articles WHERE published = true ORDER BY publish_date DESC"
  );
  return rows.map(rowToArticle);
}

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

export interface Invoice {
  id: string;
  clientName: string;
  contactId?: string;
  description: string;
  amount: number;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}

function rowToInvoice(r: Record<string, unknown>): Invoice {
  return {
    id: r.id as string,
    clientName: r.client_name as string,
    contactId: (r.contact_id as string | null) ?? undefined,
    description: r.description as string,
    amount: Number(r.amount),
    currency: r.currency as string,
    invoiceDate: r.invoice_date as string,
    dueDate: r.due_date as string,
    status: r.status as InvoiceStatus,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function getInvoices(): Promise<Invoice[]> {
  const { rows } = await pool.query(
    "SELECT * FROM invoices ORDER BY created_at DESC"
  );
  return rows.map(rowToInvoice);
}

export async function saveInvoices(invoices: Invoice[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM invoices");
    for (const inv of invoices) {
      await client.query(
        `INSERT INTO invoices (id, client_name, contact_id, description, amount, currency, invoice_date, due_date, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [inv.id, inv.clientName, inv.contactId ?? null, inv.description, inv.amount, inv.currency, inv.invoiceDate, inv.dueDate, inv.status, inv.createdAt, inv.updatedAt]
      );
    }
  });
}

export type NotificationType =
  | "discovery_call"
  | "email_capture"
  | "new_subscriber"
  | "cancellation"
  | "retainer_checkin";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface AdminSettings {
  emailNotificationsEnabled: boolean;
  adminEmail: string;
  calendlyUrl?: string;
}

const HIGH_PRIORITY_TYPES: NotificationType[] = ["discovery_call", "new_subscriber"];

export async function getNotifications(): Promise<Notification[]> {
  const { rows } = await pool.query(
    "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 200"
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type as NotificationType,
    title: r.title,
    description: r.description,
    link: r.link ?? undefined,
    read: r.read,
    createdAt: r.created_at,
  }));
}

export async function addNotification(
  type: NotificationType,
  title: string,
  description: string,
  link?: string
): Promise<Notification> {
  const notification: Notification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    description,
    link,
    read: false,
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO notifications (id, type, title, description, link, read, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [notification.id, notification.type, notification.title, notification.description, notification.link ?? null, notification.read, notification.createdAt]
  );
  await pool.query(
    `DELETE FROM notifications WHERE id NOT IN (SELECT id FROM notifications ORDER BY created_at DESC LIMIT 200)`
  );
  return notification;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const result = await pool.query(
    "UPDATE notifications SET read = true WHERE id = $1",
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function markAllNotificationsRead(): Promise<void> {
  await pool.query("UPDATE notifications SET read = true");
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const { rows } = await pool.query("SELECT * FROM admin_settings WHERE id = 1");
  if (rows.length === 0) {
    return { emailNotificationsEnabled: false, adminEmail: "", calendlyUrl: undefined };
  }
  const r = rows[0];
  return {
    emailNotificationsEnabled: r.email_notifications_enabled,
    adminEmail: r.admin_email,
    calendlyUrl: r.calendly_url ?? undefined,
  };
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  await pool.query(
    `INSERT INTO admin_settings (id, email_notifications_enabled, admin_email, calendly_url)
     VALUES (1, $1, $2, $3)
     ON CONFLICT (id) DO UPDATE SET
       email_notifications_enabled = EXCLUDED.email_notifications_enabled,
       admin_email = EXCLUDED.admin_email,
       calendly_url = EXCLUDED.calendly_url`,
    [settings.emailNotificationsEnabled, settings.adminEmail, settings.calendlyUrl ?? null]
  );
}

export function isHighPriority(type: NotificationType): boolean {
  return HIGH_PRIORITY_TYPES.includes(type);
}

export async function checkRetainerCheckins(): Promise<void> {
  const clients = await getRetainerClients();
  const notifications = await getNotifications();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  for (const client of clients) {
    if (client.healthChecks.length === 0) continue;
    const sorted = [...client.healthChecks].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastCheck = new Date(sorted[0].date);
    const nextCheckDue = new Date(lastCheck.getTime() + 30 * 24 * 60 * 60 * 1000);

    if (nextCheckDue <= threeDaysFromNow && nextCheckDue >= now) {
      const dueDateKey = nextCheckDue.toISOString().slice(0, 10);
      const dedupTag = `[ref:${client.id}:${dueDateKey}]`;
      const alreadyNotified = notifications.some(
        (n) => n.type === "retainer_checkin" && n.description.includes(dedupTag)
      );
      if (!alreadyNotified) {
        await addNotification(
          "retainer_checkin",
          "Upcoming Retainer Check-in",
          `Monthly check-in for ${client.name} is due on ${dueDateKey}. ${dedupTag}`,
          `/admin?tab=retainers&id=${client.id}`
        );
      }
    }
  }
}

export interface EmailLead {
  id: string;
  email: string;
  firstName: string;
  toolSource: string;
  documentType?: string;
  capturedAt: string;
}

export async function getEmailLeads(): Promise<EmailLead[]> {
  const { rows } = await pool.query(
    "SELECT * FROM email_leads ORDER BY captured_at DESC"
  );
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    firstName: r.first_name,
    toolSource: r.tool_source,
    documentType: r.document_type ?? undefined,
    capturedAt: r.captured_at,
  }));
}

export async function saveEmailLead(lead: EmailLead): Promise<void> {
  await pool.query(
    `INSERT INTO email_leads (id, email, first_name, tool_source, document_type, captured_at) VALUES ($1,$2,$3,$4,$5,$6)`,
    [lead.id, lead.email, lead.firstName, lead.toolSource, lead.documentType ?? null, lead.capturedAt]
  );
}

export async function saveEmailLeads(leads: EmailLead[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM email_leads");
    for (const l of leads) {
      await client.query(
        `INSERT INTO email_leads (id, email, first_name, tool_source, document_type, captured_at) VALUES ($1,$2,$3,$4,$5,$6)`,
        [l.id, l.email, l.firstName, l.toolSource, l.documentType ?? null, l.capturedAt]
      );
    }
  });
}

export interface ToolRunEvent {
  id: string;
  toolName: string;
  toolSlug: string;
  timestamp: string;
  inputType?: string;
  emailCaptured: boolean;
  documentSizeCategory?: string;
  gapCategories?: string[];
}

export async function getToolRuns(): Promise<ToolRunEvent[]> {
  const { rows } = await pool.query(
    "SELECT * FROM tool_runs ORDER BY timestamp"
  );
  return rows.map((r) => ({
    id: r.id,
    toolName: r.tool_name,
    toolSlug: r.tool_slug,
    timestamp: r.timestamp,
    inputType: r.input_type ?? undefined,
    emailCaptured: r.email_captured,
    documentSizeCategory: r.document_size_category ?? undefined,
    gapCategories: r.gap_categories ?? undefined,
  }));
}

export async function logToolRun(event: Omit<ToolRunEvent, "id" | "timestamp">): Promise<ToolRunEvent> {
  const entry: ToolRunEvent = {
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...event,
  };
  await pool.query(
    `INSERT INTO tool_runs (id, tool_name, tool_slug, timestamp, input_type, email_captured, document_size_category, gap_categories)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [entry.id, entry.toolName, entry.toolSlug, entry.timestamp, entry.inputType ?? null, entry.emailCaptured, entry.documentSizeCategory ?? null, entry.gapCategories ? JSON.stringify(entry.gapCategories) : null]
  );
  return entry;
}

export interface ToolMetricsSummary {
  toolName: string;
  toolSlug: string;
  totalRuns: number;
  last30DaysRuns: number;
  emailCaptures: number;
  inputTypeBreakdown?: Record<string, number>;
  documentSizeBreakdown?: Record<string, number>;
  topGapCategories?: { category: string; count: number }[];
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface MetricsResponse {
  tools: ToolMetricsSummary[];
  dailyCounts: DailyCount[];
  totalRuns: number;
  totalEmails: number;
}

export async function getMetrics(): Promise<MetricsResponse> {
  const runs = await getToolRuns();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const toolMap = new Map<string, ToolRunEvent[]>();
  for (const run of runs) {
    const key = run.toolSlug;
    if (!toolMap.has(key)) toolMap.set(key, []);
    toolMap.get(key)!.push(run);
  }

  const tools: ToolMetricsSummary[] = [];
  for (const [slug, toolRuns] of toolMap) {
    const recentRuns = toolRuns.filter((r) => new Date(r.timestamp) >= thirtyDaysAgo);
    const summary: ToolMetricsSummary = {
      toolName: toolRuns[0].toolName,
      toolSlug: slug,
      totalRuns: toolRuns.length,
      last30DaysRuns: recentRuns.length,
      emailCaptures: toolRuns.filter((r) => r.emailCaptured).length,
    };

    if (slug === "docaudit") {
      const inputBreakdown: Record<string, number> = {};
      const sizeBreakdown: Record<string, number> = {};
      const gapCounts: Record<string, number> = {};

      for (const run of toolRuns) {
        if (run.inputType) {
          inputBreakdown[run.inputType] = (inputBreakdown[run.inputType] || 0) + 1;
        }
        if (run.documentSizeCategory) {
          sizeBreakdown[run.documentSizeCategory] = (sizeBreakdown[run.documentSizeCategory] || 0) + 1;
        }
        if (run.gapCategories) {
          for (const cat of run.gapCategories) {
            gapCounts[cat] = (gapCounts[cat] || 0) + 1;
          }
        }
      }

      summary.inputTypeBreakdown = inputBreakdown;
      summary.documentSizeBreakdown = sizeBreakdown;
      summary.topGapCategories = Object.entries(gapCounts)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }

    tools.push(summary);
  }

  const dailyMap = new Map<string, number>();
  const last30Runs = runs.filter((r) => new Date(r.timestamp) >= thirtyDaysAgo);
  for (const run of last30Runs) {
    const day = run.timestamp.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }

  for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    if (!dailyMap.has(key)) dailyMap.set(key, 0);
  }

  const dailyCounts: DailyCount[] = [...dailyMap.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    tools,
    dailyCounts,
    totalRuns: runs.length,
    totalEmails: runs.filter((r) => r.emailCaptured).length,
  };
}

export type PipelineStage = "New Lead" | "Contacted" | "Proposal Sent" | "Active Client" | "Closed";
export type ContactSource = "discovery_call" | "tool_email_capture" | "manual";

export interface PipelineContact {
  id: string;
  name: string;
  email: string;
  company: string;
  source: ContactSource;
  serviceInterest: string;
  stage: PipelineStage;
  lastTouchDate: string;
  nextAction: string;
  notes: string;
  estimatedValue: number;
  createdAt: string;
  updatedAt: string;
}

function rowToContact(r: Record<string, unknown>): PipelineContact {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    company: r.company as string,
    source: r.source as ContactSource,
    serviceInterest: r.service_interest as string,
    stage: r.stage as PipelineStage,
    lastTouchDate: r.last_touch_date as string,
    nextAction: r.next_action as string,
    notes: r.notes as string,
    estimatedValue: Number(r.estimated_value),
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function getPipelineContacts(): Promise<PipelineContact[]> {
  const { rows } = await pool.query(
    "SELECT * FROM pipeline_contacts ORDER BY created_at DESC"
  );
  return rows.map(rowToContact);
}

export async function savePipelineContacts(contacts: PipelineContact[]): Promise<void> {
  await withTransaction(async (client) => {
    await client.query("DELETE FROM pipeline_contacts");
    for (const c of contacts) {
      await client.query(
        `INSERT INTO pipeline_contacts (id, name, email, company, source, service_interest, stage, last_touch_date, next_action, notes, estimated_value, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [c.id, c.name, c.email, c.company, c.source, c.serviceInterest, c.stage, c.lastTouchDate, c.nextAction, c.notes, c.estimatedValue, c.createdAt, c.updatedAt]
      );
    }
  });
}

export async function addPipelineContact(contact: PipelineContact): Promise<void> {
  await pool.query(
    `INSERT INTO pipeline_contacts (id, name, email, company, source, service_interest, stage, last_touch_date, next_action, notes, estimated_value, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [contact.id, contact.name, contact.email, contact.company, contact.source, contact.serviceInterest, contact.stage, contact.lastTouchDate, contact.nextAction, contact.notes, contact.estimatedValue, contact.createdAt, contact.updatedAt]
  );
}

export async function updatePipelineContact(id: string, updates: Partial<PipelineContact>): Promise<PipelineContact | null> {
  const { rows } = await pool.query("SELECT * FROM pipeline_contacts WHERE id = $1", [id]);
  if (rows.length === 0) return null;

  const current = rowToContact(rows[0]);
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };

  await pool.query(
    `UPDATE pipeline_contacts SET name=$1, email=$2, company=$3, source=$4, service_interest=$5, stage=$6, last_touch_date=$7, next_action=$8, notes=$9, estimated_value=$10, updated_at=$11 WHERE id=$12`,
    [updated.name, updated.email, updated.company, updated.source, updated.serviceInterest, updated.stage, updated.lastTouchDate, updated.nextAction, updated.notes, updated.estimatedValue, updated.updatedAt, id]
  );
  return updated;
}

export async function deletePipelineContact(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM pipeline_contacts WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
