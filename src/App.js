import React, { useState, useEffect, useCallback } from 'react';

// all the styles in one place, easier to change colors and stuff later
const styles = {
  app: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    backgroundColor: '#141415',
    color: '#f0f0f0',
    minHeight: '100vh',
    padding: '0',
    margin: '0',
  },
  header: {
    backgroundColor: '#1e1e20',
    padding: '14px 16px',
    borderBottom: '1px solid #2a2a2d',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  count: {
    fontSize: '11px',
    color: '#555',
  },
  list: {
    padding: '10px',
    listStyle: 'none',
    margin: 0,
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 60px)',
  },
  // default card style
  itemBase: {
    backgroundColor: '#1e1e20',
    border: '1px solid #2a2a2d',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '6px',
    cursor: 'pointer',
    transition: 'background 0.1s ease, border-color 0.1s ease',
    position: 'relative', // needed so the order badge can be positioned inside the card
  },
  // this gets merged on top of itemBase when the card is hovered
  itemHover: {
    backgroundColor: '#28282c',
    borderColor: '#424246',
  },
  itemText: {
    fontSize: '13px',
    lineHeight: '1.5',
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    color: '#e8e8e8',
  },
  itemMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
  timestamp: {
    fontSize: '11px',
    color: '#555',
  },
  // "click to copy" hint - hidden by default, shows on hover
  copyHint: {
    fontSize: '11px',
    color: '#666',
    opacity: 0,
    transition: 'opacity 0.15s ease',
  },
  copyHintVisible: {
    opacity: 1,
  },
  // green "Copied!" badge that shows for 1.5s after clicking
  copiedBadge: {
    fontSize: '11px',
    color: '#4caf50',
    fontWeight: '500',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px',
    color: '#444',
  },
  emptyIcon: {
    fontSize: '44px',
    marginBottom: '14px',
    opacity: 0.5,
  },
  selectBtn: {
    background: 'none',
    border: '1px solid #2a2a2d',
    color: '#888',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '12px',
    cursor: 'pointer',
  },
};

// converts a date to a human readable string like "3m ago" or "just now"
function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  if (diff < 30000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}
function highlightMatch(text, query) {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} style={{ backgroundColor: '#f5a623', color: '#000', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
      : part
  );
}

// a single clipboard card
// gets: the item data, copy function, and selection-related stuff from App
function ClipboardItem({ item, onCopy, selectingMode, isSelected, onToggle, selectionOrder, searchQuery }) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  

  // copies the text back to clipboard and shows "Copied!" for 1.5s
  const handleClick = async () => {
    await onCopy(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // toggles between showing full text vs first 100 chars
  // stopPropagation so clicking expand doesn't also trigger copy
  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <li
      style={{ ...styles.itemBase, ...(hovered ? styles.itemHover : {}) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // in select mode clicking the card toggles the checkbox, otherwise it copies
      onClick={selectingMode ? () => onToggle(item.id) : handleClick}
      
    >
    {selectingMode && (
      <div
        onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          border: '1px solid #636366',
          backgroundColor: isSelected ? '#3a3a3c' : 'transparent',
          color: '#fff',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {
        isSelected ? selectionOrder : ''}
      </div>
    )} 

      {/* show full text if expanded, otherwise cap at 100 chars */}
<div style={styles.itemText}>
  {expanded
    ? highlightMatch(item.text, searchQuery)
    : highlightMatch(
        item.text.length > 100 ? item.text.slice(0, 100) + '...' : item.text,
        searchQuery
      )}
</div>

      {/* character count */}
      <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>
        {item.text.length} chars
      </div>

      {/* expand/collapse button - only shows when text is long enough to need it */}
      {item.text.length > 100 && (
        <div
          onClick={handleExpand}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            marginTop: '8px',
            padding: '4px 0',
            borderTop: '1px solid #2a2a2d',
            color: '#666',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'color 0.15s ease',
            userSelect: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >
          <span style={{
            display: 'inline-block',
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            fontSize: '9px',
          }}>▼</span>
          <span>{expanded ? 'Show less' : 'Show more'}</span>
        </div>
      )}

      {/* bottom row: timestamp on left, copy hint or "Copied!" on right */}
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
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('history'); // 'history' | 'bench' | 'search'
  const [benchText, setBenchText] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // adds a new clipboard entry to the top of the list
  // skips duplicates and keeps max 50 items
  const addToHistory = useCallback((text) => {
    if (!text || !text.trim()) return;
    setHistory((prev) => {
      if (prev.length > 0 && prev[0].text === text) return prev;
      const entry = { id: Date.now(), text, time: new Date() };
      return [entry, ...prev].slice(0, 50);
    });
  }, []);

  // runs once when the app loads
  // grabs current clipboard and starts listening for changes
  useEffect(() => {
    if (!window.electronAPI) return;

    // grab whatever is on the clipboard right now
    window.electronAPI.getClipboard().then((text) => addToHistory(text));

    // listen for future clipboard changes - electron calls addToHistory every time something is copied
    const removeListener = window.electronAPI.onClipboardUpdate(addToHistory);

    // when the app closes, stop listening
    return removeListener;
  }, [addToHistory]);

  // writes text back to the system clipboard
  // uses electron if available, falls back to browser API
  const handleCopy = async (text) => {
    if (window.electronAPI) {
      await window.electronAPI.writeClipboard(text);
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  // toggles select mode on/off and clears any checked items
  const handleSelect = () => {
    setSelectingMode((prev) => !prev);
    setSelectedList([]);
  };

  // adds or removes an item id from the selected list
  const toggleSelect = (id) => {
    setSelectedList((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };
const filteredHistory = history
  .filter((item) => item.text.toLowerCase().includes(searchQuery.toLowerCase()))
  .map((item) => {
    const text = item.text.toLowerCase();
    const query = searchQuery.toLowerCase();
    let score = 1;
    if (text.startsWith(query)) score = 3;
    else if (new RegExp(`\\b${query}\\b`).test(text)) score = 2;
    return { ...item, score };
  })
  .sort((a, b) => b.score - a.score);

  return (
    <div style={styles.app}>

      {/* header - always visible regardless of which view you're on */}
      <header
        style={styles.header}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <h1 style={styles.title}>Clipboard Manager</h1>

        {/* hamburger menu button */}
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{ background: 'none', border: 'none', color: '#888', fontSize: '20px', cursor: 'pointer' }}
        >
          ☰
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={styles.count}>{history.length} items</span>
          {history.length > 0 && (
            // select button changes color when header is hovered
            <button
              style={hovered ? { ...styles.selectBtn, background: '#3a3a3c', color: '#fff' } : styles.selectBtn}
              onClick={handleSelect}
            >
              {selectingMode ? 'Cancel' : 'Select'}
            </button>
          )}
        </div>
      </header>

      {/* dropdown menu - shows when hamburger is clicked */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#2c2c2e',
          borderBottom: '1px solid #3a3a3c',
          padding: '8px 0',
        }}>
          {[
            { label: '📋  History', view: 'history' },
            { label: '⌨️  Concat Bench', view: 'bench' },
          ].map(({ label, view }) => (
            <button
              key={view}
              onClick={() => { setCurrentView(view); setMenuOpen(false); }}
              style={{
                display: 'block',
                width: '100%',
                background: currentView === view ? '#3a3a3c' : 'none',
                border: 'none',
                color: currentView === view ? '#ffffff' : '#aaa',
                padding: '10px 20px',
                fontSize: '13px',
                textAlign: 'left',
                cursor: 'pointer',
                fontWeight: currentView === view ? '600' : '400',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      

      {/* history view */}
      {currentView === 'history' && (
        <div>
          {history.length === 0 ? (
            // empty state
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>📋</div>
              <div>No clipboard history yet.</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                Copy something to get started.
              </div>
            </div>
          ) : (
            
            <div>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #3a3a3c' }}>
        <input
          type="text"
          placeholder="Search clipboard history..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '95%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #3a3a3c',
            backgroundColor: '#2c2c2e',
            color: '#f0f0f0',
            fontSize: '13px',
            outline: 'none',
          }}
        />
      </div>
              
              <ul style={styles.list}>
                {filteredHistory.map((item) => (
                  <ClipboardItem
                    key={item.id}
                    item={item}
                    onCopy={handleCopy}
                    isSelected={selectedList.includes(item.id)}
                    selectingMode={selectingMode}
                    onToggle={toggleSelect}
                    selectionOrder={selectedList.indexOf(item.id) + 1}
                    searchQuery={searchQuery}
                  />
                ))}
              </ul>

              {/* select all, add to bench, and trash - only show in select mode */}
              {selectingMode && (
                <div style={{
                  position: 'fixed',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  backgroundColor: '#2c2c2e',
                  borderTop: '1px solid #3a3a3c',
                  padding: '12px 16px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  {/* left side: select all + add to bench */}
                  <button
                    style={{
                      flex: 1,
                      background: 'none',
                      border: '1px solid #3a3a3c',
                      color: '#aaa',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedList(history.map((item) => item.id))}
                  >
                    Select All
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: '#3a3a3c',
                      border: '1px solid #636366',
                      color: '#fff',
                      borderRadius: '6px',
                      padding: '8px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      fontWeight: '500',
                    }}
                    onClick={() => {
                      // add selected items to bench in click order
                      const selectedItems = selectedList.map((id) => history.find((item) => item.id === id));
                      const concatenatedText = selectedItems.map((item) => item.text).join('\n\n');
                      setBenchText(concatenatedText);
                      setCurrentView('bench');
                      setMenuOpen(false);
                      setSelectingMode(false);
                    }}>
                    Add to Bench
                  </button>

                  {/* right side: trash */}
                  <button
                    style={{ background: 'none', border: '1px solid #3a3a3c', borderRadius: '6px', padding: '8px 12px', fontSize: '16px', cursor: 'pointer' }}
                    onClick={() => {
                      // remove only the selected items from history
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
      )}

      {/* concat bench view */}
      {currentView === 'bench' && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 61px)', boxSizing: 'border-box' }}>

          {/* title + char count */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontWeight: '600' }}>Concat Bench</h2>
            <span style={{ fontSize: '11px', color: '#636366' }}>{benchText.length} chars</span>
          </div>

          {/* the editable textarea - takes up all available space */}
          <textarea
            value={benchText}
            onChange={(e) => setBenchText(e.target.value)}
            placeholder="Select items from History and click 'Add to Bench'..."
            style={{
              flex: 1,
              width: '100%',
              backgroundColor: '#2c2c2e',
              color: '#f0f0f0',
              border: '1px solid #3a3a3c',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '13px',
              lineHeight: '1.6',
              resize: 'none',
              outline: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              boxSizing: 'border-box',
            }}
          />

          {/* bottom buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', gap: '8px' }}>
            <button
              style={{
                flex: 1,
                background: 'none',
                border: '1px solid #3a3a3c',
                color: '#aaa',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
              onClick={() => setBenchText('')}
            >
              Clear
            </button>
            <button
              style={{
                flex: 1,
                background: '#3a3a3c',
                border: '1px solid #636366',
                color: '#ffffff',
                borderRadius: '6px',
                padding: '8px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500',
              }}
              onClick={() => handleCopy(benchText).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })}
            >
              {copied && benchText !== '' ? <span style={styles.copiedBadge}>Copied!</span> : 'Copy All'}
            </button>
          </div>

        </div>
      )}


    </div>
  );
}
