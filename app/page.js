
'use client';
import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [status, setStatus] = useState('Agent is Active & Waiting for 6:00 PM');
  const [logs, setLogs] = useState([
    'System Initialized.',
    'Niche set to: AI & Future Tech',
    'Schedule: Daily at 6:00 PM'
  ]);

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif', backgroundColor: '#0f172a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#38bdf8' }}>🤖 YouTube AI Agent Control Center</h1>
      
      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
        <h2>Agent Status: <span style={{ color: '#4ade80' }}>{status}</span></h2>
        <p><strong>Configured Niche:</strong> AI, Technology & Future Trends</p>
        <p><strong>Next Run:</strong> Today at 6:00 PM</p>
      </div>

      <div style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', marginTop: '20px' }}>
        <h3>Execution Logs & Activity</h3>
        <ul>
          {logs.map((log, index) => (
            <li key={index} style={{ margin: '8px 0', color: '#cbd5e1' }}>{log}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
