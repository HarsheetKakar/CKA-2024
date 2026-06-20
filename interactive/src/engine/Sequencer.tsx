import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import './Sequencer.css';

export interface SequenceItem {
  id: string;
  label: string;
  detail?: string;
}

export interface SequencerProps {
  items: SequenceItem[];
  /** Current order of item ids. Fully controlled by the parent day. */
  order: string[];
  onReorder: (order: string[]) => void;
  /** Positions (0-based) flagged wrong after a Check. */
  invalidPositions?: Set<number>;
  locked?: boolean;
  disabled?: boolean;
  /** Label for the numbered slots, e.g. "Build step". */
  slotLabel?: string;
}

function Row({
  item,
  index,
  total,
  onMove,
  invalid,
  locked,
  disabled,
  slotLabel,
}: {
  item: SequenceItem;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  invalid: boolean;
  locked: boolean;
  disabled: boolean;
  slotLabel: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: disabled || locked,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`sequencer__row ${invalid ? 'is-invalid' : ''} ${locked ? 'is-locked' : ''} ${
        isDragging ? 'is-dragging' : ''
      }`}
    >
      <span className="sequencer__num" aria-hidden="true">
        {index + 1}
      </span>
      {!locked && (
        <button
          type="button"
          className="sequencer__grip"
          aria-label={`Reorder ${item.label}`}
          {...listeners}
          {...attributes}
          disabled={disabled}
        >
          <GripVertical size={16} aria-hidden="true" />
        </button>
      )}
      <div className="sequencer__body">
        <span className="sequencer__label">{item.label}</span>
        {item.detail && <span className="sequencer__detail">{item.detail}</span>}
      </div>
      {!locked && (
        <div className="sequencer__moves" role="group" aria-label={`Move ${slotLabel} ${index + 1}`}>
          <button
            type="button"
            className="sequencer__move"
            aria-label={`Move ${item.label} up`}
            disabled={disabled || index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            <ArrowUp size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="sequencer__move"
            aria-label={`Move ${item.label} down`}
            disabled={disabled || index === total - 1}
            onClick={() => onMove(index, index + 1)}
          >
            <ArrowDown size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </li>
  );
}

export function Sequencer({
  items,
  order,
  onReorder,
  invalidPositions,
  locked = false,
  disabled = false,
  slotLabel = 'Step',
}: SequencerProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = (id: string) => items.find((i) => i.id === id)!;

  function move(from: number, to: number) {
    if (to < 0 || to >= order.length) return;
    onReorder(arrayMove(order, from, to));
  }

  function handleEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = order.indexOf(String(active.id));
    const to = order.indexOf(String(over.id));
    onReorder(arrayMove(order, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ol className="sequencer">
          {order.map((id, index) => (
            <Row
              key={id}
              item={byId(id)}
              index={index}
              total={order.length}
              onMove={move}
              invalid={invalidPositions?.has(index) ?? false}
              locked={locked}
              disabled={disabled}
              slotLabel={slotLabel}
            />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
