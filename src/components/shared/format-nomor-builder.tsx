"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DYNAMIC_TOKENS: Record<
  string,
  { label: string; badgeClass: string }
> = {
  "{urut}": {
    label: "Nomor Urut",
    badgeClass:
      "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200",
  },
  "{jenis}": {
    label: "Kode Jenis",
    badgeClass:
      "border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950/60 dark:text-violet-200",
  },
  "{bulan}": {
    label: "Bulan Romawi",
    badgeClass:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200",
  },
  "{tahun}": {
    label: "Tahun",
    badgeClass:
      "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200",
  },
};

const DEFAULT_FORMAT = "{urut}/34.114/{jenis}/SMKNST/{bulan}/{tahun}";

interface FormatNomorBuilderProps {
  value: string;
  onChange: (nextFormat: string) => void;
}

export function FormatNomorBuilder({ value, onChange }: FormatNomorBuilderProps) {
  const segments = value.split("/");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function updateSegments(next: string[]) {
    onChange(next.join("/"));
  }

  function moveSegment(from: number, to: number) {
    if (to < 0 || to >= segments.length || from === to) return;
    const copy = [...segments];
    const [moved] = copy.splice(from, 1);
    copy.splice(to, 0, moved);
    updateSegments(copy);
  }

  function updateTextSegment(idx: number, newText: string) {
    const clean = newText.replace(/\//g, "");
    const copy = [...segments];
    copy[idx] = clean;
    updateSegments(copy);
  }

  function removeSegment(idx: number) {
    if (segments.length <= 1) return;
    updateSegments(segments.filter((_, i) => i !== idx));
  }

  function addCustomSegment() {
    updateSegments([...segments, "KODE"]);
  }

  function addToken(token: string) {
    if (segments.includes(token)) return;
    updateSegments([...segments, token]);
  }

  const missingTokens = Object.keys(DYNAMIC_TOKENS).filter(
    (t) => !segments.includes(t)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          <b>Drag &amp; geser</b> blok (atau gunakan tombol panah di HP) untuk mengubah urutan, dan{" "}
          <b>ketik langsung</b> pada blok teks tetap (<code className="font-mono">34.114</code>,{" "}
          <code className="font-mono">SMKNST</code>).
        </p>
        <div className="flex items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={addCustomSegment}>
            <Plus className="size-3.5" />
            Teks Tetap
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(DEFAULT_FORMAT)}
            title="Kembalikan ke urutan bawaan sekolah"
          >
            <RotateCcw className="size-3.5" />
            Reset Default
          </Button>
        </div>
      </div>

      {/* Area Blok Segmen Draggable */}
      <div className="bg-muted/50 flex flex-wrap items-center gap-2 rounded-xl border border-border p-3.5">
        {segments.map((seg, idx) => {
          const tokenMeta = DYNAMIC_TOKENS[seg];
          const isOver = dragOverIndex === idx && dragIndex !== idx;

          return (
            <div key={`${idx}-${tokenMeta ? seg : "txt"}`} className="flex items-center gap-2">
              <div
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverIndex(idx);
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) moveSegment(dragIndex, idx);
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDragOverIndex(null);
                }}
                className={cn(
                  "group flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 shadow-2xs transition-all select-none",
                  tokenMeta
                    ? tokenMeta.badgeClass
                    : "bg-card text-foreground border-border",
                  dragIndex === idx && "opacity-45",
                  isOver && "ring-2 ring-violet-500"
                )}
              >
                <GripVertical className="size-3.5 shrink-0 cursor-grab opacity-50 active:cursor-grabbing" />

                {tokenMeta ? (
                  <div className="px-0.5">
                    <div className="text-[10px] leading-none font-semibold opacity-75">
                      {tokenMeta.label}
                    </div>
                    <div className="mt-0.5 font-mono text-xs font-bold">{seg}</div>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-[10px] leading-none font-medium">
                      Teks Tetap
                    </span>
                    <input
                      type="text"
                      value={seg}
                      onChange={(e) => updateTextSegment(idx, e.target.value)}
                      aria-label="Ubah teks segmen"
                      className="text-foreground mt-0.5 w-20 border-b border-dashed border-border bg-transparent font-mono text-xs font-bold focus:border-violet-500 focus:outline-none"
                    />
                  </div>
                )}

                <div className="ml-1 flex items-center gap-0.5 opacity-80 sm:opacity-60 sm:group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSegment(idx, idx - 1)}
                    className="cursor-pointer rounded p-1 hover:bg-black/10 disabled:opacity-25 dark:hover:bg-white/10"
                    title="Geser kiri"
                  >
                    <ArrowLeft className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === segments.length - 1}
                    onClick={() => moveSegment(idx, idx + 1)}
                    className="cursor-pointer rounded p-1 hover:bg-black/10 disabled:opacity-25 dark:hover:bg-white/10"
                    title="Geser kanan"
                  >
                    <ArrowRight className="size-3.5" />
                  </button>
                  {segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(idx)}
                      className="cursor-pointer rounded p-1 text-red-500 hover:bg-red-500/15"
                      title="Hapus segmen"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {idx < segments.length - 1 && (
                <span className="text-muted-foreground font-mono text-base font-bold">/</span>
              )}
            </div>
          );
        })}
      </div>

      {missingTokens.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground">Tambahkan variabel:</span>
          {missingTokens.map((t) => (
            <Button
              key={t}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addToken(t)}
              className="h-7 font-mono text-xs"
            >
              + {t}
            </Button>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <span className="text-muted-foreground text-[11px] font-medium">
          String Format Lengkap (Sinkron Otomatis):
        </span>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-xs"
        />
      </div>
    </div>
  );
}
