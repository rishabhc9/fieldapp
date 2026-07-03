import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Field Visit Log',
  description: 'Submit a field visit record',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#F6F4EF', color: '#1C2321' }}>
        {children}
      </body>
    </html>
  );
}
