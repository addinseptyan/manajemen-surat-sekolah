import {
  Inbox,
  LayoutDashboard,
  Send,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ThemeKey } from "./types";

export interface ThemeStyle {
  iconBg: string;
  iconText: string;
  activeNav: string;
  accentText: string;
  softCard: string;
  buttonPrimary: string;
  ring: string;
}

export const THEMES: Record<ThemeKey, ThemeStyle> = {
  indigo: {
    iconBg: "bg-indigo-100 dark:bg-indigo-950/70",
    iconText: "text-indigo-600 dark:text-indigo-300",
    activeNav: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/25",
    accentText: "text-indigo-600 dark:text-indigo-400",
    softCard:
      "from-indigo-50/80 via-white to-white border-indigo-100 dark:from-indigo-950/35 dark:via-card dark:to-card dark:border-indigo-900/50",
    buttonPrimary: "bg-indigo-600 text-white hover:bg-indigo-700",
    ring: "focus-visible:ring-indigo-500",
  },
  blue: {
    iconBg: "bg-blue-100 dark:bg-blue-950/70",
    iconText: "text-blue-600 dark:text-blue-300",
    activeNav: "bg-blue-600 text-white shadow-sm shadow-blue-600/25",
    accentText: "text-blue-600 dark:text-blue-400",
    softCard:
      "from-blue-50/80 via-white to-white border-blue-100 dark:from-blue-950/35 dark:via-card dark:to-card dark:border-blue-900/50",
    buttonPrimary: "bg-blue-600 text-white hover:bg-blue-700",
    ring: "focus-visible:ring-blue-500",
  },
  emerald: {
    iconBg: "bg-emerald-100 dark:bg-emerald-950/70",
    iconText: "text-emerald-600 dark:text-emerald-300",
    activeNav: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25",
    accentText: "text-emerald-600 dark:text-emerald-400",
    softCard:
      "from-emerald-50/80 via-white to-white border-emerald-100 dark:from-emerald-950/35 dark:via-card dark:to-card dark:border-emerald-900/50",
    buttonPrimary: "bg-emerald-600 text-white hover:bg-emerald-700",
    ring: "focus-visible:ring-emerald-500",
  },
  amber: {
    iconBg: "bg-amber-100 dark:bg-amber-950/70",
    iconText: "text-amber-700 dark:text-amber-300",
    activeNav: "bg-amber-600 text-white shadow-sm shadow-amber-600/25",
    accentText: "text-amber-600 dark:text-amber-400",
    softCard:
      "from-amber-50/80 via-white to-white border-amber-100 dark:from-amber-950/35 dark:via-card dark:to-card dark:border-amber-900/50",
    buttonPrimary: "bg-amber-600 text-white hover:bg-amber-700",
    ring: "focus-visible:ring-amber-500",
  },
  violet: {
    iconBg: "bg-violet-100 dark:bg-violet-950/70",
    iconText: "text-violet-600 dark:text-violet-300",
    activeNav: "bg-violet-600 text-white shadow-sm shadow-violet-600/25",
    accentText: "text-violet-600 dark:text-violet-400",
    softCard:
      "from-violet-50/80 via-white to-white border-violet-100 dark:from-violet-950/35 dark:via-card dark:to-card dark:border-violet-900/50",
    buttonPrimary: "bg-violet-600 text-white hover:bg-violet-700",
    ring: "focus-visible:ring-violet-500",
  },
  rose: {
    iconBg: "bg-rose-100 dark:bg-rose-950/70",
    iconText: "text-rose-600 dark:text-rose-300",
    activeNav: "bg-rose-600 text-white shadow-sm shadow-rose-600/25",
    accentText: "text-rose-600 dark:text-rose-400",
    softCard:
      "from-rose-50/80 via-white to-white border-rose-100 dark:from-rose-950/35 dark:via-card dark:to-card dark:border-rose-900/50",
    buttonPrimary: "bg-rose-600 text-white hover:bg-rose-700",
    ring: "focus-visible:ring-rose-500",
  },
};

export interface NavItem {
  href: string;
  label: string;
  description: string;
  theme: ThemeKey;
  icon: LucideIcon;
  group: "operasional" | "administrasi";
  adminOnly?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Ringkasan statistik, tunggakan arsip & nomor berikutnya",
    theme: "indigo",
    icon: LayoutDashboard,
    group: "operasional",
  },
  {
    href: "/surat-keluar",
    label: "Surat Keluar",
    description: "Penomoran otomatis, slot kosong & arsip keluar",
    theme: "blue",
    icon: Send,
    group: "operasional",
  },
  {
    href: "/surat-masuk",
    label: "Surat Masuk",
    description: "Registrasi surat masuk & disposisi",
    theme: "emerald",
    icon: Inbox,
    group: "operasional",
  },
  {
    href: "/pengaturan",
    label: "Pengaturan",
    description: "Identitas aplikasi, format nomor, klasifikasi & disposisi",
    theme: "violet",
    icon: Settings,
    group: "administrasi",
    adminOnly: true,
  },
  {
    href: "/pegawai",
    label: "Pegawai",
    description: "Kelola akun & hak akses staf",
    theme: "rose",
    icon: Users,
    group: "administrasi",
    adminOnly: true,
  },
];
