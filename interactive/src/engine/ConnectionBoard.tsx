import { useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import './ConnectionBoard.css';

export interface ConnectionNode {
  id: string;
  label: string;
  detail?: string;
}

export interface Connection {
  source: string;
  target: string;
}

export interface ConnectionBoardProps {
  sources: ConnectionNode[];
  targets: ConnectionNode[];
  connections: Connection[];
  onConnect: (source: string, target: string) => void;
  onDisconnect: (source: string, target: string) => void;
  /** "source|target" keys flagged wrong after a Check. */
  invalidPairs?: Set<string>;
  /** "source|target" keys confirmed correct after a Check. */
  lockedPairs?: Set<string>;
  disabled?: boolean;
  sourceLabel?: string;
  targetLabel?: string;
}

const key = (s: string, t: string) => `${s}|${t}`;

export function ConnectionBoard({
  sources,
  targets,
  connections,
  onConnect,
  onDisconnect,
  invalidPairs,
  lockedPairs,
  disabled = false,
  sourceLabel = 'Sources',
  targetLabel = 'Targets',
}: ConnectionBoardProps) {
  const [pendingSource, setPendingSource] = useState<string | null>(null);

  const isConnected = (s: string, t: string) =>
    connections.some((c) => c.source === s && c.target === t);
  const targetsOf = (s: string) => connections.filter((c) => c.source === s).map((c) => c.target);
  const sourcesOf = (t: string) => connections.filter((c) => c.target === t).map((c) => c.source);

  function pickSource(id: string) {
    if (disabled) return;
    setPendingSource((cur) => (cur === id ? null : id));
  }
  function pickTarget(id: string) {
    if (disabled || !pendingSource) return;
    if (isConnected(pendingSource, id)) {
      onDisconnect(pendingSource, id);
    } else {
      onConnect(pendingSource, id);
    }
  }

  return (
    <div className="connboard">
      <div className="connboard__grid">
        <div className="connboard__col">
          <h3 className="connboard__heading">{sourceLabel}</h3>
          <ul>
            {sources.map((s) => {
              const conns = targetsOf(s.id);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className={`connboard__node ${pendingSource === s.id ? 'is-pending' : ''} ${
                      conns.length ? 'is-wired' : ''
                    }`}
                    aria-pressed={pendingSource === s.id}
                    disabled={disabled}
                    onClick={() => pickSource(s.id)}
                  >
                    <span className="connboard__dot" aria-hidden="true" />
                    <span className="connboard__text">
                      <span className="connboard__label">{s.label}</span>
                      {s.detail && <span className="connboard__detail">{s.detail}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="connboard__col">
          <h3 className="connboard__heading">{targetLabel}</h3>
          <ul>
            {targets.map((t) => {
              const wiredFrom = sourcesOf(t.id);
              const targetable = pendingSource !== null;
              const live = pendingSource ? isConnected(pendingSource, t.id) : false;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    className={`connboard__node connboard__target ${
                      targetable ? 'is-targetable' : ''
                    } ${wiredFrom.length ? 'is-wired' : ''} ${live ? 'is-live' : ''}`}
                    disabled={disabled || !targetable}
                    onClick={() => pickTarget(t.id)}
                  >
                    <span className="connboard__text">
                      <span className="connboard__label">{t.label}</span>
                      {t.detail && <span className="connboard__detail">{t.detail}</span>}
                    </span>
                    <span className="connboard__dot" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="connboard__cables" aria-label="Active connections">
        <h3 className="connboard__heading">
          <Link2 size={14} aria-hidden="true" /> Cables run
        </h3>
        {connections.length === 0 ? (
          <p className="connboard__empty">
            {pendingSource
              ? 'Now choose a target to run a cable.'
              : 'Select a source, then a target to connect them.'}
          </p>
        ) : (
          <ul className="connboard__cable-list">
            {connections.map((c) => {
              const k = key(c.source, c.target);
              const cls = invalidPairs?.has(k)
                ? 'is-invalid'
                : lockedPairs?.has(k)
                  ? 'is-locked'
                  : '';
              const sLabel = sources.find((s) => s.id === c.source)?.label ?? c.source;
              const tLabel = targets.find((t) => t.id === c.target)?.label ?? c.target;
              return (
                <li key={k} className={`connboard__cable ${cls}`}>
                  <span>
                    <strong>{sLabel}</strong> ⇄ <strong>{tLabel}</strong>
                  </span>
                  {!lockedPairs?.has(k) && (
                    <button
                      type="button"
                      aria-label={`Disconnect ${sLabel} from ${tLabel}`}
                      disabled={disabled}
                      onClick={() => onDisconnect(c.source, c.target)}
                    >
                      <Unlink size={13} aria-hidden="true" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
