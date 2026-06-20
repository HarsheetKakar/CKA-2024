import { useState } from 'react';
import { ArrowDown, ArrowLeftToLine, ArrowRightToLine, ArrowUp, Plus, X } from 'lucide-react';
import './YamlBuilder.css';

export interface YamlFragment {
  id: string;
  /** The literal text placed on the line, e.g. "kind: Pod". */
  text: string;
}

export interface YamlLine {
  fragmentId: string;
  /** Indent depth in units (each unit = `indentUnit` spaces). */
  indent: number;
}

export interface InsertResult {
  ok: boolean;
  reason?: string;
}

export interface YamlBuilderProps {
  /** Tiles available to place, including decoys. */
  fragments: YamlFragment[];
  /** Controlled assembled manifest. */
  lines: YamlLine[];
  onChange: (lines: YamlLine[]) => void;
  /**
   * Day-owned validation for a candidate fragment. Return ok:false with a reason
   * to reject decoys/malformed tiles inline (no star logic here — the day counts).
   */
  onAttemptInsert?: (fragmentId: string) => InsertResult;
  /** Allow the same fragment to be placed more than once. Default false. */
  allowReuse?: boolean;
  indentUnit?: number;
  maxIndent?: number;
  locked?: boolean;
  disabled?: boolean;
}

export function YamlBuilder({
  fragments,
  lines,
  onChange,
  onAttemptInsert,
  allowReuse = false,
  indentUnit = 2,
  maxIndent = 4,
  locked = false,
  disabled = false,
}: YamlBuilderProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [rejection, setRejection] = useState<string | null>(null);

  const usedIds = new Set(lines.map((l) => l.fragmentId));
  const pool = fragments.filter((f) => allowReuse || !usedIds.has(f.id));
  const fragText = (id: string) => fragments.find((f) => f.id === id)?.text ?? '';

  function insert(fragmentId: string) {
    if (disabled || locked) return;
    const verdict = onAttemptInsert?.(fragmentId) ?? { ok: true };
    if (!verdict.ok) {
      setRejection(verdict.reason ?? 'That tile does not belong in this manifest.');
      return;
    }
    setRejection(null);
    const indent = lines.length > 0 ? lines[lines.length - 1].indent : 0;
    onChange([...lines, { fragmentId, indent }]);
    setSelected(null);
  }

  function update(idx: number, patch: Partial<YamlLine>) {
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  }
  function remove(idx: number) {
    onChange(lines.filter((_, i) => i !== idx));
  }
  function move(idx: number, to: number) {
    if (to < 0 || to >= lines.length) return;
    const next = [...lines];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  const preview =
    lines.length === 0
      ? '# manifest is empty'
      : lines.map((l) => ' '.repeat(l.indent * indentUnit) + fragText(l.fragmentId)).join('\n');

  return (
    <div className="yamlb">
      <div className="yamlb__pool" aria-label="Available manifest fragments">
        {pool.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`yamlb__tile ${selected === f.id ? 'is-selected' : ''}`}
            aria-pressed={selected === f.id}
            disabled={disabled || locked}
            onClick={() => setSelected((cur) => (cur === f.id ? null : f.id))}
            onDoubleClick={() => insert(f.id)}
          >
            <code>{f.text}</code>
          </button>
        ))}
        {pool.length === 0 && <p className="yamlb__pool-empty">All fragments placed.</p>}
      </div>

      <div className="yamlb__insertbar">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={disabled || locked || !selected}
          onClick={() => selected && insert(selected)}
        >
          <Plus size={15} aria-hidden="true" /> Insert fragment
        </button>
        <span className="yamlb__hint">Select a tile, then insert — or double-click it.</span>
      </div>

      <p className="yamlb__rejection" role="status" aria-live="polite">
        {rejection}
      </p>

      <ol className="yamlb__lines" aria-label="Assembled manifest">
        {lines.map((line, idx) => (
          <li key={`${line.fragmentId}-${idx}`} className="yamlb__line">
            <span className="yamlb__rail" aria-hidden="true" style={{ width: line.indent * 16 }} />
            <code className="yamlb__line-text">{fragText(line.fragmentId)}</code>
            {!locked && (
              <span className="yamlb__line-actions">
                <button
                  type="button"
                  aria-label="Outdent line"
                  disabled={disabled || line.indent === 0}
                  onClick={() => update(idx, { indent: Math.max(0, line.indent - 1) })}
                >
                  <ArrowLeftToLine size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Indent line"
                  disabled={disabled || line.indent >= maxIndent}
                  onClick={() => update(idx, { indent: Math.min(maxIndent, line.indent + 1) })}
                >
                  <ArrowRightToLine size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Move line up"
                  disabled={disabled || idx === 0}
                  onClick={() => move(idx, idx - 1)}
                >
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Move line down"
                  disabled={disabled || idx === lines.length - 1}
                  onClick={() => move(idx, idx + 1)}
                >
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Remove line"
                  disabled={disabled}
                  onClick={() => remove(idx)}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </span>
            )}
          </li>
        ))}
        {lines.length === 0 && (
          <li className="yamlb__line-empty">Insert fragments to build the manifest.</li>
        )}
      </ol>

      <figure className="yamlb__preview">
        <figcaption>shipping manifest</figcaption>
        <pre>
          <code>{preview}</code>
        </pre>
      </figure>
    </div>
  );
}
