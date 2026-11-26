export const APP_VERSION = `v${process.env.NEXT_PUBLIC_APP_VERSION || "1.0.3"}`;
export const DEVELOPER_NAME = "Addin Septyan";
export const DEVELOPER_PORTFOLIO_URL = "https://addinseptyan.my.id";
export const DEVELOPER_PORTFOLIO_LABEL = "addinseptyan.my.id";

export function formatBrowserTitle(
  namaAplikasi?: string,
  namaSekolah?: string
): string {
  const app = (namaAplikasi || "Manajemen Surat").trim();
  const school = (namaSekolah || "SMK Nusantara Lab").trim();
  return `${app} - ${school}`;
}
