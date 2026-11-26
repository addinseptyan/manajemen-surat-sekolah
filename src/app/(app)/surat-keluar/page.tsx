import { Suspense } from "react";
import { TablePageSkeleton } from "@/components/shared/page-skeletons";
import { SuratView } from "@/components/shared/surat-view";

export default function SuratKeluarPage() {
  return (
    <Suspense fallback={<TablePageSkeleton />}>
      <SuratView arah="keluar" />
    </Suspense>
  );
}
