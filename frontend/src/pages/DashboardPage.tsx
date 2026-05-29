import { useState } from 'react';
import { useReviews, useReviewStats } from '../hooks/useReviews';
import { PRCard } from '../components/PRCard';
import { InstallButton } from '../components/InstallButton';
import { AnalyticsChart } from '../components/AnalyticsChart';

export function DashboardPage() {
  const [offset, setOffset] = useState(0);
  const limit = 20;
  const { data: reviews, isLoading, isError } = useReviews(limit, offset);
  const { data: stats } = useReviewStats();

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <h2 style={styles.heading}>PR Reviews</h2>
        <InstallButton />
      </div>

      {stats && <AnalyticsChart stats={stats} />}

      {isLoading && <p style={styles.status}>Loading reviews…</p>}
      {isError && <p style={styles.error}>Failed to load reviews.</p>}

      {reviews && reviews.length === 0 && (
        <div style={styles.empty}>
          <p>No reviews yet. Install the GitHub App on a repo and open a pull request.</p>
        </div>
      )}

      {reviews?.map((review) => (
        <PRCard key={review.id} review={review} />
      ))}

      {reviews && reviews.length === limit && (
        <div style={styles.pagination}>
          <button onClick={() => setOffset((o) => Math.max(0, o - limit))} disabled={offset === 0} style={styles.pgBtn}>
            Previous
          </button>
          <button onClick={() => setOffset((o) => o + limit)} style={styles.pgBtn}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { maxWidth: 800, margin: '0 auto', padding: 24 },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  heading: { color: '#e2e8f0', fontSize: 22, fontWeight: 700, margin: 0 },
  status: { color: '#94a3b8' },
  error: { color: '#f87171' },
  empty: { background: '#16213e', borderRadius: 8, padding: 32, textAlign: 'center', color: '#94a3b8' },
  pagination: { display: 'flex', gap: 12, marginTop: 16 },
  pgBtn: { background: '#334155', color: '#e2e8f0', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer' },
};
