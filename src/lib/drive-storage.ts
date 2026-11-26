import {
  extractDriveFileId,
  getDriveFolderId,
  getGoogleAccessToken,
} from "./google";

export interface DriveFileMeta {
  name: string;
  mimeType: string;
}

const globalForDriveMeta = globalThis as unknown as {
  __driveFileMetaCache?: Map<string, DriveFileMeta>;
  __driveFolderScanExpiresAt?: number;
};

function getDriveMetaCache(): Map<string, DriveFileMeta> {
  if (!globalForDriveMeta.__driveFileMetaCache) {
    globalForDriveMeta.__driveFileMetaCache = new Map();
  }
  return globalForDriveMeta.__driveFileMetaCache;
}

function safeFileName(input: string): string {
  return String(input)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .trim();
}

export function inferExtensionFromMime(mimeType?: string): string {
  const m = (mimeType || "").toLowerCase();
  if (m === "image/png") return ".png";
  if (m === "image/jpeg" || m === "image/jpg") return ".jpg";
  if (m === "image/webp") return ".webp";
  if (m === "image/gif") return ".gif";
  if (
    m ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return ".docx";
  }
  if (m === "application/msword") return ".doc";
  if (
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return ".xlsx";
  }
  if (m === "application/vnd.ms-excel") return ".xls";
  if (
    m ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return ".pptx";
  }
  if (m === "application/vnd.ms-powerpoint") return ".ppt";
  if (m === "text/plain") return ".txt";
  if (m === "application/zip") return ".zip";
  return ".pdf";
}

function ensureFileNameHasExtension(name: string, mimeType?: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) return `lampiran${inferExtensionFromMime(mimeType)}`;
  if (/\.[A-Za-z0-9]{2,5}$/.test(trimmed)) return trimmed;
  return `${trimmed}${inferExtensionFromMime(mimeType)}`;
}

/**
 * Memuat metadata asli (nama berkas beserta ekstensi .pdf/.png/.docx + mimeType) dari Google Drive
 * secara massal dan menyimpannya di cache memori server agar pembacaan tabel tetap instan.
 */
export async function resolveDriveFilesMetadata(
  fileIds: string[]
): Promise<Map<string, DriveFileMeta>> {
  const uniqueIds = Array.from(new Set(fileIds.filter(Boolean)));
  const cache = getDriveMetaCache();
  if (uniqueIds.length === 0) return cache;

  const hasUncached = uniqueIds.some((id) => !cache.has(id));
  if (!hasUncached) return cache;

  try {
    const accessToken = await getGoogleAccessToken();
    const now = Date.now();

    // 1. Pindai isi folder arsip utama & subfolder tahun secara massal (hanya 1-2 HTTP request untuk ratusan file)
    if (
      !globalForDriveMeta.__driveFolderScanExpiresAt ||
      globalForDriveMeta.__driveFolderScanExpiresAt <= now
    ) {
      try {
        const rootFolderId = getDriveFolderId();
        const rootQ = `'${rootFolderId}' in parents and trashed = false`;
        const rootRes = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            rootQ
          )}&pageSize=1000&fields=files(id,name,mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true`,
          { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
        );

        if (rootRes.ok) {
          const rootData = (await rootRes.json()) as {
            files?: Array<{ id: string; name: string; mimeType: string }>;
          };
          const subfolderIds: string[] = [];
          for (const f of rootData.files ?? []) {
            if (f.mimeType === "application/vnd.google-apps.folder") {
              subfolderIds.push(f.id);
            } else {
              cache.set(f.id, {
                name: ensureFileNameHasExtension(f.name, f.mimeType),
                mimeType: f.mimeType || "application/octet-stream",
              });
            }
          }

          if (subfolderIds.length > 0) {
            const parentClauses = subfolderIds
              .slice(0, 25)
              .map((fid) => `'${fid}' in parents`)
              .join(" or ");
            const childQ = `(${parentClauses}) and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
            let pageToken = "";
            for (let page = 0; page < 3; page++) {
              const tokenParam = pageToken
                ? `&pageToken=${encodeURIComponent(pageToken)}`
                : "";
              const childRes = await fetch(
                `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
                  childQ
                )}&pageSize=1000&fields=nextPageToken,files(id,name,mimeType)&supportsAllDrives=true&includeItemsFromAllDrives=true${tokenParam}`,
                {
                  headers: { Authorization: `Bearer ${accessToken}` },
                  cache: "no-store",
                }
              );
              if (!childRes.ok) break;
              const childData = (await childRes.json()) as {
                nextPageToken?: string;
                files?: Array<{ id: string; name: string; mimeType: string }>;
              };
              for (const f of childData.files ?? []) {
                cache.set(f.id, {
                  name: ensureFileNameHasExtension(f.name, f.mimeType),
                  mimeType: f.mimeType || "application/octet-stream",
                });
              }
              if (!childData.nextPageToken) break;
              pageToken = childData.nextPageToken;
            }
          }
          globalForDriveMeta.__driveFolderScanExpiresAt = now + 60_000;
        }
      } catch {
        // Lanjut ke fallback individual bila GOOGLE_DRIVE_FOLDER_ID berbeda/eksternal
      }
    }

    // 2. Fallback individual untuk fileId yang berada di luar folder utama
    const stillMissing = uniqueIds.filter((id) => !cache.has(id));
    const CHUNK = 15;
    for (let i = 0; i < stillMissing.length; i += CHUNK) {
      const batch = stillMissing.slice(i, i + CHUNK);
      await Promise.all(
        batch.map(async (fid) => {
          try {
            const r = await fetch(
              `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
                fid
              )}?supportsAllDrives=true&fields=id,name,mimeType`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
                cache: "no-store",
              }
            );
            if (!r.ok) return;
            const meta = (await r.json()) as {
              id?: string;
              name?: string;
              mimeType?: string;
            };
            if (meta.id && meta.name) {
              cache.set(meta.id, {
                name: ensureFileNameHasExtension(meta.name, meta.mimeType),
                mimeType: meta.mimeType || "application/octet-stream",
              });
            }
          } catch {
            // Abaikan kegagalan per-berkas agar tabel utama tetap tampil
          }
        })
      );
    }
  } catch {
    // Pertahankan fallback nama apabila koneksi Google Drive sedang terkendala
  }

  return cache;
}

/**
 * Mencari atau membuat subfolder tahun (misal "2026", "2027") di dalam GOOGLE_DRIVE_FOLDER_ID.
 * Persis seperti uploadFile_ di Letters.gs Apps Script lama.
 */
async function ensureYearSubfolder(
  accessToken: string,
  rootFolderId: string,
  tahun: number
): Promise<string> {
  const folderName = String(tahun);
  const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and '${rootFolderId}' in parents and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    q
  )}&fields=files(id,name)&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (searchRes.ok) {
    const searchData = (await searchRes.json()) as {
      files?: Array<{ id: string; name: string }>;
    };
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
  }

  const createRes = await fetch(
    "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootFolderId],
      }),
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Gagal membuat folder tahun ${tahun} di Google Drive: ${errText}`);
  }

  const created = (await createRes.json()) as { id: string };
  return created.id;
}

export async function uploadSuratFileToDrive(params: {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  tahun: number;
  nomor: string;
  tanggal: string;
}): Promise<{
  fileId: string;
  webViewLink: string;
  fileName: string;
  mimeType: string;
}> {
  const accessToken = await getGoogleAccessToken();
  const rootFolderId = getDriveFolderId();
  const yearFolderId = await ensureYearSubfolder(
    accessToken,
    rootFolderId,
    params.tahun
  );

  const extMatch = params.originalName.match(/\.[A-Za-z0-9]+$/);
  const ext = extMatch ? extMatch[0] : inferExtensionFromMime(params.mimeType);
  const rawBase = params.originalName.replace(/\.[A-Za-z0-9]+$/, "");
  const baseName = params.nomor
    ? safeFileName(params.nomor)
    : `masuk_${params.tanggal}_${safeFileName(rawBase || "lampiran")}`;
  const finalName = `${baseName}${ext}`;

  const boundary = `surat_boundary_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
  const metadataPart = JSON.stringify({
    name: finalName,
    parents: [yearFolderId],
  });

  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadataPart}\r\n--${boundary}\r\nContent-Type: ${
      params.mimeType || "application/octet-stream"
    }\r\n\r\n`,
    "utf8"
  );
  const epilogue = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const multipartBody = Buffer.concat([preamble, params.buffer, epilogue]);

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,mimeType,webViewLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Gagal mengunggah file ke Google Drive (${uploadRes.status}): ${errText}`);
  }

  const uploaded = (await uploadRes.json()) as {
    id: string;
    name: string;
    mimeType: string;
    webViewLink?: string;
  };

  const resolvedMime = uploaded.mimeType || params.mimeType || "application/octet-stream";
  const resolvedName = ensureFileNameHasExtension(
    uploaded.name || finalName,
    resolvedMime
  );

  getDriveMetaCache().set(uploaded.id, {
    name: resolvedName,
    mimeType: resolvedMime,
  });

  return {
    fileId: uploaded.id,
    webViewLink:
      uploaded.webViewLink ||
      `https://drive.google.com/file/d/${uploaded.id}/view`,
    fileName: resolvedName,
    mimeType: resolvedMime,
  };
}

export async function renameDriveFileIfNeeded(
  urlOrId: string,
  newNomor: string
): Promise<void> {
  const fileId = extractDriveFileId(urlOrId);
  if (!fileId || !newNomor) return;

  try {
    const accessToken = await getGoogleAccessToken();
    const metaRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?supportsAllDrives=true&fields=name,mimeType`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    if (!metaRes.ok) return;
    const meta = (await metaRes.json()) as { name?: string; mimeType?: string };
    const ext =
      (meta.name?.match(/\.[A-Za-z0-9]+$/) || [""])[0] ||
      inferExtensionFromMime(meta.mimeType);
    const nextName = `${safeFileName(newNomor)}${ext}`;

    const patchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: nextName }),
      }
    );

    if (patchRes.ok) {
      getDriveMetaCache().set(fileId, {
        name: nextName,
        mimeType: meta.mimeType || "application/octet-stream",
      });
    }
  } catch {
    // Abaikan kegagalan rename non-kritis seperti di Letters.gs
  }
}

export async function trashDriveFileIfNeeded(urlOrId?: string): Promise<void> {
  const fileId = extractDriveFileId(urlOrId);
  if (!fileId) return;

  try {
    const accessToken = await getGoogleAccessToken();
    await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}?supportsAllDrives=true`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trashed: true }),
      }
    );
    getDriveMetaCache().delete(fileId);
  } catch {
    // Masuk Trash Drive (dapat dipulihkan 30 hari); abaikan jika file sudah dihapus manual
  }
}

export async function fetchDriveFileStream(fileId: string): Promise<{
  stream: ReadableStream<Uint8Array>;
  fileName: string;
  mimeType: string;
  size?: string;
}> {
  const accessToken = await getGoogleAccessToken();

  const metaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?supportsAllDrives=true&fields=id,name,mimeType,size`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!metaRes.ok) {
    throw new Error("Berkas tidak ditemukan di Google Drive sekolah.");
  }

  const meta = (await metaRes.json()) as {
    name?: string;
    mimeType?: string;
    size?: string;
  };

  // Dukungan ekspor otomatis bila berkas berupa Google Docs/Sheets native
  if (meta.mimeType?.startsWith("application/vnd.google-apps.")) {
    const exportMime = "application/pdf";
    const exportRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        fileId
      )}/export?mimeType=${encodeURIComponent(exportMime)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );
    if (!exportRes.ok || !exportRes.body) {
      throw new Error("Gagal mengekspor dokumen Google Drive.");
    }
    const cleanBase = (meta.name || `dokumen-${fileId}`).replace(
      /\.[A-Za-z0-9]+$/,
      ""
    );
    return {
      stream: exportRes.body,
      fileName: `${cleanBase}.pdf`,
      mimeType: exportMime,
    };
  }

  const resolvedMime = meta.mimeType || "application/octet-stream";
  const resolvedName = ensureFileNameHasExtension(
    meta.name || `dokumen-${fileId}`,
    resolvedMime
  );

  getDriveMetaCache().set(fileId, {
    name: resolvedName,
    mimeType: resolvedMime,
  });

  const mediaRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
      fileId
    )}?alt=media&supportsAllDrives=true`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    }
  );

  if (!mediaRes.ok || !mediaRes.body) {
    throw new Error("Gagal mengambil isi berkas dari Google Drive.");
  }

  return {
    stream: mediaRes.body,
    fileName: resolvedName,
    mimeType: resolvedMime,
    size: meta.size,
  };
}
