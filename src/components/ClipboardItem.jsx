import React, { useState } from 'react';
import { formatTime } from '../utils/formatTime';
import { highlightMatch } from '../utils/highlightMatch';
import './ClipboardItem.css';

// a single clipboard card
// gets: the item data, copy function, and selection-related stuff from App
export function ClipboardItem({ item,
  onCopy, selectingMode,
  isSelected, onToggle,
  selectionOrder, searchQuery,
  note, onNoteChange,
  isFavorite, onToggleFavorite }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // copies text back to system clipboard (goes through electron ipc, or navigator.clipboard
  // if theres no window.electronAPI) then flashes "copied!" for 1.5s. copied/expanded are
  // LOCAL state to this card, not in App - so each card animates independently
  const handleClick = async () => {
    await onCopy(item.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // toggles between showing full text vs first 100 chars
  // e.stopPropagation() is important here - without it clicking expand would ALSO
  // bubble up to the <li>'s onClick and trigger a copy/select, since this button lives inside it
  const handleExpand = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <li
      className="clipboard-item"
      // in select mode clicking the card toggles the checkbox, otherwise it copies
      onClick={selectingMode ? () => onToggle(item.id) : handleClick}
    >
      {selectingMode && (
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(item.id); }}
          className={`select-badge ${isSelected ? 'selected' : ''}`}
        >
          {isSelected ? selectionOrder : ''}
        </div>
      )}

      {/* star button - gold when favorited, barely visible when not */}
      <div
        onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
        className={`favorite-star ${isFavorite ? 'active' : ''}`}
      >
        ★
      </div>

      {/* show full text if expanded, otherwise cap at 100 chars */}
      <div className="item-text">
        {expanded
          ? highlightMatch(item.text, searchQuery)
          : highlightMatch(
              item.text.length > 100 ? item.text.slice(0, 100) + '...' : item.text,
              searchQuery
            )}
      </div>

      {/* character count */}
      <div className="item-char-count">{item.text.length} chars</div>

      {/* expand/collapse button - only shows when text is long enough to need it */}
      {item.text.length > 100 && (
        <div className="expand-toggle" onClick={handleExpand}>
          <span className={`expand-arrow ${expanded ? 'expanded' : ''}`}>▼</span>
          <span>{expanded ? 'Show less' : 'Show more'}</span>
        </div>
      )}

      <div className="note-input-wrap">
        <input
          type="text"
          className="note-input"
          placeholder="Add a note..."
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* bottom row: timestamp on left, copy hint or "Copied!" on right */}
      <div className="item-meta">
        <span className="item-timestamp">{formatTime(item.time)}</span>
        {copied ? (
          <span className="copied-badge">Copied!</span>
        ) : (
          <span className="copy-hint">Click to copy</span>
        )}
      </div>
    </li>
  );
}
