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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-theme');
                    document.documentElement.setAttribute('data-theme', 'light');
                    document.documentElement.style.setProperty('--color-bg-primary', '#f8f9fa');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
