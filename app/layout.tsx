import type { Metadata } from "next";
import "./cms.css";

export const metadata: Metadata = {
  title: "Sáng mãi tên Người · Trường Tiểu học Gia Lâm",
  description: "Hành trình của Bác và những bài viết từ Trường Tiểu học Gia Lâm.",
  icons: {
    icon: "/assets/gia-lam-logo.png",
    shortcut: "/assets/gia-lam-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
