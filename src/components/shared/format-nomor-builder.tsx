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
    badgeClass: "border-blue-300 bg-blue-50 text-blue-800",
  },
  "{jenis}": {
    label: "Kode Jenis",
    badgeClass: "border-violet-300 bg-violet-50 text-violet-800",
  },
  "{bulan}": {
    label: "Bulan Romawi",
    badgeClass: "border-emerald-300 bg-emerald-50 text-emerald-800",
  },
  "{tahun}": {
    label: "Tahun",
    badgeClass: "border-amber-300 bg-amber-50 text-amber-900",
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
    // Cegah garis miring di dalam satu segmen agar struktur tetap rapi
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
        <p className="text-xs text-slate-500">
          <b>Drag &amp; geser</b> blok di bawah untuk mengubah urutan, atau <b>ketik langsung</b>{" "}
          pada kotak teks sekolah (<code className="font-mono">34.114</code>,{" "}
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
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
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
                    : "border-slate-300 bg-white text-slate-800",
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
                    <span className="text-[10px] leading-none font-medium text-slate-400">
                      Teks Tetap
                    </span>
                    <input
                      type="text"
                      value={seg}
                      onChange={(e) => updateTextSegment(idx, e.target.value)}
                      aria-label="Ubah teks segmen"
                      className="mt-0.5 w-20 border-b border-dashed border-slate-300 bg-transparent font-mono text-xs font-bold text-slate-900 focus:border-violet-600 focus:outline-none"
                    />
                  </div>
                )}

                {/* Tombol geser kecil untuk layar sentuh / aksesibilitas */}
                <div className="ml-1 flex items-center gap-0.5 opacity-60 group-hover:opacity-100">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveSegment(idx, idx - 1)}
                    className="cursor-pointer rounded p-0.5 hover:bg-black/5 disabled:opacity-25"
                    title="Geser kiri"
                  >
                    <ArrowLeft className="size-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === segments.length - 1}
                    onClick={() => moveSegment(idx, idx + 1)}
                    className="cursor-pointer rounded p-0.5 hover:bg-black/5 disabled:opacity-25"
                    title="Geser kanan"
                  >
                    <ArrowRight className="size-3" />
                  </button>
                  {segments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSegment(idx)}
                      className="cursor-pointer rounded p-0.5 text-red-600 hover:bg-red-100/60"
                      title="Hapus segmen"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>
              </div>

              {idx < segments.length - 1 && (
                <span className="font-mono text-base font-bold text-slate-400">/</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Tombol kembalikan token variabel yang sempat dihapus */}
      {missingTokens.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500">Tambahkan variabel:</span>
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

      {/* Sinkronisasi string manual */}
      <div className="space-y-1">
        <span className="text-[11px] font-medium text-slate-500">
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
