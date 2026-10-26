"use client";

import React, { useEffect, useState } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { DbAudioTrack, DbReciter } from '@/types';
import { fetchHomeData } from '@/lib/home_data';
import { usePlaylists } from '@/context/PlaylistContext';
import OccasionBanner from '@/components/home/OccasionBanner';
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

// Every section says what it is: no "made for you" or "mix" over lists that
// are the same for everyone. What is the listener's own (recent tracks, likes)
// comes from their browser and shows only when there is some.
export default function HomeClient(initialData: HomeClientProps) {
  const { recentTracks } = usePlayer();
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

  // "More from": the reciters the listener has been hearing, then the most listened
  const fromRecent = recentTracks.some(t => t.reciterId);
  const seeds: Seed[] = [];
  for (const t of [
    ...recentTracks.map(t => ({ id: t.reciterId, name: t.artist })),
    ...popularPoems.map(p => ({ id: p.reciter_id, name: p.reciter_name ?? '' })),
  ]) {
    const id = t.id ? String(t.id) : '';
    if (id && t.name && t.name !== 'مجهول' && !seeds.some(s => s.id === id)) seeds.push({ id, name: t.name });
  }
  const shownSeeds = seeds.slice(0, 6);
  // "Made for you": only the listener's own reciters, the most heard lately first
  const ownSeeds = seeds.filter(s => recentTracks.some(t => String(t.reciterId) === s.id)).slice(0, 4);
  const heard = recentTracks.map(t => String(t.id));
  // "For the fans of": the reciters of the most listened tracks, the same for everyone
  const topSeeds: Seed[] = [];
  for (const p of popularPoems) {
    const id = p.reciter_id ? String(p.reciter_id) : '';
    const name = p.reciter_name ?? '';
    if (id && name && name !== 'مجهول' && !topSeeds.some(s => s.id === id)) topSeeds.push({ id, name });
  }

  return (
    <div className="content-inner home">
      <h1 className="sr-only">صوت الأحزان: لطميات وقصائد حسينية بصوت أشهر الرواديد</h1>

      <OccasionBanner />

      <CategoryTiles />

      {recentTracks.length > 0 ? <RecentTracks tracks={recentTracks} /> : null}

      {poems.length > 0 ? (
        <Shelf title="أحدث الإصدارات" href="/explore?type=recent">
          {poems.slice(0, 20).map(item => <TrackCard key={item.id} item={item} />)}
        </Shelf>
      ) : null}

      <ReciterOfTheDay />

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
      {ownSeeds.length > 0 ? (
        <MadeForYou key={ownSeeds.map(s => s.id).join(',')} seeds={ownSeeds} heard={heard} />
      ) : null}

      {shownSeeds.length >= 2 ? (
        <MoreFromReciters
          key={shownSeeds.map(s => s.id).join(',')}
          seeds={shownSeeds}
          heard={heard}
          fromRecent={fromRecent}
        />
      ) : null}

      {topSeeds.length >= 3 ? (
        <FansOf key={topSeeds.slice(0, 6).map(s => s.id).join(',')} seeds={topSeeds.slice(0, 6)} />
      ) : null}
    </div>
  );
}
