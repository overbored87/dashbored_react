import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import SentinelWidget from './SentinelWidget';



// Supabase configuration - Replace with your actual values
const supabase = createClient(
  'https://nlijrpfuzcxftbcuwzte.supabase.co',  // e.g., 'https://xxxxx.supabase.co'
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5saWpycGZ1emN4ZnRiY3V3enRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjcwODQsImV4cCI6MjA4NjUwMzA4NH0.SbZFfPwBLPSBK0DkWs00IGFtrnPHtvKXQefg43fL6Dg'  // Your anon/public key
);

// Only show entries created by these Telegram accounts
const ALLOWED_USER_IDS = ['268934826', '7738099781'];

const BUY_IN_STAGES = [
  { key: 'cold',         label: 'Cold',          color: '#1a2a3a' },
  { key: 'hook point',   label: 'Hook Point',    color: '#1a3a2a' },
  { key: 'making plans', label: 'Making Plans',  color: '#2a1a3a' },
];
const buyInColor = (stage) => BUY_IN_STAGES.find(s => s.key === stage)?.color || '#111';

const STAGES = [
  { key: 'texting',    label: 'Texting',    color: '#ff0088' },
  { key: 'first_date', label: 'First Date', color: '#ff6600' },
  { key: 'seeing',     label: 'Seeing',     color: '#00ff88' },
  { key: 'back_burner',label: 'Back Burner',color: '#666' },
];
const AVATAR_COLORS = ['#ff0088','#ff6600','#ffaa00','#00ff88','#00ffff','#aa88ff','#ff88cc'];
const avatarColor = (name) => AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length];

const StarRating = ({ rating }) => {
  if (!rating) return <span style={{ color: '#444', fontSize: '12px' }}>—</span>;
  return (
    <span>
      {[1,2,3,4,5].map(i => {
        const fill = Math.min(1, Math.max(0, rating - (i - 1)));
        if (fill >= 1) return <span key={i} style={{ color: '#ffaa00', fontSize: '13px' }}>★</span>;
        if (fill >= 0.5) return (
          <span key={i} style={{ position: 'relative', display: 'inline-block', fontSize: '13px' }}>
            <span style={{ color: '#333' }}>★</span>
            <span style={{ position: 'absolute', left: 0, top: 0, overflow: 'hidden', width: '50%', color: '#ffaa00' }}>★</span>
          </span>
        );
        return <span key={i} style={{ color: '#333', fontSize: '13px' }}>★</span>;
      })}
    </span>
  );
};

// Utility to generate sample data
const generateSampleData = () => ({
  finance: [
    // January
    { date: '2/1', fullDate: '2026-01-02', amount: 134, category: 'groceries' },
    { date: '5/1', fullDate: '2026-01-05', amount: 89, category: 'dining' },
    { date: '8/1', fullDate: '2026-01-08', amount: 45, category: 'transport' },
    { date: '10/1', fullDate: '2026-01-10', amount: 156, category: 'groceries' },
    { date: '12/1', fullDate: '2026-01-12', amount: 78, category: 'dining' },
    { date: '15/1', fullDate: '2026-01-15', amount: 234, category: 'groceries' },
    { date: '18/1', fullDate: '2026-01-18', amount: 92, category: 'entertainment' },
    { date: '20/1', fullDate: '2026-01-20', amount: 67, category: 'dining' },
    { date: '23/1', fullDate: '2026-01-23', amount: 145, category: 'groceries' },
    { date: '25/1', fullDate: '2026-01-25', amount: 54, category: 'transport' },
    { date: '28/1', fullDate: '2026-01-28', amount: 89, category: 'dining' },
    { date: '30/1', fullDate: '2026-01-30', amount: 178, category: 'groceries' },
    
    // February (current)
    { date: '2/2', fullDate: '2026-02-02', amount: 198, category: 'groceries' },
    { date: '4/2', fullDate: '2026-02-04', amount: 76, category: 'dining' },
    { date: '7/2', fullDate: '2026-02-07', amount: 145, category: 'groceries' },
    { date: '8/2', fullDate: '2026-02-08', amount: 52, category: 'dining' },
    { date: '9/2', fullDate: '2026-02-09', amount: 89, category: 'transport' },
    { date: '10/2', fullDate: '2026-02-10', amount: 220, category: 'groceries' },
    { date: '11/2', fullDate: '2026-02-11', amount: 75, category: 'dining' },
    { date: '12/2', fullDate: '2026-02-12', amount: 45, category: 'entertainment' },
    { date: '13/2', fullDate: '2026-02-13', amount: 67, category: 'dining' },
    
    // December (for 3-month view)
    { date: '5/12', fullDate: '2025-12-05', amount: 156, category: 'groceries' },
    { date: '8/12', fullDate: '2025-12-08', amount: 92, category: 'dining' },
    { date: '12/12', fullDate: '2025-12-12', amount: 234, category: 'groceries' },
    { date: '15/12', fullDate: '2025-12-15', amount: 67, category: 'transport' },
    { date: '18/12', fullDate: '2025-12-18', amount: 145, category: 'entertainment' },
    { date: '20/12', fullDate: '2025-12-20', amount: 89, category: 'dining' },
    { date: '23/12', fullDate: '2025-12-23', amount: 178, category: 'groceries' },
    { date: '27/12', fullDate: '2025-12-27', amount: 234, category: 'dining' },
    { date: '30/12', fullDate: '2025-12-30', amount: 123, category: 'groceries' }
  ],
  todos: [
    { id: 'sample-1', task: 'Q1 performance review', due: '2/18', priority: 'high', status: 'pending' },
    { id: 'sample-2', task: 'Dentist appointment', due: '2/21', priority: 'medium', status: 'pending' },
    { id: 'sample-3', task: 'File taxes', due: '3/15', priority: 'high', status: 'pending' }
  ],
  netWorth: Object.assign([
    { month: 'Sep', savings: 22000, trading: 8500, total: 30500 },
    { month: 'Oct', savings: 23500, trading: 9200, total: 32700 },
    { month: 'Nov', savings: 24000, trading: 8800, total: 32800 },
    { month: 'Dec', savings: 25500, trading: 10100, total: 35600 },
    { month: 'Jan', savings: 26000, trading: 11500, total: 37500 },
    { month: 'Feb', savings: 27000, trading: 12000, total: 39000 }
  ], { lastUpdated: '10/02/26' }),
  habits: { apps: 5, vlogs: 4, pm: 3 },
  demoMode: false
});

const App = () => {
  const [data, setData] = useState(generateSampleData());
  const [loading, setLoading] = useState(true);
  const [prospects, setProspects] = useState([]);
  const [wikiCount, setWikiCount] = useState(0);
  const [videosCount, setVideosCount] = useState(0);
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [mergeMode, setMergeMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [spendView, setSpendView] = useState('7d');
  const [spendData, setSpendData] = useState({ bars: [], categories: [] });
  const [spendFilter, setSpendFilter] = useState(null);
  const [spendRows, setSpendRows] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Refs mirror spendView/spendFilter so the 30s interval sees current values,
  // not the ones captured on first render
  const spendViewRef = useRef('7d');
  const spendFilterRef = useRef(null);

  const refreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadData(),
        loadProspects(),
        loadWikiCount(),
        loadVideosCount(),
        loadSpend(spendViewRef.current, spendFilterRef.current),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    loadProspects();
    loadWikiCount();
    loadVideosCount();
    loadSpend('7d', null);
    const interval = setInterval(() => { loadData(); loadProspects(); loadWikiCount(); loadVideosCount(); loadSpend(spendViewRef.current, spendFilterRef.current); }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWikiCount = async () => {
    try {
      const { count, error } = await supabase
        .from('wiki_pages')
        .select('*', { count: 'exact', head: true });
      if (!error) setWikiCount(count || 0);
    } catch (e) {}
  };

  // Videos count = Random Walk + Watchtower episodes, counted from the numbered
  // episode-table rows on the "Random Walk Podcast" wiki page.
  const loadVideosCount = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('wiki_pages')
        .select('content')
        .ilike('title', '%random%walk%')
        .limit(1);
      if (error || !rows || !rows[0]) return;
      const matches = rows[0].content.match(/^\|\s*\d+\s*\|/gm);
      setVideosCount(matches ? matches.length : 0);
    } catch (e) {}
  };

  const loadProspects = async () => {
    try {
      const { data: rows, error } = await supabase
        .from('prospects')
        .select('*')
        .eq('archived', false)
        .in('user_id', ALLOWED_USER_IDS)
        .order('updated_at', { ascending: false });
      if (!error && rows) setProspects(rows);
    } catch (err) {
      console.log('Error loading prospects:', err);
    }
  };

  const mergeProspects = async (otherId) => {
    const other = prospects.find(p => p.id === otherId);
    if (!other || !selectedProspect) return;
    setSaving(true);
    try {
      const [older, newer] = new Date(selectedProspect.created_at) <= new Date(other.created_at)
        ? [selectedProspect, other]
        : [other, selectedProspect];

      const mergedNotes = [older.notes, newer.notes].filter(Boolean).join('\n\n---\n\n') || null;
      const mergedLogs = [...(older.logs || []), ...(newer.logs || [])]
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const { error: updateError } = await supabase
        .from('prospects')
        .update({
          name: newer.name,
          stage: newer.stage,
          buy_in_stage: newer.buy_in_stage,
          platform: newer.platform,
          rating: newer.rating,
          archive_reason: newer.archive_reason,
          notes: mergedNotes,
          logs: mergedLogs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', newer.id);
      if (updateError) throw updateError;

      const { error: deleteError } = await supabase.from('prospects').delete().eq('id', older.id);
      if (deleteError) throw deleteError;

      setSelectedProspect(null);
      setMergeMode(false);
      await loadProspects();
    } catch (err) {
      console.error('Merge failed:', err);
      alert('Merge failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProspect = async (id) => {
    try {
      const { error } = await supabase.from('prospects').delete().eq('id', id);
      if (error) throw error;
      setSelectedProspect(null);
      await loadProspects();
    } catch (err) {
      console.log('Error deleting prospect:', err);
    }
  };

  const saveProspectEdit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('prospects')
        .update({
          name: editForm.name,
          stage: editForm.stage,
          buy_in_stage: editForm.buy_in_stage || 'cold',
          platform: editForm.platform || null,
          rating: editForm.rating ? parseFloat(editForm.rating) : null,
          notes: editForm.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProspect.id);
      if (error) throw error;
      await loadProspects();
      setSelectedProspect(p => ({ ...p, ...editForm, rating: editForm.rating ? parseFloat(editForm.rating) : null }));
      setEditMode(false);
    } catch (err) {
      console.error('Failed to save prospect:', err);
    } finally {
      setSaving(false);
    }
  };

  const getViewConfig = (view) => {
    const now = new Date();
    let since, groupFn, labelFn;
    if (view === '7d') {
      since = new Date(now); since.setDate(now.getDate() - 6); since.setHours(0,0,0,0);
      groupFn = (d) => d.toISOString().slice(0, 10);
      labelFn = (key) => { const d = new Date(key); return `${d.getDate()}/${d.getMonth()+1}`; };
    } else if (view === '8w') {
      since = new Date(now); since.setDate(now.getDate() - 55); since.setHours(0,0,0,0);
      groupFn = (d) => { const s = new Date(d); s.setDate(d.getDate() - d.getDay()); return s.toISOString().slice(0, 10); };
      labelFn = (key) => { const d = new Date(key); return `${d.getDate()}/${d.getMonth()+1}`; };
    } else {
      since = new Date(now); since.setMonth(now.getMonth() - 5); since.setDate(1); since.setHours(0,0,0,0);
      groupFn = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      labelFn = (key) => MONTHS[parseInt(key.split('-')[1]) - 1];
    }
    return { since, groupFn, labelFn, now };
  };

  const computeSpendDisplay = (rows, view, filter) => {
    const { groupFn, labelFn, now } = getViewConfig(view);
    const barMap = {};
    const catMap = {};
    (rows || []).forEach(row => {
      const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      const amount = Math.abs(d.amount || 0);
      if (!amount) return;
      const cat = (d.subcategory || d.description || 'other').toLowerCase();
      if (filter && cat !== filter) return;
      const date = new Date(d.date || row.created_at);
      const key = groupFn(date);
      barMap[key] = (barMap[key] || 0) + amount;
      catMap[cat] = (catMap[cat] || 0) + amount;
    });
    const bars = [];
    if (view === '7d') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0,0,0,0);
        const key = groupFn(d);
        bars.push({ label: labelFn(new Date(key)), amount: barMap[key] || 0 });
      }
    } else if (view === '8w') {
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now); d.setDate(now.getDate() - i * 7);
        const key = groupFn(d);
        if (!bars.find(b => b.key === key)) bars.push({ key, label: labelFn(new Date(key)), amount: barMap[key] || 0 });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now); d.setMonth(now.getMonth() - i); d.setDate(1);
        const key = groupFn(d);
        bars.push({ label: labelFn(key), amount: barMap[key] || 0 });
      }
    }
    const categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, total]) => ({ name, total }));
    setSpendData({ bars, categories });
  };

  const loadSpend = async (view, filter) => {
    const resolvedFilter = filter !== undefined ? filter : spendFilter;
    const { since } = getViewConfig(view);
    try {
      const { data: rows, error } = await supabase
        .from('dashboard_entries')
        .select('data, created_at')
        .eq('category', 'spending')
        .in('user_id', ALLOWED_USER_IDS)
        .gte('created_at', since.toISOString());
      if (error || !rows) return;
      setSpendRows(rows);
      computeSpendDisplay(rows, view, resolvedFilter);
    } catch (err) {
      console.log('Error loading spend:', err);
    }
  };



  const loadData = async () => {
    try {
      // Fetch data from Supabase
      const { data: entries, error } = await supabase
        .from('dashboard_entries')
        .select('*')
        .in('user_id', ALLOWED_USER_IDS)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
        // Fall back to sample data if error
        setLoading(false);
        return;
      }

      if (entries && entries.length > 0) {
        // Transform database entries into dashboard format
        const transformedData = transformEntries(entries);
        setData(transformedData);
      }
    } catch (err) {
      console.log('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform database entries into the format the dashboard expects
  const transformEntries = (entries) => {
    const finance = [];
    const todos = [];
    const habits = { apps: 0, vlogs: 0, pm: 0 };
    // Current year for filtering habits
    const currentYear = new Date().getFullYear();
    const netWorthRaw = [];
    let demoMode = false;


    entries.forEach(entry => {
      // Parse data if it's a string (bot saves as JSON string)
      const data = typeof entry.data === 'string' ? JSON.parse(entry.data) : entry.data;
      
      if (entry.category === 'spending') {
        const date = new Date(data.date || entry.created_at);
        finance.push({
          date: `${date.getDate()}/${date.getMonth() + 1}`,
          fullDate: data.date || entry.created_at,
          amount: Math.abs(data.amount || 0), // Use absolute value for display
          category: data.subcategory || data.description || 'other'
        });
      } else if (entry.category === 'net_worth') {
        netWorthRaw.push({
          date: data.date || entry.created_at.slice(0, 10),
          savings: data.savings,
          trading: data.trading,
          created_at: entry.created_at
        });
      } else if (entry.category === 'todos') {
        // Only show pending/in_progress todos
        if (data.status !== 'done') {
          todos.push({
            id: entry.id,               // Supabase row ID for updates
            entryData: data,             // Keep full data for PATCH
            task: data.task || 'Task',
            due: data.due || 'TBD',
            priority: data.priority || 'medium',
            status: data.status || 'pending',
            reminderTime: data.reminder_time || null
          });
        }
      } else if (entry.category === 'habits') {
        // Only count habits from current year
        const entryDate = new Date(data.date || entry.created_at);
        if (entryDate.getFullYear() === currentYear) {
          const habit = data.habit;
          if (habit in habits) {
            habits[habit] += 1;
          }
        }
      } else if (entry.category === 'settings') {
        // Read demo mode setting
        if (data.demo_mode !== undefined) {
          demoMode = data.demo_mode;
        }
      }
    });

    // Build net worth timeline: for each month, take the latest snapshot
    // and carry forward the last known value for each account
    const netWorth = buildNetWorthTimeline(netWorthRaw);

    return { finance, todos, netWorth, habits, demoMode };
  };

  // Build a 6-month net worth timeline from snapshots
  const buildNetWorthTimeline = (rawEntries) => {
    if (rawEntries.length === 0) return [];

    // Sort by date ascending
    const sorted = [...rawEntries].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Track latest known values for each account
    let latestSavings = 0;
    let latestTrading = 0;

    // Group by month, keeping the latest entry per month
    const monthMap = {};
    let lastDate = '';
    sorted.forEach(entry => {
      if (entry.savings != null) latestSavings = entry.savings;
      if (entry.trading != null) latestTrading = entry.trading;
      lastDate = entry.date;

      const d = new Date(entry.date);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      monthMap[monthKey] = {
        savings: latestSavings,
        trading: latestTrading,
        total: latestSavings + latestTrading
      };
    });

    // Get last 6 months
    const months = Object.keys(monthMap).sort().slice(-6);
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Format lastDate as DD/MM/YY
    const ld = new Date(lastDate);
    const lastUpdated = lastDate ? `${String(ld.getDate()).padStart(2,'0')}/${String(ld.getMonth()+1).padStart(2,'0')}/${String(ld.getFullYear()).slice(-2)}` : '';

    const timeline = months.map(key => {
      const [, m] = key.split('-');
      return {
        month: monthNames[parseInt(m) - 1],
        ...monthMap[key]
      };
    });

    // Attach lastUpdated to the array for display
    timeline.lastUpdated = lastUpdated;
    return timeline;
  };

  // Mark a todo as done — optimistic UI + Supabase update
  const markTodoDone = async (todoId, entryData) => {
    // Optimistic: remove from UI immediately
    setData(prev => ({
      ...prev,
      todos: prev.todos.filter(t => t.id !== todoId)
    }));

    // If it's a sample todo (no real Supabase ID), just remove from UI
    if (!todoId || String(todoId).startsWith('sample-')) return;

    const { error } = await supabase
      .from('dashboard_entries')
      .update({ data: { ...entryData, status: 'done' } })
      .eq('id', todoId);

    if (error) {
      console.error('Failed to mark todo done:', error);
      // Re-fetch to restore if failed
      loadData();
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
        color: '#00ff88',
        fontFamily: 'Courier New, monospace',
        fontSize: '18px'
      }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');
        
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        
        .widget {
          animation: slideInUp 0.6s ease-out backwards;
        }
        
        .widget:nth-child(1) { animation-delay: 0.1s; }
        .widget:nth-child(2) { animation-delay: 0.2s; }
        .widget:nth-child(3) { animation-delay: 0.3s; }
        .widget:nth-child(4) { animation-delay: 0.4s; }
        .widget:nth-child(5) { animation-delay: 0.5s; }
        .widget:nth-child(6) { animation-delay: 0.6s; }
        
        .stat-number {
          font-family: 'Space Mono', monospace;
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
          background: linear-gradient(135deg, #00ff88 0%, #00ffff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .live-indicator {
          animation: pulse 2s ease-in-out infinite;
          background: #00ff88;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          box-shadow: 0 0 12px #00ff88;
        }

        .todo-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #444;
          border-radius: 6px;
          flex-shrink: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #000;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .todo-checkbox:hover {
          border-color: #88ff00;
          background: #88ff0022;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .refresh-btn {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 8px;
          color: #888;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .refresh-btn:hover {
          border-color: #00ff8866;
          color: #00ff88;
        }

        .refresh-btn:disabled {
          cursor: default;
        }

        .refresh-btn.spinning svg {
          animation: spin 0.8s linear infinite;
        }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: '1100px', margin: '0 auto 60px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <span className="live-indicator"></span>
              <span style={{
                color: '#00ff88',
                fontFamily: 'Space Mono, monospace',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                LIVE DASHBOARD
              </span>
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '32px',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 8px 0',
              letterSpacing: '-1px',
              lineHeight: '1.2'
            }}>
              Dashbored v2.0
            </h1>
            <p style={{
              color: '#666',
              fontFamily: 'Space Mono, monospace',
              fontSize: '14px',
              margin: 0
            }}>
              Last synced: {new Date().toLocaleTimeString()} via Telegram Bot
            </p>
          </div>
          <button
            className={`refresh-btn${refreshing ? ' spinning' : ''}`}
            onClick={refreshAll}
            disabled={refreshing}
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 4v6h-6" />
              <path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div style={{ 
        maxWidth: '1100px', 
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        
        {/* Net Worth Widget */}
        <div className="widget" style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
          gridColumn: 'span 2'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(0,255,136,0.08) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}></div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              color: '#00ff88',
              fontSize: '12px',
              fontFamily: 'Space Mono, monospace',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🏦 Net Worth
              <span style={{ color: '#555', fontSize: '11px', textTransform: 'none', letterSpacing: '0' }}>
                {data.netWorth?.lastUpdated ? `updated ${data.netWorth.lastUpdated}` : ''}
              </span>
            </div>
            <div className="stat-number" style={{ fontSize: '56px' }}>
              {demoMode ? '•••••' : `$${(() => {
                const nw = data.netWorth;
                if (!nw || nw.length === 0) return '0';
                const latest = nw[nw.length - 1];
                return (latest.total || 0).toLocaleString();
              })()}`}
            </div>
            <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
              <div>
                <span style={{ color: '#666', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginRight: '8px' }}>Savings</span>
                <span style={{ color: '#00ff88', fontSize: '16px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>
                  {demoMode ? '•••••' : `$${(() => {
                    const nw = data.netWorth;
                    if (!nw || nw.length === 0) return '0';
                    return (nw[nw.length - 1].savings || 0).toLocaleString();
                  })()}`}
                </span>
              </div>
              <div>
                <span style={{ color: '#666', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginRight: '8px' }}>Trading</span>
                <span style={{ color: '#00ffff', fontSize: '16px', fontFamily: 'Space Mono, monospace', fontWeight: '700' }}>
                  {demoMode ? '•••••' : `$${(() => {
                    const nw = data.netWorth;
                    if (!nw || nw.length === 0) return '0';
                    return (nw[nw.length - 1].trading || 0).toLocaleString();
                  })()}`}
                </span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={data.netWorth || []}>
              <XAxis dataKey="month" stroke="#444" style={{ fontSize: '11px' }} />
              <YAxis stroke="#444" style={{ fontSize: '11px' }} tickFormatter={v => demoMode ? '•••' : `$${(v/1000).toFixed(0)}k`} />
              {!demoMode && <Tooltip 
                contentStyle={{ background: '#0f0f0f', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                formatter={(value) => [`$${value.toLocaleString()}`, '']}
              />}
              <Line type="monotone" dataKey="total" stroke="#00ff88" strokeWidth={2} dot={{ fill: '#00ff88', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Spending Widget */}
        <div className="widget" style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '24px',
          gridColumn: 'span 2'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ color: '#ff6600', fontSize: '12px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '2px' }}>
              💸 Spending
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[['7d','7 Days'],['8w','8 Weeks'],['6m','6 Months']].map(([key, label]) => (
                <button key={key} onClick={() => { setSpendView(key); setSpendFilter(null); spendViewRef.current = key; spendFilterRef.current = null; loadSpend(key, null); }} style={{
                  background: spendView === key ? '#ff6600' : 'transparent',
                  border: `1px solid ${spendView === key ? '#ff6600' : '#333'}`,
                  color: spendView === key ? '#000' : '#666',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontFamily: 'Space Mono, monospace',
                  cursor: 'pointer'
                }}>{label}</button>
              ))}
            </div>
          </div>

          {/* Bar chart */}
          {(() => {
            const max = Math.max(...spendData.bars.map(b => b.amount), 1);
            return (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '120px', marginBottom: '20px' }}>
                {spendData.bars.map((bar, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '9px', color: '#555', fontFamily: 'Space Mono, monospace', marginBottom: '3px' }}>
                      {bar.amount > 0 ? `$${bar.amount.toFixed(0)}` : ''}
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${(bar.amount / max) * 85}%`,
                      minHeight: bar.amount > 0 ? '4px' : '0',
                      background: 'linear-gradient(180deg, #ff6600 0%, #ff440088 100%)',
                      borderRadius: '4px 4px 0 0',
                    }} />
                    <div style={{ fontSize: '9px', color: '#555', fontFamily: 'Space Mono, monospace', marginTop: '5px' }}>
                      {bar.label}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Top categories */}
          {spendData.categories.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ fontSize: '11px', color: '#555', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px' }}>Top Categories</div>
                {spendFilter && (
                  <div style={{ fontSize: '10px', color: '#ff6600', fontFamily: 'Space Mono, monospace' }}>
                    filtered · tap again to clear
                  </div>
                )}
              </div>
              {spendData.categories.map((cat, i) => {
                const maxCat = spendData.categories[0].total;
                const isActive = spendFilter === cat.name;
                return (
                  <div key={i}
                    onClick={() => {
                      const newFilter = isActive ? null : cat.name;
                      setSpendFilter(newFilter);
                      spendFilterRef.current = newFilter;
                      computeSpendDisplay(spendRows, spendView, newFilter);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', background: isActive ? '#ff660011' : 'transparent', border: isActive ? '1px solid #ff660033' : '1px solid transparent', transition: 'background 0.15s' }}>
                    <div style={{ width: '90px', fontSize: '12px', color: isActive ? '#ff6600' : '#888', fontFamily: 'Space Mono, monospace', flexShrink: 0 }}>{cat.name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
                    <div style={{ flex: 1, background: '#1a1a1a', borderRadius: '4px', height: '6px' }}>
                      <div style={{ width: `${(cat.total / maxCat) * 100}%`, height: '100%', background: isActive ? '#ff6600' : '#ff660066', borderRadius: '4px', transition: 'background 0.15s' }} />
                    </div>
                    <div style={{ width: '60px', textAlign: 'right', fontSize: '12px', color: isActive ? '#ff6600' : '#ff660088', fontFamily: 'Space Mono, monospace' }}>${cat.total.toFixed(0)}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: '#444', fontSize: '13px', textAlign: 'center', paddingTop: '8px' }}>No spend data for this period</div>
          )}
        </div>

        {/* Todos Widget */}
        <div className="widget" style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '24px',
          gridColumn: 'span 2'
        }}>
          <div style={{ 
            color: '#88ff00',
            fontSize: '12px',
            fontFamily: 'Space Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '20px'
          }}>
            ✅ To-Do ({data.todos.length})
          </div>

          {data.todos.length === 0 && (
            <div style={{ color: '#666', fontSize: '13px', fontStyle: 'italic' }}>
              All done! 🎉
            </div>
          )}

          {data.todos.map((todo, i) => (
            <div key={todo.id || i} style={{
              background: '#1a1a1a',
              border: todo.priority === 'high' ? '1px solid #88ff0044' : '1px solid #2a2a2a',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div
                className="todo-checkbox"
                onClick={() => markTodoDone(todo.id, todo.entryData)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && markTodoDone(todo.id, todo.entryData)}
              />
              <div style={{ flex: 1 }}>
                <div style={{ 
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '4px'
                }}>
                  {todo.task}
                </div>
                <div style={{ 
                  color: '#666',
                  fontSize: '12px',
                  fontFamily: 'Space Mono, monospace'
                }}>
                  Due: {todo.due} • {todo.priority}
                  {todo.reminderTime && (() => {
                    try {
                      const rt = new Date(todo.reminderTime);
                      const dd = String(rt.getDate()).padStart(2, '0');
                      const mm = String(rt.getMonth() + 1).padStart(2, '0');
                      const time = rt.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit', hour12: true });
                      return <span style={{ color: '#ffaa00' }}> • 🔔 {dd}/{mm} {time}</span>;
                    } catch { return null; }
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>


        {/* Dating CRM Widget */}
        {!demoMode && <div className="widget" style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '24px',
          gridColumn: 'span 2'
        }}>
          {/* Widget header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div>
              <div style={{ color: '#ff0088', fontSize: '12px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                💕 Dating CRM
              </div>
              <div className="stat-number" style={{ fontSize: '40px', background: 'linear-gradient(135deg, #ff0088 0%, #ff8800 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {prospects.length}
              </div>
              <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>in pipeline</div>
            </div>
            <a href="/archive.html" style={{ color: '#555', fontSize: '13px', fontFamily: 'Space Mono, monospace', textDecoration: 'none', border: '1px solid #333', padding: '8px 14px', borderRadius: '8px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color='#aaa'} onMouseLeave={e => e.target.style.color='#555'}>
              Archive →
            </a>
          </div>

          {/* Stage rows */}
          {STAGES.map(stage => {
            const cards = prospects.filter(p => p.stage === stage.key);
            return (
              <div key={stage.key} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ color: stage.color, fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                    {stage.label}
                  </span>
                  <span style={{ color: '#333', fontSize: '11px' }}>{cards.length}</span>
                  <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
                </div>
                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
                  {cards.length === 0 && (
                    <div style={{ color: '#333', fontSize: '12px', fontStyle: 'italic', padding: '8px 0' }}>empty</div>
                  )}
                  {cards.map(p => (
                    <div key={p.id}
                      onClick={() => setSelectedProspect(p)}
                      style={{
                        background: buyInColor(p.buy_in_stage),
                        border: `1px solid ${stage.color}22`,
                        borderRadius: '12px',
                        padding: '14px',
                        minWidth: '110px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = stage.color + '66'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = stage.color + '22'}
                    >
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: avatarColor(p.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: '700', color: '#0f0f0f',
                        marginBottom: '10px'
                      }}>
                        {(p.name || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90px' }}>
                        {p.name}
                      </div>
                      {p.platform && <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px' }}>{p.platform}</div>}
                      <StarRating rating={p.rating} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>}

        {/* Prospect modal */}
        {selectedProspect && (
          <div onClick={() => { setSelectedProspect(null); setEditMode(false); setMergeMode(false); }} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#1a1a1a', border: '1px solid #333', borderRadius: '20px',
              padding: '28px', width: '100%', maxWidth: '420px', maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              {/* Modal header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: avatarColor(editMode ? editForm.name : selectedProspect.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', fontWeight: '700', color: '#0f0f0f', flexShrink: 0
                }}>
                  {((editMode ? editForm.name : selectedProspect.name) || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>{selectedProspect.name}</div>
                  <div style={{ color: '#555', fontSize: '13px', marginTop: '2px' }}>
                    {STAGES.find(s => s.key === selectedProspect.stage)?.label || selectedProspect.stage}
                    {selectedProspect.platform && ` · ${selectedProspect.platform}`}
                  </div>
                </div>
                <button onClick={() => { setSelectedProspect(null); setEditMode(false); setMergeMode(false); }} style={{
                  marginLeft: 'auto', background: 'none', border: 'none', color: '#555',
                  fontSize: '22px', cursor: 'pointer', padding: '4px'
                }}>✕</button>
              </div>

              {editMode ? (
                /* Edit form */
                <div>
                  {[
                    { key: 'name', label: 'Name', type: 'text' },
                    { key: 'platform', label: 'Platform', type: 'text', placeholder: 'Hinge, Bumble…' },
                    { key: 'rating', label: 'Rating (0.5–5)', type: 'number', placeholder: '3.5' },
                  ].map(f => (
                    <div key={f.key} style={{ marginBottom: '14px' }}>
                      <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{f.label}</div>
                      <input
                        type={f.type}
                        value={editForm[f.key] || ''}
                        placeholder={f.placeholder || ''}
                        step={f.key === 'rating' ? '0.5' : undefined}
                        min={f.key === 'rating' ? '0.5' : undefined}
                        max={f.key === 'rating' ? '5' : undefined}
                        onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        style={{
                          width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px',
                          color: '#fff', padding: '10px 12px', fontSize: '14px', outline: 'none',
                          fontFamily: 'inherit',
                        }}
                      />
                    </div>
                  ))}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Stage</div>
                    <select
                      value={editForm.stage || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, stage: e.target.value }))}
                      style={{
                        width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px',
                        color: '#fff', padding: '10px 12px', fontSize: '14px', outline: 'none',
                        fontFamily: 'inherit', cursor: 'pointer',
                      }}
                    >
                      {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Buy-in</div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {BUY_IN_STAGES.map(s => (
                        <button
                          key={s.key}
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, buy_in_stage: s.key }))}
                          style={{
                            flex: 1, padding: '8px 4px', borderRadius: '8px', fontSize: '11px',
                            fontFamily: 'Space Mono, monospace', cursor: 'pointer',
                            border: editForm.buy_in_stage === s.key ? '1px solid #888' : '1px solid #333',
                            background: editForm.buy_in_stage === s.key ? s.color : '#111',
                            color: editForm.buy_in_stage === s.key ? '#ccc' : '#555',
                            transition: 'all 0.15s',
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Notes <span style={{ color: '#444', textTransform: 'none', letterSpacing: 0 }}>— preferences, context</span></div>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      style={{
                        width: '100%', background: '#111', border: '1px solid #333', borderRadius: '8px',
                        color: '#fff', padding: '10px 12px', fontSize: '14px', outline: 'none',
                        fontFamily: 'inherit', resize: 'vertical',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Activity <span style={{ color: '#444', textTransform: 'none', letterSpacing: 0 }}>— read-only, add via voice</span></div>
                    {selectedProspect.logs && selectedProspect.logs.length > 0
                      ? [...selectedProspect.logs].reverse().map((log, i) => {
                          const d = new Date(log.date);
                          return (
                            <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                              <div style={{ color: '#444', fontSize: '11px', fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '36px' }}>{d.getDate()}/{d.getMonth()+1}</div>
                              <div style={{ color: '#666', fontSize: '13px', lineHeight: '1.5' }}>{log.text}</div>
                            </div>
                          );
                        })
                      : <div style={{ color: '#444', fontSize: '13px', fontStyle: 'italic' }}>No activity yet</div>
                    }
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={saveProspectEdit} disabled={saving} style={{
                      flex: 1, background: '#fff', color: '#0f0f0f', border: 'none', borderRadius: '10px',
                      padding: '12px', fontSize: '14px', fontWeight: '600', cursor: saving ? 'default' : 'pointer',
                      opacity: saving ? 0.6 : 1,
                    }}>
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button onClick={() => setEditMode(false)} style={{
                      flex: 1, background: 'none', color: '#888', border: '1px solid #333', borderRadius: '10px',
                      padding: '12px', fontSize: '14px', cursor: 'pointer',
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : mergeMode ? (
                /* Merge picker */
                <div>
                  <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                    Merge {selectedProspect.name} into…
                  </div>
                  <div style={{ color: '#444', fontSize: '12px', marginBottom: '16px', lineHeight: '1.5' }}>
                    Notes and activity combine. Other fields use whichever card was created more recently. This cannot be undone.
                  </div>
                  {prospects.filter(p => p.id !== selectedProspect.id).length === 0 ? (
                    <div style={{ color: '#444', fontSize: '13px', fontStyle: 'italic', marginBottom: '20px' }}>No other active prospects to merge with.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                      {prospects.filter(p => p.id !== selectedProspect.id).map(p => (
                        <button
                          key={p.id}
                          disabled={saving}
                          onClick={() => {
                            if (window.confirm(`Merge ${selectedProspect.name} and ${p.name}? This cannot be undone.`)) mergeProspects(p.id);
                          }}
                          style={{
                            width: '100%', textAlign: 'left', background: '#111', border: '1px solid #333',
                            borderRadius: '10px', padding: '11px 14px', color: '#ccc', fontSize: '14px',
                            cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1,
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={e => { if (!saving) e.currentTarget.style.borderColor = '#555'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; }}
                        >
                          {p.name}
                          <span style={{ color: '#555', fontSize: '12px' }}> · {STAGES.find(s => s.key === p.stage)?.label || p.stage}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setMergeMode(false)} disabled={saving} style={{
                    width: '100%', background: 'none', color: '#888', border: '1px solid #333', borderRadius: '10px',
                    padding: '12px', fontSize: '14px', cursor: saving ? 'default' : 'pointer',
                  }}>
                    Cancel
                  </button>
                </div>
              ) : (
                /* View mode */
                <div>
                  {[
                    { label: 'Rating', value: selectedProspect.rating ? <StarRating rating={selectedProspect.rating} /> : null },
                    { label: 'Notes', value: selectedProspect.notes },
                  ].filter(f => f.value).map(f => (
                    <div key={f.label} style={{ marginBottom: '16px' }}>
                      <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{f.label}</div>
                      <div style={{ color: '#ccc', fontSize: '14px', lineHeight: '1.5' }}>{f.value}</div>
                    </div>
                  ))}

                  {/* Activity log */}
                  {selectedProspect.logs && selectedProspect.logs.length > 0 && (
                    <div style={{ marginTop: '4px', marginBottom: '20px' }}>
                      <div style={{ color: '#555', fontSize: '11px', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Activity</div>
                      {[...selectedProspect.logs].reverse().map((log, i) => {
                        const d = new Date(log.date);
                        const label = `${d.getDate()}/${d.getMonth() + 1}`;
                        return (
                          <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ color: '#444', fontSize: '11px', fontFamily: 'Space Mono, monospace', whiteSpace: 'nowrap', paddingTop: '2px', minWidth: '36px' }}>{label}</div>
                            <div style={{ color: '#999', fontSize: '13px', lineHeight: '1.5' }}>{log.text}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Edit / Delete buttons */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button
                      onClick={() => {
                        setEditForm({
                          name: selectedProspect.name,
                          stage: selectedProspect.stage,
                          buy_in_stage: selectedProspect.buy_in_stage || 'cold',
                          platform: selectedProspect.platform || '',
                          rating: selectedProspect.rating || '',
                          notes: selectedProspect.notes || '',
                        });
                        setEditMode(true);
                      }}
                      style={{
                        flex: 1, background: 'none', border: '1px solid #333', borderRadius: '10px',
                        color: '#888', padding: '11px', fontSize: '14px', cursor: 'pointer',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = '#555'; e.target.style.color = '#ccc'; }}
                      onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#888'; }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setMergeMode(true)}
                      style={{
                        flex: 1, background: 'none', border: '1px solid #333', borderRadius: '10px',
                        color: '#888', padding: '11px', fontSize: '14px', cursor: 'pointer',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = '#aa88ff'; e.target.style.color = '#aa88ff'; }}
                      onMouseLeave={e => { e.target.style.borderColor = '#333'; e.target.style.color = '#888'; }}
                    >
                      Merge
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Delete ${selectedProspect.name}? This cannot be undone.`)) deleteProspect(selectedProspect.id); }}
                      style={{
                        flex: 1, background: 'none', border: '1px solid #331111', borderRadius: '10px',
                        color: '#664444', padding: '11px', fontSize: '14px', cursor: 'pointer',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={e => { e.target.style.borderColor = '#ff4444'; e.target.style.color = '#ff4444'; }}
                      onMouseLeave={e => { e.target.style.borderColor = '#331111'; e.target.style.color = '#664444'; }}
                    >
                      Delete
                    </button>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}


        {/* Habits Widget */}
        <div className="widget" style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #222 100%)',
          border: '1px solid #333',
          borderRadius: '16px',
          padding: '24px',
          gridColumn: 'span 2'
        }}>
          <div style={{ 
            color: '#aa88ff',
            fontSize: '12px',
            fontFamily: 'Space Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🔁 Habits
            <span style={{ color: '#555', fontSize: '11px', textTransform: 'none', letterSpacing: '0' }}>
              Week {Math.ceil((Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 1)) / 86400000) + 1) / 7)} of {new Date().getFullYear()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '20px' }}>
            {/* Videos */}
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #aa88ff33',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '40px',
                fontWeight: '700',
                color: '#aa88ff',
                lineHeight: '1'
              }}>
                {videosCount}
              </div>
              <div style={{ color: '#888', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginTop: '8px' }}>
                videos
              </div>
            </div>

            {/* Prospects */}
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #aa88ff33',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '40px',
                fontWeight: '700',
                color: '#aa88ff',
                lineHeight: '1'
              }}>
                {prospects.length}
              </div>
              <div style={{ color: '#888', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginTop: '8px' }}>
                prospects
              </div>
            </div>

            {/* Wiki pages */}
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #aa88ff33',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '40px',
                fontWeight: '700',
                color: '#aa88ff',
                lineHeight: '1'
              }}>
                {wikiCount}
              </div>
              <div style={{ color: '#888', fontSize: '12px', fontFamily: 'Space Mono, monospace', marginTop: '8px' }}>
                wiki pages
              </div>
            </div>
          </div>
        </div>


        {/* Sentinel / Infra Widget */}
        <SentinelWidget supabase={supabase} />

      </div>

      {/* Demo mode toggle */}
      <div style={{ maxWidth: '1100px', margin: '40px auto 0', textAlign: 'center' }}>
        <button
          onClick={() => setDemoMode(d => !d)}
          style={{
            background: demoMode ? '#2a1a2a' : 'transparent',
            border: `1px solid ${demoMode ? '#aa88ff' : '#333'}`,
            color: demoMode ? '#aa88ff' : '#555',
            fontFamily: 'Space Mono, monospace',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            padding: '8px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { if (!demoMode) { e.target.style.borderColor = '#555'; e.target.style.color = '#888'; }}}
          onMouseLeave={e => { if (!demoMode) { e.target.style.borderColor = '#333'; e.target.style.color = '#555'; }}}
        >
          {demoMode ? '🎭 Demo Mode ON' : '🎭 Demo Mode'}
        </button>
      </div>

      {/* Footer */}
      <div style={{
        maxWidth: '1100px',
        margin: '40px auto 0',
        textAlign: 'center',
        color: '#444',
        fontSize: '13px',
        fontFamily: 'Space Mono, monospace'
      }}>
        <div>Powered by Telegram Bot + Claude API</div>
        <div style={{ marginTop: '8px', color: '#333' }}>
          Send messages to @YourDashboardBot to add entries
        </div>
      </div>
    </div>
  );
};

export default App;
