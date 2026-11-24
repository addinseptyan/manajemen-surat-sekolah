import crypto from "node:crypto";
import {
  renameDriveFileIfNeeded,
  trashDriveFileIfNeeded,
  uploadSuratFileToDrive,
} from "./drive-storage";
import { extractDriveFileId, isDemoMode } from "./google";
import {
  INITIAL_DISPOSISI,
  INITIAL_KLASIFIKASI,
  INITIAL_PENGATURAN,
  INITIAL_SURAT,
} from "./mock-data";
import {
  appendAuditLog,
  appendSheetRows,
  deleteSheetRow,
  normalizeSheetDate,
  readSheetRows,
  updateSheetRow,
} from "./sheets-db";
import type {
  Arah,
  DisposisiJabatan,
  Klasifikasi,
  Pengaturan,
  Surat,
  User,
} from "./types";
import { formatNomorSurat } from "./utils";

interface DemoMemoryState {
  suratList: Surat[];
  klasifikasiList: Klasifikasi[];
  disposisiList: DisposisiJabatan[];
  pengaturan: Pengaturan;
  demoFiles: Map<
    string,
    { buffer: Buffer; mimeType: string; fileName: string }
  >;
}

const globalForRepo = globalThis as unknown as {
  __demoMemoryRepo?: DemoMemoryState;
};

function getDemoRepo(): DemoMemoryState {
  if (!globalForRepo.__demoMemoryRepo) {
    globalForRepo.__demoMemoryRepo = {
      suratList: [...INITIAL_SURAT],
      klasifikasiList: [...INITIAL_KLASIFIKASI],
      disposisiList: [...INITIAL_DISPOSISI],
      pengaturan: { ...INITIAL_PENGATURAN },
      demoFiles: new Map(),
    };
  }
  return globalForRepo.__demoMemoryRepo;
}

export function getDemoUploadedFile(fileId: string) {
  return getDemoRepo().demoFiles.get(fileId);
}

function sortKlasifikasi(list: Klasifikasi[]): Klasifikasi[] {
  return [...list].sort((a, b) =>
    a.kode.localeCompare(b.kode, "id", { sensitivity: "base", numeric: true })
  );
}

function parseBool(raw: string | undefined, def = true): boolean {
  if (raw === undefined || raw === "") return def;
  const v = raw.trim().toLowerCase();
  return !(v === "false" || v === "0" || v === "tidak");
}

function deriveDisplayFileName(
  nomor: string,
  arah: Arah,
  tanggal: string,
  rawFileUrl: string
): string | undefined {
  if (!rawFileUrl) return undefined;
  if (rawFileUrl === "#demo-file") {
    return nomor
      ? `${nomor.replace(/[\\/:*?"<>|]+/g, "-")}.pdf`
      : `Arsip-${arah}-${tanggal}.pdf`;
  }
  const cleanNomor = nomor
    ? nomor.replace(/[\\/:*?"<>|]+/g, "-")
    : `lampiran-${arah}-${tanggal}`;
  return `${cleanNomor}.pdf`;
}

/** Konversi baris tab Surat di Google Sheets menjadi objek Surat UI (100% kompatibel data lama Apps Script). */
function mapSheetRowToSurat(r: Record<string, string>): (Surat & { _row: number; _rawFileUrl: string; _legacyBatal: boolean }) {
  const arah: Arah = r.arah === "masuk" ? "masuk" : "keluar";
  const tanggal = normalizeSheetDate(r.tanggal) || new Date().toISOString().slice(0, 10);
  const tahun = Number(r.tahun) || Number(tanggal.slice(0, 4)) || new Date().getFullYear();
  const urutNum = Number(r.urut);
  const urut: number | "" = arah === "keluar" && urutNum > 0 ? urutNum : "";

  const rawFileUrl = String(r.fileUrl || "").trim();
  const fileId = extractDriveFileId(rawFileUrl);
  const proxyUrl = fileId ? `/api/files/${fileId}` : rawFileUrl;

  const isGap = r.status === "Belum Lengkap";
  const isLegacyBatal = r.status === "Batal";

  return {
    _row: Number(r._row) || 0,
    _rawFileUrl: rawFileUrl,
    _legacyBatal: isLegacyBatal,
    id: r.id || `row-${r._row}`,
    arah,
    nomor: r.nomor || "",
    urut,
    tahun,
    jenis: r.jenis || "",
    tanggal,
    pihak: r.pihak || "-",
    perihal: isLegacyBatal
      ? `[Arsip Lama Dibatalkan] ${r.perihal || ""}`
      : r.perihal || "",
    catatan: r.catatan || "",
    fileName: proxyUrl
      ? deriveDisplayFileName(r.nomor || "", arah, tanggal, rawFileUrl)
      : undefined,
    fileUrl: proxyUrl,
    fileMime: proxyUrl ? "application/pdf" : undefined,
    status: isGap ? "Belum Lengkap" : "Lengkap",
    pembuat: r.pembuat || "-",
    dibuat: normalizeSheetDate(r.dibuat) || tanggal,
  };
}

export async function getPengaturanData(): Promise<Pengaturan> {
  if (isDemoMode()) {
    return getDemoRepo().pengaturan;
  }

  const rows = await readSheetRows("Pengaturan");
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (r.key) map[r.key] = r.value ?? "";
  }

  return {
    namaAplikasi: map.namaAplikasi || INITIAL_PENGATURAN.namaAplikasi,
    instansiInduk: map.instansiInduk ?? INITIAL_PENGATURAN.instansiInduk,
    namaSekolah: map.namaSekolah || INITIAL_PENGATURAN.namaSekolah,
    alamatSekolah: map.alamatSekolah ?? INITIAL_PENGATURAN.alamatSekolah,
    kotaSurat: map.kotaSurat || INITIAL_PENGATURAN.kotaSurat,
    namaKepsek: map.namaKepsek ?? INITIAL_PENGATURAN.namaKepsek,
    nipKepsek: map.nipKepsek ?? INITIAL_PENGATURAN.nipKepsek,
    format: map.format || INITIAL_PENGATURAN.format,
    pad: Math.max(1, Math.min(6, Number(map.pad) || INITIAL_PENGATURAN.pad)),
  };
}

export async function getBootstrapData(): Promise<{
  suratList: Surat[];
  klasifikasiList: Klasifikasi[];
  disposisiList: DisposisiJabatan[];
  pengaturan: Pengaturan;
}> {
  if (isDemoMode()) {
    const repo = getDemoRepo();
    return {
      suratList: repo.suratList,
      klasifikasiList: sortKlasifikasi(repo.klasifikasiList),
      disposisiList: repo.disposisiList,
      pengaturan: repo.pengaturan,
    };
  }

  const [suratRows, klasRows, dispRows, pengaturan] = await Promise.all([
    readSheetRows("Surat"),
    readSheetRows("Klasifikasi"),
    readSheetRows("Disposisi"),
    getPengaturanData(),
  ]);

  const suratList: Surat[] = suratRows
    .map(mapSheetRowToSurat)
    .map(({ _row: _r, _rawFileUrl: _rf, _legacyBatal: _lb, ...clean }) => clean);

  const klasifikasiList = sortKlasifikasi(
    klasRows.map((k) => ({ kode: k.kode, nama: k.nama }))
  );

  const disposisiList: DisposisiJabatan[] = dispRows.map((d) => ({
    id: d.id,
    nama: d.nama,
    aktif: parseBool(d.aktif, true),
  }));

  return {
    suratList,
    klasifikasiList,
    disposisiList,
    pengaturan,
  };
}

function calcNextUrut(list: Surat[], tahun: number): number {
  const max = list
    .filter(
      (s) => s.arah === "keluar" && s.tahun === tahun && typeof s.urut === "number"
    )
    .reduce((acc, s) => Math.max(acc, Number(s.urut) || 0), 0);
  return max + 1;
}

function calcMissingUrutBefore(
  list: Surat[],
  tahun: number,
  targetUrut: number
): number[] {
  if (targetUrut <= 1) return [];
  const used = new Set(
    list
      .filter(
        (s) => s.arah === "keluar" && s.tahun === tahun && typeof s.urut === "number"
      )
      .map((s) => Number(s.urut))
  );
  const gaps: number[] = [];
  for (let n = 1; n < targetUrut; n++) {
    if (!used.has(n)) gaps.push(n);
  }
  return gaps;
}

export interface SaveSuratPayload {
  id?: string;
  arah: Arah;
  urutManual?: number;
  nomorManual?: string;
  jenis: string;
  tanggal: string;
  pihak: string;
  perihal: string;
  catatan: string;
  uploadedFile?: {
    buffer: Buffer;
    mimeType: string;
    originalName: string;
  };
}

export async function saveSuratRecord(
  actor: User,
  payload: SaveSuratPayload
): Promise<{
  ok: boolean;
  saved?: Surat;
  suratList?: Surat[];
  generatedGaps?: number[];
  error?: string;
}> {
  const tanggal = normalizeSheetDate(payload.tanggal);
  const pihak = String(payload.pihak || "").trim();
  const perihal = String(payload.perihal || "").trim();
  if (!tanggal || !pihak || !perihal) {
    return { ok: false, error: "Tanggal, pihak, dan perihal wajib diisi." };
  }

  const tahun = Number(tanggal.slice(0, 4)) || new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);

  // ================= MODE DEMO (IN-MEMORY) =================
  if (isDemoMode()) {
    const repo = getDemoRepo();
    const { pengaturan } = repo;

    const targetId = payload.id;
    const nextNormalUrut = calcNextUrut(repo.suratList, tahun);
    if (
      !targetId &&
      payload.arah === "keluar" &&
      payload.urutManual !== undefined &&
      payload.urutManual < nextNormalUrut
    ) {
      return {
        ok: false,
        error: `Nomor urut baru minimal ${String(nextNormalUrut).padStart(
          pengaturan.pad,
          "0"
        )} atau lebih besar. Untuk mengisi nomor kosong sebelumnya, gunakan tombol Lengkapi.`,
      };
    }

    let demoFileUrl: string | undefined;
    let demoFileName: string | undefined;
    let demoFileMime: string | undefined;

    if (payload.uploadedFile) {
      const fid = `demo-${Date.now()}`;
      repo.demoFiles.set(fid, {
        buffer: payload.uploadedFile.buffer,
        mimeType: payload.uploadedFile.mimeType,
        fileName: payload.uploadedFile.originalName,
      });
      demoFileUrl = `/api/files/${fid}`;
      demoFileName = payload.uploadedFile.originalName;
      demoFileMime = payload.uploadedFile.mimeType;
    }

    if (targetId) {
      const existing = repo.suratList.find((s) => s.id === targetId);
      if (!existing) {
        return { ok: false, error: "Data surat tidak ditemukan." };
      }
      const canManage =
        actor.role === "admin" ||
        existing.pembuat === actor.nama ||
        existing.status === "Belum Lengkap";
      if (!canManage) {
        return {
          ok: false,
          error: "Anda hanya dapat mengubah surat yang Anda catat sendiri.",
        };
      }

      const finalUrut =
        existing.arah === "keluar"
          ? payload.urutManual ??
            (typeof existing.urut === "number" ? existing.urut : 1)
          : "";
      const nextNomor =
        existing.arah === "keluar" && typeof finalUrut === "number"
          ? payload.nomorManual?.trim() ||
            formatNomorSurat(
              pengaturan.format,
              pengaturan.pad,
              finalUrut,
              payload.jenis,
              tanggal
            )
          : payload.nomorManual?.trim() ?? existing.nomor;

      const updated: Surat = {
        ...existing,
        urut: finalUrut,
        jenis: existing.arah === "keluar" ? payload.jenis : "",
        nomor: nextNomor,
        tahun,
        tanggal,
        pihak,
        perihal,
        catatan: payload.catatan.trim(),
        fileName: demoFileName ?? existing.fileName,
        fileUrl: demoFileUrl ?? existing.fileUrl,
        fileMime: demoFileMime ?? existing.fileMime,
        status: "Lengkap",
        pembuat:
          existing.status === "Belum Lengkap" ? actor.nama : existing.pembuat,
      };

      repo.suratList = repo.suratList.map((s) =>
        s.id === targetId ? updated : s
      );
      return {
        ok: true,
        saved: updated,
        suratList: repo.suratList,
        generatedGaps: [],
      };
    }

    const targetUrut =
      payload.arah === "keluar"
        ? Math.max(1, payload.urutManual ?? calcNextUrut(repo.suratList, tahun))
        : ("" as const);

    const generatedGaps =
      payload.arah === "keluar" && typeof targetUrut === "number"
        ? calcMissingUrutBefore(repo.suratList, tahun, targetUrut)
        : [];

    const gapItems: Surat[] = generatedGaps.map((n) => {
      const padStr = String(n).padStart(pengaturan.pad, "0");
      return {
        id: `gap-${tahun}-${n}-${Date.now()}`,
        arah: "keluar",
        nomor: formatNomorSurat(
          pengaturan.format,
          pengaturan.pad,
          n,
          "---",
          tanggal
        ),
        urut: n,
        tahun,
        jenis: "",
        tanggal,
        pihak: "— (Berkas fisik belum ditemukan)",
        perihal: `Slot Nomor Urut ${padStr} Kosong — Harap cari arsip fisik & unggah scan`,
        catatan: `Tergenerate otomatis saat lompat ke nomor ${String(
          targetUrut
        ).padStart(pengaturan.pad, "0")}`,
        fileUrl: "",
        status: "Belum Lengkap",
        pembuat: "Sistem Penertiban",
        dibuat: today,
      };
    });

    const nomor =
      payload.arah === "keluar" && typeof targetUrut === "number"
        ? payload.nomorManual?.trim() ||
          formatNomorSurat(
            pengaturan.format,
            pengaturan.pad,
            targetUrut,
            payload.jenis,
            tanggal
          )
        : payload.nomorManual?.trim() ?? "";

    const created: Surat = {
      id: `s-${Date.now()}`,
      arah: payload.arah,
      nomor,
      urut: targetUrut,
      tahun,
      jenis: payload.arah === "keluar" ? payload.jenis : "",
      tanggal,
      pihak,
      perihal,
      catatan: payload.catatan.trim(),
      fileName: demoFileName,
      fileUrl: demoFileUrl ?? "",
      fileMime: demoFileMime,
      status: "Lengkap",
      pembuat: actor.nama,
      dibuat: today,
    };

    repo.suratList = [created, ...gapItems, ...repo.suratList];
    return {
      ok: true,
      saved: created,
      suratList: repo.suratList,
      generatedGaps,
    };
  }

  // ================= MODE PRODUKSI (GOOGLE SHEETS + DRIVE) =================
  const [rawRows, pengaturan] = await Promise.all([
    readSheetRows("Surat"),
    getPengaturanData(),
  ]);
  const mappedRows = rawRows.map(mapSheetRowToSurat);

  const targetRow = payload.id
    ? mappedRows.find((s) => s.id === payload.id)
    : undefined;

  const nextNormalUrut = calcNextUrut(mappedRows, tahun);
  if (
    !targetRow &&
    !payload.id &&
    payload.arah === "keluar" &&
    payload.urutManual !== undefined &&
    payload.urutManual < nextNormalUrut
  ) {
    return {
      ok: false,
      error: `Nomor urut baru minimal ${String(nextNormalUrut).padStart(
        pengaturan.pad,
        "0"
      )} atau lebih besar. Untuk mengisi nomor kosong sebelumnya, gunakan tombol Lengkapi.`,
    };
  }

  if (targetRow) {
    const canManage =
      actor.role === "admin" ||
      targetRow.pembuat === actor.nama ||
      targetRow.status === "Belum Lengkap";
    if (!canManage) {
      return {
        ok: false,
        error: "Anda hanya dapat mengubah surat yang Anda catat sendiri.",
      };
    }

    const finalUrut =
      targetRow.arah === "keluar"
        ? payload.urutManual ??
          (typeof targetRow.urut === "number" ? targetRow.urut : 1)
        : "";
    const nextNomor =
      targetRow.arah === "keluar" && typeof finalUrut === "number"
        ? payload.nomorManual?.trim() ||
          formatNomorSurat(
            pengaturan.format,
            pengaturan.pad,
            finalUrut,
            payload.jenis,
            tanggal
          )
        : payload.nomorManual?.trim() ?? targetRow.nomor;

    let nextRawDriveUrl = targetRow._rawFileUrl;
    if (payload.uploadedFile) {
      const uploaded = await uploadSuratFileToDrive({
        buffer: payload.uploadedFile.buffer,
        mimeType: payload.uploadedFile.mimeType,
        originalName: payload.uploadedFile.originalName,
        tahun,
        nomor: nextNomor,
        tanggal,
      });
      if (targetRow._rawFileUrl) {
        void trashDriveFileIfNeeded(targetRow._rawFileUrl);
      }
      nextRawDriveUrl = uploaded.webViewLink;
    } else if (
      targetRow._rawFileUrl &&
      nextNomor &&
      nextNomor !== targetRow.nomor
    ) {
      void renameDriveFileIfNeeded(targetRow._rawFileUrl, nextNomor);
    }

    const nextPembuat =
      targetRow.status === "Belum Lengkap" ? actor.nama : targetRow.pembuat;

    await updateSheetRow("Surat", targetRow._row, {
      id: targetRow.id,
      arah: targetRow.arah,
      nomor: nextNomor,
      urut: finalUrut,
      tahun,
      jenis: targetRow.arah === "keluar" ? payload.jenis : "",
      tanggal,
      pihak,
      perihal,
      catatan: payload.catatan.trim(),
      fileUrl: nextRawDriveUrl,
      status: "Aktif", // Kompatibel dengan kolom status di Spreadsheet lama
      pembuat: nextPembuat,
      dibuat: targetRow.dibuat || today,
      alasanBatal: "",
      batalOleh: "",
      batalWaktu: "",
    });

    void appendAuditLog(
      actor.nama,
      "surat.save",
      `${targetRow.arah} ${nextNomor || perihal}`
    );

    const freshRows = (await readSheetRows("Surat")).map(mapSheetRowToSurat);
    const savedClean = freshRows.find((s) => s.id === targetRow!.id);
    const cleanList = freshRows.map(
      ({ _row: _r, _rawFileUrl: _rf, _legacyBatal: _lb, ...c }) => c
    );
    return {
      ok: true,
      saved: savedClean
        ? (({ _row: _r, _rawFileUrl: _rf, _legacyBatal: _lb, ...c }) => c)(
            savedClean
          )
        : undefined,
      suratList: cleanList,
      generatedGaps: [],
    };
  }

  // Tambah Baru ke Google Sheets
  const targetUrut =
    payload.arah === "keluar"
      ? Math.max(1, payload.urutManual ?? calcNextUrut(mappedRows, tahun))
      : ("" as const);

  const generatedGaps =
    payload.arah === "keluar" && typeof targetUrut === "number"
      ? calcMissingUrutBefore(mappedRows, tahun, targetUrut)
      : [];

  const nomor =
    payload.arah === "keluar" && typeof targetUrut === "number"
      ? payload.nomorManual?.trim() ||
        formatNomorSurat(
          pengaturan.format,
          pengaturan.pad,
          targetUrut,
          payload.jenis,
          tanggal
        )
      : payload.nomorManual?.trim() ?? "";

  let rawDriveUrl = "";
  if (payload.uploadedFile) {
    const uploaded = await uploadSuratFileToDrive({
      buffer: payload.uploadedFile.buffer,
      mimeType: payload.uploadedFile.mimeType,
      originalName: payload.uploadedFile.originalName,
      tahun,
      nomor,
      tanggal,
    });
    rawDriveUrl = uploaded.webViewLink;
  }

  const gapSheetRows = generatedGaps.map((n) => {
    const padStr = String(n).padStart(pengaturan.pad, "0");
    return {
      id: crypto.randomUUID(),
      arah: "keluar",
      nomor: formatNomorSurat(
        pengaturan.format,
        pengaturan.pad,
        n,
        "---",
        tanggal
      ),
      urut: n,
      tahun,
      jenis: "",
      tanggal,
      pihak: "— (Berkas fisik belum ditemukan)",
      perihal: `Slot Nomor Urut ${padStr} Kosong — Harap cari arsip fisik & unggah scan`,
      catatan: `Tergenerate otomatis saat lompat ke nomor ${String(
        targetUrut
      ).padStart(pengaturan.pad, "0")}`,
      fileUrl: "",
      status: "Belum Lengkap",
      pembuat: "Sistem Penertiban",
      dibuat: today,
    };
  });

  const newId = crypto.randomUUID();
  const mainSheetRow = {
    id: newId,
    arah: payload.arah,
    nomor,
    urut: targetUrut,
    tahun,
    jenis: payload.arah === "keluar" ? payload.jenis : "",
    tanggal,
    pihak,
    perihal,
    catatan: payload.catatan.trim(),
    fileUrl: rawDriveUrl,
    status: "Aktif",
    pembuat: actor.nama,
    dibuat: today,
  };

  // Satu kali batch append (gap slots + surat baru) agar cepat & hemat kuota API!
  await appendSheetRows("Surat", [...gapSheetRows, mainSheetRow]);
  void appendAuditLog(
    actor.nama,
    "surat.save",
    `${payload.arah} ${nomor || perihal}`
  );

  const freshRows = (await readSheetRows("Surat")).map(mapSheetRowToSurat);
  const savedClean = freshRows.find((s) => s.id === newId);
  const cleanList = freshRows.map(
    ({ _row: _r, _rawFileUrl: _rf, _legacyBatal: _lb, ...c }) => c
  );

  return {
    ok: true,
    saved: savedClean
      ? (({ _row: _r, _rawFileUrl: _rf, _legacyBatal: _lb, ...c }) => c)(
          savedClean
        )
      : undefined,
    suratList: cleanList,
    generatedGaps,
  };
}

export async function deleteSuratRecord(
  actor: User,
  id: string
): Promise<{ ok: boolean; suratList?: Surat[]; error?: string }> {
  if (isDemoMode()) {
    const repo = getDemoRepo();
    const target = repo.suratList.find((s) => s.id === id);
    if (!target) return { ok: false, error: "Surat tidak ditemukan." };
    const canDelete =
      actor.role === "admin" ||
      target.pembuat === actor.nama ||
      target.status === "Belum Lengkap";
    if (!canDelete) {
      return {
        ok: false,
        error: "Anda hanya dapat menghapus surat yang Anda catat sendiri.",
      };
    }
    repo.suratList = repo.suratList.filter((s) => s.id !== id);
    return { ok: true, suratList: repo.suratList };
  }

  const rows = (await readSheetRows("Surat")).map(mapSheetRowToSurat);
  const target = rows.find((s) => s.id === id);
  if (!target) {
    return { ok: false, error: "Surat tidak ditemukan di Spreadsheet." };
  }

  const canDelete =
    actor.role === "admin" ||
    target.pembuat === actor.nama ||
    target.status === "Belum Lengkap";
  if (!canDelete) {
    return {
      ok: false,
      error: "Anda hanya dapat menghapus surat yang Anda catat sendiri.",
    };
  }

  if (target._rawFileUrl) {
    void trashDriveFileIfNeeded(target._rawFileUrl);
  }
  await deleteSheetRow("Surat", target._row);
  void appendAuditLog(
    actor.nama,
    "surat.delete",
    `${target.arah} ${target.nomor || target.perihal}`
  );

  const freshList = (await readSheetRows("Surat"))
    .map(mapSheetRowToSurat)
    .map(({ _row: _r, _rawFileUrl: _rf, _legacyBatal: _lb, ...c }) => c);

  return { ok: true, suratList: freshList };
}

export async function savePengaturanRecord(
  admin: User,
  next: Pengaturan
): Promise<{ ok: boolean; pengaturan?: Pengaturan; error?: string }> {
  if (!/\{urut\}/.test(next.format)) {
    return {
      ok: false,
      error: "Format nomor surat wajib mengandung variabel {urut}.",
    };
  }

  const sanitized: Pengaturan = {
    namaAplikasi: String(next.namaAplikasi || "").trim() || "Manajemen Surat",
    instansiInduk: String(next.instansiInduk || "").trim(),
    namaSekolah: String(next.namaSekolah || "").trim() || "SMK Nusantara Lab",
    alamatSekolah: String(next.alamatSekolah || "").trim(),
    kotaSurat: String(next.kotaSurat || "").trim() || "Purwoharjo",
    namaKepsek: String(next.namaKepsek || "").trim(),
    nipKepsek: String(next.nipKepsek || "").trim(),
    format: String(next.format || "").trim(),
    pad: Math.max(1, Math.min(6, Number(next.pad) || 3)),
  };

  if (isDemoMode()) {
    getDemoRepo().pengaturan = sanitized;
    return { ok: true, pengaturan: sanitized };
  }

  const existingRows = await readSheetRows("Pengaturan");
  const entries = Object.entries(sanitized) as Array<[string, string | number]>;
  const toAppend: Array<{ key: string; value: string }> = [];

  for (const [key, val] of entries) {
    const found = existingRows.find((r) => r.key === key);
    if (found) {
      await updateSheetRow("Pengaturan", found._row, {
        key,
        value: String(val),
      });
    } else {
      toAppend.push({ key, value: String(val) });
    }
  }

  if (toAppend.length > 0) {
    await appendSheetRows("Pengaturan", toAppend);
  }

  void appendAuditLog(admin.nama, "settings.save", sanitized.format);
  return { ok: true, pengaturan: sanitized };
}

export async function saveKlasifikasiRecord(
  admin: User,
  item: Klasifikasi,
  oldKode?: string
): Promise<{ ok: boolean; klasifikasiList?: Klasifikasi[]; error?: string }> {
  const cleanKode = String(item.kode || "").trim();
  const cleanNama = String(item.nama || "").trim();
  if (!cleanKode || !cleanNama) {
    return { ok: false, error: "Kode dan nama jenis surat wajib diisi." };
  }
  if (!/^[A-Za-z0-9._-]{1,15}$/.test(cleanKode)) {
    return {
      ok: false,
      error:
        "Kode hanya boleh huruf, angka, titik, atau tanda minus (maks. 15 karakter), tanpa spasi dan tanpa '/'.",
    };
  }

  if (isDemoMode()) {
    const repo = getDemoRepo();
    if (oldKode && oldKode !== cleanKode) {
      const used = repo.suratList.some((s) => s.jenis === oldKode);
      if (used) {
        return {
          ok: false,
          error: "Kode sudah dipakai di surat keluar sehingga tidak boleh diubah.",
        };
      }
    }
    const conflict = repo.klasifikasiList.some(
      (k) =>
        k.kode.toLowerCase() === cleanKode.toLowerCase() && k.kode !== oldKode
    );
    if (conflict) {
      return { ok: false, error: `Kode "${cleanKode}" sudah terdaftar.` };
    }
    if (oldKode) {
      repo.klasifikasiList = repo.klasifikasiList.map((k) =>
        k.kode === oldKode ? { kode: cleanKode, nama: cleanNama } : k
      );
    } else {
      repo.klasifikasiList = [
        ...repo.klasifikasiList,
        { kode: cleanKode, nama: cleanNama },
      ];
    }
    return { ok: true, klasifikasiList: sortKlasifikasi(repo.klasifikasiList) };
  }

  const [klasRows, suratRows] = await Promise.all([
    readSheetRows("Klasifikasi"),
    readSheetRows("Surat"),
  ]);

  if (oldKode) {
    const existing = klasRows.find((k) => k.kode === oldKode);
    if (!existing) {
      return { ok: false, error: "Jenis surat tidak ditemukan." };
    }
    if (oldKode !== cleanKode) {
      const used = suratRows.some((s) => s.jenis === oldKode);
      if (used) {
        return {
          ok: false,
          error: `Kode ${oldKode} sudah dipakai pada surat dan tidak dapat diganti. Ubah namanya saja.`,
        };
      }
      const conflict = klasRows.some(
        (k) => k.kode.toLowerCase() === cleanKode.toLowerCase()
      );
      if (conflict) {
        return { ok: false, error: `Kode "${cleanKode}" sudah terdaftar.` };
      }
    }
    await updateSheetRow("Klasifikasi", existing._row, {
      kode: cleanKode,
      nama: cleanNama,
    });
    void appendAuditLog(
      admin.nama,
      "klasifikasi.ubah",
      `${oldKode} -> ${cleanKode} | ${cleanNama}`
    );
  } else {
    const conflict = klasRows.some(
      (k) => k.kode.toLowerCase() === cleanKode.toLowerCase()
    );
    if (conflict) {
      return { ok: false, error: `Kode "${cleanKode}" sudah terdaftar.` };
    }
    await appendSheetRows("Klasifikasi", [{ kode: cleanKode, nama: cleanNama }]);
    void appendAuditLog(
      admin.nama,
      "klasifikasi.tambah",
      `${cleanKode} | ${cleanNama}`
    );
  }

  const updated = (await readSheetRows("Klasifikasi")).map((k) => ({
    kode: k.kode,
    nama: k.nama,
  }));
  return { ok: true, klasifikasiList: sortKlasifikasi(updated) };
}

export async function deleteKlasifikasiRecord(
  admin: User,
  kode: string
): Promise<{ ok: boolean; klasifikasiList?: Klasifikasi[]; error?: string }> {
  if (isDemoMode()) {
    const repo = getDemoRepo();
    const used = repo.suratList.some((s) => s.jenis === kode);
    if (used) {
      return {
        ok: false,
        error: "Jenis surat sudah dipakai pada arsip dan tidak dapat dihapus.",
      };
    }
    if (repo.klasifikasiList.length < 2) {
      return { ok: false, error: "Minimal harus ada 1 jenis surat." };
    }
    repo.klasifikasiList = repo.klasifikasiList.filter((k) => k.kode !== kode);
    return { ok: true, klasifikasiList: sortKlasifikasi(repo.klasifikasiList) };
  }

  const [klasRows, suratRows] = await Promise.all([
    readSheetRows("Klasifikasi"),
    readSheetRows("Surat"),
  ]);
  const target = klasRows.find((k) => k.kode === kode);
  if (!target) {
    return { ok: false, error: "Jenis surat tidak ditemukan." };
  }
  const used = suratRows.some((s) => s.jenis === kode);
  if (used) {
    return {
      ok: false,
      error: "Jenis surat sudah dipakai pada arsip dan tidak dapat dihapus.",
    };
  }
  if (klasRows.length < 2) {
    return { ok: false, error: "Minimal harus ada 1 jenis surat." };
  }

  await deleteSheetRow("Klasifikasi", target._row);
  void appendAuditLog(admin.nama, "klasifikasi.hapus", `${target.kode} | ${target.nama}`);

  const updated = (await readSheetRows("Klasifikasi")).map((k) => ({
    kode: k.kode,
    nama: k.nama,
  }));
  return { ok: true, klasifikasiList: sortKlasifikasi(updated) };
}

export async function saveDisposisiRecord(
  admin: User,
  input: { id?: string; nama: string; aktif: boolean }
): Promise<{
  ok: boolean;
  disposisiList?: DisposisiJabatan[];
  error?: string;
}> {
  const cleanNama = String(input.nama || "").trim();
  if (!cleanNama) {
    return { ok: false, error: "Nama jabatan disposisi wajib diisi." };
  }

  if (isDemoMode()) {
    const repo = getDemoRepo();
    const duplicate = repo.disposisiList.some(
      (d) =>
        d.nama.toLowerCase() === cleanNama.toLowerCase() && d.id !== input.id
    );
    if (duplicate) {
      return { ok: false, error: `"${cleanNama}" sudah ada di daftar disposisi.` };
    }
    if (input.id) {
      repo.disposisiList = repo.disposisiList.map((d) =>
        d.id === input.id ? { ...d, nama: cleanNama, aktif: input.aktif } : d
      );
    } else {
      repo.disposisiList = [
        ...repo.disposisiList,
        { id: `d-${Date.now()}`, nama: cleanNama, aktif: input.aktif },
      ];
    }
    return { ok: true, disposisiList: repo.disposisiList };
  }

  const rows = await readSheetRows("Disposisi");
  const duplicate = rows.some(
    (d) =>
      String(d.nama || "").toLowerCase() === cleanNama.toLowerCase() &&
      d.id !== input.id
  );
  if (duplicate) {
    return { ok: false, error: `"${cleanNama}" sudah ada di daftar disposisi.` };
  }

  if (input.id) {
    const existing = rows.find((d) => d.id === input.id);
    if (!existing) {
      return { ok: false, error: "Jabatan disposisi tidak ditemukan." };
    }
    await updateSheetRow("Disposisi", existing._row, {
      id: existing.id,
      nama: cleanNama,
      aktif: input.aktif,
    });
    void appendAuditLog(admin.nama, "disposisi.ubah", cleanNama);
  } else {
    await appendSheetRows("Disposisi", [
      {
        id: crypto.randomUUID(),
        nama: cleanNama,
        aktif: input.aktif,
      },
    ]);
    void appendAuditLog(admin.nama, "disposisi.tambah", cleanNama);
  }

  const updated = (await readSheetRows("Disposisi")).map((d) => ({
    id: d.id,
    nama: d.nama,
    aktif: parseBool(d.aktif, true),
  }));
  return { ok: true, disposisiList: updated };
}

export async function deleteDisposisiRecord(
  admin: User,
  id: string
): Promise<{
  ok: boolean;
  disposisiList?: DisposisiJabatan[];
  error?: string;
}> {
  if (isDemoMode()) {
    const repo = getDemoRepo();
    repo.disposisiList = repo.disposisiList.filter((d) => d.id !== id);
    return { ok: true, disposisiList: repo.disposisiList };
  }

  const rows = await readSheetRows("Disposisi");
  const target = rows.find((d) => d.id === id);
  if (!target) {
    return { ok: false, error: "Jabatan disposisi tidak ditemukan." };
  }

  await deleteSheetRow("Disposisi", target._row);
  void appendAuditLog(admin.nama, "disposisi.hapus", target.nama);

  const updated = (await readSheetRows("Disposisi")).map((d) => ({
    id: d.id,
    nama: d.nama,
    aktif: parseBool(d.aktif, true),
  }));
  return { ok: true, disposisiList: updated };
}
