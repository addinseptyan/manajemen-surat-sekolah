import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ThemeKey } from "@/lib/types";
import { THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  theme: ThemeKey;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  theme,
  actions,
}: PageHeaderProps) {
  const t = THEMES[theme];
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-xs",
            t.iconBg,
            t.iconText
          )}
        >
          <Icon className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
