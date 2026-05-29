import { useState } from 'react';
import type { Repo } from '../hooks/useRepos';

const FOCUS_OPTIONS = [
  { value: 'security', label: 'Security' },
  { value: 'performance', label: 'Performance' },
  { value: 'test-coverage', label: 'Test Coverage' },
  { value: 'error-handling', label: 'Error Handling' },
  { value: 'design', label: 'Design / Architecture' },
];

interface Props {
  repo: Repo;
  onSave: (repoId: number, focusRules: string[], enabled: boolean) => void;
  isSaving: boolean;
}

export function RepoConfigForm({ repo, onSave, isSaving }: Props) {
  const [focusRules, setFocusRules] = useState<string[]>(repo.focusRules ?? []);
  const [enabled, setEnabled] = useState(repo.enabled);

  function toggleRule(value: string) {
    setFocusRules((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.repoHeader}>
        <strong style={styles.repoName}>{repo.fullName}</strong>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          &nbsp; Reviews enabled
        </label>
      </div>

      <div style={styles.rules}>
        {FOCUS_OPTIONS.map((opt) => (
          <label key={opt.value} style={styles.ruleLabel}>
            <input
              type="checkbox"
              checked={focusRules.includes(opt.value)}
              onChange={() => toggleRule(opt.value)}
            />
            &nbsp; {opt.label}
          </label>
        ))}
      </div>

      <button
        onClick={() => onSave(repo.id, focusRules, enabled)}
        disabled={isSaving}
        style={styles.saveBtn}
      >
        {isSaving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: '#16213e', borderRadius: 8, padding: 16, marginBottom: 12 },
  repoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  repoName: { color: '#e2e8f0', fontSize: 14 },
  toggle: { color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  rules: { display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  ruleLabel: { color: '#94a3b8', fontSize: 13, cursor: 'pointer' },
  saveBtn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, padding: '7px 18px', cursor: 'pointer', fontSize: 13 },
};
