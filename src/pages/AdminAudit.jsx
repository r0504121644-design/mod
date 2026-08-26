import React from 'react';
import Layout from '../components/Layout.jsx';
import { useFetch } from '../lib/hooks.js';
import { formatDateTime } from '../lib/format.js';

export default function AdminAudit() {
  const { data: logs, loading } = useFetch('/admin/audit-log');

  return (
    <Layout title="יומן פעילות (Audit Log)" subtitle="מעקב טכני אחר פעולות במערכת">
      <div className="card">
        {loading && <div className="empty-state">טוענת...</div>}
        {!loading && (logs || []).length === 0 && <div className="empty-state">אין פעילות מתועדת</div>}
        {!loading && logs && logs.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>משתמשת</th><th>פעולה</th><th>סוג רשומה</th><th>זמן</th></tr></thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td>{l.user_name || 'מערכת'}</td>
                    <td>{l.action}</td>
                    <td>{l.entity_type}</td>
                    <td>{formatDateTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
