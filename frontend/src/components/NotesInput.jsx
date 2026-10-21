import { useState } from 'react';
import { Send, Lightbulb, X } from 'lucide-react';

const EXAMPLE_INPUTS = [
  {
    label: 'Student chaos',
    text: `I need to finish my DBMS assignment by Thursday, revise graphs for tomorrow's test, email the professor tomorrow morning about the project extension, buy groceries this weekend, and check my internship application status next Monday.`,
  },
  {
    label: 'Work sprint',
    text: `Submit Q3 report to Sarah today. Review pull requests before EOD. Set up the staging server — it's been delayed two weeks. Call the client Tuesday morning. Update the Jira board. Renew the SSL cert before it expires next Friday.`,
  },
  {
    label: 'Life admin',
    text: `Pay electricity bill before the 25th or there's a late fee. Book dentist appointment sometime soon. Call mom on Sunday. Return the Amazon package, deadline is tomorrow. Finish reading the book I borrowed from Jake. Start meal prepping for next week.`,
  },
];

/**
 * NotesInput - The hero textarea where users paste their unstructured notes.
 */
export default function NotesInput({ onSubmit, isLoading }) {
  const [notes, setNotes] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX = 5000;
  const MIN = 10;

  function handleChange(e) {
    const val = e.target.value;
    if (val.length <= MAX) {
      setNotes(val);
      setCharCount(val.length);
    }
  }

  function handleExample(text) {
    setNotes(text);
    setCharCount(text.length);
  }

  function handleClear() {
    setNotes('');
    setCharCount(0);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!notes.trim() || notes.trim().length < MIN || isLoading) return;
    onSubmit(notes.trim());
  }

  const isValid = notes.trim().length >= MIN;
  const isNearLimit = charCount > MAX * 0.8;

  return (
    <section style={{ padding: '0 0 32px' }} aria-label="Notes input area">
      <form onSubmit={handleSubmit}>
        {/* Label row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px',
          }}
        >
          <label
            htmlFor="notes-input"
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            Your Notes
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {notes && (
              <button
                type="button"
                onClick={handleClear}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px' }}
                aria-label="Clear notes"
              >
                <X size={12} /> Clear
              </button>
            )}
            <span
              style={{
                fontSize: '12px',
                color: isNearLimit ? '#F59E0B' : 'var(--color-text-muted)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {charCount}/{MAX}
            </span>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          id="notes-input"
          className="lazydesk-textarea"
          value={notes}
          onChange={handleChange}
          placeholder="Paste anything — meeting notes, brain dumps, reminders, scattered thoughts. LazyDesk AI will extract and organize your tasks automatically."
          disabled={isLoading}
          aria-describedby="notes-hint"
          rows={7}
        />

        <p
          id="notes-hint"
          style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '6px' }}
        >
          Notes are processed by a local AI model and never sent to external servers.
        </p>

        {/* Example buttons */}
        <div style={{ marginTop: '14px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '12px',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Lightbulb size={13} color="#FCA311" />
            Try an example:
          </span>
          {EXAMPLE_INPUTS.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => handleExample(ex.text)}
              className="filter-pill"
              disabled={isLoading}
              aria-label={`Load "${ex.label}" example`}
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Submit button */}
        <div style={{ marginTop: '20px' }}>
          <button
            id="organize-btn"
            type="submit"
            className="btn-primary"
            disabled={!isValid || isLoading}
            style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: '16px' }}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading-dots" aria-hidden="true">
                  <span /><span /><span />
                </span>
                Organizing your tasks…
              </>
            ) : (
              <>
                <Send size={18} />
                Organize My Tasks
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
