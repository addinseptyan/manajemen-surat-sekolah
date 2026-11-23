import { Card, Badge } from "@/components/ui";
import { mockSurat } from "@/lib/mock-data";

const BULAN = "Jan Feb Mar Apr Mei Jun Jul Agu Sep Okt Nov Des".split(" ");

export default function DashboardPage() {
  const keluar = mockSurat.filter((s) => s.arah === "keluar" && s.status === "Aktif").length;
  const masuk = mockSurat.filter((s) => s.arah === "masuk").length;
  const batal = mockSurat.filter((s) => s.status === "Batal").length;
  const bulan = Array.from({ length: 12 }, () => ({ masuk: 0, keluar: 0 }));
  mockSurat.forEach((s) => { const m = Number(s.tanggal.slice(5, 7)) - 1; if (bulan[m]) bulan[m][s.arah]++; });
  const maks = Math.max(1, ...bulan.map((b) => b.masuk + b.keluar));
  const jenis: Record<string, number> = {};
  mockSurat.filter((s) => s.arah === "keluar").forEach((s) => { jenis[s.jenis] = (jenis[s.jenis] || 0) + 1; });

  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-indigo-600">📊 Dashboard 2026</h1>
      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-100 to-white"><div className="text-3xl font-bold text-blue-600">{keluar}</div><span className="text-sm text-slate-500">📤 Surat keluar</span></Card>
        <Card className="bg-gradient-to-br from-emerald-100 to-white"><div className="text-3xl font-bold text-emerald-600">{masuk}</div><span className="text-sm text-slate-500">📥 Surat masuk</span></Card>
        <Card className="bg-gradient-to-br from-red-100 to-white"><div className="text-3xl font-bold text-red-600">{batal}</div><span className="text-sm text-slate-500">⛔ Nomor dibatalkan</span></Card>
      </div>
      <Card className="mb-3 bg-gradient-to-br from-violet-100 to-white">
        <h2 className="mb-2 font-semibold">Nomor surat keluar berikutnya</h2>
        <div className="rounded-md border border-dashed border-violet-400 bg-white px-3 py-2 font-mono text-violet-800">34.114/004/SK/SMKNST/II/2026 (contoh)</div>
      </Card>
      <Card>
        <h2 className="mb-3 font-semibold">Surat per bulan</h2>
        <div className="flex h-32 items-end gap-2">
          {bulan.map((b, i) => (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1 text-[10px] text-slate-500">
              <span>{b.masuk + b.keluar}</span>
              <div className="w-full rounded-t bg-blue-600" style={{ height: `${(b.keluar / maks) * 80}px` }} />
              <div className="w-full rounded-t bg-emerald-600" style={{ height: `${(b.masuk / maks) * 80}px` }} />
              <span>{BULAN[i]}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-3">
        <h2 className="mb-2 font-semibold">Surat keluar per jenis</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(jenis).map(([k, v]) => <Badge key={k} tone="blue">{k}: {v}</Badge>)}
        </div>
      </Card>
    </div>
  );
}
