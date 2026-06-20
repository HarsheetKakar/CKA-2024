import { useState } from 'react';
import './MatchPairs.css';

export interface MatchItem {
  id: string;
  label: string;
  detail?: string;
}

export interface MatchPairsProps {
  /** Fixed-order prompts (left column). */
  left: MatchItem[];
  /** Shuffled candidates (right column). */
  right: MatchItem[];
  /** leftId -> rightId | null. Fully controlled by the parent day. */
  matches: Record<string, string | null>;
  onMatch: (leftId: string, rightId: string | null) => void;
  invalidIds?: Set<string>;
  lockedIds?: Set<string>;
  disabled?: boolean;
  leftLabel?: string;
  rightLabel?: string;
}

export function MatchPairs({
  left,
  right,
  matches,
  onMatch,
  invalidIds,
  lockedIds,
  disabled = false,
  leftLabel = 'Terms',
  rightLabel = 'Roles',
}: MatchPairsProps) {
  const [pendingLeft, setPendingLeft] = useState<string | null>(null);

  const rightToLeft: Record<string, string> = {};
  for (const [l, r] of Object.entries(matches)) if (r) rightToLeft[r] = l;

  const orderOf = (rightId: string) => {
    const idx = left.findIndex((l) => matches[l.id] === rightId);
    return idx >= 0 ? idx + 1 : null;
  };

  function pickLeft(id: string) {
    if (disabled || lockedIds?.has(id)) return;
    setPendingLeft((cur) => (cur === id ? null : id));
  }

  function pickRight(rightId: string) {
    if (disabled) return;
    if (pendingLeft) {
      // If this right was used elsewhere, free it first.
      const prevOwner = rightToLeft[rightId];
      if (prevOwner && prevOwner !== pendingLeft) onMatch(prevOwner, null);
      onMatch(pendingLeft, rightId);
      setPendingLeft(null);
    } else {
      const owner = rightToLeft[rightId];
      if (owner && !lockedIds?.has(owner)) onMatch(owner, null);
    }
  }

  return (
    <div className="matchpairs">
      <div className="matchpairs__col">
        <h3 className="matchpairs__heading">{leftLabel}</h3>
        <ul>
          {left.map((item, i) => {
            const matched = matches[item.id];
            const locked = lockedIds?.has(item.id) ?? false;
            const invalid = invalidIds?.has(item.id) ?? false;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`matchpairs__node matchpairs__left ${
                    pendingLeft === item.id ? 'is-pending' : ''
                  } ${matched ? 'is-matched' : ''} ${locked ? 'is-locked' : ''} ${
                    invalid ? 'is-invalid' : ''
                  }`}
                  aria-pressed={pendingLeft === item.id}
                  disabled={disabled || locked}
                  onClick={() => pickLeft(item.id)}
                >
                  <span className="matchpairs__index" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="matchpairs__text">
                    <span className="matchpairs__label">{item.label}</span>
                    {item.detail && <span className="matchpairs__detail">{item.detail}</span>}
                  </span>
                  <span className="matchpairs__status">
                    {matched
                      ? `→ ${right.find((r) => r.id === matched)?.label ?? ''}`
                      : pendingLeft === item.id
                        ? 'pick a role…'
                        : 'unmatched'}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="matchpairs__col">
        <h3 className="matchpairs__heading">{rightLabel}</h3>
        <ul>
          {right.map((item) => {
            const order = orderOf(item.id);
            const used = order !== null;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`matchpairs__node matchpairs__right ${used ? 'is-used' : ''} ${
                    pendingLeft ? 'is-targetable' : ''
                  }`}
                  disabled={disabled}
                  onClick={() => pickRight(item.id)}
                >
                  {used && (
                    <span className="matchpairs__index" aria-hidden="true">
                      {order}
                    </span>
                  )}
                  <span className="matchpairs__text">
                    <span className="matchpairs__label">{item.label}</span>
                    {item.detail && <span className="matchpairs__detail">{item.detail}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
