import './globals.css';

export const metadata = {
  title: 'Hệ thống Tra cứu Quy trình tiếp nhận hồ sơ Kết nạp Đảng',
  description: 'Tra cứu Quy trình tiếp nhận hồ sơ Kết nạp Đảng là hệ thống hỗ trợ theo dõi tiến độ xử lý hồ sơ kết nạp Đảng viên trực tuyến, giúp tra cứu nhanh chóng, chính xác và minh bạch bằng số CCCD hoặc Chi bộ/Đảng bộ cơ sở. Website cung cấp thông tin cập nhật về tình trạng xử lý hồ sơ, góp phần nâng cao hiệu quả cải cách hành chính, chuyển đổi số trong công tác xây dựng Đảng và phục vụ tổ chức, cá nhân thuận tiện mọi lúc, mọi nơi. Truy cập: https://xdd.phuongchanhhung.vn',
  keywords: 'kết nạp đảng, quy trình, đảng viên, tra cứu, quản lý, phường chánh hưng, tp hcm',
  openGraph: {
    title: 'Hệ thống Tra cứu Quy trình tiếp nhận hồ sơ Kết nạp Đảng',
    description: 'Tra cứu Quy trình tiếp nhận hồ sơ Kết nạp Đảng là hệ thống hỗ trợ theo dõi tiến độ xử lý hồ sơ kết nạp Đảng viên trực tuyến, giúp tra cứu nhanh chóng, chính xác và minh bạch bằng số CCCD hoặc Chi bộ/Đảng bộ cơ sở.',
    url: 'https://xdd.phuongchanhhung.vn',
    siteName: 'Hệ thống Tra cứu Quy trình tiếp nhận hồ sơ Kết nạp Đảng',
    images: [
      {
        url: 'https://drive.google.com/uc?export=view&id=12ch3RNQSK1rNt9nPhxTZ1XafbWPZMXq0',
        width: 1200,
        height: 630,
        alt: 'Hệ thống Tra cứu Quy trình tiếp nhận hồ sơ Kết nạp Đảng',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  verification: {
    google: 'Cx6XkiddX1vPfqrc1j8f4lbTWOGqkMrwFYMFngZ2jpg',
  },
  icons: {
    icon: 'https://dangbo.phuongchanhhung.vn/wp-content/uploads/2026/02/cropped-dangbo-phuongchanhhung-vn.webp',
    apple: 'https://dangbo.phuongchanhhung.vn/wp-content/uploads/2026/02/cropped-dangbo-phuongchanhhung-vn.webp',
  },
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
