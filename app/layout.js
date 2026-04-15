import './globals.css';

export const metadata = {
  title: 'Xây dựng Đảng - Đảng bộ Phường Chánh Hưng, TP.HCM',
  description: 'Tra cứu và quản lý quy trình tiếp nhận hồ sơ kết nạp Đảng viên Đảng Cộng sản Việt Nam tại Đảng bộ Phường Chánh Hưng, TP.HCM.',
  keywords: 'kết nạp đảng, quy trình, đảng viên, tra cứu, quản lý, phường chánh hưng, tp hcm',
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
