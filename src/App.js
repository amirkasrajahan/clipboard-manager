import React, { useState, useEffect, useCallback } from 'react';

const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    minHeight: '100vh',
    padding: '0',
    margin: '0',
  },
  header: {
    backgroundColor: '#16213e',
    padding: '16px 20px',
    borderBottom: '1px solid #9ab0cbff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#17f01bff',
  },
  count: {
    fontSize: '12px',
    color: '#f9f5f5ff',
  },
  list: {
    padding: '12px',
    listStyle: 'none',
    margin: 0,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 60px)',
  },
  itemBase: {
    backgroundColor: '#16213e',
    border: '1px solid #0f3460',
    borderRadius: '8px',
    padding: '12px 14px',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
  },
  itemHover: {
    backgroundColor: '#0f3460',
    borderColor: '#e94560',
  },
  itemText: {
    fontSize: '13px',
    lineHeight: '1.4',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    maxHeight: '80px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
  },
  timestamp: {
    fontSize: '11px',
    color: '#666',
  },
  copyHint: {
    fontSize: '11px',
    color: '#e94560',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  copyHintVisible: {
    opacity: 1,
  },
  copiedBadge: {
    fontSize: '11px',
    color: '#4caf50',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#555',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '12px',
  },
  clearBtn: {
    background: 'none',
    border: '1px solid #333',
    color: '#888',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 30000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function ClipboardItem({ item, onCopy }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    await onCopy(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <li
      style={{ ...styles.itemBase, ...(hovered ? styles.itemHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <div style={styles.itemText}>{item.text}</div>
      <div style={styles.itemMeta}>
        <span style={styles.timestamp}>{formatTime(item.time)}</span>
        {copied ? (
          <span style={styles.copiedBadge}>Copied!</span>
        ) : (
          <span style={{ ...styles.copyHint, ...(hovered ? styles.copyHintVisible : {}) }}>
            Click to copy
          </span>
        )}
      </div>
    </li>
  );
}

export default function App() {
  const [history, setHistory] = useState([]);

  const addToHistory = useCallback((text) => {
    if (!text || !text.trim()) return;
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].text === text) return prev;
      const entry = { id: Date.now(), text, time: new Date() };
      return [entry, ...prev].slice(0, 50);
    });
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.getClipboard().then(addToHistory);

    const removeListener = window.electronAPI.onClipboardUpdate(addToHistory);
    return removeListener;
  }, [addToHistory]);

  const handleCopy = async (text) => {
    if (window.electronAPI) {
      await window.electronAPI.writeClipboard(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleClear = () => setHistory([]);

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Clipboard Manager</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={styles.count}>{history.length} items</span>
          {history.length > 0 && (
            <button style={styles.clearBtn} onClick={handleClear}>
              Clear
            </button>
          )}
        </div>
      </header>

      {history.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📋</div>
          <div>No clipboard history yet.</div>
          <div style={{ marginTop: '8px', fontSize: '12px' }}>
            Copy something to get started.
          </div>
        </div>
      ) : (
        <ul style={styles.list}>
          {history.map((item) => (
            <ClipboardItem key={item.id} item={item} onCopy={handleCopy} />
          ))}
        </ul>
      )}
    </div>
  );
}
