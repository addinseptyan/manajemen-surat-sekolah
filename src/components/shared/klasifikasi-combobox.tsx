"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import type { Klasifikasi } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface KlasifikasiComboboxProps {
  items: Klasifikasi[];
  value: string;
  onValueChange: (value: string) => void;
  includeAllOption?: boolean;
  allLabel?: string;
  placeholder?: string;
  className?: string;
}

export function KlasifikasiCombobox({
  items,
  value,
  onValueChange,
  includeAllOption = false,
  allLabel = "Semua Jenis",
  placeholder = "Pilih jenis surat...",
  className,
}: KlasifikasiComboboxProps) {
  const [open, setOpen] = useState(false);

  const selected = items.find((item) => item.kode === value);
  const displayLabel =
    includeAllOption && value === "ALL"
      ? allLabel
      : selected
        ? `${selected.kode} — ${selected.nama}`
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-white px-3 font-normal text-slate-800 hover:bg-slate-50",
            className
          )}
        >
          <span className="truncate text-left">{displayLabel}</span>
          <ChevronsUpDown className="ml-1 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Ketik kode atau nama jenis..." />
          <CommandList>
            <CommandEmpty>Jenis surat tidak ditemukan.</CommandEmpty>
            <CommandGroup>
              {includeAllOption && (
                <CommandItem
                  value={`ALL ${allLabel}`}
                  onSelect={() => {
                    onValueChange("ALL");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 text-indigo-600",
                      value === "ALL" ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="font-medium">{allLabel}</span>
                </CommandItem>
              )}

              {items.map((item) => (
                <CommandItem
                  key={item.kode}
                  value={`${item.kode} ${item.nama}`}
                  onSelect={() => {
                    onValueChange(item.kode);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 text-indigo-600",
                      value === item.kode ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="w-12 shrink-0 font-mono text-xs font-bold text-indigo-700">
                    {item.kode}
                  </span>
                  <span className="truncate text-slate-700">{item.nama}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
