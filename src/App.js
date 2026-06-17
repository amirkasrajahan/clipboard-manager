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
    overflow: 'hidden',
    display: '-webkit-box',
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
  selectBtn: {
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

function ClipboardItem({ item, onCopy, selectingMode, isSelected, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const handleClick = async () => {
    await onCopy(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleExpand = (e) => {
    e.stopPropagation(); // Prevents the click from triggering the copy action.
    setExpanded((prev) => !prev);
  }


  return (
    <li
      style={{ ...styles.itemBase, ...(hovered ? styles.itemHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={selectingMode ? () => onToggle(item.id) : handleClick}
    >
    {selectingMode && (
      <input
    type="checkbox"
    checked={isSelected}
    onChange={() => onToggle(item.id)}
    style={{ position: 'absolute', top: '10px', right: '10px' }}
      />
    )}
      <div style={styles.itemText}>
        {expanded ? item.text : item.text.length > 100 ? item.text.slice(0, 100) + '...' : item.text}
        </div>
      <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
            {item.text.length} chars
      </div>
<div 
  onClick={handleExpand}
  style={{ 
    textAlign: 'center', 
    color: '#555', 
    fontSize: '10px',
    marginTop: '4px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  }}
>
  ▼
</div>
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
  const [selectingMode, setSelectingMode] = useState(false);
  const [selectedList, setSelectedList] = useState([]);

  const addToHistory = useCallback((text) => {
    if (!text || !text.trim()) return;
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].text === text) return prev;  // Prevents duplicates.
      const entry = { id: Date.now(), text, time: new Date() };   // Creates a new entry with a unique ID(timestamp because Date.now() is unique for each entry) and timestamp.
      return [entry, ...prev].slice(0, 50); //keeps only the latest 50 entries in history.
    });
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.getClipboard().then((text) => addToHistory(text)); // Fetches the current clipboard content when the app starts and adds it to history.

    const removeListener = window.electronAPI.onClipboardUpdate(addToHistory);
    return removeListener; // Cleans up the listener when the component unmounts.
  }, [addToHistory]);

  const handleCopy = async (text) => {
    if (window.electronAPI) {
      await window.electronAPI.writeClipboard(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const handleSelect = () => {
    setSelectingMode((prev) => !prev);
  }

  const toggleSelect = (id) => {
  setSelectedList((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
  );
};

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.title}>Clipboard Manager</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={styles.count}>{history.length} items</span>
          {history.length > 0 && (
            <button style={styles.selectBtn} onClick={handleSelect}>
              {selectingMode ? 'Cancel' : 'Select'}
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
        <div>
        <ul style={styles.list}>
          {history.map((item) => (
            <ClipboardItem key={item.id} item={item} onCopy={handleCopy} isSelected={selectedList.includes(item.id)} selectingMode={selectingMode} onToggle={toggleSelect} />
          ))}
        </ul>
        
{selectingMode && (
  <div>
    <button
      style={{ background: 'none',
    border: '1px solid #333',
    color: '#888',
    borderRadius: '4px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',position: 'fixed', bottom: '20px', left: '20px',}}
      onClick={() => setSelectedList(history.map((item) => item.id))}
    >
      Select All
    </button>

    <button 
      style={{ position: 'fixed', bottom: '20px', right: '20px', fontSize: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
      onClick={() => {
        setHistory((prev) => prev.filter((item) => !selectedList.includes(item.id)));
        setSelectedList([]);
        setSelectingMode(false);
      }}
    >
      🗑️
    </button>
  </div>
)}
    </div>
  
      )}
    </div>
  );
}
