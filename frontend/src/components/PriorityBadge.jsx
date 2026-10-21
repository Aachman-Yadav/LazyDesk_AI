import { Zap, Shield } from 'lucide-react';

/**
 * PriorityBadge - Visual indicator for task priority level.
 * Sizes: 'sm' | 'md'
 */
export function PriorityBadge({ priority, size = 'sm' }) {
  const labels = { high: 'High', medium: 'Medium', low: 'Low' };
  const icons = { high: '🔴', medium: '🟡', low: '🟢' };
  const classes = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  const paddingClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${paddingClass} ${classes[priority] || classes.medium}`}
      aria-label={`Priority: ${labels[priority] || priority}`}
    >
      <span aria-hidden="true" style={{ fontSize: '9px' }}>{icons[priority]}</span>
      {labels[priority] || priority}
    </span>
  );
}

/**
 * CategoryBadge - Category label chip.
 */
export function CategoryBadge({ category }) {
  return (
    <span className="category-badge inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
      {category}
    </span>
  );
}
