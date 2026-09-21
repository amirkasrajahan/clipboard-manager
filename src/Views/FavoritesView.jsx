import { ClipboardItem } from '../components/ClipboardItem';
export function FavoritesView({
  history,
  selectingMode,
  selectedList,
  toggleSelect,
  handleCopy,
  toggleFavorite,
  handleNoteChange,
  searchQuery
}) {
  return (
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
              onNoteChange={(value) => handleNoteChange(item.id, value)}
              isFavorite={item.favorite || false}
              onToggleFavorite={() => toggleFavorite(item.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}