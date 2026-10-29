// What the site's owner chose for the releases, beyond what the tracks say
// (kept in the bucket as site/releases.json, see functions/api/releases.js):
//   covers: { reciter id: { release: picture } }  a release's cover, instead of its last track's picture
//   hidden: [reciter id]                          reciters whose «جديد» card the homepage leaves out
//   open:   { reciter id: release }               the release a «جديد» card opens, instead of the newest track's
import { isOwnImageUrl } from './server-api.js';

export const emptySettings = () => ({ covers: {}, hidden: [], open: {} });

const MAX_NAME = 300;
const isReciter = (id) => typeof id === 'string' && /^\d+$/.test(id);
/** The release's name trimmed, or null when it cannot be one. */
export const releaseName = (name) => {
  if (typeof name !== 'string') return null;
  const trimmed = name.trim();
  return trimmed && trimmed.length <= MAX_NAME ? trimmed : null;
};

/** The stored settings with anything malformed left out (a missing file reads as none). */
export function cleanSettings(raw) {
  const out = emptySettings();
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, releases] of Object.entries(raw.covers ?? {})) {
    if (!isReciter(id) || !releases || typeof releases !== 'object') continue;
    const kept = Object.fromEntries(Object.entries(releases).filter(([name, url]) => releaseName(name) && isOwnImageUrl(url)));
    if (Object.keys(kept).length) out.covers[id] = kept;
  }
  if (Array.isArray(raw.hidden)) out.hidden = raw.hidden.filter(isReciter);
  for (const [id, name] of Object.entries(raw.open ?? {})) {
    if (isReciter(id) && releaseName(name)) out.open[id] = name;
  }
  return out;
}

/**
 * The settings after one of the owner's changes, or null when the change is
 * not one that can be made:
 *   { action: 'cover', reciterId, album, imageUrl }  imageUrl null: the last track's picture again
 *   { action: 'hide', reciterId, hidden }
 *   { action: 'open', reciterId, album }             album null: the newest track's release again
 *   { action: 'rename', reciterId, from, to }        the release's cover and card follow its new name
 */
export function applyChange(settings, change) {
  const id = change?.reciterId;
  if (!isReciter(id)) return null;
  const next = { covers: { ...settings.covers }, hidden: [...settings.hidden], open: { ...settings.open } };
  const releases = { ...(next.covers[id] ?? {}) };
  const keep = () => {
    if (Object.keys(releases).length) next.covers[id] = releases;
    else delete next.covers[id];
    return next;
  };

  switch (change.action) {
    case 'cover': {
      const album = releaseName(change.album);
      if (!album) return null;
      if (change.imageUrl === null) delete releases[album];
      else if (isOwnImageUrl(change.imageUrl)) releases[album] = change.imageUrl;
      else return null;
      return keep();
    }
    case 'hide':
      if (typeof change.hidden !== 'boolean') return null;
      next.hidden = next.hidden.filter(h => h !== id);
      if (change.hidden) next.hidden.push(id);
      return next;
    case 'open': {
      if (change.album === null) {
        delete next.open[id];
        return next;
      }
      const album = releaseName(change.album);
      if (!album) return null;
      next.open[id] = album;
      return next;
    }
    case 'rename': {
      const from = releaseName(change.from);
      const to = releaseName(change.to);
      if (!from || !to) return null;
      if (from in releases) {
        releases[to] = releases[from];
        delete releases[from];
      }
      if (next.open[id] === from) next.open[id] = to;
      return keep();
    }
    default:
      return null;
  }
}
