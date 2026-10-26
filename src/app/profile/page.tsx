"use client";

// The listener's profile: their library (likes, playlists: their account's when
// signed in, this browser's when not) and the reciters they heard lately. The
// page says where it lives rather than calling it public.

import React from 'react';
import Link from 'next/link';
import { Heart, ListMusic } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlaylists } from '@/context/PlaylistContext';
import { thumb } from '@/utils/image';
import { countOf, LIKES, PLAYLISTS, TRACKS } from '@/utils/plural';
import { useRecentReciters } from '@/utils/recent_reciters';
import { MeHead, MePage, nameOf, SignInButtons } from '@/components/me/Me';
import { ReciterCard, Shelf } from '@/components/home/HomeParts';
import '@/components/home/home.css';

/** A list's cover: four of its tracks' covers, or the first one's */
function ListCover({ tracks }: { tracks: { imageUrl?: string }[] }) {
  const covers = [...new Set(tracks.map(t => t.imageUrl).filter(Boolean))] as string[];
  if (covers.length === 0) return <span className="me-list-cover is-empty"><ListMusic size={44} /></span>;
  const shown = covers.length >= 4 ? covers.slice(0, 4) : covers.slice(0, 1);
  return (
    <span className={`me-list-cover${shown.length === 4 ? ' is-four' : ''}`}>
      {shown.map(c => <img key={c} src={thumb(c, shown.length === 4 ? 160 : 320)} alt="" loading="lazy" decoding="async" />)}
    </span>
  );
}

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { playlists, likedTracks, libraryLoaded } = usePlaylists();
  const reciters = useRecentReciters();

  const counts = (
    <>
      <span className="me-chip">{playlists.length ? countOf(playlists.length, PLAYLISTS) : 'لا قوائم بعد'}</span>
      <span className="me-chip">{likedTracks.length ? countOf(likedTracks.length, LIKES) : 'لا إعجابات بعد'}</span>
    </>
  );

  return (
    <MePage>
      {loading || !libraryLoaded ? (
        <div className="info-hero me-head" aria-busy="true" />
      ) : user ? (
        <MeHead user={user} title={nameOf(user)} line={counts} />
      ) : (
        <MeHead
          user={null}
          title="مكتبتك"
          line={<>{counts}<span>تُحفظ في هذا المتصفح، وبحسابك تجدها في تطبيق الهاتف أيضاً.</span></>}
        >
          <SignInButtons small />
        </MeHead>
      )}

      {libraryLoaded ? (
        <section className="me-section" aria-labelledby="profile-lists">
          <h2 className="me-section-title" id="profile-lists">قوائمك</h2>
          <ul className="me-lists">
            <li>
              <Link href="/playlists?id=likes" prefetch={false} className="me-list">
                <span className="me-list-cover is-likes"><Heart size={56} fill="currentColor" strokeWidth={0} /></span>
                <span className="me-list-name">الإعجابات</span>
                <span className="me-list-sub">{likedTracks.length ? countOf(likedTracks.length, TRACKS) : 'لا مقاطع بعد'}</span>
              </Link>
            </li>
            {playlists.map(p => (
              <li key={p.id}>
                <Link href={`/playlists?id=${p.id}`} prefetch={false} className="me-list">
                  <ListCover tracks={p.tracks} />
                  <span className="me-list-name">{p.name}</span>
                  <span className="me-list-sub">{p.tracks.length ? countOf(p.tracks.length, TRACKS) : 'فارغة'}</span>
                </Link>
              </li>
            ))}
          </ul>
          {playlists.length === 0 ? (
            <p className="me-panel-text">لم تنشئ قوائم تشغيل بعد. أضف أي مقطع إلى قائمة من زر الخيارات بجانبه، أو احفظ ميكساً أو محطة من الرئيسية.</p>
          ) : null}
        </section>
      ) : null}

      {reciters.length > 0 ? (
        <Shelf title="رواديد استمعت إليهم مؤخراً">
          {reciters.map(r => <ReciterCard key={r.id} item={r} />)}
        </Shelf>
      ) : null}
    </MePage>
  );
}
