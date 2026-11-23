import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppProvider } from "@/context/app-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Manajemen Surat — SMK Nusantara Lab",
  description:
    "Aplikasi manajemen surat keluar & surat masuk sekolah berbasis Next.js 16, Tailwind CSS, dan shadcn/ui.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          <AppProvider>
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
