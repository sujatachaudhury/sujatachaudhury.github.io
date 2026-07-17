import type { Metadata } from "next";
import { fontClassNames } from "./fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sujatachaudhury.github.io"),
  title: {
    default: "Sujata Chaudhury — ML & Computer Vision Engineer",
    template: "%s · Sujata Chaudhury",
  },
  description:
    "ML & Computer Vision Engineer. Erasmus Mundus MSc Imaging at Politecnico di Milano and Tampere University.",
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/icons/favicon-57.png", sizes: "57x57" },
      { url: "/icons/favicon-60.png", sizes: "60x60" },
      { url: "/icons/favicon-72.png", sizes: "72x72" },
      { url: "/icons/favicon-76.png", sizes: "76x76" },
    ],
  },
};

// The [locale] segment supplies its own <html lang="…">, so this root layout
// stays minimal and lets each locale layout own the language declaration.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={fontClassNames}>{children}</body>
    </html>
  );
}
