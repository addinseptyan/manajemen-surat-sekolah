import { Button, Card, PrimaryButton } from "@/components/ui";
import { mockKlasifikasi } from "@/lib/mock-data";

const COLS = ["arah", "nomor", "urut", "jenis", "tanggal", "pihak", "perihal"];
const EXS = [
  ["keluar", "34.114/001/SK/SMKNST/I/2026", "1", "SK", "2026-01-05", "Seluruh Guru dan Staf", "Penetapan Wali Kelas"],
  ["masuk", "421.5/112/DISDIK/2026", "", "", "2026-01-08", "Dinas Pendidikan", "Edaran Jadwal Asesmen"],
];

export default function ImporPage() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-amber-600">📦 Impor Data Lama</h1>
        <PrimaryButton>✍️ Input Manual + Upload File</PrimaryButton>
      </div>
      <Card className="mb-3">
        <h2 className="mb-2 font-semibold">Cara 1 · Input manual satu per satu</h2>
        <p className="text-sm text-slate-600">Cocok untuk surat yang ada file/scan-nya. File otomatis tersimpan di Google Drive (setelah backend disambungkan).</p>
      </Card>
      <Card>
        <h2 className="mb-2 font-semibold">Cara 2 · Impor banyak data dari CSV</h2>
        <p className="mb-3 text-sm text-slate-500">Kolom wajib: arah, nomor (keluar), tanggal (YYYY-MM-DD), perihal. Jenis: {mockKlasifikasi.map((k) => k.kode).join(", ")}</p>
        <div className="mb-3 flex gap-2"><Button>⬇ Template kosong</Button><Button>⬇ Contoh terisi</Button></div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b">{COLS.map((c) => <th key={c} className="p-2 text-left">{c}</th>)}</tr></thead>
            <tbody>{EXS.map((r, i) => <tr key={i} className="border-b">{r.map((v, j) => <td key={j} className="p-2">{v}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <div className="mt-4"><Button className="border-dashed">Pilih file CSV (demo)</Button></div>
      </Card>
    </div>
  );
}
