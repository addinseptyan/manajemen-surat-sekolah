import type { LucideIcon } from "lucide-react";
import type { ThemeKey } from "@/lib/types";
import { THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  icon: LucideIcon;
  theme: ThemeKey;
}

export function StatCard({ label, value, hint, icon: Icon, theme }: StatCardProps) {
  const t = THEMES[theme];
  return (
    <Card className={cn("bg-gradient-to-br py-4", t.softCard)}>
      <CardContent className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs font-medium">{label}</p>
          <div className={cn("mt-1.5 text-3xl font-bold tracking-tight", t.accentText)}>
            {value}
          </div>
          {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            t.iconBg,
            t.iconText
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
