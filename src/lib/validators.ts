/**
 * Validates a GitHub username.
 * Rules:
 * - Alphanumeric characters or single hyphens.
 * - Cannot begin or end with a hyphen.
 * - Maximum 39 characters.
 * - Case insensitive.
 */
export function isValidGitHubUsername(username: string): boolean {
  if (!username) return false;
  // Regex:
  // ^[a-z\d]           : Starts with alphanumeric
  // (?:[a-z\d]|-(?=[a-z\d])){0,38} : Followed by 0-38 chars of alphanumeric OR hyphen (if followed by alphanumeric)
  // $                  : End of string
  // 'i' flag           : Case insensitive
  const regex = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
  return regex.test(username);
}

/**
 * Sanitizes a URL for use in href attributes.
 * Allows only http and https protocols.
 * If the input starts with //, it prepends https:.
 * If the input doesn't have a protocol, it prepends https://.
 * Malicious protocols like javascript:, data:, or vbscript: are blocked and replaced with '#'.
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "#";

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "#";

  // Handle protocol-relative URLs
  if (trimmedUrl.startsWith("//")) {
    return `https:${trimmedUrl}`;
  }

  // Check if it already has a protocol
  const protocolMatch = trimmedUrl.match(/^([a-z0-9+.-]+):/i);
  if (protocolMatch) {
    const protocol = protocolMatch[1].toLowerCase();
    if (protocol === "http" || protocol === "https") {
      return trimmedUrl;
    }
    // Block other protocols
    return "#";
  }

  // Default to https if no protocol is present
  return `https://${trimmedUrl}`;
}

const DEFAULT_TRUSTED_FONT_ORIGINS = [
  "https://github-user-summary.vercel.app",
];

function getTrustedFontOrigins(): Set<string> {
  const origins = new Set(DEFAULT_TRUSTED_FONT_ORIGINS);
  const configuredAppUrl = process.env.APP_URL;

  if (configuredAppUrl) {
    try {
      const configuredOrigin = new URL(configuredAppUrl).origin;
      if (configuredOrigin.startsWith("https://")) {
        origins.add(configuredOrigin);
      }
    } catch {
      // Ignore invalid deployment configuration and fall back to the fixed allowlist.
    }
  }

  return origins;
}

function isTrustedJsDelivrNotoFont(parsedUrl: URL): boolean {
  if (parsedUrl.hostname !== "cdn.jsdelivr.net") {
    return false;
  }

  if (parsedUrl.pathname.includes("%")) {
    return false;
  }

  const pathname = parsedUrl.pathname;

  const slash1 = pathname.indexOf("/");
  if (slash1 === -1) return false;

  let slash2 = pathname.indexOf("/", slash1 + 1);
  if (slash2 === -1) slash2 = pathname.length;
  if (pathname.slice(slash1 + 1, slash2) !== "gh") return false;

  let slash3 = pathname.indexOf("/", slash2 + 1);
  if (slash3 === -1) slash3 = pathname.length;
  if (pathname.slice(slash2 + 1, slash3) !== "googlefonts") return false;

  let slash4 = pathname.indexOf("/", slash3 + 1);
  if (slash4 === -1) slash4 = pathname.length;

  const repoSegment = pathname.slice(slash3 + 1, slash4);

  const isNotoFontsRepo =
    repoSegment === "noto-fonts" ||
    /^noto-fonts@.+$/.test(repoSegment);

  return isNotoFontsRepo;
}

/**
 * Validates if a font URL is from a trusted source.
 * Trusted sources include specific paths on cdn.jsdelivr.net and the application's own origin.
 * All URLs must use the HTTPS protocol.
 */
export function isTrustedFontUrl(url: string, allowedOrigin?: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Enforce HTTPS
    if (parsedUrl.protocol !== "https:") {
      return false;
    }

    // Allow JSDelivr only for the googlefonts/noto-fonts repository.
    if (isTrustedJsDelivrNotoFont(parsedUrl)) {
      return true;
    }

    // Allow the application's own origin
    if (allowedOrigin) {
      const originUrl = new URL(allowedOrigin);
      if (
        parsedUrl.origin === originUrl.origin &&
        getTrustedFontOrigins().has(originUrl.origin)
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
