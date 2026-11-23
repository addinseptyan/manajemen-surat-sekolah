import { Badge, Button, Card, PrimaryButton } from "@/components/ui";
import { mockUsers } from "@/lib/mock-data";

export default function PegawaiPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-pink-600">👥 Pegawai</h1>
        <PrimaryButton>+ Tambah</PrimaryButton>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left text-xs text-pink-600"><th className="p-3">Nama</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead>
          <tbody>
            {mockUsers.map((u) => (
              <tr key={u.id} className="border-b hover:bg-slate-50">
                <td className="p-3">{u.nama}</td>
                <td className="p-3"><Badge tone={u.role === "admin" ? "purple" : "blue"}>{u.role}</Badge></td>
                <td className="p-3"><Badge tone={u.aktif ? "green" : "slate"}>{u.aktif ? "Aktif" : "Nonaktif"}</Badge></td>
                <td className="p-3"><Button className="px-2 py-1 text-xs">Ubah</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
