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
