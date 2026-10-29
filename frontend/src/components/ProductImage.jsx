import { useState } from 'react';

const PLATFORM_EMOJI = { amazon: '🛒', flipkart: '🛍️' };

export default function ProductImage({ src, alt, platform, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;

  return (
    <div className={`product-image-wrap ${size}`} data-platform={platform}>
      {showImg ? (
        <img
          src={src}
          alt={alt || 'Product'}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="product-image-fallback" aria-hidden>
          <span>{PLATFORM_EMOJI[platform] || '📦'}</span>
        </div>
      )}
    </div>
  );
}
