import { DbAudioTrack, DbReciter, Track, Reciter } from '@/types';

// yt-dlp writes the characters a file name can't hold as look-alikes ("/" as
// "⧸", "|" as "｜"); fonts lack some and draw them as a huge stroke over the title.
// The same map as cloudflare/titles.js.
const FILE_NAME_LOOKALIKES: Record<string, string> = { '⧸': '/', '⧹': '\\', '｜': '|', '：': ':', '？': '?', '＂': '"', '＊': '*', '＜': '<', '＞': '>' };
// Some titles are the uploaded file's name ("وسط القلب.mp3"), some carry the
// direction marks of the text they were pasted from
const AUDIO_EXT = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|wma|amr)$/i;
const DIRECTION_MARKS = /[‎‏‪-‮⁦-⁩]/g;
export const readableTitle = (title: string): string =>
  title.replace(DIRECTION_MARKS, '').replace(/[⧸⧹｜：？＂＊＜＞]/g, (c) => FILE_NAME_LOOKALIKES[c]).trim().replace(AUDIO_EXT, '').trim();

export const getTrackData = (item: DbAudioTrack | any): Track => ({
  id: item.id?.toString(),
  title: item.title ? readableTitle(String(item.title)) : 'بدون عنوان',
  artist: item.reciterName || item.artist || item.reciter_name || 'مجهول',
  audioUrl: item.audioUrl || item.file_url || item.url || '',
  imageUrl: item.thumbnailUrl || item.thumbnail_url || item.imageUrl || item.image_url || '/cover-placeholder.svg',
  plays: item.listen_count || item.listenCount || item.plays || 0,
  reciterId: item.reciter_id || item.artist_id || item.artistId || '',
  duration: item.duration
});

// Stored as "m:ss" / "h:mm:ss"; "0:00" means it was never measured -> show nothing
export const formatDuration = (duration: unknown): string => {
  if (typeof duration !== 'string' || !/^\d+(:\d{2}){1,2}$/.test(duration)) return '';
  return /^0+(:00)+$/.test(duration) ? '' : duration;
};

export const getReciterData =(item: DbReciter | any): Reciter => ({
  id: item.id?.toString(),
  name: item.name || 'بدون اسم',
  imageUrl: item.imageUrl || item.image_url || '/cover-placeholder.svg',
});
