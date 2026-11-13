import Icon from './Icon';

export default function DataSourceBadge({ isSimulated, label, size = 'sm' }) {
  if (label) {
    return (
      <span className={`data-badge data-badge-live ${size}`}>
        <Icon name="sparkle" size={size === 'sm' ? 11 : 13} />
        <span>{label}</span>
      </span>
    );
  }

  return (
    <span
      className={`data-badge data-badge-live ${size}`}
      title="Verified live price extracted from store page"
    >
      <Icon name="check" size={size === 'sm' ? 11 : 13} />
      <span>LIVE</span>
    </span>
  );
}
