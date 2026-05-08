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

    // Allow JSDelivr only for trusted paths (e.g., googlefonts)
    if (
      parsedUrl.hostname === "cdn.jsdelivr.net" &&
      parsedUrl.pathname.startsWith("/gh/googlefonts/noto-fonts")
    ) {
      return true;
    }

    // Allow the application's own origin
    if (allowedOrigin) {
      const originUrl = new URL(allowedOrigin);
      const TRUSTED_DOMAINS = ["github-user-summary.vercel.app", "localhost"];

      if (
        TRUSTED_DOMAINS.includes(originUrl.hostname) &&
        parsedUrl.origin === originUrl.origin
      ) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
