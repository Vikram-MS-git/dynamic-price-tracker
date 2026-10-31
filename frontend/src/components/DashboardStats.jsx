import Icon from './Icon';
import { Skeleton } from './States';
import { formatINR, formatPct } from '../lib/format';

function Kpi({ icon, label, value, sub, tone = 'neutral', loading }) {
  return (
    <div className="kpi">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-icon tone-${tone}`}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton style={{ height: 30, width: '55%', marginTop: 10 }} />
          <Skeleton style={{ height: 12, width: '80%', marginTop: 10 }} />
        </>
      ) : (
        <>
          <div className="kpi-value">{value}</div>
          <div className="kpi-sub">{sub}</div>
        </>
      )}
    </div>
  );
}

export default function DashboardStats({ kpis, loading, insightsLoading }) {
  const k = kpis;
  return (
    <section className="kpi-grid" aria-label="Key metrics">
      <Kpi
        icon="package"
        label="Tracked products"
        loading={loading}
        value={k.total}
        sub={`${k.withPrice} with price data · ${k.platforms} ${k.platforms === 1 ? 'store' : 'stores'}${k.failed ? ` · ${k.failed} failing` : ''}`}
      />
      <Kpi
        icon="arrowDown"
        tone="good"
        label="Price drops"
        loading={loading || insightsLoading}
        value={k.drops}
        sub={k.biggest ? `Biggest: ${formatPct(k.biggest.pct)} on ${k.biggest.name}` : 'No drops in recent readings'}
      />
      <Kpi
        icon="bell"
        tone="accent"
        label="Active alerts"
        loading={loading}
        value={k.alertsActive}
        sub={k.alertsActive ? `${k.alertsReached} target${k.alertsReached === 1 ? '' : 's'} reached` : 'Set a target on a product page'}
      />
      <Kpi
        icon="piggy"
        tone="good"
        label="Potential savings"
        loading={loading}
        value={formatINR(k.savings, { compact: true })}
        sub={
          k.comparedGroups
            ? `By buying from the cheaper store across ${k.comparedGroups} compared ${k.comparedGroups === 1 ? 'product' : 'products'}`
            : 'Track one item on both stores to see savings'
        }
      />
    </section>
  );
}
