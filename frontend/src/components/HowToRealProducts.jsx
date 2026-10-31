import { useState } from 'react';
import Icon from './Icon';

export default function HowToRealProducts() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card help-card">
      <button type="button" className="help-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <Icon name="info" size={16} />
        How to track and compare the same product on both stores
        <Icon name={open ? 'arrowUp' : 'arrowDown'} size={14} className="help-caret" />
      </button>
      {open && (
        <ol className="help-steps">
          <li>Open the <strong>same item</strong> on Amazon.in and Flipkart (a product page, not search results).</li>
          <li>Use <strong>Track New Product</strong> twice, once per store.</li>
          <li>Give both the <strong>same group name</strong>, for example <code>boAt Rockerz 450</code>.</li>
          <li>Press <strong>Refresh all prices</strong>. If a store blocks the fetch, that product shows a failed-refresh notice.</li>
          <li>Open <strong>Compare</strong> and pick the group.</li>
        </ol>
      )}
    </div>
  );
}
