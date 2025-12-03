import React, { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../api/client';
import { spacing, typography } from '../theme';

function AdminDashboard({ theme }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);

  const fetchStats = async () => {
    try {
      // Don't set loading to true on subsequent fetches to avoid flickering
      if (!stats) setLoading(true);
      const data = await apiGet('/admin/stats');
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load system stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the entire cache?')) return;
    
    try {
      setClearing(true);
      await apiPost('/admin/cache/clear', {});
      alert('Cache cleared successfully');
      fetchStats(); // Refresh stats
    } catch (err) {
      alert('Failed to clear cache');
      console.error(err);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Styles
  const containerStyle = {
    padding: spacing.xl,
    maxWidth: '1200px',
    margin: '0 auto',
    color: theme.text.primary,
    animation: 'fadeIn 0.3s ease',
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  };

  const titleStyle = {
    fontSize: "28px",
    fontWeight: typography.fontWeight.bold,
    color: theme.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const buttonStyle = {
    backgroundColor: theme.error,
    color: '#fff',
    padding: `${spacing.sm} ${spacing.lg}`,
    borderRadius: '12px',
    border: 'none',
    cursor: clearing ? 'not-allowed' : 'pointer',
    opacity: clearing ? 0.7 : 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    transition: 'all 0.2s ease',
    boxShadow: `0 4px 12px ${theme.shadow}`,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  };

  const modelPathStyle = {
    backgroundColor: theme.bg.secondary,
    padding: spacing.lg,
    borderRadius: '16px',
    fontSize: typography.fontSize.sm,
    fontFamily: 'monospace',
    color: theme.text.secondary,
    border: `1px solid ${theme.border}`,
    overflowX: 'auto',
    boxShadow: `0 2px 8px ${theme.shadow}`,
  };

  if (loading && !stats) return (
    <div style={{ padding: spacing.xl, color: theme.text.primary, textAlign: 'center' }}>
      Loading system stats...
    </div>
  );
  
  if (error) return (
    <div style={{ padding: spacing.xl, color: theme.error, textAlign: 'center' }}>
      {error}
    </div>
  );

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>
          <span>🛡️</span> System Admin Dashboard
        </h1>
        <button 
          onClick={handleClearCache}
          disabled={clearing}
          style={buttonStyle}
          onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          <span>🗑️</span>
          {clearing ? 'Clearing...' : 'Clear Cache'}
        </button>
      </div>

      <div style={gridStyle}>
        <StatCard 
          theme={theme} 
          label="Uptime" 
          value={`${Math.floor(stats.uptime_seconds / 60)}m ${Math.floor(stats.uptime_seconds % 60)}s`} 
          icon="⏱️" 
        />
        <StatCard 
          theme={theme} 
          label="Total Requests" 
          value={stats.total_requests} 
          icon="📊" 
        />
        <StatCard 
          theme={theme} 
          label="Avg Latency" 
          value={`${stats.avg_latency_ms.toFixed(0)} ms`} 
          icon="⚡" 
          valueColor={stats.avg_latency_ms > 1000 ? theme.warning : theme.success}
        />
        <StatCard 
          theme={theme} 
          label="Cache Hit Rate" 
          value={`${(stats.cache_hit_rate * 100).toFixed(1)}%`} 
          icon="🎯" 
          valueColor={theme.info}
        />
        <StatCard 
          theme={theme} 
          label="Cache Hits" 
          value={stats.cache_hits} 
          icon="✅" 
          valueColor={theme.success}
        />
        <StatCard 
          theme={theme} 
          label="Cache Misses" 
          value={stats.cache_misses} 
          icon="❌" 
          valueColor={theme.text.secondary}
        />
        <StatCard 
          theme={theme} 
          label="Tokens Generated" 
          value={stats.total_tokens_generated.toLocaleString()} 
          icon="📝" 
        />
        <StatCard 
          theme={theme}
          label="Model Status" 
          value={stats.model_loaded ? 'Loaded' : 'Not Loaded'} 
          icon="🤖"
          valueColor={stats.model_loaded ? theme.success : theme.error}
        />
      </div>

      <div style={modelPathStyle}>
        <p style={{ marginBottom: spacing.xs, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: spacing.sm }}>
          <span>📂</span> Active Model Path:
        </p>
        <p style={{ color: theme.text.primary }}>{stats.model_path}</p>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ theme, label, value, icon, valueColor }) {
  const [isHovered, setIsHovered] = useState(false);

  const cardStyle = {
    backgroundColor: theme.bg.primary,
    padding: spacing.lg,
    borderRadius: '16px',
    boxShadow: isHovered ? `0 8px 24px ${theme.shadowMd}` : `0 2px 8px ${theme.shadow}`,
    border: `1px solid ${theme.border}`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    cursor: 'default',
    position: 'relative',
    overflow: 'hidden',
  };

  const iconBgStyle = {
    position: 'absolute',
    top: '-10px',
    right: '-10px',
    fontSize: '5rem',
    opacity: 0.05,
    transform: 'rotate(15deg)',
    pointerEvents: 'none',
  };

  return (
    <div 
      style={cardStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={iconBgStyle}>{icon}</div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md, position: 'relative' }}>
        <span style={{ 
          fontSize: typography.fontSize.xs, 
          color: theme.text.secondary, 
          fontWeight: typography.fontWeight.bold,
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {label}
        </span>
        <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>{icon}</span>
      </div>
      
      <div style={{ 
        fontSize: "24px", 
        fontWeight: typography.fontWeight.bold, 
        color: valueColor || theme.text.primary,
        position: 'relative',
        letterSpacing: '-0.5px'
      }}>
        {value}
      </div>
    </div>
  );
}

export default AdminDashboard;
