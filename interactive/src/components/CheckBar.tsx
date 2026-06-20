import type { ReactNode } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import './CheckBar.css';

export type CheckTone = 'idle' | 'error' | 'success';

export interface CheckBarProps {
  onCheck: () => void;
  onReset?: () => void;
  checkLabel?: string;
  checkDisabled?: boolean;
  tone?: CheckTone;
  message?: string;
  children?: ReactNode;
}

export function CheckBar({
  onCheck,
  onReset,
  checkLabel = 'Check',
  checkDisabled = false,
  tone = 'idle',
  message,
  children,
}: CheckBarProps) {
  return (
    <div className="checkbar">
      <p className={`checkbar__status checkbar__status--${tone}`} role="status" aria-live="polite">
        {tone === 'success' && <CheckCircle2 size={16} aria-hidden="true" />}
        {tone === 'error' && <XCircle size={16} aria-hidden="true" />}
        {message}
      </p>
      <div className="checkbar__actions">
        {children}
        {onReset && (
          <button type="button" className="btn btn--ghost" onClick={onReset}>
            <RotateCcw size={15} aria-hidden="true" /> Reset
          </button>
        )}
        <button
          type="button"
          className="btn btn--primary"
          onClick={onCheck}
          disabled={checkDisabled}
        >
          {checkLabel}
        </button>
      </div>
    </div>
  );
}
