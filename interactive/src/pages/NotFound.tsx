import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="app-shell" style={{ textAlign: 'center', paddingTop: 'var(--sp-10)' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 'var(--sp-3)' }}>Off the chart</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--sp-5)' }}>
        These waters aren’t on any map.
      </p>
      <Link className="btn btn--primary" to="/">
        Back to the voyage chart
      </Link>
    </main>
  );
}
