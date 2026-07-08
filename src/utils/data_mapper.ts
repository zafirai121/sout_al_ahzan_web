import { DbAudioTrack, DbReciter, Track, Reciter } from '@/types';

export const getTrackData = (item: DbAudioTrack | any): Track => ({
  id: item.id?.toString(),
  title: item.title || 'بدون عنوان',
  artist: item.reciterName || item.artist || item.reciter_name || 'مجهول',
  audioUrl: item.audioUrl || item.file_url || item.url || '',
  imageUrl: item.thumbnailUrl || item.thumbnail_url || item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80',
  plays: item.listen_count || item.listenCount || 0,
  reciterId: item.reciter_id || item.artist_id || item.artistId || ''
});

export const getReciterData = (item: DbReciter | any): Reciter => ({
  id: item.id?.toString(),
  name: item.name || 'بدون اسم',
  imageUrl: item.imageUrl || item.image_url || 'https://images.unsplash.com/photo-1621243764831-29496a79895c?auto=format&fit=crop&w=300&q=80',
});
