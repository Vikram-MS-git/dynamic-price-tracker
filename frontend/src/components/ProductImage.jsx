import { useState } from 'react';

export default function ProductImage({ src, alt, platform, size = 'md' }) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  const initial = (alt || '?').trim().charAt(0).toUpperCase();

  return (
    <div className={`product-image-wrap ${size}`} data-platform={platform}>
      {showImg ? (
        <img src={src} alt={alt || 'Product'} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      ) : (
        <div className="product-image-fallback" aria-hidden="true">
          {initial}
        </div>
      )}
    </div>
  );
}
