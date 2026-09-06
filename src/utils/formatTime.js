// converts a date to a human readable string like "3m ago" or "just now"
export function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 30000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
