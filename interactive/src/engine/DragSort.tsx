import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import './DragSort.css';

export interface DragSortItem {
  id: string;
  label: string;
  detail?: string;
}

export interface DragSortBucket {
  id: string;
  label: string;
  hint?: string;
}

export interface DragSortProps {
  items: DragSortItem[];
  buckets: DragSortBucket[];
  /** itemId -> bucketId | null (unplaced). Fully controlled by the parent day. */
  assignments: Record<string, string | null>;
  onAssign: (itemId: string, bucketId: string | null) => void;
  /** Item ids flagged wrong after a Check; shown with danger styling. */
  invalidIds?: Set<string>;
  /** Item ids confirmed correct after a Check; shown locked/correct. */
  lockedIds?: Set<string>;
  disabled?: boolean;
  /** Optional renderer for the unplaced pool heading. */
  poolLabel?: string;
}

const UNPLACED = '__pool__';

function Card({
  item,
  buckets,
  currentBucket,
  onAssign,
  invalid,
  locked,
  disabled,
}: {
  item: DragSortItem;
  buckets: DragSortBucket[];
  currentBucket: string | null;
  onAssign: (itemId: string, bucketId: string | null) => void;
  invalid: boolean;
  locked: boolean;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: disabled || locked,
  });

  const stateClass = locked ? 'is-locked' : invalid ? 'is-invalid' : '';

  return (
    <div
      ref={setNodeRef}
      className={`dragsort-card ${stateClass} ${isDragging ? 'is-dragging' : ''}`}
    >
      <button
        type="button"
        className="dragsort-card__grip"
        aria-label={`Drag ${item.label}`}
        {...listeners}
        {...attributes}
        disabled={disabled || locked}
      >
        <span className="dragsort-card__crate" aria-hidden="true" />
      </button>
      <div className="dragsort-card__body">
        <span className="dragsort-card__label">{item.label}</span>
        {item.detail && <span className="dragsort-card__detail">{item.detail}</span>}
        {!locked && (
          <div className="dragsort-card__actions" role="group" aria-label={`Send ${item.label} to`}>
            {buckets.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`dragsort-chip ${currentBucket === b.id ? 'is-active' : ''}`}
                aria-pressed={currentBucket === b.id}
                disabled={disabled}
                onClick={() => onAssign(item.id, currentBucket === b.id ? null : b.id)}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Bucket({
  bucket,
  children,
  count,
}: {
  bucket: DragSortBucket;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucket.id });
  return (
    <section
      ref={setNodeRef}
      className={`dragsort-bucket ${isOver ? 'is-over' : ''}`}
      aria-label={`${bucket.label} (${count} item${count === 1 ? '' : 's'})`}
    >
      <header className="dragsort-bucket__head">
        <h3>{bucket.label}</h3>
        {bucket.hint && <p>{bucket.hint}</p>}
      </header>
      <div className="dragsort-bucket__slots">{children}</div>
    </section>
  );
}

export function DragSort({
  items,
  buckets,
  assignments,
  onAssign,
  invalidIds,
  lockedIds,
  disabled = false,
  poolLabel = 'Cargo waiting on the dock',
}: DragSortProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const byId = (id: string) => items.find((i) => i.id === id);

  function handleStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function handleEnd(e: DragEndEvent) {
    setActiveId(null);
    const itemId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    onAssign(itemId, overId === UNPLACED ? null : overId);
  }

  const pool = items.filter((i) => !assignments[i.id]);
  const { setNodeRef: poolRef, isOver: poolOver } = useDroppable({ id: UNPLACED });

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="dragsort">
        <div className="dragsort-buckets">
          {buckets.map((bucket) => {
            const placed = items.filter((i) => assignments[i.id] === bucket.id);
            return (
              <Bucket key={bucket.id} bucket={bucket} count={placed.length}>
                {placed.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    buckets={buckets}
                    currentBucket={bucket.id}
                    onAssign={onAssign}
                    invalid={invalidIds?.has(item.id) ?? false}
                    locked={lockedIds?.has(item.id) ?? false}
                    disabled={disabled}
                  />
                ))}
                {placed.length === 0 && <p className="dragsort-bucket__empty">Drop cargo here</p>}
              </Bucket>
            );
          })}
        </div>

        <div
          ref={poolRef}
          className={`dragsort-pool ${poolOver ? 'is-over' : ''}`}
          aria-label={poolLabel}
        >
          <header className="dragsort-pool__head">
            <h3>{poolLabel}</h3>
          </header>
          <div className="dragsort-pool__slots">
            {pool.map((item) => (
              <Card
                key={item.id}
                item={item}
                buckets={buckets}
                currentBucket={null}
                onAssign={onAssign}
                invalid={invalidIds?.has(item.id) ?? false}
                locked={false}
                disabled={disabled}
              />
            ))}
            {pool.length === 0 && <p className="dragsort-pool__empty">All cargo assigned.</p>}
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeId ? (
          <div className="dragsort-card is-overlay">
            <span className="dragsort-card__crate" aria-hidden="true" />
            <span className="dragsort-card__label">{byId(activeId)?.label}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
