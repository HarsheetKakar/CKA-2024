import { Star } from 'lucide-react';
import './StarRating.css';

export interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  label?: string;
}

export function StarRating({ value, max = 5, size = 18, label }: StarRatingProps) {
  return (
    <span
      className="starrating"
      role="img"
      aria-label={label ?? `${value} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          aria-hidden="true"
          className={i < value ? 'starrating__star is-filled' : 'starrating__star'}
          fill={i < value ? 'currentColor' : 'none'}
        />
      ))}
    </span>
  );
}
