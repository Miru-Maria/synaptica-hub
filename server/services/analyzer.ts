import OpenAI from "openai";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set. Please configure it to run analysis.");
  }
  return new OpenAI({ apiKey });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelayMs = 2000): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
      const isRateLimit = msg.includes("429") || msg.includes("rate limit") || msg.includes("too many requests");
      if (isRateLimit && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`OpenAI rate limit hit — retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export interface TopicCoverage {
  topic: string;
  score: number;
  severity: "critical" | "high" | "medium" | "low";
  recommendation: string;
}

export interface AuditResult {
  overallScore: number;
  topicCoverages: TopicCoverage[];
  summary: string;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const openai = getOpenAI();
  const batchSize = 20;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await withRetry(() =>
      openai.embeddings.create({ model: "text-embedding-3-small", input: batch })
    );
    allEmbeddings.push(...response.data.map((d) => d.embedding));
  }

  return allEmbeddings;
}

function getSeverity(score: number): "critical" | "high" | "medium" | "low" {
  if (score < 0.2) return "critical";
  if (score < 0.4) return "high";
  if (score < 0.6) return "medium";
  return "low";
}

async function generateRecommendations(
  gaps: { topic: string; score: number; severity: string }[],
  kbName: string
): Promise<Map<string, string>> {
  const gapList = gaps
    .map((g) => `- "${g.topic}" (coverage: ${Math.round(g.score * 100)}%, severity: ${g.severity})`)
    .join("\n");

  const openai = getOpenAI();
  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a documentation audit expert. Generate specific, actionable recommendations for documentation gaps. Return a JSON object mapping each topic name to its recommendation string.",
        },
        {
          role: "user",
          content: `Knowledge base: "${kbName}"\n\nThe following topics have insufficient documentation coverage:\n${gapList}\n\nFor each topic, provide a specific recommendation on what documentation should be created or expanded. Return valid JSON: {"topic_name": "recommendation", ...}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    })
  );

  const parsed = JSON.parse(response.choices[0].message.content || "{}") as Record<string, string>;
  return new Map(Object.entries(parsed));
}

export async function analyzeDocumentation(
  chunks: string[],
  topics: string[],
  kbName: string
): Promise<AuditResult> {
  if (chunks.length === 0) {
    throw new Error("No content chunks to analyze");
  }

  if (topics.length === 0) {
    throw new Error("No topics defined for analysis");
  }

  const truncatedChunks = chunks.map((c) => c.slice(0, 800));

  const [chunkEmbeddings, topicEmbeddings] = await Promise.all([
    getEmbeddings(truncatedChunks),
    getEmbeddings(topics.map((t) => `Documentation about: ${t}`)),
  ]);

  const topicScores: { topic: string; score: number; severity: string }[] = [];

  for (let ti = 0; ti < topics.length; ti++) {
    let maxSimilarity = 0;
    for (let ci = 0; ci < chunkEmbeddings.length; ci++) {
      const sim = cosineSimilarity(topicEmbeddings[ti], chunkEmbeddings[ci]);
      if (sim > maxSimilarity) maxSimilarity = sim;
    }

    const normalizedScore = Math.min(1, Math.max(0, (maxSimilarity - 0.15) / 0.55));

    topicScores.push({
      topic: topics[ti],
      score: normalizedScore,
      severity: getSeverity(normalizedScore),
    });
  }

  const gapsToRecommend = topicScores.filter((t) => t.score < 0.7);
  let recommendations = new Map<string, string>();

  if (gapsToRecommend.length > 0) {
    recommendations = await generateRecommendations(gapsToRecommend, kbName);
  }

  const topicCoverages: TopicCoverage[] = topicScores.map((ts) => ({
    topic: ts.topic,
    score: ts.score,
    severity: getSeverity(ts.score),
    recommendation:
      recommendations.get(ts.topic) ||
      (ts.score >= 0.7 ? "Coverage is adequate." : "Consider adding documentation for this topic."),
  }));

  topicCoverages.sort((a, b) => a.score - b.score);

  const overallScore = Math.round(
    (topicScores.reduce((sum, t) => sum + t.score, 0) / topicScores.length) * 100
  );

  const criticalCount = topicCoverages.filter((t) => t.severity === "critical").length;
  const highCount = topicCoverages.filter((t) => t.severity === "high").length;

  const summary = `Documentation coverage analysis of "${kbName}" across ${topics.length} topics. Overall score: ${overallScore}%. ${criticalCount} critical gaps and ${highCount} high-priority gaps identified out of ${topicCoverages.length} topics analyzed.`;

  return { overallScore, topicCoverages, summary };
}
