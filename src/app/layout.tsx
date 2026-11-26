import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/app-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { INITIAL_PENGATURAN } from "@/lib/mock-data";
import { getPengaturanData } from "@/lib/repository";
import { formatBrowserTitle } from "@/lib/version";

async function loadInitialPengaturan() {
  try {
    return await getPengaturanData();
  } catch {
    return INITIAL_PENGATURAN;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const pengaturan = await loadInitialPengaturan();
  return {
    title: formatBrowserTitle(pengaturan.namaAplikasi, pengaturan.namaSekolah),
    description:
      "Aplikasi manajemen surat keluar & surat masuk sekolah berbasis Next.js 16, Tailwind CSS, dan shadcn/ui.",
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const initialPengaturan = await loadInitialPengaturan();

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AppProvider initialPengaturan={initialPengaturan}>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
