export function formatRelativeTime(value?: string | Date | null): string {
  if (!value) return 'Unknown';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  const diffMs = Date.now() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 60) return 'just now';

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function formatTime(value?: string | Date | null): string {
  if (!value) return 'Unknown';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return 'Unknown';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDuration(start?: string | Date | null, end?: string | Date | null): string {
  if (!start) return 'Unknown';
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end ? (end instanceof Date ? end : new Date(end)) : null;
  if (Number.isNaN(startDate.getTime())) return 'Unknown';
  if (endDate && Number.isNaN(endDate.getTime())) return 'Unknown';

  const endValue = endDate ? endDate.getTime() : Date.now();
  const diffMs = Math.max(0, endValue - startDate.getTime());
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'}`;
  const diffHours = Math.floor(diffMinutes / 60);
  const remMinutes = diffMinutes % 60;
  if (remMinutes === 0) return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  return `${diffHours}h ${remMinutes}m`;
}
