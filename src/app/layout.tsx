import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sujata Chaudhury - Portfolio",
  description: "Personal portfolio of Sujata Chaudhury - Computer Science student and software developer",
  icons: {
    icon: [
      { url: '/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/favicon-57.png', sizes: '57x57', type: 'image/png' },
      { url: '/icons/favicon-60.png', sizes: '60x60', type: 'image/png' },
      { url: '/icons/favicon-72.png', sizes: '72x72', type: 'image/png' },
      { url: '/icons/favicon-76.png', sizes: '76x76', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
