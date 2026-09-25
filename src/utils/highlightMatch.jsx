// escapes regex special characters so `query` is matched as literal text,
// not interpreted as a pattern (e.g. searching "(" would otherwise crash)
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// wraps every case-insensitive match of `query` inside `text` in a <mark>
export function highlightMatch(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="search-highlight">{part}</mark>
      : part
  );
}
