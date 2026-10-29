// The owner's edit of a track (TrackEditor): what changed, as
// functions/api/update-track.js takes it. No values are imported, so the
// scripts' tests run it as it is.

/** The details a track's page lets its owner change (all but its file). */
export const TRACK_FIELDS = ['title', 'reciter_name', 'category', 'album', 'occasion', 'year', 'location', 'lyrics', 'image_url'] as const;
export type TrackField = typeof TRACK_FIELDS[number];
export type TrackForm = Record<TrackField, string | null | undefined>;

const REQUIRED: TrackField[] = ['title', 'reciter_name'];
const clean = (value: string | null | undefined) => (value ?? '').trim();

/** The fields that differ from [row] (trimmed; an emptied one cleared), or the one left empty that cannot be. */
export function changedFields(row: Partial<TrackForm>, form: Partial<TrackForm>): { fields: Partial<Record<TrackField, string | null>> } | { missing: TrackField } {
  const fields: Partial<Record<TrackField, string | null>> = {};
  for (const key of TRACK_FIELDS) {
    if (!(key in form)) continue;
    const now = clean(form[key]);
    if (!now && REQUIRED.includes(key)) return { missing: key };
    if (now === clean(row[key])) continue;
    fields[key] = now || null;
  }
  return { fields };
}
