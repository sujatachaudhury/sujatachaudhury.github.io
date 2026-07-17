/**
 * Labs flag parser — a comma-separated list of experiment names in ?labs=…
 * gates opt-in features.
 *
 *   /en/?labs=chat
 *   /en/?labs=chat,viz
 *
 * All helpers are SSR-safe: on the server they return an empty set (labs are
 * strictly opt-in at read time; nothing is enabled during static generation).
 *
 * To add a new lab: add its slug to `KNOWN_LABS`. Unknown values in the query
 * string are ignored so junk like ?labs=🤖 never accidentally enables things.
 */

export const KNOWN_LABS = ["chat"] as const;
export type LabFlag = (typeof KNOWN_LABS)[number];

const KNOWN_SET: ReadonlySet<string> = new Set(KNOWN_LABS);

export function parseLabsFlag(search: string | URLSearchParams | null | undefined): Set<LabFlag> {
  const result = new Set<LabFlag>();
  if (!search) return result;
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  const raw = params.get("labs");
  if (!raw) return result;
  for (const token of raw.split(",")) {
    const slug = token.trim().toLowerCase();
    if (KNOWN_SET.has(slug)) result.add(slug as LabFlag);
  }
  return result;
}

export function isLabEnabled(flags: Set<LabFlag>, lab: LabFlag): boolean {
  return flags.has(lab);
}

export function readLabsFromLocation(): Set<LabFlag> {
  if (typeof window === "undefined") return new Set();
  return parseLabsFlag(window.location.search);
}
