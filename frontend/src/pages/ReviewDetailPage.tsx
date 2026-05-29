import { useParams, Link } from 'react-router-dom';
import { useReview } from '../hooks/useReviews';
import { ReviewPanel } from '../components/ReviewPanel';

export function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: review, isLoading, isError } = useReview(Number(id));

  if (isLoading) return <div style={styles.status}>Loading review…</div>;
  if (isError || !review) return <div style={styles.error}>Review not found.</div>;

  const bugs = (review.bugs_found ?? []) as Parameters<typeof ReviewPanel>[0]['bugs'];
  const securityIssues = (review.security_issues ?? []) as Parameters<typeof ReviewPanel>[0]['securityIssues'];
  const suggestions = (review.suggestions ?? []) as Parameters<typeof ReviewPanel>[0]['suggestions'];

  return (
    <div style={styles.page}>
      <div style={styles.breadcrumb}>
        <Link to="/" style={styles.backLink}>← Back to Dashboard</Link>
      </div>

      <div style={styles.header}>
        <h2 style={styles.heading}>Review #{review.id}</h2>
        <div style={styles.meta}>
          <span>Commit: <code style={styles.code}>{review.commit_sha?.slice(0, 7)}</code></span>
          <span>Status: <strong>{review.status}</strong></span>
          {review.duration_ms && <span>Duration: {(review.duration_ms / 1000).toFixed(1)}s</span>}
          <span>{new Date(review.created_at).toLocaleString()}</span>
        </div>
      </div>

      <ReviewPanel
        bugs={bugs}
        securityIssues={securityIssues}
        suggestions={suggestions}
        reviewMarkdown={review.review_body ?? '(no review body)'}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 860, margin: '0 auto', padding: 24 },
  breadcrumb: { marginBottom: 16 },
  backLink: { color: '#6366f1', textDecoration: 'none', fontSize: 14 },
  header: { marginBottom: 24 },
  heading: { color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: '0 0 8px' },
  meta: { display: 'flex', gap: 20, color: '#94a3b8', fontSize: 13 },
  code: { background: '#0f172a', padding: '2px 6px', borderRadius: 4 },
  status: { color: '#94a3b8', padding: 24 },
  error: { color: '#f87171', padding: 24 },
};
