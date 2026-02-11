/**
 * Generate a session ID in the format SES-xxxxxxxx
 * Simulates a bigint/varchar opaque identifier
 */
export function generateSessionId(): string {
  const random = Math.random().toString(36).substring(2, 10);
  return `SES-${random}`;
}

/**
 * Format session ID for display with monospace styling
 */
export function formatSessionId(sessionId: string): string {
  return sessionId;
}
