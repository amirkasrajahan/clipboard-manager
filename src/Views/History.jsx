import { ClipboardItem } from '../components/ClipboardItem';

export function History({
        history,
        setHistory,
        searchQuery,
        setSearchQuery,
        selectingMode,
        setSelectingMode,
        selectedList,
        setSelectedList,
        benchText,
        setBenchText,
        currentView,
        setCurrentView,
        menuOpen,
        setMenuOpen,
        searchInputRef
}) {

      return (
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
      </div>)
}