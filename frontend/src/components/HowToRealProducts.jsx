import { useState } from 'react';

export default function HowToRealProducts() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card help-card">
      <button
        type="button"
        className="help-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? '▼' : '▶'} How to track & compare real products
      </button>
      {open && (
        <ol className="help-steps">
          <li>
            Open the <strong>same item</strong> on Amazon.in and Flipkart (product page, not search).
          </li>
          <li>
            Add it <strong>twice</strong> in the form below — once per platform.
          </li>
          <li>
            Use the <strong>same Group name</strong> for both (e.g. <code>boAt Rockerz 450</code>).
          </li>
          <li>
            Click <strong>Refresh all prices</strong>. If scrape fails, sites may block bots — demo seed
            data still works for charts.
          </li>
          <li>
            Open <strong>Compare (RQ1)</strong> in the menu and pick your group.
          </li>
        </ol>
      )}
    </div>
  );
}
