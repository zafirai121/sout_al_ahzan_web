export interface Track {
  id: string;
  title: string;
  artist: string;
  imageUrl?: string;
  audioUrl: string;
  plays?: number;
  reciterId?: string;
  category?: string;
  createdAt?: string;
}

export interface Reciter {
  id: string;
  name: string;
  imageUrl?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  userId?: string;
  isPublic?: boolean;
}

// Database schema mappings (for Supabase raw data)
export interface DbAudioTrack {
  id: number;
  title: string;
  reciter_name?: string;
  artist?: string;
  reciterName?: string;
  file_url?: string;
  audioUrl?: string;
  url?: string;
  thumbnail_url?: string;
  imageUrl?: string;
  image_url?: string;
  thumbnailUrl?: string;
  listen_count?: number;
  listenCount?: number;
  reciter_id?: string;
  artist_id?: string;
  artistId?: string;
  category?: string;
  created_at?: string;
}

export interface DbReciter {
  id: number;
  name: string;
  image_url?: string;
  imageUrl?: string;
}
