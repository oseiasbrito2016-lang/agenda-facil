import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PreferencesProvider } from "@/lib/preferences";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgendaFácil",
  description: "Sistema de agendamento online",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <style>{`
          :root {
            --bg: #F5F5F2;
            --bg2: #ffffff;
            --border: #eeeeee;
            --text: #0A0A0A;
            --text2: #666666;
            --text3: #999999;
            --sidebar-bg: #ffffff;
            --sidebar-border: #eeeeee;
            --input-border: #e5e7eb;
            --card-shadow: 0 2px 8px rgba(0,0,0,.04);
          }
          [data-theme="dark"] {
            --bg: #0f0f0f;
            --bg2: #1a1a1a;
            --border: #2a2a2a;
            --text: #f0f0f0;
            --text2: #aaaaaa;
            --text3: #666666;
            --sidebar-bg: #141414;
            --sidebar-border: #2a2a2a;
            --input-border: #333333;
            --card-shadow: 0 2px 8px rgba(0,0,0,.3);
          }
          body { background: var(--bg); color: var(--text); transition: background .2s, color .2s; }
        `}</style>
      </head>
      <body className="min-h-full flex flex-col">
        <PreferencesProvider>
          {children}
        </PreferencesProvider>
      </body>
    </html>
  );
}