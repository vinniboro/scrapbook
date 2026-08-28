export type MusicProvider =
  | "spotify"
  | "youtube"
  | "bandcamp"
  | "soundcloud"
  | "other";

const PROVIDERS: { provider: MusicProvider; host: RegExp }[] = [
  { provider: "spotify", host: /(^|\.)spotify\.com$/i },
  { provider: "youtube", host: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i },
  { provider: "bandcamp", host: /(^|\.)bandcamp\.com$/i },
  { provider: "soundcloud", host: /(^|\.)soundcloud\.com$/i },
];

export function parseMusicUrl(raw: string): {
  musicUrl: string;
  musicProvider: MusicProvider;
} | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.replace(/^www\./i, "");
  const match = PROVIDERS.find((entry) => entry.host.test(host));
  return {
    musicUrl: url.toString(),
    musicProvider: match?.provider ?? "other",
  };
}
