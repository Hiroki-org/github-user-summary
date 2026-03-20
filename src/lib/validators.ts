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
