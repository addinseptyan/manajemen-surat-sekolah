import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "Manajemen Surat Sekolah — SMK Nusantara Lab",
  description:
    "Aplikasi manajemen surat keluar & surat masuk sekolah berbasis Next.js 16, Tailwind CSS, dan shadcn/ui.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AppProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </body>
    </html>
  );
}
