import { useState, useEffect, useCallback, useRef } from 'react';
import { ClipboardItem } from './components/ClipboardItem';
import './App.css';


// this is the URL of the backend flask server. in production it runs on 5000, in dev mode it runs on 5000 too (but you have to start it manually with `npm run backend`).
const API = 'http://localhost:5000';

export default function App() {
  const [history, setHistory] = useState([]);
  const [selectingMode, setSelectingMode] = useState(false);
  const [selectedList, setSelectedList] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState('history'); // 'history' | 'bench' | 'favorites'
  const [benchText, setBenchText] = useState('');
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null)

  // loads whatever's already saved in flask when the app starts (runs once, empty [] dep)
  useEffect(() => {
    fetch(`${API}/history`)
      .then((response) => response.json())
      .then((items) => {
        // API returns { id, text, timestamp, note, favorite }
        // reshape to what the UI expects: { id, text, time, note, favorite }
        setHistory(items.map((item) => ({ ...item, time: new Date(item.timestamp) })));
      })
      .catch(() => {}); // backend might not be running yet — fail silently
  }, []);

  // this is what electron.js's clipboard-update event actually calls (see useEffect
  // below). doesnt touch history state right away - sends to flask first and only
  // updates the UI once flask sends back the saved row (with a real id + timestamp)
  const addToHistory = useCallback((text) => {
    if (!text || !text.trim()) return; // ignore empty strings or whitespace-only strings
    fetch(`${API}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then((response) => response.json())
      .then((item) => {
        setHistory((prev) => {
          // backend deduplicates; only prepend if it's genuinely new
          if (prev.length > 0 && prev[0].id === item.id) return prev;
          return [{ ...item, time: new Date(item.timestamp) }, ...prev].slice(0, 50);
        });
      })
      .catch(() => {});
  }, []);

  // THIS is where electron actually connects to react. window.electronAPI comes from
  // preload.js. onClipboardUpdate(addToHistory) makes addToHistory the callback that
  // fires every time electron.js's polling loop sees a new clipboard value.
  // also grabs whatever was already on the clipboard before the app even opened
  useEffect(() => {
    if (!window.electronAPI) return; // so it doesnt crash if opened in a normal browser tab (no electron)
    window.electronAPI.getClipboard().then((text) => addToHistory(text));
    const removeListener = window.electronAPI.onClipboardUpdate(addToHistory);
    return removeListener; // react auto-calls this on unmount, unsubscribes the listener
  }, [addToHistory]);

  // wrapped in useCallback (same reason as addToHistory above) so this function keeps
  // the same identity across renders - otherwise the useEffect below would think its
  // dependency changed every render and re-subscribe the listener every single time
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setMenuOpen(false);
      setSelectingMode(false);
      setSelectedList([]);
    }
    if (e.key === '/') {
      // dont steal focus if the user is already typing somewhere (like a note input) -
      // otherwise pressing "/" while writing a note would yank them into the search box
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      searchInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);


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

  // adds/removes an id from selectedList. its an array on purpose not a Set -
  // keeps the order i clicked in, thats how the numbered badges on the cards work
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

  const handleNoteChange = (id, value) => {
    // update local state immediately so the input stays responsive
    setHistory((prev) => prev.map((i) => i.id === id ? { ...i, note: value } : i));
    // persist to backend (fire and forget)
    fetch(`${API}/history/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: value }),
    }).catch(() => {});
  };

  // optimistic update - flips the star on screen right away instead of waiting for
  // flask to respond. PATCH runs in the background (fire and forget, no error
  // handling rn so if it fails the UI just stays wrong til next reload)
  const toggleFavorite = (id) => {
    setHistory((prev) => prev.map((i) => {
      if (i.id !== id) return i;
      const next = !i.favorite;
      fetch(`${API}/history/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: next }),
      }).catch(() => {});
      return { ...i, favorite: next };
    }));
  };

  return (
    <div className="app">

      {/* header - always visible regardless of which view you're on */}
      <header className="app-header">
        <h1 className="app-title">Clipboard Manager</h1>

        {/* hamburger menu button */}
        <button className="menu-btn" onClick={() => setMenuOpen((prev) => !prev)}>
          ☰
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="header-count">{history.length} items</span>
          {history.length > 0 && (
            <button className="select-btn" onClick={handleSelect}>
              {selectingMode ? 'Cancel' : 'Select'}
            </button>
          )}
        </div>
      </header>

      {/* dropdown menu - shows when hamburger is clicked */}
      {menuOpen && (
        <div className="menu-dropdown">
          {[
            { label: '📋  History', view: 'history' },
            { label: '⌨️  Concat Bench', view: 'bench' },
            { label: "Favorites", view: 'favorites' },
          ].map(({ label, view }) => (
            <button
              key={view}
              onClick={() => { setCurrentView(view); setMenuOpen(false); }}
              className={`menu-item ${currentView === view ? 'active' : ''}`}
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
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div>No clipboard history yet.</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                Copy something to get started.
              </div>
            </div>
          ) : (
            <div>
              <div className="search-bar">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search clipboard history..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={searchInputRef}
                />
              </div>

              <ul className="item-list">
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
                    note={item.note || ''}
                    onNoteChange={(value) => handleNoteChange(item.id, value)}
                    isFavorite={item.favorite || false}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                  />
                ))}
              </ul>

              {/* select all, add to bench, and trash - only show in select mode */}
              {selectingMode && (
                <div className="selection-toolbar">
                  {/* left side: select all + add to bench */}
                  <button
                    className="toolbar-btn"
                    onClick={() => setSelectedList(history.map((item) => item.id))}
                  >
                    Select All
                  </button>
                  <button
                    className="toolbar-btn primary"
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
                    className="trash-btn"
                    onClick={() => {
                      // delete each selected item from the backend, then remove from local state
                      selectedList.forEach((id) =>
                        fetch(`${API}/history/${id}`, { method: 'DELETE' }).catch(() => {})
                      );
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
        <div className="bench-view">

          {/* title + char count */}
          <div className="bench-header">
            <h2 className="bench-title">Concat Bench</h2>
            <span className="bench-char-count">{benchText.length} chars</span>
          </div>

          {/* the editable textarea - takes up all available space */}
          <textarea
            className="bench-textarea"
            value={benchText}
            onChange={(e) => setBenchText(e.target.value)}
            placeholder="Select items from History and click 'Add to Bench'..."
          />

          {/* bottom buttons */}
          <div className="bench-actions">
            <button className="toolbar-btn" onClick={() => setBenchText('')}>
              Clear
            </button>
            <button
              className="toolbar-btn primary"
              onClick={() => handleCopy(benchText).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              })}
            >
              {copied && benchText !== '' ? <span className="copied-badge">Copied!</span> : 'Copy All'}
            </button>
          </div>

        </div>
      )}

      {/* favorites view */}
      {currentView === 'favorites' && (
        <div>
          {history.filter((item) => item.favorite).length === 0 ? (
            // empty state
            <div className="empty-state">
              <div className="empty-icon">⭐</div>
              <div>No favorites yet.</div>
              <div style={{ marginTop: '8px', fontSize: '12px' }}>
                Click the star on a clipboard item to add it to your favorites.
              </div>
            </div>
          ) : (
            <ul className="item-list">
              {history.filter((item) => item.favorite).map((item) => (
                <ClipboardItem
                  key={item.id}
                  item={item}
                  onCopy={handleCopy}
                  isSelected={selectedList.includes(item.id)}
                  selectingMode={selectingMode}
                  onToggle={toggleSelect}
                  selectionOrder={selectedList.indexOf(item.id) + 1}
                  searchQuery={searchQuery}
                  note={item.note || ''}
                  onNoteChange={(value) => handleNoteChange(item.id , value)}
                  isFavorite={item.favorite || false}
                  onToggleFavorite={() => toggleFavorite(item.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

    </div>
  );
}


