import * as cheerio from "cheerio";
import { URL } from "url";
import { lookup } from "dns/promises";

const BLOCKED_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "169.254.169.254",
  "[::1]",
  "metadata.google.internal",
];

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  if (parts[0] === 10) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 0) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase().trim();

  if (normalized === "::1") return true;
  if (normalized === "::") return true;

  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  if (normalized.startsWith("fe80")) return true;

  if (normalized.startsWith("::ffff:")) {
    const v4Part = normalized.slice(7);
    if (isPrivateIPv4(v4Part)) return true;
  }

  return false;
}

function isPrivateIP(ip: string): boolean {
  if (ip.includes(":")) {
    return isPrivateIPv6(ip);
  }
  return isPrivateIPv4(ip);
}

function validateUrlFormat(urlString: string): URL {
  const parsed = new URL(urlString);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.includes(hostname)) {
    throw new Error("This URL target is not allowed");
  }

  if (isPrivateIP(hostname)) {
    throw new Error("Private/internal network URLs are not allowed");
  }

  return parsed;
}

async function validateHostResolution(hostname: string): Promise<void> {
  try {
    const result = await lookup(hostname, { all: true });
    const results = Array.isArray(result) ? result : [result];
    for (const entry of results) {
      const addr = typeof entry === "string" ? entry : entry.address;
      if (isPrivateIP(addr)) {
        throw new Error("URL resolves to a private/internal IP address");
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("private/internal")) {
      throw err;
    }
    throw new Error("Failed to resolve hostname — request blocked for safety");
  }
}

const MAX_REDIRECTS = 5;

export async function scrapeUrl(url: string): Promise<string> {
  let currentUrl = url;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const parsed = validateUrlFormat(currentUrl);
    await validateHostResolution(parsed.hostname);

    const response = await fetch(currentUrl, {
      headers: {
        "User-Agent": "DocAudit/1.0 (Documentation Gap Analysis Tool)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Redirect with no location header");
      }
      currentUrl = new URL(location, currentUrl).toString();

      if (i === MAX_REDIRECTS) {
        throw new Error("Too many redirects");
      }
      continue;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
      throw new Error("Response too large (max 5MB)");
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header, iframe, noscript").remove();

    const content = $("main, article, .content, .post, .entry, #content, body")
      .first()
      .text();

    return content.replace(/\s+/g, " ").trim();
  }

  throw new Error("Failed to fetch URL after redirects");
}
