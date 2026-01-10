import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { DemoUserProvider } from "@/contexts/DemoUserContext";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { ConditionalContainer } from "@/components/ConditionalContainer";
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
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.variable} antialiased`}
          style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}
        >
          <DemoUserProvider>
            <AppShell>
              <ConditionalHeader />
              <main style={{ flex: 1 }}>
                <ConditionalContainer>
                  {children}
                </ConditionalContainer>
              </main>
              <ToastContainer />
            </AppShell>
          </DemoUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
