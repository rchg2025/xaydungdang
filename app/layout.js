import './globals.css';

export const metadata = {
  title: 'Hệ Thống Quản Lý Quy Trình Kết Nạp Đảng',
  description: 'Tra cứu và quản lý quy trình kết nạp Đảng viên Đảng Cộng sản Việt Nam. Theo dõi tiến độ, trạng thái hồ sơ kết nạp Đảng.',
  keywords: 'kết nạp đảng, quy trình, đảng viên, tra cứu, quản lý',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
