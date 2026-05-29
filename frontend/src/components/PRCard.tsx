import { Link } from 'react-router-dom';
import type { ReviewSummary } from '../hooks/useReviews';

const badgeColors: Record<string, string> = {
  LGTM: '#22c55e',
  NEEDS_CHANGES: '#f59e0b',
  CRITICAL_ISSUES: '#ef4444',
};

export function PRCard({ review }: { review: ReviewSummary }) {
  const badge = review.overallAssessment;
  const color = badge ? badgeColors[badge] ?? '#888' : '#888';

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={{ ...styles.badge, background: color }}>
          {badge ?? review.status.toUpperCase()}
        </span>
        <span style={styles.repo}>{review.pr?.repoFullName}</span>
      </div>
      <div style={styles.title}>
        <Link to={`/reviews/${review.id}`} style={styles.link}>
          #{review.pr?.number} — {review.pr?.title ?? '(untitled)'}
        </Link>
      </div>
      <div style={styles.meta}>
        <span>by {review.pr?.author}</span>
        <span>commit {review.commitSha}</span>
        {review.durationMs && <span>{(review.durationMs / 1000).toFixed(1)}s</span>}
        <span>{new Date(review.createdAt).toLocaleString()}</span>
        {review.pr?.htmlUrl && (
          <a href={review.pr.htmlUrl} target="_blank" rel="noreferrer" style={styles.ghLink}>
            View on GitHub
          </a>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: { background: '#16213e', borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: '3px solid #e94560' },
  header: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  badge: { color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 },
  repo: { color: '#888', fontSize: 12 },
  title: { marginBottom: 8 },
  link: { color: '#e2e8f0', fontWeight: 600, textDecoration: 'none', fontSize: 15 },
  meta: { display: 'flex', gap: 16, color: '#888', fontSize: 12 },
  ghLink: { color: '#6366f1', textDecoration: 'none' },
};
