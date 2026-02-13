import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nlijrpfuzcxftbcuwzte.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5saWpycGZ1emN4ZnRiY3V3enRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5MjcwODQsImV4cCI6MjA4NjUwMzA4NH0.SbZFfPwBLPSBK0DkWs00IGFtrnPHtvKXQefg43fL6Dg'
);

// In your component:
useEffect(() => {
  async function fetchData() {
    const { data, error } = await supabase
      .from('dashboard_entries')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) {
      // Group by category and set state
      const grouped = groupByCategory(data);
      setData(grouped);
    }
  }
  fetchData();
}, []);