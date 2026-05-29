interface Bug {
  severity: string;
  file: string;
  line_range: string;
  description: string;
  suggestion: string;
}

interface SecurityIssue extends Bug {
  owasp_category: string;
}

interface Suggestion extends Bug {
  type: string;
}

interface Props {
  bugs: Bug[];
  securityIssues: SecurityIssue[];
  suggestions: Suggestion[];
  reviewMarkdown: string;
}

const severityColor: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#6366f1',
};

function IssueItem({ item, extraLabel }: { item: Bug; extraLabel?: string }) {
  return (
    <div style={styles.issueItem}>
      <div style={styles.issueHeader}>
        <span style={{ ...styles.severityBadge, background: severityColor[item.severity] ?? '#888' }}>
          {item.severity}
        </span>
        {extraLabel && <span style={styles.typeLabel}>{extraLabel}</span>}
        <code style={styles.fileRef}>{item.file} :{item.line_range}</code>
      </div>
      <p style={styles.issueDesc}>{item.description}</p>
      <p style={styles.issueSuggest}><strong>Fix:</strong> {item.suggestion}</p>
    </div>
  );
}

export function ReviewPanel({ bugs, securityIssues, suggestions, reviewMarkdown }: Props) {
  return (
    <div>
      {bugs.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Bugs ({bugs.length})</h3>
          {bugs.map((b, i) => <IssueItem key={i} item={b} />)}
        </section>
      )}

      {securityIssues.length > 0 && (
        <section style={styles.section}>
          <h3 style={{ ...styles.sectionTitle, color: '#ef4444' }}>
            Security Issues ({securityIssues.length})
          </h3>
          {securityIssues.map((s, i) => (
            <IssueItem key={i} item={s} extraLabel={s.owasp_category} />
          ))}
        </section>
      )}

      {suggestions.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Suggestions ({suggestions.length})</h3>
          {suggestions.map((s, i) => <IssueItem key={i} item={s} extraLabel={s.type} />)}
        </section>
      )}

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Full Review</h3>
        <pre style={styles.markdown}>{reviewMarkdown}</pre>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  section: { marginBottom: 24 },
  sectionTitle: { color: '#e2e8f0', fontSize: 16, marginBottom: 12, borderBottom: '1px solid #2d3748', paddingBottom: 6 },
  issueItem: { background: '#16213e', borderRadius: 8, padding: 12, marginBottom: 8 },
  issueHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  severityBadge: { color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' },
  typeLabel: { color: '#888', fontSize: 11 },
  fileRef: { color: '#93c5fd', fontSize: 12, background: '#0f172a', padding: '2px 6px', borderRadius: 4 },
  issueDesc: { color: '#e2e8f0', fontSize: 13, margin: '4px 0' },
  issueSuggest: { color: '#94a3b8', fontSize: 13, margin: 0 },
  markdown: { background: '#0f172a', color: '#e2e8f0', padding: 16, borderRadius: 8, fontSize: 13, overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};
