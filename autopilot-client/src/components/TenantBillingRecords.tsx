import React from 'react';
import { paymentsApi } from '@/lib/api';

interface BillingRecord {
  id: string;
  status: string | null;
  amount: string | null;
  currency: string | null;
  method: 'mobile_money';
  plan: string | null;
  createdAt: string;
}

export function TenantBillingRecords({ tenantId }: { tenantId: string }) {
  const [records, setRecords] = React.useState<BillingRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    paymentsApi.listDeposits(tenantId)
      .then(setRecords)
      .catch(() => setError('Failed to load billing records.'))
      .finally(() => setLoading(false));
  }, [tenantId]);

  if (!tenantId) return <div>Tenant ID required.</div>;
  if (loading) return <div>Loading billing records...</div>;
  if (error) return <div>{error}</div>;
  if (!records.length) return <div>No billing records found.</div>;

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Billing Records</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Date</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.createdAt).toLocaleString()}</td>
              <td>{r.plan ?? '-'}</td>
              <td>{r.status ?? '-'}</td>
              <td>{r.amount ? `${r.currency ?? 'ZMW'} ${r.amount}` : '-'}</td>
              <td>Mobile Money</td>
              <td style={{ fontSize: 12 }}>{r.id}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
