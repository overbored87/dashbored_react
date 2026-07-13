import React, { useState, useEffect } from 'react';

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const SentinelWidget = ({ supabase, refreshKey = 0 }) => {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('dashboard_entries')
          .select('created_at, data')
          .eq('category', 'sentinel')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        if (!error && data) {
          const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
          setSnapshot({ captured_at: data.created_at, services: parsed.services || [] });
        }
      } catch (e) {
        console.log('SentinelWidget load error:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [supabase, refreshKey]);

  const services = snapshot?.services || [];

  const cellStyle = {
    padding: '10px 12px',
    fontSize: '13px',
    fontFamily: 'Space Mono, monospace',
    borderBottom: '1px solid #2a2a2a',
    color: '#ccc',
  };

  const headStyle = {
    ...cellStyle,
    color: '#555',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    borderBottom: '1px solid #333',
  };

  return (
    <div
      className="widget"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
        border: '1px solid #333',
        borderRadius: '16px',
        padding: '24px',
        gridColumn: 'span 2',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ color: '#00ccff', fontSize: '12px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '2px' }}>
          🛰 Infra
        </div>
        <div style={{ color: '#444', fontSize: '11px', fontFamily: 'Space Mono, monospace' }}>
          {snapshot ? `Updated ${timeAgo(snapshot.captured_at)}` : loading ? 'Loading…' : 'No data'}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Service', 'Platform', 'Status'].map(h => (
                <th key={h} style={headStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ ...cellStyle, color: '#444', textAlign: 'center' }}>Loading…</td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ ...cellStyle, color: '#444', textAlign: 'center' }}>No snapshot yet</td>
              </tr>
            ) : (
              services.map((svc, i) => (
                <tr key={i}>
                  <td style={cellStyle}>{svc.name}</td>
                  <td style={{ ...cellStyle, color: '#666' }}>{svc.platform}</td>
                  <td style={cellStyle}>{svc.status === 'healthy' ? '🟢' : '🔴'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default SentinelWidget;
