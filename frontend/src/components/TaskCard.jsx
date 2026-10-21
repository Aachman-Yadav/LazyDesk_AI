import { useState } from 'react';
import { Calendar, AlertTriangle, Edit3, Check, X } from 'lucide-react';
import { PriorityBadge, CategoryBadge } from './PriorityBadge';

/**
 * TaskCard - A single task displayed as an interactive card.
 * Supports inline editing of title and description, completion toggle,
 * priority display, deadline labels, and delete.
 */
export default function TaskCard({ task, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDesc, setEditDesc] = useState(task.description || '');

  function handleCompletionToggle() {
    onUpdate(task.id, { completed: !task.completed });
  }

  function handleEditSave() {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) return; // don't allow blank title
    onUpdate(task.id, {
      title: trimmedTitle,
      description: editDesc.trim(),
    });
    setIsEditing(false);
  }

  function handleEditCancel() {
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    }
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  }

  const borderColor =
    task.priority === 'high'
      ? 'rgba(239,68,68,0.4)'
      : task.priority === 'low'
      ? 'rgba(34,197,94,0.3)'
      : 'rgba(252,163,17,0.2)';

  return (
    <article
      className={`task-card-wrapper glass-card animate-fade-in ${task.completed ? 'task-completed' : ''}`}
      style={{
        padding: '20px 22px',
        borderLeft: `3px solid ${task.completed ? 'rgba(34,197,94,0.4)' : borderColor}`,
        opacity: task.completed ? 0.7 : 1,
        transition: 'opacity 250ms ease, border-color 250ms ease',
      }}
      aria-label={`Task: ${task.title}`}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        {/* Completion checkbox */}
        <div style={{ paddingTop: '2px', flexShrink: 0 }}>
          <input
            type="checkbox"
            id={`task-done-${task.id}`}
            className="custom-checkbox"
            checked={task.completed}
            onChange={handleCompletionToggle}
            aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title row */}
          {isEditing ? (
            <input
              className="task-input task-title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '6px',
                width: '100%',
              }}
              aria-label="Edit task title"
              maxLength={200}
            />
          ) : (
            <p
              className="task-title"
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: task.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                marginBottom: '6px',
                textDecoration: task.completed ? 'line-through' : 'none',
                wordBreak: 'break-word',
              }}
            >
              {task.title}
            </p>
          )}

          {/* Description */}
          {isEditing ? (
            <textarea
              className="task-input"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Add a description…"
              style={{
                fontSize: '13px',
                color: 'var(--color-text-secondary)',
                resize: 'none',
                width: '100%',
                marginBottom: '10px',
              }}
              aria-label="Edit task description"
              maxLength={500}
            />
          ) : (
            task.description && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: '10px',
                  wordBreak: 'break-word',
                }}
              >
                {task.description}
              </p>
            )
          )}

          {/* Badges row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              alignItems: 'center',
              marginBottom: isEditing ? '10px' : '0',
            }}
          >
            <PriorityBadge priority={task.priority} />
            <CategoryBadge category={task.category} />

            {/* Deadline */}
            {task.deadline && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  color: task.deadline_uncertain ? '#F59E0B' : 'var(--color-text-muted)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '20px',
                  padding: '2px 8px',
                }}
              >
                {task.deadline_uncertain ? (
                  <AlertTriangle size={11} color="#F59E0B" />
                ) : (
                  <Calendar size={11} />
                )}
                {task.deadline}
                {task.deadline_uncertain && (
                  <span style={{ color: '#F59E0B', marginLeft: '2px' }}>?</span>
                )}
              </span>
            )}
          </div>

          {/* Edit action buttons */}
          {isEditing && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={handleEditSave}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 12px' }}
                aria-label="Save edits"
              >
                <Check size={13} /> Save
              </button>
              <button
                onClick={handleEditCancel}
                className="btn-secondary"
                style={{ fontSize: '12px', padding: '5px 12px' }}
                aria-label="Cancel editing"
              >
                <X size={13} /> Cancel
              </button>
            </div>
          )}
        </div>

        {/* Action buttons (right side) */}
        {!isEditing && (
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
              style={{ padding: '6px 8px' }}
              aria-label={`Edit task: ${task.title}`}
              title="Edit task"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="btn-secondary"
              style={{ padding: '6px 8px' }}
              aria-label={`Delete task: ${task.title}`}
              title="Delete task"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
