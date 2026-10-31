import { platformLabel } from '../lib/format';

export default function PlatformBadge({ platform }) {
  const key = String(platform || '').toLowerCase();
  return (
    <span className={`platform-badge platform-${key}`}>
      <span className="dot" />
      {platformLabel(key)}
    </span>
  );
}
