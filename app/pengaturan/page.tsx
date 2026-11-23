import { Button, Card, Input, PrimaryButton } from "@/components/ui";
import { mockKlasifikasi, mockPengaturan } from "@/lib/mock-data";

export default function PengaturanPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-bold text-violet-600">⚙️ Pengaturan</h1>
      <Card className="mb-3">
        <h2 className="mb-3 font-semibold">Format nomor surat</h2>
        <Input defaultValue={mockPengaturan.format} />
        <p className="mt-2 text-xs text-slate-500">Token: {"{urut} {jenis} {bulan} (romawi) {tahun}"}. Panjang nomor urut:</p>
        <Input type="number" defaultValue={mockPengaturan.pad} className="mt-2 w-24" />
        <div className="mt-3 rounded-md bg-violet-50 px-3 py-2 font-mono text-sm">Contoh: 34.114/001/SK/SMKNST/I/2026</div>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked={mockPengaturan.trial} /> <b>Mode percobaan</b> — admin boleh menghapus surat keluar</label>
        <PrimaryButton className="mt-3">Simpan pengaturan</PrimaryButton>
      </Card>
      <Card>
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Jenis / klasifikasi surat</h2><PrimaryButton>+ Tambah jenis</PrimaryButton></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs text-violet-600"><th className="p-2">Kode</th><th className="p-2">Nama jenis</th><th className="p-2">Dipakai</th><th className="p-2"></th></tr></thead>
          <tbody>{mockKlasifikasi.map((k) => <tr key={k.kode} className="border-b"><td className="p-2 font-bold">{k.kode}</td><td className="p-2">{k.nama}</td><td className="p-2">-</td><td className="p-2"><Button className="px-2 py-1 text-xs">Ubah</Button></td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
