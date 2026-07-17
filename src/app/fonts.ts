import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono, Noto_Sans_Devanagari } from "next/font/google";

// Editorial serif for display. Optical size + weight are variable axes.
export const fontDisplay = Fraunces({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Grounded technical sans for body copy.
export const fontBody = IBM_Plex_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Monospace for metadata, coordinates, dates, code.
export const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

// Devanagari fallback — CSS activates it only when :lang(hi). Latin visitors
// won't request this file thanks to preload=false + conditional class usage.
export const fontDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600"],
  variable: "--font-deva",
  display: "swap",
  preload: false,
});

export const fontClassNames = [
  fontDisplay.variable,
  fontBody.variable,
  fontMono.variable,
  fontDevanagari.variable,
].join(" ");
