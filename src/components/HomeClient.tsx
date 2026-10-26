"use client";

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { DbAudioTrack, DbReciter, Track } from '@/types';
import { fetchHomeData } from '@/lib/home_data';
import { usePlaylists } from '@/context/PlaylistContext';
import { CategoryTiles, RecentTracks, ReciterCard, Shelf, TrackCard, TrackColumns } from '@/components/home/HomeParts';
import { CategoryShelf, FansOf, MadeForYou, MoreFromReciters, NewReciters, ReciterOfTheDay, Seed } from '@/components/home/HomeExtras';
import '@/components/home/home.css';

interface HomeClientProps {
  poems: DbAudioTrack[];
  popularPoems: DbAudioTrack[];
  reciters: DbReciter[];
  fridayTracks: DbAudioTrack[];
}

const dailyMessage = () => {
  switch (new Date().getDay()) {
    case 0: return "بداية أسبوع مباركة، وقت للروحانية";
    case 1: return "يوم الإثنين، تجديد العهد والنية";
    case 2: return "الثلاثاء، سكينة وطمأنينة";
    case 3: return "منتصف الأسبوع، استمر في العطاء الروحي";
    case 4: return "ليلة الجمعة تقترب، وقت للخشوع والدعاء";
    case 5: return "إنه الجمعة، يوم الدعاء وقراءة القرآن";
    case 6: return "يوم السبت، راحة وسلام داخلي";
    default: return "يوم مبارك";
  }
};

type Picks = { own: Seed[]; shown: Seed[]; top: Seed[]; heard: string[]; fromRecent: boolean };

const known = (id: unknown, name: string | null | undefined) =>
  id && name && name !== 'مجهول' ? { id: String(id), name } : null;

/** The reciters of the tall cards' sections, from the recent tracks and the most listened */
function pickSeeds(recent: Track[], popular: DbAudioTrack[]): Picks {
  const add = (list: Seed[], seed: Seed | null) => { if (seed && !list.some(s => s.id === seed.id)) list.push(seed); };
  // "More from": the reciters the listener has been hearing, then the most listened
  const seeds: Seed[] = [];
  recent.forEach(t => add(seeds, known(t.reciterId, t.artist)));
  popular.forEach(p => add(seeds, known(p.reciter_id, p.reciter_name)));
  // "For the fans of": the reciters of the most listened tracks, the same for everyone
  const top: Seed[] = [];
  popular.forEach(p => add(top, known(p.reciter_id, p.reciter_name)));
  return {
    // "Made for you": only the listener's own reciters, the most heard lately first
    own: seeds.filter(s => recent.some(t => String(t.reciterId) === s.id)).slice(0, 4),
    shown: seeds.slice(0, 6),
    top: top.slice(0, 6),
    heard: recent.map(t => String(t.id)),
    fromRecent: recent.some(t => t.reciterId),
  };
}

// Every section says what it is: no "made for you" or "mix" over lists that
// are the same for everyone. What is the listener's own (recent tracks, likes)
// comes from their browser and shows only when there is some.
export default function HomeClient(initialData: HomeClientProps) {
  const { recentTracks, recentLoaded } = usePlayer();
  const { likedTracks } = usePlaylists();

  // Build-time data first, then today's data from the database
  const [data, setData] = useState(initialData);
  useEffect(() => {
    fetchHomeData()
      .then(fresh => { if (fresh.poems.length > 0) setData(fresh); })
      .catch(e => console.error('Failed to refresh homepage data:', e));
  }, []);
  const { poems, popularPoems, reciters, fridayTracks } = data;

  // The page is built once at deploy time, on the server's day; the visitor's
  // day is only known in the browser. Set after mount so both render the same
  // HTML (otherwise React error #418 on every visit).
  const [dayLine, setDayLine] = useState('');
  useEffect(() => setDayLine(dailyMessage()), []);

  // The tall cards' reciters, picked once, from what the listener had heard
  // when the page opened. Every track played moves its reciter to the front of
  // the recent list; following it would rebuild those sections, emptied and
  // reordered under the pointer, every few tracks of a mix. They renew on the
  // next visit.
  const [picks, setPicks] = useState<Picks | null>(null);
  useEffect(() => {
    if (recentLoaded && !picks) setPicks(pickSeeds(recentTracks, popularPoems));
  }, [recentLoaded, recentTracks, popularPoems, picks]);

  return (
    <div className="content-inner home">
      <h1 className="sr-only">صوت الأحزان: لطميات وقصائد حسينية بصوت أشهر الرواديد</h1>

      <ReciterOfTheDay />

      <CategoryTiles />

      {recentTracks.length > 0 ? <RecentTracks tracks={recentTracks} /> : null}

      {poems.length > 0 ? (
        <Shelf title="أحدث الإصدارات" href="/explore?type=recent">
          {poems.slice(0, 20).map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      {reciters.length > 0 ? (
        <Shelf title="الرواديد" href="/explore?type=reciters">
          {reciters.map(item => <ReciterCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      {popularPoems.length > 0 ? (
        <TrackColumns id="home-popular" title="الأكثر استماعاً" href="/explore?type=popular" tracks={popularPoems} />
      ) : null}

      <CategoryShelf title="مواليد وأفراح" subtitle="من المواليد والأناشيد، الأكثر استماعاً" href="/category/muwalid" codes={['muwalid', 'nasheed']} />

      {fridayTracks.length > 0 ? (
        <Shelf title="أدعية ومناجاة" subtitle={dayLine || undefined} href="/category/dua">
          {fridayTracks.map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      <CategoryShelf title="زيارات" href="/category/ziyarat" codes={['ziyarat']} />

      <NewReciters />

      {likedTracks.length > 0 ? (
        <Shelf title="إعجاباتك" href="/playlists?id=likes">
          {likedTracks.slice(-12).reverse().map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      {/* The tall cards come last: the listener's mixes, more from their reciters, the fans' stations */}
      {picks && picks.own.length > 0 ? <MadeForYou seeds={picks.own} heard={picks.heard} /> : null}

      {picks && picks.shown.length >= 2 ? (
        <MoreFromReciters seeds={picks.shown} heard={picks.heard} fromRecent={picks.fromRecent} />
      ) : null}

      {picks && picks.top.length >= 3 ? <FansOf seeds={picks.top} /> : null}
    </div>
  );
}
