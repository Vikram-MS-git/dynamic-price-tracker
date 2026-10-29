export default function DashboardStats({ products, groupsCount }) {
  const withPrice = products.filter((p) => p.latest_price != null).length;
  const failed = products.filter((p) => p.last_scrape_error).length;
  const platforms = new Set(products.map((p) => p.platform)).size;

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <span className="stat-emoji">📦</span>
        <span className="stat-value">{products.length}</span>
        <span className="stat-label">Products tracked</span>
      </div>
      <div className="stat-card">
        <span className="stat-emoji">⚖️</span>
        <span className="stat-value">{groupsCount ?? '—'}</span>
        <span className="stat-label">Compare groups</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{withPrice}</span>
        <span className="stat-label">With price data</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{platforms}</span>
        <span className="stat-label">Platforms</span>
      </div>
      {failed > 0 && (
        <div className="stat-card stat-warn">
          <span className="stat-value">{failed}</span>
          <span className="stat-label">Scrape failures</span>
        </div>
      )}
    </div>
  );
}
