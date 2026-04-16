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
  chatWidgetEnabled: boolean;
  chatSystemPrompt: string;
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
    return { emailNotificationsEnabled: false, adminEmail: "", calendlyUrl: undefined, chatWidgetEnabled: true, chatSystemPrompt: "" };
  }
  const r = rows[0];
  return {
    emailNotificationsEnabled: r.email_notifications_enabled,
    adminEmail: r.admin_email,
    calendlyUrl: r.calendly_url ?? undefined,
    chatWidgetEnabled: r.chat_widget_enabled ?? true,
    chatSystemPrompt: r.chat_system_prompt ?? "",
  };
}

export async function saveAdminSettings(settings: AdminSettings): Promise<void> {
  await pool.query(
    `INSERT INTO admin_settings (id, email_notifications_enabled, admin_email, calendly_url, chat_widget_enabled, chat_system_prompt)
     VALUES (1, $1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       email_notifications_enabled = EXCLUDED.email_notifications_enabled,
       admin_email = EXCLUDED.admin_email,
       calendly_url = EXCLUDED.calendly_url,
       chat_widget_enabled = EXCLUDED.chat_widget_enabled,
       chat_system_prompt = EXCLUDED.chat_system_prompt`,
    [settings.emailNotificationsEnabled, settings.adminEmail, settings.calendlyUrl ?? null, settings.chatWidgetEnabled, settings.chatSystemPrompt]
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
export type ContactSource = "discovery_call" | "tool_email_capture" | "manual" | "ai_chat";

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

export interface ChatSession {
  id: string;
  visitorName: string;
  visitorEmail: string;
  leadCaptured: boolean;
  pipelineContactId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
  messageCount: number;
}

function rowToChatSession(r: Record<string, unknown>): ChatSession {
  return {
    id: r.id as string,
    visitorName: r.visitor_name as string,
    visitorEmail: r.visitor_email as string,
    leadCaptured: r.lead_captured as boolean,
    pipelineContactId: (r.pipeline_contact_id as string | null) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToChatMessage(r: Record<string, unknown>): ChatMessage {
  return {
    id: r.id as string,
    sessionId: r.session_id as string,
    role: r.role as "user" | "assistant" | "system",
    content: r.content as string,
    createdAt: r.created_at as string,
  };
}

export async function createChatSession(): Promise<ChatSession> {
  const session: ChatSession = {
    id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    visitorName: "",
    visitorEmail: "",
    leadCaptured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO chat_sessions (id, visitor_name, visitor_email, lead_captured, pipeline_contact_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [session.id, session.visitorName, session.visitorEmail, session.leadCaptured, null, session.createdAt, session.updatedAt]
  );
  return session;
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  const { rows } = await pool.query("SELECT * FROM chat_sessions WHERE id = $1", [id]);
  return rows.length > 0 ? rowToChatSession(rows[0]) : null;
}

export async function updateChatSession(id: string, updates: Partial<Pick<ChatSession, "visitorName" | "visitorEmail" | "leadCaptured" | "pipelineContactId">>): Promise<ChatSession | null> {
  const session = await getChatSession(id);
  if (!session) return null;
  const updated = { ...session, ...updates, updatedAt: new Date().toISOString() };
  await pool.query(
    `UPDATE chat_sessions SET visitor_name=$1, visitor_email=$2, lead_captured=$3, pipeline_contact_id=$4, updated_at=$5 WHERE id=$6`,
    [updated.visitorName, updated.visitorEmail, updated.leadCaptured, updated.pipelineContactId ?? null, updated.updatedAt, id]
  );
  return updated;
}

export async function addChatMessage(sessionId: string, role: "user" | "assistant", content: string): Promise<ChatMessage> {
  const message: ChatMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sessionId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  await pool.query(
    `INSERT INTO chat_messages (id, session_id, role, content, created_at) VALUES ($1,$2,$3,$4,$5)`,
    [message.id, message.sessionId, message.role, message.content, message.createdAt]
  );
  await pool.query("UPDATE chat_sessions SET updated_at = $1 WHERE id = $2", [message.createdAt, sessionId]);
  return message;
}

export async function getChatSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  const { rows } = await pool.query(
    "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
    [sessionId]
  );
  return rows.map(rowToChatMessage);
}

export async function getChatSessions(): Promise<ChatSessionWithMessages[]> {
  const { rows: sessionRows } = await pool.query(
    "SELECT cs.*, COALESCE(mc.msg_count, 0) as msg_count FROM chat_sessions cs LEFT JOIN (SELECT session_id, COUNT(*) as msg_count FROM chat_messages GROUP BY session_id) mc ON cs.id = mc.session_id ORDER BY cs.updated_at DESC LIMIT 200"
  );
  return sessionRows.map((r) => ({
    ...rowToChatSession(r),
    messages: [],
    messageCount: Number(r.msg_count || 0),
  }));
}

export async function getChatSessionWithMessages(id: string): Promise<ChatSessionWithMessages | null> {
  const session = await getChatSession(id);
  if (!session) return null;
  const { rows: msgRows } = await pool.query(
    "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
    [id]
  );
  const messages = msgRows.map(rowToChatMessage);
  return { ...session, messages, messageCount: messages.length };
}

export async function deleteChatSession(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM chat_sessions WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export type ProjectStatus = "active" | "on-hold" | "complete";

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  startDate?: string;
  dueDate?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProjectTaskStatus = "todo" | "in-progress" | "done";
export type ProjectTaskPriority = "low" | "medium" | "high";

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: ProjectTaskStatus;
  owner: string;
  priority: ProjectTaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithProgress extends Project {
  totalTasks: number;
  completedTasks: number;
}

function rowToProject(r: Record<string, unknown>): Project {
  return {
    id: r.id as string,
    name: r.name as string,
    description: r.description as string,
    status: r.status as ProjectStatus,
    startDate: (r.start_date as string | null) ?? undefined,
    dueDate: (r.due_date as string | null) ?? undefined,
    archived: r.archived as boolean,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

function rowToProjectTask(r: Record<string, unknown>): ProjectTask {
  return {
    id: r.id as string,
    projectId: r.project_id as string,
    title: r.title as string,
    description: r.description as string,
    status: r.status as ProjectTaskStatus,
    owner: r.owner as string,
    priority: r.priority as ProjectTaskPriority,
    dueDate: (r.due_date as string | null) ?? undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export async function getProjects(): Promise<ProjectWithProgress[]> {
  const { rows } = await pool.query(
    `SELECT p.*, 
      COALESCE(tc.total, 0) as total_tasks, 
      COALESCE(tc.completed, 0) as completed_tasks
    FROM projects p
    LEFT JOIN (
      SELECT project_id, COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'done') as completed
      FROM project_tasks GROUP BY project_id
    ) tc ON p.id = tc.project_id
    WHERE p.archived = false
    ORDER BY p.created_at DESC`
  );
  return rows.map((r) => ({
    ...rowToProject(r),
    totalTasks: Number(r.total_tasks),
    completedTasks: Number(r.completed_tasks),
  }));
}

export async function getProject(id: string): Promise<ProjectWithProgress | null> {
  const { rows } = await pool.query(
    `SELECT p.*, 
      COALESCE(tc.total, 0) as total_tasks, 
      COALESCE(tc.completed, 0) as completed_tasks
    FROM projects p
    LEFT JOIN (
      SELECT project_id, COUNT(*) as total, COUNT(*) FILTER (WHERE status = 'done') as completed
      FROM project_tasks GROUP BY project_id
    ) tc ON p.id = tc.project_id
    WHERE p.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    ...rowToProject(r),
    totalTasks: Number(r.total_tasks),
    completedTasks: Number(r.completed_tasks),
  };
}

export async function createProject(project: Omit<Project, "id" | "createdAt" | "updatedAt" | "archived">): Promise<Project> {
  const now = new Date().toISOString();
  const newProject: Project = {
    id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...project,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  await pool.query(
    `INSERT INTO projects (id, name, description, status, start_date, due_date, archived, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [newProject.id, newProject.name, newProject.description, newProject.status, newProject.startDate ?? null, newProject.dueDate ?? null, newProject.archived, newProject.createdAt, newProject.updatedAt]
  );
  return newProject;
}

export async function updateProject(id: string, updates: Partial<Pick<Project, "name" | "description" | "status" | "startDate" | "dueDate" | "archived">>): Promise<Project | null> {
  const { rows } = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const current = rowToProject(rows[0]);
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  await pool.query(
    `UPDATE projects SET name=$1, description=$2, status=$3, start_date=$4, due_date=$5, archived=$6, updated_at=$7 WHERE id=$8`,
    [updated.name, updated.description, updated.status, updated.startDate ?? null, updated.dueDate ?? null, updated.archived, updated.updatedAt, id]
  );
  return updated;
}

export async function deleteProject(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM projects WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function getProjectTasks(projectId: string): Promise<ProjectTask[]> {
  const { rows } = await pool.query(
    "SELECT * FROM project_tasks WHERE project_id = $1 ORDER BY created_at ASC",
    [projectId]
  );
  return rows.map(rowToProjectTask);
}

export async function createProjectTask(task: Omit<ProjectTask, "id" | "createdAt" | "updatedAt">): Promise<ProjectTask> {
  const now = new Date().toISOString();
  const newTask: ProjectTask = {
    id: `ptask-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...task,
    createdAt: now,
    updatedAt: now,
  };
  await pool.query(
    `INSERT INTO project_tasks (id, project_id, title, description, status, owner, priority, due_date, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [newTask.id, newTask.projectId, newTask.title, newTask.description, newTask.status, newTask.owner, newTask.priority, newTask.dueDate ?? null, newTask.createdAt, newTask.updatedAt]
  );
  return newTask;
}

export async function updateProjectTask(projectId: string, id: string, updates: Partial<Pick<ProjectTask, "title" | "description" | "status" | "owner" | "priority" | "dueDate">>): Promise<ProjectTask | null> {
  const { rows } = await pool.query("SELECT * FROM project_tasks WHERE id = $1 AND project_id = $2", [id, projectId]);
  if (rows.length === 0) return null;
  const current = rowToProjectTask(rows[0]);
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  await pool.query(
    `UPDATE project_tasks SET title=$1, description=$2, status=$3, owner=$4, priority=$5, due_date=$6, updated_at=$7 WHERE id=$8 AND project_id=$9`,
    [updated.title, updated.description, updated.status, updated.owner, updated.priority, updated.dueDate ?? null, updated.updatedAt, id, projectId]
  );
  return updated;
}

export async function deleteProjectTask(projectId: string, id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM project_tasks WHERE id = $1 AND project_id = $2", [id, projectId]);
  return (result.rowCount ?? 0) > 0;
}

export interface ProcessingCertificate {
  id: string;
  toolName: string;
  toolSlug: string;
  documentCount: number;
  chunkCount: number;
  approximateChars: number;
  contentTypes: string;
  clientReference: string;
  rawContentRetained: boolean;
  sessionHash: string;
  processedAt: string;
  completedAt: string;
}

export async function createProcessingCertificate(opts: {
  toolName: string;
  toolSlug: string;
  documentCount: number;
  chunkCount: number;
  approximateChars: number;
  contentTypes: string;
  clientReference?: string;
  sessionHash: string;
  processedAt: string;
  completedAt: string;
}): Promise<ProcessingCertificate> {
  const id = `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const cert: ProcessingCertificate = {
    id,
    toolName: opts.toolName,
    toolSlug: opts.toolSlug,
    documentCount: opts.documentCount,
    chunkCount: opts.chunkCount,
    approximateChars: opts.approximateChars,
    contentTypes: opts.contentTypes,
    clientReference: opts.clientReference || "",
    rawContentRetained: false,
    sessionHash: opts.sessionHash,
    processedAt: opts.processedAt,
    completedAt: opts.completedAt,
  };
  await pool.query(
    `INSERT INTO processing_certificates
       (id, tool_name, tool_slug, document_count, chunk_count, approximate_chars, content_types,
        client_reference, raw_content_retained, session_hash, processed_at, completed_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [cert.id, cert.toolName, cert.toolSlug, cert.documentCount, cert.chunkCount,
     cert.approximateChars, cert.contentTypes, cert.clientReference,
     cert.rawContentRetained, cert.sessionHash, cert.processedAt, cert.completedAt]
  );
  return cert;
}

export async function getProcessingCertificates(limit = 100): Promise<ProcessingCertificate[]> {
  const { rows } = await pool.query(
    "SELECT * FROM processing_certificates ORDER BY processed_at DESC LIMIT $1",
    [limit]
  );
  return rows.map((r) => ({
    id: r.id,
    toolName: r.tool_name,
    toolSlug: r.tool_slug,
    documentCount: Number(r.document_count),
    chunkCount: Number(r.chunk_count),
    approximateChars: Number(r.approximate_chars),
    contentTypes: r.content_types,
    clientReference: r.client_reference,
    rawContentRetained: r.raw_content_retained,
    sessionHash: r.session_hash,
    processedAt: r.processed_at,
    completedAt: r.completed_at,
  }));
}

export async function getProcessingCertificate(id: string): Promise<ProcessingCertificate | null> {
  const { rows } = await pool.query("SELECT * FROM processing_certificates WHERE id = $1", [id]);
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    toolName: r.tool_name,
    toolSlug: r.tool_slug,
    documentCount: Number(r.document_count),
    chunkCount: Number(r.chunk_count),
    approximateChars: Number(r.approximate_chars),
    contentTypes: r.content_types,
    clientReference: r.client_reference,
    rawContentRetained: r.raw_content_retained,
    sessionHash: r.session_hash,
    processedAt: r.processed_at,
    completedAt: r.completed_at,
  };
}
