"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Ganti tema Terang / Gelap"
      title={isDark ? "Beralih ke Mode Terang" : "Beralih ke Mode Gelap"}
      className={className}
    >
      <Sun className="size-4 scale-100 rotate-0 text-amber-500 transition-all duration-300 dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-4 scale-0 rotate-90 text-indigo-300 transition-all duration-300 dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
