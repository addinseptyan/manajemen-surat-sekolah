"use client";
import { useState } from "react";
import { Badge, Button, Card, Input, PrimaryButton } from "@/components/ui";
import { mockKlasifikasi, mockSurat } from "@/lib/mock-data";

export default function SuratKeluarPage() {
  const [q, setQ] = useState("");
  const rows = mockSurat.filter((s) => s.arah === "keluar" && (!q || [s.nomor, s.pihak, s.perihal].join(" ").toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-blue-600">📤 Surat Keluar</h1>
        <div className="flex gap-2"><Button>Excel</Button><Button>PDF</Button><PrimaryButton>+ Tambah</PrimaryButton></div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Input placeholder="Cari nomor, tujuan, perihal" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className="rounded-md border border-slate-300 px-3 py-2 text-sm"><option>Semua jenis</option>{mockKlasifikasi.map((k) => <option key={k.kode}>{k.kode}</option>)}</select>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs text-blue-600"><th className="p-3">Tanggal</th><th className="p-3">Nomor</th><th className="p-3">Tujuan</th><th className="p-3">Perihal</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-b hover:bg-slate-50 ${r.status === "Batal" ? "opacity-60" : ""}`}>
                <td className="p-3">{r.tanggal}</td>
                <td className="p-3"><span className="font-mono">{r.nomor}</span><div className="text-xs text-slate-400">oleh {r.pembuat}</div></td>
                <td className="p-3">{r.pihak}</td>
                <td className="p-3">{r.perihal}{r.status === "Batal" && r.alasanBatal ? <div className="text-xs text-red-600">⛔ {r.alasanBatal}</div> : null}</td>
                <td className="p-3"><Badge tone={r.status === "Batal" ? "red" : "green"}>{r.status}</Badge></td>
                <td className="p-3"><Button className="px-2 py-1 text-xs">Ubah</Button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={6} className="p-4 text-center text-slate-400">Tidak ada data</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-xs text-slate-400">Menampilkan {rows.length} dari {rows.length} (demo)</p>
    </div>
  );
}
