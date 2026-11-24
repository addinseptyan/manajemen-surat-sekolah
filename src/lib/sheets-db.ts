import { INITIAL_DISPOSISI, INITIAL_KLASIFIKASI } from "./mock-data";
import { getGoogleAccessToken, getSpreadsheetId } from "./google";

export const SHEET_COLUMNS = {
  Users: ["id", "nama", "role", "pinHash", "aktif", "dibuat"],
  Surat: [
    "id",
    "arah",
    "nomor",
    "urut",
    "tahun",
    "jenis",
    "tanggal",
    "pihak",
    "perihal",
    "catatan",
    "fileUrl",
    "status",
    "pembuat",
    "dibuat",
    "alasanBatal",
    "batalOleh",
    "batalWaktu",
  ],
  Klasifikasi: ["kode", "nama"],
  Disposisi: ["id", "nama", "aktif"],
  Pengaturan: ["key", "value"],
  Log: ["waktu", "user", "aksi", "detail"],
} as const;

export type SheetName = keyof typeof SHEET_COLUMNS;

export type SheetRow = Record<string, string> & {
  _row: number;
};

interface CacheEntry {
  rows: SheetRow[];
  expiresAt: number;
}

const SMALL_CACHED_SHEETS: Record<string, boolean> = {
  Users: true,
  Klasifikasi: true,
  Disposisi: true,
  Pengaturan: true,
};

const globalForSheets = globalThis as unknown as {
  __sheetSchemaVerifiedFor?: string;
  __sheetIdsMap?: Record<string, number>;
  __sheetRowCache?: Record<string, CacheEntry>;
};

function getRowCache(): Record<string, CacheEntry> {
  if (!globalForSheets.__sheetRowCache) {
    globalForSheets.__sheetRowCache = {};
  }
  return globalForSheets.__sheetRowCache;
}

export function bustSheetCache(name: SheetName) {
  const cache = getRowCache();
  delete cache[name];
}

function colIndexToLetter(idxZeroBased: number): string {
  let n = idxZeroBased + 1;
  let s = "";
  while (n > 0) {
    const mod = (n - 1) % 26;
    s = String.fromCharCode(65 + mod) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** Normalisasi tanggal dari Google Sheets (mendukung YYYY-MM-DD, DD/MM/YYYY, atau M/D/YYYY). */
export function normalizeSheetDate(raw: string): string {
  const v = String(raw || "").trim();
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);

  const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slash) {
    const [, a, b, y] = slash;
    const n1 = Number(a);
    const n2 = Number(b);
    // Di Indonesia (Asia/Jakarta) umumnya DD/MM/YYYY bila n1 > 12
    const month = n1 > 12 ? n2 : n1;
    const day = n1 > 12 ? n1 : n2;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return v;
}

/**
 * Memastikan keenam tab (Users, Surat, Klasifikasi, Disposisi, Pengaturan, Log)
 * tersedia beserta kolom headernya tanpa menimpa data lama di Spreadsheet sekolah.
 */
export async function ensureSheetsSchema(): Promise<Record<string, number>> {
  const ssId = getSpreadsheetId();
  if (
    globalForSheets.__sheetSchemaVerifiedFor === ssId &&
    globalForSheets.__sheetIdsMap
  ) {
    return globalForSheets.__sheetIdsMap;
  }

  const token = await getGoogleAccessToken();
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}?fields=sheets(properties(sheetId,title))`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text();
    throw new Error(
      `Gagal mengakses Google Spreadsheet (${metaRes.status}). Pastikan GOOGLE_SPREADSHEET_ID benar dan akun memiliki akses Editor: ${errText}`
    );
  }

  const meta = (await metaRes.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
  };

  const sheetIds: Record<string, number> = {};
  for (const sh of meta.sheets || []) {
    if (sh.properties?.title && typeof sh.properties.sheetId === "number") {
      sheetIds[sh.properties.title] = sh.properties.sheetId;
    }
  }

  const wantedNames = Object.keys(SHEET_COLUMNS) as SheetName[];
  const missingSheets = wantedNames.filter((name) => !(name in sheetIds));

  if (missingSheets.length > 0) {
    const batchRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        ssId
      )}:batchUpdate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: missingSheets.map((title) => ({
            addSheet: {
              properties: {
                title,
                gridProperties: { frozenRowCount: 1 },
              },
            },
          })),
        }),
      }
    );

    if (batchRes.ok) {
      const batchData = (await batchRes.json()) as {
        replies?: Array<{
          addSheet?: { properties?: { sheetId?: number; title?: string } };
        }>;
      };
      for (const rep of batchData.replies || []) {
        const p = rep.addSheet?.properties;
        if (p?.title && typeof p.sheetId === "number") {
          sheetIds[p.title] = p.sheetId;
        }
      }
    }
  }

  // Periksa baris pertama (header) setiap tab secara batchGet
  const rangesParam = wantedNames
    .map((n) => `ranges=${encodeURIComponent(`${n}!1:1`)}`)
    .join("&");
  const headersRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}/values:batchGet?${rangesParam}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (headersRes.ok) {
    const headersData = (await headersRes.json()) as {
      valueRanges?: Array<{ range?: string; values?: string[][] }>;
    };

    const updates: Array<{ range: string; values: string[][] }> = [];
    wantedNames.forEach((name, idx) => {
      const existingRow = headersData.valueRanges?.[idx]?.values?.[0] || [];
      const wantedCols = [...SHEET_COLUMNS[name]];
      if (existingRow.length === 0) {
        updates.push({
          range: `${name}!A1:${colIndexToLetter(wantedCols.length - 1)}1`,
          values: [wantedCols],
        });
      } else {
        // Tambahkan kolom baru yang belum ada di kanan tanpa mengubah urutan kolom lama!
        const missingCols = wantedCols.filter((c) => !existingRow.includes(c));
        if (missingCols.length > 0) {
          const startCol = colIndexToLetter(existingRow.length);
          const endCol = colIndexToLetter(
            existingRow.length + missingCols.length - 1
          );
          updates.push({
            range: `${name}!${startCol}1:${endCol}1`,
            values: [missingCols],
          });
        }
      }
    });

    if (updates.length > 0) {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
          ssId
        )}/values:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            valueInputOption: "RAW",
            data: updates,
          }),
        }
      );
    }
  }

  globalForSheets.__sheetIdsMap = sheetIds;
  globalForSheets.__sheetSchemaVerifiedFor = ssId;

  // Seed otomatis tab Disposisi (8 jabatan) & Klasifikasi bila masih kosong
  const dispRows = await readSheetRows("Disposisi", true);
  if (dispRows.length === 0) {
    await appendSheetRows(
      "Disposisi",
      INITIAL_DISPOSISI.map((d) => ({
        id: d.id,
        nama: d.nama,
        aktif: d.aktif ? "TRUE" : "FALSE",
      }))
    );
  }

  const klasRows = await readSheetRows("Klasifikasi", true);
  if (klasRows.length === 0) {
    await appendSheetRows(
      "Klasifikasi",
      INITIAL_KLASIFIKASI.map((k) => ({ kode: k.kode, nama: k.nama }))
    );
  }

  return sheetIds;
}

export async function readSheetRows(
  name: SheetName,
  skipSchemaCheck = false
): Promise<SheetRow[]> {
  if (!skipSchemaCheck) {
    await ensureSheetsSchema();
  }

  if (SMALL_CACHED_SHEETS[name]) {
    const hit = getRowCache()[name];
    if (hit && hit.expiresAt > Date.now()) {
      return hit.rows;
    }
  }

  const ssId = getSpreadsheetId();
  const token = await getGoogleAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}/values/${encodeURIComponent(name)}?valueRenderOption=FORMATTED_VALUE`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal membaca tab ${name}: ${errText}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const values = data.values || [];
  if (values.length <= 1) {
    if (SMALL_CACHED_SHEETS[name]) {
      getRowCache()[name] = { rows: [], expiresAt: Date.now() + 60_000 };
    }
    return [];
  }

  const headers = values[0].map((h) => String(h || "").trim());
  const rows: SheetRow[] = [];

  for (let i = 1; i < values.length; i++) {
    const rawRow = values[i];
    if (!rawRow || rawRow.every((cell) => String(cell ?? "").trim() === "")) {
      continue;
    }
    const cols: Record<string, string> = {};
    headers.forEach((key, colIdx) => {
      if (key) {
        cols[key] = rawRow[colIdx] !== undefined ? String(rawRow[colIdx]) : "";
      }
    });
    const obj: SheetRow = Object.assign(cols, { _row: i + 1 });
    rows.push(obj);
  }

  if (SMALL_CACHED_SHEETS[name]) {
    getRowCache()[name] = { rows, expiresAt: Date.now() + 60_000 };
  }

  return rows;
}

async function getActualSheetHeaders(name: SheetName): Promise<string[]> {
  const ssId = getSpreadsheetId();
  const token = await getGoogleAccessToken();
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}/values/${encodeURIComponent(`${name}!1:1`)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (res.ok) {
    const data = (await res.json()) as { values?: string[][] };
    const first = data.values?.[0]?.map((h) => String(h || "").trim()).filter(Boolean);
    if (first && first.length > 0) return first;
  }
  return [...SHEET_COLUMNS[name]];
}

export async function appendSheetRows(
  name: SheetName,
  items: Array<Record<string, string | number | boolean | undefined>>
): Promise<void> {
  if (items.length === 0) return;
  await ensureSheetsSchema();

  const headers = await getActualSheetHeaders(name);
  const ssId = getSpreadsheetId();
  const token = await getGoogleAccessToken();

  const values = items.map((item) =>
    headers.map((col) => {
      const val = item[col];
      if (val === undefined || val === null) return "";
      if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
      return String(val);
    })
  );

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}/values/${encodeURIComponent(
      `${name}!A1`
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menambah baris pada tab ${name}: ${errText}`);
  }

  bustSheetCache(name);
}

export async function updateSheetRow(
  name: SheetName,
  rowNumber: number,
  item: Record<string, string | number | boolean | undefined>
): Promise<void> {
  await ensureSheetsSchema();

  const headers = await getActualSheetHeaders(name);
  const ssId = getSpreadsheetId();
  const token = await getGoogleAccessToken();

  const rowValues = headers.map((col) => {
    const val = item[col];
    if (val === undefined || val === null) return "";
    if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
    return String(val);
  });

  const endCol = colIndexToLetter(headers.length - 1);
  const range = `${name}!A${rowNumber}:${endCol}${rowNumber}`;

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: [rowValues] }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal memperbarui baris ${rowNumber} pada tab ${name}: ${errText}`);
  }

  bustSheetCache(name);
}

export async function deleteSheetRow(
  name: SheetName,
  rowNumber: number
): Promise<void> {
  const sheetIds = await ensureSheetsSchema();
  const sheetId = sheetIds[name];
  if (typeof sheetId !== "number") {
    throw new Error(`Tab ${name} tidak ditemukan di Spreadsheet.`);
  }

  const ssId = getSpreadsheetId();
  const token = await getGoogleAccessToken();

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      ssId
    )}:batchUpdate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowNumber - 1,
                endIndex: rowNumber,
              },
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gagal menghapus baris pada tab ${name}: ${errText}`);
  }

  bustSheetCache(name);
}

/** Mencatat riwayat aktivitas ke tab Log seperti fungsi log_ di Config.gs lama. */
export async function appendAuditLog(
  userNama: string,
  aksi: string,
  detail = ""
): Promise<void> {
  try {
    const jakartaIso = new Date().toLocaleString("sv-SE", {
      timeZone: "Asia/Jakarta",
    });
    await appendSheetRows("Log", [
      {
        waktu: jakartaIso,
        user: userNama || "-",
        aksi,
        detail: String(detail || "").slice(0, 300),
      },
    ]);
  } catch {
    // Jangan gagalkan transaksi utama hanya karena pencatatan log gagal
  }
}
