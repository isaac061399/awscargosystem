'use client';

import { useEffect } from 'react';

const Ticket = ({
  ticket
}: {
  ticket: { id: string; createdAt: string; items: { name: string; qty: number; price: number }[] };
}) => {
  // Auto print
  useEffect(() => {
    // small delay helps fonts/layout settle
    const t = window.setTimeout(() => window.print(), 150);

    return () => window.clearTimeout(t);
  }, []);

  const total = ticket.items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <div className="print-ticket">
      <div className="wrap">
        <div className="no-print" style={{ marginBottom: 12 }}>
          <button onClick={() => window.print()} style={{ padding: '8px 12px' }}>
            Print ticket #{ticket.id}
          </button>
        </div>

        <div className="title">My Store</div>
        <div className="muted">Ticket: {ticket.id}</div>
        <div className="muted">Date: {new Date(ticket.createdAt).toLocaleString()}</div>

        <hr />

        {ticket.items.map((it, idx) => (
          <div key={idx} className="row" style={{ marginBottom: 4 }}>
            <div>
              {it.qty} × {it.name}
            </div>
            <div>${(it.qty * it.price).toFixed(2)}</div>
          </div>
        ))}

        <hr />

        <div className="row" style={{ fontWeight: 700 }}>
          <div>Total</div>
          <div>${total.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
