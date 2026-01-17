'use client';

import { useEffect } from 'react';

const Sticker = ({ sticker }: { sticker: { id: string; sku: string; name: string; price: number } }) => {
  // Auto print
  useEffect(() => {
    // small delay helps fonts/layout settle
    const t = window.setTimeout(() => window.print(), 150);

    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="print-sticker">
      <div className="no-print" style={{ padding: 12 }}>
        <button onClick={() => window.print()} style={{ padding: '8px 12px' }}>
          Print sticker #{sticker.id}
        </button>
      </div>

      <div className="label">
        <div className="name">{sticker.name}</div>
        <div className="sku">SKU: {sticker.sku}</div>
        <div className="price">${sticker.price.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default Sticker;
