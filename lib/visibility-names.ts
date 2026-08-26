/** Stored values stay public|private. Spoken values: room (next room) and close (people you stood with). */
export type StoredVisibility = "public" | "private";
export type SpokenVisibility = "room" | "close";

export function toStoredVisibility(value: string): StoredVisibility | null {
  if (value === "public" || value === "room") return "public";
  if (value === "private" || value === "close") return "private";
  return null;
}

export function toSpokenVisibility(value: StoredVisibility): SpokenVisibility {
  return value === "public" ? "room" : "close";
}
