'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [data, setData] = useState({
    status: 'Loading...',
    title: 'Fetching latest status...',
    youtubeUrl: '',
    script: '',
    timestamp: '',
  });

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Auto-refreshes every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ color: '#38bdf8', fontSize: '28px' }}>🤖 AI Master Hub - Live Control Center</h1>
      
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginTop: '20px', border: '1px solid #334155' }}>
        <h2 style={{ fontSize: '18px', color: '#94a3b8' }}>Agent Execution Status</h2>
        <p style={{ fontSize: '22px', fontWeight: 'bold', color: data.status.includes('Successfully') ? '#4ade80' : '#f59e0b' }}>
          ● {data.status}
        </p>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Last Updated: {data.timestamp}</p>
      </div>

      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', marginTop: '20px', border: '1px solid #334155' }}>
        <h2 style={{ fontSize: '18px', color: '#94a3b8' }}>Latest Published Video</h2>
        <h3 style={{ fontSize: '20px', color: '#38bdf8', marginTop: '10px' }}>{data.title}</h3>
        
        {data.youtubeUrl && (
          <a 
            href={data.youtubeUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ display: 'inline-block', background: '#ef4444', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', marginTop: '10px' }}
          >
            ▶️ Watch Live on YouTube
          </a>
        )}

        {data.script && (
          <div style={{ marginTop: '20px', background: '#0f172a', padding: '15px', borderRadius: '8px' }}>
            <h4 style={{ color: '#cbd5e1', marginBottom: '8px' }}>Generated Voiceover Script:</h4>
            <p style={{ color: '#94a3b8', fontStyle: 'italic', lineHeight: '1.6' }}>"{data.script}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
