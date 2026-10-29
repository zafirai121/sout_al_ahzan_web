// The owner's choices for the releases (cloudflare/release-settings.js keeps
// them): a release's cover, and the homepage's «جديد» cards hidden or opening
// a chosen release. Read by everyone; changed only by the site's owner, an
// account with the admin role (functions/api/releases.js checks it again).
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { storeSmallCopy } from '@/utils/image';

export interface ReleaseSettings {
  /** reciter id → release → its cover */
  covers: Record<string, Record<string, string>>;
  /** Reciters whose «جديد» card the homepage leaves out */
  hidden: string[];
  /** reciter id → the release its «جديد» card opens */
  open: Record<string, string>;
}

export const NO_SETTINGS: ReleaseSettings = { covers: {}, hidden: [], open: {} };

// A cover must be on the site's own storage (cloudflare/server-api.js isOwnImageUrl)
const OWN_IMAGES = ['https://soutalahzan.com/', 'https://ckhtndmrcypkqrpjlzli.supabase.co/storage/v1/object/public/'];
export const canBeCover = (url: string) => OWN_IMAGES.some(prefix => url.startsWith(prefix));

/** Whether this account is the site's owner (the role only the server can give). */
export const isOwner = (user: User | null) => user?.app_metadata?.role === 'admin';

/** The settings as they are now; none when they cannot be read (the site shows the tracks as they are). */
export async function fetchReleaseSettings(): Promise<ReleaseSettings> {
  try {
    const res = await fetch('/api/releases', { cache: 'no-store' });
    if (!res.ok) return NO_SETTINGS;
    const body = await res.json();
    return { ...NO_SETTINGS, ...body };
  } catch {
    return NO_SETTINGS;
  }
}

export type ReleaseChange =
  | { action: 'rename'; reciterId: string; ids: number[]; from: string; to: string }
  | { action: 'move'; reciterId: string; ids: number[]; album: string | null }
  | { action: 'cover'; reciterId: string; album: string; imageUrl: string | null }
  | { action: 'hide'; reciterId: string; hidden: boolean }
  | { action: 'open'; reciterId: string; album: string | null };

/** Sends one of the owner's changes to [path]; the answer, or the reason it was not made. */
export async function ownerPost<T>(path: string, change: object): Promise<{ ok: T } | { error: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'انتهت الجلسة، سجّل الدخول مرة أخرى.' };
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(change),
    });
    const body = await res.json().catch(() => ({}));
    if (res.status === 403) return { error: 'هذا التعديل لصاحب الموقع وحده.' };
    if (!res.ok) return { error: `لم يُحفظ التعديل (${res.status}).` };
    return { ok: body as T };
  } catch {
    return { error: 'تعذّر الاتصال، تحقّق من الإنترنت وحاول مجدداً.' };
  }
}

/** Makes one of the owner's changes to the releases; the settings after it, or the reason it was not made. */
export async function changeReleases(change: ReleaseChange): Promise<{ settings: ReleaseSettings } | { error: string }> {
  const result = await ownerPost<{ settings?: ReleaseSettings }>('/api/releases', change);
  if ('error' in result) return result;
  if (!result.ok.settings) return { error: 'لم يُحفظ التعديل.' };
  return { settings: { ...NO_SETTINGS, ...result.ok.settings } };
}

/** Uploads a picture for a cover (with its small copy); its address, or the reason it was not uploaded. */
export async function uploadCover(file: File): Promise<{ url: string } | { error: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { error: 'انتهت الجلسة، سجّل الدخول مرة أخرى.' };
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  try {
    const res = await fetch(`/api/upload?kind=image&ext=${encodeURIComponent(ext)}`, {
      method: 'POST',
      headers: { 'Content-Type': file.type || 'image/jpeg', Authorization: `Bearer ${session.access_token}` },
      body: file,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) return { error: res.status === 413 ? 'الصورة كبيرة جداً.' : `لم تُرفع الصورة (${res.status}).` };
    await storeSmallCopy(file, body.url, session.access_token);
    return { url: body.url as string };
  } catch {
    return { error: 'تعذّر الاتصال، تحقّق من الإنترنت وحاول مجدداً.' };
  }
}
