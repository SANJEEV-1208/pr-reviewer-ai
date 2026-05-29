import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { ReviewStats } from '../hooks/useReviews';

const ASSESSMENT_COLORS: Record<string, string> = {
  LGTM: '#22c55e',
  NEEDS_CHANGES: '#f59e0b',
  CRITICAL_ISSUES: '#ef4444',
  Unknown: '#64748b',
};

interface Props {
  stats: ReviewStats;
}

export function AnalyticsChart({ stats }: Props) {
  const pieData = stats.assessmentBreakdown.map((r) => ({
    name: r.assessment ?? 'Unknown',
    value: parseInt(r.count),
  }));

  const barData = stats.dailyActivity.map((r) => ({
    date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    reviews: parseInt(r.count),
  }));

  const total = parseInt(stats.summary.total);
  const completed = parseInt(stats.summary.completed);
  const failed = parseInt(stats.summary.failed);
  const avgDuration = stats.summary.avg_duration_ms
    ? (parseInt(stats.summary.avg_duration_ms) / 1000).toFixed(1)
    : null;

  return (
    <div style={styles.container}>
      <div style={styles.statCards}>
        <div style={styles.card}>
          <div style={styles.cardValue}>{total}</div>
          <div style={styles.cardLabel}>Total Reviews</div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardValue, color: '#22c55e' }}>{completed}</div>
          <div style={styles.cardLabel}>Completed</div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardValue, color: '#ef4444' }}>{failed}</div>
          <div style={styles.cardLabel}>Failed</div>
        </div>
        <div style={styles.card}>
          <div style={{ ...styles.cardValue, color: '#6366f1' }}>
            {avgDuration ? `${avgDuration}s` : '—'}
          </div>
          <div style={styles.cardLabel}>Avg Duration</div>
        </div>
      </div>

      <div style={styles.charts}>
        {barData.length > 0 && (
          <div style={styles.chartBox}>
            <h4 style={styles.chartTitle}>Reviews — Last 7 Days</h4>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 6 }}
                  labelStyle={{ color: '#e2e8f0' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Bar dataKey="reviews" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {pieData.length > 0 && (
          <div style={styles.chartBox}>
            <h4 style={styles.chartTitle}>Assessment Breakdown</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  dataKey="value"
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={ASSESSMENT_COLORS[entry.name] ?? '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 6 }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { marginBottom: 28 },
  statCards: { display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' },
  card: {
    flex: 1,
    minWidth: 100,
    background: '#16213e',
    borderRadius: 8,
    padding: '14px 18px',
    textAlign: 'center',
  },
  cardValue: { fontSize: 28, fontWeight: 700, color: '#e2e8f0' },
  cardLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  charts: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  chartBox: { flex: 1, minWidth: 260, background: '#16213e', borderRadius: 8, padding: 16 },
  chartTitle: { color: '#94a3b8', fontSize: 13, fontWeight: 600, marginBottom: 12, margin: '0 0 12px' },
};
