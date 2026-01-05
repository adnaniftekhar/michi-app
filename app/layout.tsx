import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DemoUserProvider } from "@/contexts/DemoUserContext";
import { Header } from "@/components/Header";
import { AppShell } from "@/components/ui/AppShell";
import { ToastContainer } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "michi",
  description: "Learn while you travel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
        style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
      >
        <DemoUserProvider>
          <AppShell>
            <Header />
            <main style={{ flex: 1 }}>
              <div className="container mx-auto" style={{ 
                maxWidth: '1100px',
                paddingLeft: 'var(--spacing-4)',
                paddingRight: 'var(--spacing-4)',
                paddingTop: 'var(--spacing-8)',
                paddingBottom: 'var(--spacing-8)',
              }}>
                {children}
              </div>
            </main>
            <ToastContainer />
          </AppShell>
        </DemoUserProvider>
      </body>
    </html>
  );
}
