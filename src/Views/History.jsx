import { ClipboardItem } from '../components/ClipboardItem';
import '../App.css';

// history view - list + search bar + selection toolbar.
// every mutation (copy/note/favorite/select/add-to-bench/delete) is owned by App
// (that's where `history` itself lives) and handed down here as a callback.
export function History({
  history,
  filteredHistory,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  selectingMode,
  selectedList,
  setSelectedList,
  onCopy,
  onToggle,
  onNoteChange,
  onToggleFavorite,
  onAddToBench,
  onDeleteSelected,
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
                onCopy={onCopy}
                isSelected={selectedList.includes(item.id)}
                selectingMode={selectingMode}
                onToggle={onToggle}
                selectionOrder={selectedList.indexOf(item.id) + 1}
                searchQuery={searchQuery}
                note={item.note || ''}
                onNoteChange={(value) => onNoteChange(item.id, value)}
                isFavorite={item.favorite || false}
                onToggleFavorite={() => onToggleFavorite(item.id)}
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
              <button className="toolbar-btn primary" onClick={onAddToBench}>
                Add to Bench
              </button>

              {/* right side: trash */}
              <button className="trash-btn" onClick={onDeleteSelected}>
                🗑️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
