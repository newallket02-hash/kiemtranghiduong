import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MKT Assistant Portal — Lịch làm & Báo cáo công việc',
  description:
    'Cổng nhập thông tin công việc cho đội MKT Assistant: xem lịch làm theo tuần và điền báo cáo chi tiết theo từng nhóm task.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#12203a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
