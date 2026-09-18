import { useState } from 'react';

import '../App.css';
export function ConcatBench(
        {handleCopy,
        benchText,
        setBenchText}
        ) {
  const [copied, setCopied] = useState(false);

  return (
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
  )
}