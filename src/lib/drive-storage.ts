import {
  extractDriveFileId,
  getDriveFolderId,
  getGoogleAccessToken,
} from "./google";

function safeFileName(input: string): string {
  return String(input)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "_")
    .trim();
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
  const ext = extMatch ? extMatch[0] : ".pdf";
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

  return {
    fileId: uploaded.id,
    webViewLink:
      uploaded.webViewLink ||
      `https://drive.google.com/file/d/${uploaded.id}/view`,
    fileName: uploaded.name,
    mimeType: uploaded.mimeType || params.mimeType,
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
      )}?supportsAllDrives=true&fields=name`,
      { headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" }
    );
    if (!metaRes.ok) return;
    const meta = (await metaRes.json()) as { name?: string };
    const ext = (meta.name?.match(/\.[A-Za-z0-9]+$/) || [""])[0];

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
        body: JSON.stringify({ name: `${safeFileName(newNomor)}${ext}` }),
      }
    );
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
    fileName: meta.name || `dokumen-${fileId}.pdf`,
    mimeType: meta.mimeType || "application/pdf",
    size: meta.size,
  };
}
