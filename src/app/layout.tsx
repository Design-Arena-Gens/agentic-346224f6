import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "ShortWave Agent",
  description: "Autonomous agent that uploads YouTube Shorts with structured metadata."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-shell">{children}</div>
        <footer className="footer">
          <span>Built for seamless Shorts publishing using the YouTube Data API.</span>
        </footer>
      </body>
    </html>
  );
}
