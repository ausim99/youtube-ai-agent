export const metadata = {
  title: 'YouTube AI Agent Control Center',
  description: 'Autonomous Bangla YouTube AI Agent Control Dashboard',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
